import {
  descricaoDoBanco,
  ehHostLocal,
  limiteDoPool,
  mascararUrl,
  validarDatabaseUrl,
} from './banco-de-dados';

const LOCAL = 'postgresql://tripplanner:segredo@localhost:5432/tripplanner_dev?schema=public';
const NEON =
  'postgresql://usuario:segredo@ep-cool-name-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

describe('validarDatabaseUrl', () => {
  it('recusa DATABASE_URL ausente com mensagem acionável', () => {
    expect(() => validarDatabaseUrl(undefined, 'development')).toThrow(/obrigatória/i);
    expect(() => validarDatabaseUrl('   ', 'development')).toThrow(/db:setup:local/);
  });

  it('recusa URL malformada e esquema não suportado', () => {
    expect(() => validarDatabaseUrl('nao-e-url', 'development')).toThrow(/inválida/i);
    expect(() => validarDatabaseUrl('mysql://u:p@localhost:3306/db', 'development')).toThrow(
      /não é suportado/i,
    );
  });

  it('recusa URL sem nome de banco', () => {
    expect(() => validarDatabaseUrl('postgresql://u:p@localhost:5432', 'development')).toThrow(
      /nome do banco ausente/i,
    );
  });

  it('aceita Postgres local em desenvolvimento', () => {
    const banco = validarDatabaseUrl(LOCAL, 'development', {});

    expect(banco).toMatchObject({
      host: 'localhost',
      porta: '5432',
      database: 'tripplanner_dev',
      local: true,
      neon: false,
    });
  });

  it('reconhece loopback e rede privada como local', () => {
    expect(ehHostLocal('127.0.0.1')).toBe(true);
    expect(ehHostLocal('::1')).toBe(true);
    expect(ehHostLocal('192.168.0.10')).toBe(true);
    expect(ehHostLocal('172.20.1.5')).toBe(true);
    expect(ehHostLocal('ep-x.neon.tech')).toBe(false);
  });

  it('BLOQUEIA o Neon em desenvolvimento (proteção contra usar produção)', () => {
    expect(() => validarDatabaseUrl(NEON, 'development', {})).toThrow(/ALLOW_REMOTE_DB=true/);
    expect(() => validarDatabaseUrl(NEON, 'development', {})).toThrow(/Neon \(produção\)/);
  });

  it('permite Neon em desenvolvimento com ALLOW_REMOTE_DB=true', () => {
    const banco = validarDatabaseUrl(NEON, 'development', { ALLOW_REMOTE_DB: 'true' });

    expect(banco).toMatchObject({ local: false, neon: true, ssl: true });
  });

  it('BLOQUEIA banco local em produção', () => {
    expect(() => validarDatabaseUrl(LOCAL, 'production', {})).toThrow(/host local "localhost"/);
  });

  it('aceita Neon em produção', () => {
    const banco = validarDatabaseUrl(NEON, 'production', {});

    expect(banco.neon).toBe(true);
    expect(banco.ssl).toBe(true);
  });

  it('detecta sslmode=disable', () => {
    const banco = validarDatabaseUrl(
      'postgresql://u:p@localhost:5432/db?sslmode=disable',
      'development',
      {},
    );

    expect(banco.ssl).toBe(false);
  });
});

describe('limiteDoPool', () => {
  it('usa o padrão quando a variável não existe', () => {
    expect(limiteDoPool(undefined)).toBe(10);
    expect(limiteDoPool('   ', 4)).toBe(4);
  });

  it('respeita o valor configurado (serverless: 3 a 5)', () => {
    expect(limiteDoPool('5')).toBe(5);
    expect(limiteDoPool('3')).toBe(3);
  });

  it('recusa valor inválido ou não positivo', () => {
    expect(() => limiteDoPool('abc')).toThrow(/inteiro positivo/);
    expect(() => limiteDoPool('0')).toThrow(/inteiro positivo/);
    expect(() => limiteDoPool('-2')).toThrow(/inteiro positivo/);
    expect(() => limiteDoPool('2.5')).toThrow(/inteiro positivo/);
  });
});

describe('mascararUrl', () => {
  it('esconde a senha e preserva o restante', () => {
    const mascarada = mascararUrl(LOCAL);

    expect(mascarada).not.toContain('segredo');
    expect(mascarada).toContain('tripplanner');
    expect(mascarada).toContain('localhost');
  });

  it('não quebra com valor inválido', () => {
    expect(mascararUrl('lixo')).toBe('<DATABASE_URL inválida>');
  });
});

describe('descricaoDoBanco', () => {
  it('descreve host, banco, tipo e ssl sem senha', () => {
    const banco = validarDatabaseUrl(NEON, 'production', {});
    const descricao = descricaoDoBanco(banco);

    expect(descricao).toContain('neon.tech');
    expect(descricao).toContain('neondb');
    expect(descricao).toContain('Neon');
    expect(descricao).toContain('ssl');
    expect(descricao).not.toContain('segredo');
  });
});
