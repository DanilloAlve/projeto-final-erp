import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth';
import { API_URL } from '../../services/constants';

export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  codigo: string;
  preco: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo: number | null;
  ativo: boolean;
  categoriaId?: string;
  created_at?: string;
}

type ProdutoForm = {
  id?: string;
  nome: string;
  codigo: string;
  descricao: string;
  preco: number;
  estoque_minimo: number;
  estoque_maximo: number | null;
  ativo: boolean;
  categoriaId: string;
  precoInput?: string;
  quantidade: number;
};

@Component({
  selector: 'app-produtos',
  imports: [CommonModule, FormsModule],
  templateUrl: './produtos.html',
  styleUrl: './produtos.css',
})
export class Produtos {
  currentUser = signal<any>(null);
  menuAberto = signal(false);
  menuRecolhido = signal(false);
  loading = signal(false);
  errorMessage = signal('');

  private perfilAtual() {
    return this.currentUser()?.funcao ?? null;
  }

  podeVerFinanceiro() {
    const p = this.perfilAtual();
    return p === 'ADMINISTRADOR_SISTEMA' || p === 'GERENTE_SUPERVISOR' || p === 'FINANCEIRO_CONTADOR';
  }

  podeVerMovimentacoes() {
    const p = this.perfilAtual();
    return (
      p === 'ADMINISTRADOR_SISTEMA' ||
      p === 'GERENTE_SUPERVISOR' ||
      p === 'OPERADOR_ESTOQUE' ||
      p === 'FINANCEIRO_CONTADOR'
    );
  }

  podeVerClientes() {
    const p = this.perfilAtual();
    return p === 'ADMINISTRADOR_SISTEMA' || p === 'GERENTE_SUPERVISOR' || p === 'FINANCEIRO_CONTADOR';
  }

  podeVerPedidos() {
    const p = this.perfilAtual();
    return p === 'ADMINISTRADOR_SISTEMA' || p === 'GERENTE_SUPERVISOR' || p === 'FINANCEIRO_CONTADOR';
  }

  podeVerUsuarios() {
    const p = this.perfilAtual();
    return p === 'ADMINISTRADOR_SISTEMA' || p === 'GERENTE_SUPERVISOR';
  }

  mostraModal = signal(false);
  salvando = signal(false);
  excluindo = signal(false);
  formulario = signal<ProdutoForm>({
    nome: '',
    codigo: '',
    descricao: '',
    preco: 0,
    estoque_minimo: 0,
    estoque_maximo: null,
    ativo: true,
    categoriaId: '',
    precoInput: '0,00',
    quantidade: 1,
  });

  opcoesProduto: string[] = [
    'Compressor (rotativo, scroll ou inverter)',
    'Condensador (serpentina externa)',
    'Evaporador (serpentina interna)',
    'Dispositivo de expansão (válvula de expansão ou tubo capilar)',
    'Fluido refrigerante (R22, R410A, R32, etc.)',
    'Ventilador da unidade interna (turbina / blower)',
    'Ventilador da unidade externa (axial)',
    'Motores dos ventiladores',
    'Placa eletrônica principal (PCB)',
    'Placa inverter (em modelos inverter)',
    'Sensores de temperatura (ambiente e serpentina)',
    'Sensor de degelo',
    'Sensor de pressão (em alguns modelos)',
    'Capacitores (partida e funcionamento)',
    'Relés',
    'Fusíveis',
    'Transformador',
    'Chicote elétrico (fiação interna)',
    'Fonte de alimentação',
    'Tubulação de cobre (linha de líquido e sucção)',
    'Conexões e juntas (flanges, porcas, conexões flare)',
    'Válvulas de serviço',
    'Válvulas de retenção (quando aplicável)',
    'Filtro secador',
    'Acumulador de sucção',
    'Carcaça da unidade interna (plástico)',
    'Carcaça da unidade externa (metal)',
    'Chassi estrutural',
    'Suportes metálicos (fixação)',
    'Painéis de proteção',
    'Grades de ventilação',
    'Bandeja de condensado',
    'Tubo de dreno',
    'Bandeja de coleta de água',
    'Bomba de dreno (em alguns modelos)',
    'Filtro de ar padrão',
    'Filtro HEPA (quando aplicável)',
    'Filtro de carvão ativado',
    'Ionizador (em modelos avançados)',
    'Display (LED ou digital)',
    'Placa receptora do controle remoto',
    'Controle remoto',
    'Botões de operação manual',
    'Isolamento térmico (espuma elastomérica)',
    'Isolamento acústico',
    'Borrachas antivibração',
    'Proteções contra poeira e umidade',
    'Válvula reversora (quente/frio)',
    'Placa Wi-Fi / IoT',
    'Módulo de comunicação',
    'Resistência elétrica (aquecimento)',
    'Sensor de presença',
    'Sensor de umidade',
  ];

