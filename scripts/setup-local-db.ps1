#requires -Version 5.1
<#
.SYNOPSIS
  Cria o PostgreSQL local de desenvolvimento do TripPlanner.API e grava o .env.

.DESCRIPTION
  - Localiza o psql (PATH ou instalação padrão do PostgreSQL).
  - Pede a senha do superusuário (postgres) de forma segura, só para criar o role.
  - Cria/atualiza o role da aplicação com uma senha aleatória.
  - Cria o banco `tripplanner_dev` se ainda não existir.
  - Escreve (ou atualiza só a DATABASE_URL) no `.env`.
  - Aplica as migrations e o seed.

  Idempotente: rodar de novo reaproveita a senha já presente no `.env`.

.EXAMPLE
  npm run db:setup:local
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/setup-local-db.ps1 -SkipSeed
#>
[CmdletBinding()]
param(
  [string]$SuperUser = 'postgres',
  [string]$HostName = 'localhost',
  [int]$Port = 5432,
  [string]$Database = 'tripplanner_dev',
  [string]$AppUser = 'tripplanner',
  [switch]$SkipMigrate,
  [switch]$SkipSeed
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$arquivoEnv = Join-Path $raiz '.env'

function Write-Passo([string]$mensagem) {
  Write-Host "==> $mensagem" -ForegroundColor Cyan
}

function Find-Psql {
  $comando = Get-Command psql -ErrorAction SilentlyContinue
  if ($comando) { return $comando.Source }

  $candidatos = Get-ChildItem 'C:\Program Files\PostgreSQL' -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    ForEach-Object { Join-Path $_.FullName 'bin\psql.exe' }

  foreach ($caminho in $candidatos) {
    if (Test-Path $caminho) { return $caminho }
  }

  throw 'psql.exe não encontrado. Instale o PostgreSQL ou adicione a pasta bin ao PATH.'
}

function New-SenhaAleatoria([int]$tamanho = 32) {
  $alfabeto = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  $bytes = New-Object byte[] $tamanho
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return -join ($bytes | ForEach-Object { $alfabeto[$_ % $alfabeto.Length] })
}

function Find-PrismaCli {
  $caminho = Join-Path $raiz 'node_modules\prisma\build\index.js'
  if (-not (Test-Path $caminho)) {
    throw 'CLI do Prisma não encontrado em node_modules. Rode "npm install" antes.'
  }
  return $caminho
}

function Read-ArquivoUtf8([string]$caminho) {
  return [System.IO.File]::ReadAllText($caminho, [System.Text.Encoding]::UTF8)
}

function Write-ArquivoUtf8SemBom([string]$caminho, [string]$conteudo) {
  # O Node (process.loadEnvFile) não lida bem com BOM: grava UTF-8 puro.
  [System.IO.File]::WriteAllText($caminho, $conteudo, (New-Object System.Text.UTF8Encoding($false)))
}

function Get-SenhaDoEnv([string]$usuario) {
  if (-not (Test-Path $arquivoEnv)) { return $null }
  $linha = Select-String -Path $arquivoEnv -Pattern '^\s*DATABASE_URL\s*=' | Select-Object -First 1
  if (-not $linha) { return $null }

  $valor = ($linha.Line -split '=', 2)[1].Trim()
  $match = [regex]::Match($valor, '^postgres(?:ql)?://([^:/@]+):([^@]+)@')
  if (-not $match.Success) { return $null }
  if ($match.Groups[1].Value -ne $usuario) { return $null }
  return [System.Uri]::UnescapeDataString($match.Groups[2].Value)
}

$psql = Find-Psql
Write-Passo "psql: $psql"

$senhaApp = Get-SenhaDoEnv -usuario $AppUser
if ($senhaApp) {
  Write-Passo "Reaproveitando a senha do role '$AppUser' já presente no .env"
} else {
  $senhaApp = New-SenhaAleatoria
  Write-Passo "Senha nova gerada para o role '$AppUser'"
}

$senhaSuper = Read-Host "Senha do superusuário '$SuperUser' (só para criar role/banco)" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSuper)
try {
  $senhaSuperTexto = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

if ([string]::IsNullOrWhiteSpace($senhaSuperTexto)) {
  throw 'Senha do superusuário não informada.'
}

$env:PGPASSWORD = $senhaSuperTexto
$argumentosBase = @('-h', $HostName, '-p', $Port, '-U', $SuperUser, '-v', 'ON_ERROR_STOP=1', '-tA')

try {
  Write-Passo "Testando conexão com $HostName`:$Port…"
  $teste = & $psql @argumentosBase -d postgres -c 'SELECT 1'
  if ($LASTEXITCODE -ne 0 -or "$teste".Trim() -ne '1') {
    throw 'Não foi possível conectar ao PostgreSQL com as credenciais informadas.'
  }

  Write-Passo "Criando/atualizando o role '$AppUser'…"
  $sqlRole = ('DO $$ BEGIN ' +
    'IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ''{0}'') THEN ' +
    'CREATE ROLE "{0}" LOGIN CREATEDB PASSWORD ''{1}''; ' +
    'ELSE ALTER ROLE "{0}" WITH LOGIN CREATEDB PASSWORD ''{1}''; END IF; ' +
    'END $$;') -f $AppUser, $senhaApp
  & $psql @argumentosBase -d postgres -c $sqlRole | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Falha ao criar o role '$AppUser'." }

  Write-Passo "Verificando o banco '$Database'…"
  $existe = & $psql @argumentosBase -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$Database'"
  if ("$existe".Trim() -ne '1') {
    Write-Passo "Criando o banco '$Database' (owner: $AppUser)…"
    $sqlBanco = 'CREATE DATABASE "{0}" OWNER "{1}"' -f $Database, $AppUser
    & $psql @argumentosBase -d postgres -c $sqlBanco | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Falha ao criar o banco '$Database'." }
  } else {
    Write-Passo "Banco '$Database' já existe — nada a criar."
  }
} finally {
  Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

$url = 'postgresql://{0}:{1}@{2}:{3}/{4}?schema=public' -f $AppUser, $senhaApp, $HostName, $Port, $Database

Write-Passo 'Gravando o .env…'
if (Test-Path $arquivoEnv) {
  $conteudo = Read-ArquivoUtf8 $arquivoEnv
  if ($conteudo -match '(?m)^\s*DATABASE_URL\s*=') {
    $conteudo = [regex]::Replace($conteudo, '(?m)^\s*DATABASE_URL\s*=.*$', "DATABASE_URL=$url")
  } else {
    $conteudo = $conteudo.TrimEnd() + "`r`nDATABASE_URL=$url`r`n"
  }
  Write-ArquivoUtf8SemBom $arquivoEnv $conteudo
  Write-Passo 'DATABASE_URL atualizada no .env (demais variáveis preservadas).'
} else {
  $template = Join-Path $raiz '.env.example'
  $conteudo = Read-ArquivoUtf8 $template
  $conteudo = [regex]::Replace($conteudo, '(?m)^\s*DATABASE_URL\s*=.*$', "DATABASE_URL=$url")
  Write-ArquivoUtf8SemBom $arquivoEnv $conteudo
  Write-Passo '.env criado a partir do .env.example.'
}

Write-Host ''
Write-Host 'Banco local pronto:' -ForegroundColor Green
Write-Host "  host:     $HostName`:$Port"
Write-Host "  database: $Database"
Write-Host "  usuario:  $AppUser"
Write-Host "  senha:    (gravada no .env)"
Write-Host ''

if (-not $SkipMigrate) {
  $cliPrisma = Find-PrismaCli
  # O CLI do Prisma chama binários externos (ex.: ts-node no seed). O npm injeta
  # node_modules\.bin no PATH; aqui precisamos fazer o mesmo.
  $env:Path = (Join-Path $raiz 'node_modules\.bin') + ';' + $env:Path
  Push-Location $raiz
  try {
    Write-Passo 'Aplicando migrations (prisma migrate deploy)…'
    & node $cliPrisma migrate deploy
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao aplicar as migrations.' }

    if (-not $SkipSeed) {
      Write-Passo 'Aplicando seed (demo@tripplanner.local / demo1234)…'
      & node $cliPrisma db seed
      if ($LASTEXITCODE -ne 0) { throw 'Falha ao aplicar o seed.' }
    }
  } finally {
    Pop-Location
  }
}

Write-Host ''
Write-Host 'Pronto. Suba a API com: npm run start:dev' -ForegroundColor Green
Write-Host 'Swagger: http://localhost:3000/api/docs' -ForegroundColor Green
