import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from "typeorm";
import { Historico } from "../entities/Historico.js";
import { Pedido } from "../entities/Pedido.js";

type Genero = "masculino" | "feminino";

enum TabelaHistorico {
  HISTORICO = "historico",
  SESSAO = "sessao",
  PRODUTO = "produto",
  CLIENTE = "cliente",
  CATEGORIA = "categoria",
  PEDIDO = "pedido",
  USUARIO = "usuario",
  ITEM_PEDIDO = "item_pedido",
  FINANCEIRO = "financeiro",
  MOVIMENTACAO_ESTOQUE = "movimentacao_estoque",
}

enum TipoAcaoHistorico {
  INSERT = "insert",
  UPDATE = "update",
  DELETE = "delete",
}

const TABELAS_LABEL: Record<string, { singular: string; genero: Genero }> = {
  [TabelaHistorico.PRODUTO]: { singular: "Produto", genero: "masculino" },
  [TabelaHistorico.CLIENTE]: { singular: "Cliente", genero: "masculino" },
  [TabelaHistorico.CATEGORIA]: { singular: "Categoria", genero: "feminino" },
  [TabelaHistorico.PEDIDO]: { singular: "Pedido", genero: "masculino" },
  [TabelaHistorico.USUARIO]: { singular: "Usuario", genero: "masculino" },
  [TabelaHistorico.ITEM_PEDIDO]: { singular: "Item do Pedido", genero: "masculino" },
  [TabelaHistorico.FINANCEIRO]: { singular: "Movimentação", genero: "feminino" },
  [TabelaHistorico.MOVIMENTACAO_ESTOQUE]: { singular: "Movimentacao de Estoque", genero: "feminino" },
  [TabelaHistorico.SESSAO]: { singular: "Sessao", genero: "feminino" },
};

