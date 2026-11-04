import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { normalizarUrlDeFuncao } from '../src/common/utils/url-vercel';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/app.setup';
import { carregarEnv } from '../src/config/load-env';

/**
 * Entrypoint serverless da Vercel.
 *
 * A Vercel não executa `node dist/main` (processo long-lived): ela invoca uma
 * função por requisição. Aqui a aplicação Nest é criada **uma vez por
 * instância** e reaproveitada entre invocações (inclusive o pool do Prisma) —
 * daí a promise em cache.
 *
 * Roteamento: o `rewrite` do `vercel.json` aponta para esta função e mascara o
 * caminho original, então ele vem em `?caminhoOriginal=...` e é restaurado por
 * `normalizarUrlDeFuncao` antes de chegar ao Express/Nest.
 */

type ServidorHttp = (req: IncomingMessage, res: ServerResponse) => void;

const logger = new Logger('Vercel');

let servidor: Promise<ServidorHttp> | null = null;

async function inicializar(): Promise<ServidorHttp> {
  carregarEnv();

  const adapter = new ExpressAdapter();
  const app = await NestFactory.create(AppModule, adapter);
  configurarApp(app);
  await app.init();

  return adapter.getInstance<ServidorHttp>();
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    if (!servidor) {
      servidor = inicializar();
    }
    const app = await servidor;

    req.url = normalizarUrlDeFuncao(req.url ?? '/');
    app(req, res);
  } catch (erro) {
    // Falha na inicialização (ex.: DATABASE_URL inválida): descarta o cache para
    // permitir nova tentativa na próxima invocação.
    servidor = null;
    const mensagem = (erro as Error)?.message ?? String(erro);
    logger.error(`Falha ao inicializar a aplicação: ${mensagem}`);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify([
          { id: 'ERR-099', message: 'Erro interno do servidor', field: null, detail: null },
        ]),
      );
    }
  }
}
