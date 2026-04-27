import { DataSource, Repository } from "typeorm";
import { Pedido } from "../entities/Pedido.js";
import { Produto } from "../entities/Produto.js";
import { Cliente } from "../entities/Cliente.js";

/** Início e fim do mês no fuso local (alinhado a “este mês” na interface). */
function monthRangeLocal(year: number, monthIndex0: number): { start: Date; end: Date } {
  const start = new Date(year, monthIndex0, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex0 + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export type DashboardResumoDTO = {
  vendasMesAtual: number;
  produtosAtivos: number;
  totalClientes: number;
  crescimentoPercentual: number;
};

export type VendaMesPontoDTO = { labelMes: string; valor: number };

export type ProdutoCategoriaPontoDTO = { categoriaNome: string; quantidade: number };

export type DashboardGraficosDTO = {
  vendasPorMes: VendaMesPontoDTO[];
  produtosPorCategoria: ProdutoCategoriaPontoDTO[];
};

const MESES_CURTOS_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

export class DashboardService {
  private pedidoRepo: Repository<Pedido>;
  private produtoRepo: Repository<Produto>;
  private clienteRepo: Repository<Cliente>;

  constructor(dataSource: DataSource) {
    this.pedidoRepo = dataSource.getRepository(Pedido);
    this.produtoRepo = dataSource.getRepository(Produto);
    this.clienteRepo = dataSource.getRepository(Cliente);
  }

  private async sumVendasMes(range: { start: Date; end: Date }): Promise<number> {
    const raw = await this.pedidoRepo
      .createQueryBuilder("p")
      .select("COALESCE(SUM(p.total), 0)", "sum")
      .where("p.status = :status", { status: "pago" })
      .andWhere("p.created_at BETWEEN :start AND :end", {
        start: range.start,
        end: range.end,
      })
      .getRawOne<{ sum: string | number | null }>();
    return Number(raw?.sum ?? 0);
  }

  async getResumo(): Promise<DashboardResumoDTO> {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    const atual = monthRangeLocal(y, m);
    const mesAnt = m === 0 ? 11 : m - 1;
    const anoAnt = m === 0 ? y - 1 : y;
    const anterior = monthRangeLocal(anoAnt, mesAnt);

    const vendasMesAtual = await this.sumVendasMes(atual);
    const vendasMesAnterior = await this.sumVendasMes(anterior);

    let crescimentoPercentual = 0;
    if (vendasMesAnterior > 0) {
      crescimentoPercentual =
        ((vendasMesAtual - vendasMesAnterior) / vendasMesAnterior) * 100;
    } else if (vendasMesAtual > 0) {
      crescimentoPercentual = 100;
    }

    const prodRaw = await this.produtoRepo
      .createQueryBuilder("pr")
      .select("COUNT(pr.id_prod)", "cnt")
      .where("pr.ativo = :ativo", { ativo: true })
      .getRawOne<{ cnt: string | number | null }>();

    const cliRaw = await this.clienteRepo
      .createQueryBuilder("c")
      .select("COUNT(c.id)", "cnt")
      .getRawOne<{ cnt: string | number | null }>();

    return {
      vendasMesAtual,
      produtosAtivos: Number(prodRaw?.cnt ?? 0),
      totalClientes: Number(cliRaw?.cnt ?? 0),
      crescimentoPercentual: Math.round(crescimentoPercentual * 10) / 10,
    };
  }

  async getGraficos(): Promise<DashboardGraficosDTO> {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    const vendasTasks: Promise<VendaMesPontoDTO>[] = [];
    for (let offset = 5; offset >= 0; offset--) {
      const d = new Date(y, m - offset, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth();
      const range = monthRangeLocal(yr, mo);
      const labelMes = `${MESES_CURTOS_PT[mo]} ${yr}`;
      vendasTasks.push(
        this.sumVendasMes(range).then((valor) => ({ labelMes, valor }))
      );
    }
    const vendasPorMes = await Promise.all(vendasTasks);

    const produtosRows = await this.produtoRepo
      .createQueryBuilder("pr")
      .innerJoin("pr.categoria", "cat")
      .select("cat.nome", "categoriaNome")
      .addSelect("COUNT(pr.id_prod)", "quantidade")
      .where("pr.ativo = :ativo", { ativo: true })
      .groupBy("cat.id")
      .addGroupBy("cat.nome")
      .orderBy("quantidade", "DESC")
      .getRawMany<{ categoriaNome: string; quantidade: string }>();

    const produtosPorCategoria: ProdutoCategoriaPontoDTO[] = produtosRows.map((r) => ({
      categoriaNome: r.categoriaNome,
      quantidade: Number(r.quantidade),
    }));

    return { vendasPorMes, produtosPorCategoria };
  }
}