@EventSubscriber()
export class HistoricoSubscriber implements EntitySubscriberInterface {
  private formatBrl(valor: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  private toEntityRecord(eventEntity: unknown): Record<string, unknown> {
    if (!eventEntity || typeof eventEntity !== "object") {
      return {};
    }
    return eventEntity as Record<string, unknown>;
  }

  private buildAcao(tabela: string, tipo: TipoAcaoHistorico): string {
    const fallbackNome = tabela
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    const metadata = TABELAS_LABEL[tabela] ?? { singular: fallbackNome, genero: "masculino" as Genero };
    const artigoNovo = metadata.genero === "feminino" ? "Nova" : "Novo";
    const sufixoRegistro = metadata.genero === "feminino" ? "registrada" : "registrado";
    const sufixoAlteracao = metadata.genero === "feminino" ? "alterada" : "alterado";
    const sufixoRemocao = metadata.genero === "feminino" ? "removida" : "removido";

    if (tipo === TipoAcaoHistorico.INSERT) {
      return `${artigoNovo} ${metadata.singular} ${sufixoRegistro}`;
    }
    if (tipo === TipoAcaoHistorico.UPDATE) {
      return `${metadata.singular} ${sufixoAlteracao}`;
    }
    return `${metadata.singular} ${sufixoRemocao}`;
  }

  private getRegistroId(eventEntity: unknown): string | null {
    const entity = this.toEntityRecord(eventEntity);
    const idCandidates = ["id", "id_prod", "id_user"];
    for (const key of idCandidates) {
      const value = entity[key];
      if (value !== undefined && value !== null) {
        return String(value);
      }
    }

    return null;
  }

  private getPedidoStatus(eventEntity: unknown): string | null {
    const entity = this.toEntityRecord(eventEntity);
    const status = entity["status"];
    return typeof status === "string" && status.trim() ? status.trim().toLowerCase() : null;
  }

  private buildReferencia(tabela: string, eventEntity: unknown): string | null {
    const entity = this.toEntityRecord(eventEntity);
    const nome = entity["nome"];
    const registroId = this.getRegistroId(eventEntity);

    if (
      tabela === TabelaHistorico.CLIENTE ||
      tabela === TabelaHistorico.PRODUTO ||
      tabela === TabelaHistorico.CATEGORIA ||
      tabela === TabelaHistorico.USUARIO
    ) {
      return typeof nome === "string" && nome.trim() ? nome.trim() : null;
    }

    if (tabela === TabelaHistorico.PEDIDO) {
      const codigo = entity["codigo"];
      if (typeof codigo === "string" && codigo.trim()) {
        return `Ordem #${codigo.trim()}`;
      }
      return registroId ? `Ordem #${registroId}` : null;
    }

    if (tabela === TabelaHistorico.FINANCEIRO) {
      const tipo = typeof entity["tipo"] === "string" ? entity["tipo"].toLowerCase() : "";
      const prefixo = tipo === "despesa" ? "Despesa" : "Receita";
      const valorRaw = entity["valor"];
      const valor = Number(valorRaw);
      if (!Number.isNaN(valor)) {
        return `${prefixo} ${this.formatBrl(valor)}`;
      }
      return prefixo;
    }

    return null;
  }

  private async buildReferenciaPedidoComFallback(
    event:
      | InsertEvent<unknown>
      | UpdateEvent<unknown>
      | RemoveEvent<unknown>,
    entity: unknown
  ): Promise<string | null> {
    const referenciaDireta = this.buildReferencia(TabelaHistorico.PEDIDO, entity);
    if (referenciaDireta && !referenciaDireta.includes("#null")) {
      return referenciaDireta;
    }

    const registroId = this.getRegistroId(entity);
    if (!registroId) {
      return null;
    }

    const pedido = await event.manager.getRepository(Pedido).findOne({
      where: { id: registroId },
      select: { id: true, codigo: true },
    });

    if (pedido?.codigo) {
      return `Ordem #${pedido.codigo}`;
    }

    return `Ordem #${registroId}`;
  }

  private async registrarHistorico(
    event:
      | InsertEvent<unknown>
      | UpdateEvent<unknown>
      | RemoveEvent<unknown>,
    tableName: string,
    tipo: TipoAcaoHistorico,
    entity: unknown
  ) {
    if (
      tableName === TabelaHistorico.HISTORICO ||
      tableName === TabelaHistorico.SESSAO ||
      tableName === TabelaHistorico.ITEM_PEDIDO
    ) {
      return;
    }

    const referencia =
      tableName === TabelaHistorico.PEDIDO
        ? await this.buildReferenciaPedidoComFallback(event, entity)
        : this.buildReferencia(tableName, entity);

    let acao = this.buildAcao(tableName, tipo);
    if (tableName === TabelaHistorico.PEDIDO && tipo === TipoAcaoHistorico.UPDATE && "updatedColumns" in event) {
      const statusNovo = this.getPedidoStatus(event.entity ?? entity);
      const statusAnterior = this.getPedidoStatus(event.databaseEntity);
      const statusFoiAlterado = event.updatedColumns.some((column) => column.propertyName === "status");

      if (statusFoiAlterado && statusNovo !== statusAnterior) {
        if (statusNovo === "cancelado") {
          acao = "Pedido cancelado";
        } else if (statusNovo === "pago") {
          acao = "Pagamento de pedido registrado";
        }
      }
    }

    await event.manager
      .getRepository(Historico)
      .save({
        tabela: tableName,
        acao,
        registro_id: this.getRegistroId(entity),
        referencia,
      });
  }

  afterInsert(event: InsertEvent<unknown>): void | Promise<void> {
    return this.registrarHistorico(
      event,
      event.metadata.tableName,
      TipoAcaoHistorico.INSERT,
      event.entity
    );
  }

  afterUpdate(event: UpdateEvent<unknown>): void | Promise<void> {
    if (event.updatedColumns.length === 0) {
      return;
    }
    return this.registrarHistorico(
      event,
      event.metadata.tableName,
      TipoAcaoHistorico.UPDATE,
      event.entity ?? event.databaseEntity
    );
  }

  afterRemove(event: RemoveEvent<unknown>): void | Promise<void> {
    return this.registrarHistorico(
      event,
      event.metadata.tableName,
      TipoAcaoHistorico.DELETE,
      event.databaseEntity ?? event.entity
    );
  }
}