  produtos: Produto[] = [];

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {
    this.currentUser.set(this.authService.getCurrentUser());
    this.carregarProdutos();
  }

  private mapApiProduto(p: any): Produto {
    return {
      id: p.id_prod ?? p.id,
      nome: p.nome,
      descricao: p.descricao ?? null,
      codigo: p.codigo,
      preco: Number(p.preco),
      estoque_atual: Number(p.estoque_atual ?? 0),
      estoque_minimo: Number(p.estoque_minimo ?? 0),
      estoque_maximo: p.estoque_maximo === null || p.estoque_maximo === undefined ? null : Number(p.estoque_maximo),
      ativo: Boolean(p.ativo ?? true),
      categoriaId: p.categoria?.id ?? undefined,
      created_at: p.created_at ?? undefined,
    };
  }

  async carregarProdutos() {
    try {
      this.loading.set(true);
      this.errorMessage.set('');

      const response = await firstValueFrom(this.http.get<any[]>(`${API_URL}/produtos`));
      this.produtos = Array.isArray(response) ? response.map((p) => this.mapApiProduto(p)) : [];
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      this.errorMessage.set('Erro ao carregar produtos');
    } finally {
      this.loading.set(false);
    }
  }

  irParaDashboard() {
    this.router.navigate(['/dashboard']);
  }

  irParaFinanceiro() {
    this.router.navigate(['/financeiro']);
  }

  irParaMovimentacoes() {
    this.router.navigate(['/movimentacoes']);
  }

  irParaClientes() {
    this.router.navigate(['/clientes']);
  }

  irParaPedidos() {
    this.router.navigate(['/pedidos']);
  }

  irParaUsuarios() {
    this.router.navigate(['/usuarios']);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.menuAberto.set(!this.menuAberto());
  }

  toggleMenuRecolhido() {
    this.menuRecolhido.set(!this.menuRecolhido());
  }

  abrirModalNovo() {
    const nomeInicial = this.opcoesProduto[0] ?? '';
    this.formulario.set({
      nome: nomeInicial,
      codigo: this.gerarCodigoAutomatico(nomeInicial),
      descricao: '',
      preco: 0,
      estoque_minimo: 0,
      estoque_maximo: null,
      ativo: true,
      categoriaId: '',
      precoInput: this.formatMoneyInput(0),
      quantidade: 1,
    });
    this.mostraModal.set(true);
  }

  abrirModalEditar(produto: Produto) {
    this.formulario.set({
      id: produto.id,
      nome: produto.nome,
      codigo: produto.codigo,
      descricao: produto.descricao ?? '',
      preco: produto.preco,
      estoque_minimo: produto.estoque_minimo,
      estoque_maximo: produto.estoque_maximo,
      ativo: produto.ativo,
      categoriaId: produto.categoriaId ?? '',
      precoInput: this.formatMoneyInput(produto.preco),
      quantidade: 1,
    });
    this.mostraModal.set(true);
  }

