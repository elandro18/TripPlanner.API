-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Viagem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "comDatas" BOOLEAN NOT NULL DEFAULT true,
    "dataInicio" TEXT,
    "dataFim" TEXT,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "ativa" BOOLEAN NOT NULL DEFAULT false,
    "capaUrl" TEXT NOT NULL DEFAULT '',
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Viagem_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Destino" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "viagemId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cidade" TEXT,
    "pais" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "dataInicio" TEXT,
    "dataFim" TEXT,
    "lat" REAL,
    "lng" REAL,
    CONSTRAINT "Destino_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "Viagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "viagemId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "data" TEXT,
    "titulo" TEXT,
    "destinoId" INTEGER,
    CONSTRAINT "Dia_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "Viagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dia_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "Destino" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Local" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "viagemId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "horarioPrevisto" TEXT,
    "horarioFim" TEXT,
    "horarioAbertura" TEXT,
    "horarioFechamento" TEXT,
    "duracaoMin" INTEGER,
    "custoCentavos" INTEGER,
    "observacoes" TEXT,
    "fotoUrl" TEXT,
    "lat" REAL,
    "lng" REAL,
    "geoStatus" TEXT,
    CONSTRAINT "Local_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "Viagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Passagem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "viagemId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "partida" TEXT NOT NULL,
    "chegada" TEXT,
    "companhia" TEXT,
    "localizador" TEXT,
    "numeroBilhete" TEXT,
    "passageiro" TEXT,
    "classe" TEXT,
    "terminal" TEXT,
    "assento" TEXT,
    "moeda" TEXT,
    "valorCentavos" INTEGER,
    "documentoHash" TEXT,
    "importadoDe" TEXT,
    CONSTRAINT "Passagem_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "Viagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Hotel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "viagemId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "cidade" TEXT,
    "checkin" TEXT NOT NULL,
    "checkout" TEXT NOT NULL,
    "valorNoiteCentavos" INTEGER,
    "noites" INTEGER,
    "valorTotalCentavos" INTEGER,
    "codigoReserva" TEXT,
    "fotoUrl" TEXT,
    "lat" REAL,
    "lng" REAL,
    "geoStatus" TEXT,
    CONSTRAINT "Hotel_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "Viagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Roteiro" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "viagemId" INTEGER NOT NULL,
    "diaId" INTEGER NOT NULL,
    "tipoItem" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "inicio" TEXT,
    "fim" TEXT,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "concluidoEm" DATETIME,
    CONSTRAINT "Roteiro_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "Viagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Roteiro_diaId_fkey" FOREIGN KEY ("diaId") REFERENCES "Dia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lista" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "viagemId" INTEGER,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lista_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lista_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "Viagem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListaItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "listaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "valorCentavos" INTEGER,
    "valorPrevistoCentavos" INTEGER,
    "valorPagoCentavos" INTEGER,
    "pagoEm" DATETIME,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "concluidoEm" DATETIME,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fotoUrl" TEXT,
    "refeicao" BOOLEAN NOT NULL DEFAULT false,
    "endereco" TEXT,
    "cidade" TEXT,
    "lat" REAL,
    "lng" REAL,
    "fotoPratoUrl" TEXT,
    "fotoLocalUrl" TEXT,
    "observacoes" TEXT,
    CONSTRAINT "ListaItem_listaId_fkey" FOREIGN KEY ("listaId") REFERENCES "Lista" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TokenRevogado" (
    "jti" TEXT NOT NULL PRIMARY KEY,
    "expiraEm" DATETIME NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Viagem_usuarioId_ativa_idx" ON "Viagem"("usuarioId", "ativa");

-- CreateIndex
CREATE INDEX "Destino_viagemId_ordem_idx" ON "Destino"("viagemId", "ordem");

-- CreateIndex
CREATE INDEX "Dia_viagemId_numero_idx" ON "Dia"("viagemId", "numero");

-- CreateIndex
CREATE INDEX "Local_viagemId_idx" ON "Local"("viagemId");

-- CreateIndex
CREATE INDEX "Passagem_viagemId_idx" ON "Passagem"("viagemId");

-- CreateIndex
CREATE INDEX "Passagem_documentoHash_idx" ON "Passagem"("documentoHash");

-- CreateIndex
CREATE INDEX "Hotel_viagemId_idx" ON "Hotel"("viagemId");

-- CreateIndex
CREATE INDEX "Roteiro_viagemId_diaId_ordem_idx" ON "Roteiro"("viagemId", "diaId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "Roteiro_diaId_tipoItem_itemId_key" ON "Roteiro"("diaId", "tipoItem", "itemId");

-- CreateIndex
CREATE INDEX "Lista_usuarioId_viagemId_idx" ON "Lista"("usuarioId", "viagemId");

-- CreateIndex
CREATE INDEX "ListaItem_listaId_ordem_idx" ON "ListaItem"("listaId", "ordem");

-- CreateIndex
CREATE INDEX "TokenRevogado_expiraEm_idx" ON "TokenRevogado"("expiraEm");
