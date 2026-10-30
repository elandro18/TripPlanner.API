import { EmailJaCadastradoError } from '../../common/errors/dominio.error';
import { criarModuloDeDominio, REPOSITORIOS_PRISMA } from '../../../test/support/modulo-de-teste';
import { USUARIOS_REPOSITORY, UsuariosRepository } from './usuarios.repository';

describe('PrismaUsuariosRepository (TRIP_USUARIO no PostgreSQL)', () => {
  let repositorio: UsuariosRepository;

  beforeEach(async () => {
    const contexto = await criarModuloDeDominio([...REPOSITORIOS_PRISMA]);
    repositorio = contexto.modulo.get<UsuariosRepository>(USUARIOS_REPOSITORY);
  });

  it('busca pelo e-mail normalizado', async () => {
    await repositorio.criar({
      nome: 'Elandro',
      email: 'Elandro@Exemplo.com',
      senhaHash: '$2a$04$hash',
    });

    await expect(repositorio.buscarPorEmail('  ELANDRO@exemplo.com ')).resolves.toMatchObject({
      id: 1,
      nome: 'Elandro',
      email: 'elandro@exemplo.com',
      senhaHash: '$2a$04$hash',
      ativo: true,
    });
  });

  it('interpreta ativo = false como conta inativa', async () => {
    const criado = await repositorio.criar({
      nome: 'Inativo',
      email: 'inativo@exemplo.com',
      senhaHash: '$2a$04$hash',
      ativo: false,
    });

    await expect(repositorio.buscarPorId(criado.id)).resolves.toMatchObject({ ativo: false });
  });

  it('retorna null quando o usuário não existe', async () => {
    await expect(repositorio.buscarPorId(999)).resolves.toBeNull();
    await expect(repositorio.buscarPorEmail('ninguem@exemplo.com')).resolves.toBeNull();
  });

  it('cria o usuário com id sequencial e persiste os dados', async () => {
    const primeiro = await repositorio.criar({
      nome: 'Elandro',
      email: 'elandro@exemplo.com',
      senhaHash: '$2a$04$hash',
    });
    const segundo = await repositorio.criar({
      nome: 'Maria',
      email: 'MARIA@exemplo.com',
      senhaHash: '$2a$04$novo',
    });

    expect(primeiro.id).toBe(1);
    expect(segundo).toMatchObject({
      id: 2,
      nome: 'Maria',
      email: 'maria@exemplo.com',
      ativo: true,
    });
  });

  it('recusa e-mail duplicado com ERR-040', async () => {
    await repositorio.criar({
      nome: 'Elandro',
      email: 'elandro@exemplo.com',
      senhaHash: '$2a$04$hash',
    });

    await expect(
      repositorio.criar({
        nome: 'Outro',
        email: 'ELANDRO@exemplo.com',
        senhaHash: '$2a$04$outro',
      }),
    ).rejects.toBeInstanceOf(EmailJaCadastradoError);
  });
});
