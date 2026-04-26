# Manual do Frontend (ERP)

Este manual explica como instalar, executar e usar o frontend do ERP localmente.

## 1) Pre-requisitos

Antes de começar, instale:

- Node.js 20+ (recomendado)
- npm (normalmente ja vem com Node.js)
- Backend do ERP configurado no mesmo computador

## 2) Estrutura do projeto

Neste repositorio existem dois projetos principais:

- Backend: pasta raiz `ERP/`
- Frontend Angular: pasta `ERP/frontend/`

## 3) Instalacao

### 3.1 Instalar dependencias do backend

No terminal, na raiz do projeto:

```bash
cd ERP
npm install
```

### 3.2 Instalar dependencias do frontend

No terminal, dentro da pasta frontend:

```bash
cd frontend
npm install
```

## 4) Executar em ambiente de desenvolvimento

O frontend usa proxy para enviar chamadas `/api` para `http://localhost:3000`.
Por isso, o backend precisa estar ativo junto com o frontend.

### 4.1 Subir o backend (porta 3000)

Na raiz do projeto `ERP/`:

```bash
npm run dev
```

### 4.2 Subir o frontend (porta 4200)

Em outro terminal, na pasta `ERP/frontend/`:

```bash
npm start
```

Abra no navegador:

- [http://localhost:4200](http://localhost:4200)

## 5) Fluxo de acesso

### 5.1 Tela de login

Rota: `/login`

- Informar e-mail e senha
- Botao **Entrar** autentica com a API
- Opcional: login com Google (depende do endpoint `/auth/google` no backend)

### 5.2 Cadastro de usuario

Rota: `/cadastro`

- Preencher nome, sobrenome, e-mail, perfil, senha e confirmacao
- Aceitar os termos
- Enviar formulario para criar conta

Perfis disponiveis no frontend:

- `SOLICITANTE`
- `GESTOR`
- `COMPRADOR`

> Observacao: se o backend exigir autenticacao para criar usuario, o cadastro pode retornar 401.

## 6) Navegacao principal

Depois de autenticar, o menu lateral libera as telas:

- Dashboard
- Clientes
- Produtos
- Categorias
- Financeiro

No canto inferior do menu existe o painel do usuario para encerrar sessao.

## 7) Como usar cada modulo

## 7.1 Dashboard

Rota: `/dashboard`

- Mostra cards de visao geral (ex.: total de produtos, estoque baixo)

## 7.2 Clientes

Rota: `/clientes`

Funcionalidades:

- Listar clientes
- Adicionar cliente
- Editar cliente
- Excluir cliente

Campos principais:

- Nome
- CPF/CNPJ
- E-mail
- Telefone

## 7.3 Categorias

Rota: `/categorias`

Funcionalidades:

- Listar categorias
- Adicionar categoria
- Editar categoria
- Excluir categoria

Campos principais:

- Nome da categoria
- Descricao (opcional)

## 7.4 Produtos

Rota: `/produtos`

Funcionalidades:

- Listar produtos
- Visualizar indicadores (total, ativos, inativos)
- Adicionar produto
- Editar produto
- Excluir produto

Campos principais:

- Nome
- Categoria
- Status (ativo/inativo)
- Codigo
- Preco
- Estoque atual, minimo e maximo
- Descricao

## 7.5 Financeiro

Rota: `/financeiro`

Funcionalidades:

- Listar registros financeiros
- Criar novo registro (receita/despesa)
- Marcar registro como pago

Campos principais:

- Tipo
- Descricao
- Valor
- Data de vencimento

## 8) Comandos uteis

### Frontend

Na pasta `ERP/frontend/`:

```bash
npm start      # sobe o frontend (dev server)
npm run build  # gera build de producao
npm test       # executa testes
```

### Backend

Na pasta `ERP/`:

```bash
npm run dev    # sobe backend em desenvolvimento
npm run build  # compila TypeScript
npm start      # executa build compilada
```

## 9) Problemas comuns e solucao

### Erro de API no frontend

- Confirme se o backend esta rodando em `http://localhost:3000`
- Confirme se frontend esta rodando em `http://localhost:4200`
- Reinicie os dois servidores apos mudancas de configuracao

### Porta em uso

- Troque a porta do processo que esta em conflito ou encerre o processo anterior

### Login com Google nao funciona

- Verifique se o backend implementa `/auth/google`
- Verifique configuracao de credenciais Google no backend

---

Se quiser, posso criar uma versao deste manual com capturas de tela e um guia rapido de onboard para novos usuarios.