  onNomeProdutoChange(nome: string) {
    const atual = this.formulario();
    const codigo = this.gerarCodigoAutomatico(nome);
    this.formulario.set({ ...atual, nome, codigo });
  }

  private gerarCodigoAutomatico(nome: string) {
    const base = String(nome ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim()
      .toUpperCase();

    const tokens = base.split(/\s+/).filter(Boolean);
    const prefixo = tokens
      .slice(0, 3)
      .map((t) => t.slice(0, 3))
      .join('')
      .slice(0, 9);

    let hash = 0;
    for (let i = 0; i < base.length; i++) {
      hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
    }
    const sufixo = (hash % 100000).toString().padStart(5, '0');
    return `${prefixo || 'PROD'}-${sufixo}`;
  }

  private formatMoneyInput(value: number) {
    const cents = Math.round(Number(value || 0) * 100);
    const normalized = String(Math.max(0, cents)).padStart(3, '0');
    const intPartRaw = normalized.slice(0, -2);
    const intPart = String(Number(intPartRaw));
    const frac = normalized.slice(-2);
    return `${intPart},${frac}`;
  }

  onPrecoInputChange(raw: string) {
    const digits = String(raw ?? '').replace(/\D/g, '');
    const normalized = digits.padStart(3, '0');
    const intPartRaw = normalized.slice(0, -2);
    const intPart = String(Number(intPartRaw));
    const frac = normalized.slice(-2);
    const formatted = `${intPart},${frac}`;
    this.formulario.set({ ...this.formulario(), precoInput: formatted, preco: Number(intPart) + Number(frac) / 100 });
  }

  fecharModal() {
    this.mostraModal.set(false);
  }

  private buildPayloadFromForm(form: ProdutoForm) {
    const payload: any = {
      nome: form.nome,
      codigo: form.codigo,
      descricao: form.descricao ? form.descricao : null,
      preco: Number(form.preco),
      estoque_atual: Number(form.quantidade ?? 1),
      estoque_minimo: Number(form.estoque_minimo),
      estoque_maximo: form.estoque_maximo === null || form.estoque_maximo === undefined ? null : Number(form.estoque_maximo),
      ativo: Boolean(form.ativo),
    };

    const categoriaId = form.categoriaId?.trim();
    if (categoriaId) {
      payload.categoriaId = categoriaId;
    }
    return payload;
  }

  async salvarProduto() {
    const form = this.formulario();
    if (!form.nome.trim() || !form.codigo.trim()) {
      alert('Preencha nome e código');
      return;
    }
    if (!form.quantidade || Number(form.quantidade) <= 0) {
      alert('Preencha a quantidade');
      return;
    }
    if (form.preco === null || form.preco === undefined || Number.isNaN(Number(form.preco)) || Number(form.preco) <= 0) {
      alert('Preencha o preço');
      return;
    }
    if (!form.estoque_minimo && form.estoque_minimo !== 0) {
      alert('Preencha o estoque mínimo');
      return;
    }

    try {
      this.salvando.set(true);
      const payload = this.buildPayloadFromForm(form);

      if (form.id) {
        await firstValueFrom(this.http.put(`${API_URL}/produtos/${form.id}`, payload));
      } else {
        await firstValueFrom(this.http.post(`${API_URL}/produtos`, payload));
      }

      await this.carregarProdutos();
      this.fecharModal();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto');
    } finally {
      this.salvando.set(false);
    }
  }

  async excluirProdutoModal() {
    const form = this.formulario();
    if (!form.id) {
      this.fecharModal();
      return;
    }

    const ok = confirm('Tem certeza que deseja excluir este produto?');
    if (!ok) return;

    try {
      this.excluindo.set(true);
      await firstValueFrom(this.http.delete(`${API_URL}/produtos/${form.id}`));
      await this.carregarProdutos();
      this.fecharModal();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto');
    } finally {
      this.excluindo.set(false);
    }
  }
}
