import { TokenRevocationService } from './token-revocation.service';
import { InMemoryTokenRevogadoRepository } from '../../../test/support/in-memory-token-revogado.repository';

describe('TokenRevocationService (RN-003)', () => {
  let servico: TokenRevocationService;
  let repositorio: InMemoryTokenRevogadoRepository;

  const emUmaHora = (): number => Math.floor(Date.now() / 1000) + 3600;

  beforeEach(() => {
    repositorio = new InMemoryTokenRevogadoRepository();
    servico = new TokenRevocationService(repositorio);
  });

  it('não considera revogado um token nunca revogado', async () => {
    await expect(servico.estaRevogado('jti-desconhecido')).resolves.toBe(false);
  });

  it('considera inválido um token sem jti', async () => {
    await expect(servico.estaRevogado(undefined)).resolves.toBe(true);
  });

  it('passa a recusar o token após a revogação', async () => {
    await servico.revogar('jti-1', emUmaHora());

    await expect(servico.estaRevogado('jti-1')).resolves.toBe(true);
  });

  it('não afeta outros tokens', async () => {
    await servico.revogar('jti-1', emUmaHora());

    await expect(servico.estaRevogado('jti-2')).resolves.toBe(false);
  });

  it('descarta a revogação quando o token já expirou', async () => {
    const expirado = Math.floor(Date.now() / 1000) - 10;
    await servico.revogar('jti-expirado', expirado);

    await expect(servico.estaRevogado('jti-expirado')).resolves.toBe(false);
    expect(repositorio.tamanho).toBe(0);
  });

  it('remove entradas expiradas ao registrar nova revogação', async () => {
    await servico.revogar('antigo', Math.floor(Date.now() / 1000) - 1);
    await servico.revogar('novo', emUmaHora());

    expect(repositorio.tamanho).toBe(1);
  });
});
