import { Prisma } from '../../generated/prisma/client';

/** `P2025` — registro alvo de update/delete não existe. */
export function ehRegistroNaoEncontrado(erro: unknown): boolean {
  return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2025';
}

/** `P2002` — violação de restrição única. */
export function ehViolacaoDeUnicidade(erro: unknown): boolean {
  return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002';
}
