import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { Dashboard } from './dashboard';
import { AuthService } from '../../services/auth';
import { API_URL } from '../../services/constants';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { getCurrentUser: () => ({ nome: 'Test', funcao: 'ADMINISTRADOR_SISTEMA' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const reqs = httpMock.match(
      (req) =>
        req.url.includes(`${API_URL}/dashboard/resumo`) ||
        req.url.includes(`${API_URL}/dashboard/graficos`) ||
        req.url.includes(`${API_URL}/produtos`)
    );

    expect(reqs.length).toBe(3);

    const mesesStub = Array.from({ length: 6 }, (_, i) => ({
      labelMes: `m${i}`,
      valor: 0,
    }));

    for (const req of reqs) {
      if (req.request.url.endsWith('/dashboard/resumo')) {
        req.flush({
          vendasMesAtual: 0,
          produtosAtivos: 3,
          totalClientes: 10,
          crescimentoPercentual: 0,
        });
      } else if (req.request.url.endsWith('/dashboard/graficos')) {
        req.flush({
          vendasPorMes: mesesStub,
          produtosPorCategoria: [{ categoriaNome: 'Cat', quantidade: 2 }],
        });
      } else if (req.request.url.includes('/produtos')) {
        req.flush([]);
      }
    }

    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
