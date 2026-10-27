import { Injectable } from '@nestjs/common';
import { EmailJaCadastradoError } from '../../common/errors/dominio.error';
import { ehViolacaoDeUnicidade } from '../../common/utils/prisma-erros';
import { PrismaService } from '../../persistencia/prisma/prisma.service';
import { NovoUsuario, Usuario, normalizarEmail } from './usuario.model';
import { UsuariosRepository } from './usuarios.repository';

interface LinhaUsuario {
  readonly id: number;
  readonly nome: string;
  readonly email: string;
  readonly senhaHash: string;
  readonly ativo: boolean;
}

/** Adaptador Prisma do repositório de usuários. */
@Injectable()
export class PrismaUsuariosRepository implements UsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: normalizarEmail(email) },
    });
    return usuario ? this.paraModelo(usuario) : null;
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    return usuario ? this.paraModelo(usuario) : null;
  }

  async criar(dados: NovoUsuario): Promise<Usuario> {
    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          nome: dados.nome,
          email: normalizarEmail(dados.email),
          senhaHash: dados.senhaHash,
          ativo: dados.ativo !== false,
        },
      });
      return this.paraModelo(usuario);
    } catch (erro) {
      if (ehViolacaoDeUnicidade(erro)) {
        throw new EmailJaCadastradoError();
      }
      throw erro;
    }
  }

  private paraModelo(usuario: LinhaUsuario): Usuario {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: normalizarEmail(usuario.email),
      senhaHash: usuario.senhaHash,
      ativo: usuario.ativo,
    };
  }
}
