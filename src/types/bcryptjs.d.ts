/**
 * Tipagem local do `bcryptjs@2.4.x`.
 *
 * O pacote não publica tipos e `@types/bcryptjs` não existe no feed npm interno
 * (Procergs). Declaramos apenas a superfície usada pela aplicação.
 * `bcryptjs` é a implementação JavaScript do bcrypt — evita build nativo
 * (node-gyp) no Windows.
 */
declare module 'bcryptjs' {
  export function genSalt(rounds?: number): Promise<string>;
  export function genSaltSync(rounds?: number): string;
  export function hash(senha: string, salt: number | string): Promise<string>;
  export function hashSync(senha: string, salt: number | string): string;
  export function compare(senha: string, hash: string): Promise<boolean>;
  export function compareSync(senha: string, hash: string): boolean;
}
