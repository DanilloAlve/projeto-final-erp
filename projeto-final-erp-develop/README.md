# 🚀 Sistema ERP - Enterprise Resource Planning

## 📌 Sobre o Projeto

Este projeto consiste no desenvolvimento de um **Sistema ERP (Enterprise Resource Planning)**, com o objetivo de centralizar e integrar os principais processos de uma indústrias, como:

* Gestão de usuários
* Controle de estoque
* Vendas (pedidos)
* Financeiro (contas a pagar/receber)
* Relatórios gerenciais

O sistema foi projetado seguindo o padrão de **arquitetura REST**, garantindo escalabilidade, organização e fácil integração entre serviços.

---

## 🧩 Problema Resolvido

Muitas indústrias ainda utilizam sistemas isolados ou planilhas para gerenciar suas operações, o que causa:

* Retrabalho
* Falta de integração entre setores
* Erros manuais
* Dificuldade na tomada de decisão

Este ERP resolve esses problemas ao centralizar todas as informações em um único sistema.

---

## 🛠️ Tecnologias Utilizadas

### Back-end

* Node.js
* Python
* Spring Boot (Java)

### Arquitetura

* API REST

### Banco de Dados

* MySQL

### Outros

* JWT para autenticação
* Bcrypt para criptografia de senhas
* Dotenv para variáveis de ambiente

---

## 🏗️ Arquitetura do Sistema

O sistema pode ser estruturado em:

* **Monolito modular** (Node.js)
  ou
* **Microserviços**:

  * Node.js → API principal
  * Spring Boot → serviços críticos (ex: financeiro)
  * Python → processamento e relatórios

---

## 📊 Funcionalidades

### 🔐 Autenticação

* Login com JWT
* Controle de acesso por perfil

### 👥 Usuários

* Cadastro, edição e exclusão
* Perfis: Admin, Financeiro, Estoque, Vendas

### 📦 Estoque

* Cadastro de produtos
* Controle de estoque mínimo
* Movimentações (entrada e saída)

### 🛒 Vendas

* Criação de pedidos
* Associação com clientes
* Cálculo automático do total

### 💰 Financeiro

* Contas a pagar
* Contas a receber
* Controle de status

### 📈 Dashboard

* Indicadores principais
* Produtos com estoque baixo
* Vendas do período

---

## 🗂️ Estrutura de Pastas

```
projeto-final-erp/
│
├── src/
│   ├── controllers/
│   ├── database/
│   ├── dto/
│   ├── entities/
│	├── erros/
│	├── middliware/
│	├── middliware/
│	├── routes/
│	├── services/
│   └── types/
│
├── .env
├── .gitignore
├── docker-compose.yml
├── package.json
├── server.ts
├── tsconfig.js
└── README.md
```

---

## ⚙️ Instalação e Execução

### 1. Clonar o repositório

```bash
git clone https://github.com/lucymary-am/projeto-final-erp
cd projeto-final-erp
```

---

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env`:

```env
# Banco de dados
JWT_ACCESS_SECRET="CHAVE SECRETA ACCESS"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_SECRET="CHAVE SECRETA REFRESH"
JWT_REFRESH_EXPIRATION="7d"
PORT=3000
NODE_ENV="production"
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=root
DB_NAME=erp_db
```

---

### 3. Instalar dependências

```bash
npm init -y  
#4.1 Instalando tudo de uma vez
npm install express typeorm pg reflect-metadata bcryptjs jsonwebtoken dotenv zod tsx typescript nodemon compression helmet express-rate-limit

#Instalando os tipos TypeScript
npm install -D @types/express @types/node @types/bcryptjs @types/jsonwebtoken @types/compression

#Criando o arquivo tsconfig.json
npx tsc --init

#Criando o arquivo .env
Crie o arquivo .env na raiz do projeto da seguinte forma:
# Banco de dados
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=coloque_aqui_sua_senha_do_postgres
DB_NAME=erp_db

# Segredos do JWT
# Coloque strings longas e aleatórias aqui
JWT_ACCESS_SECRET=troque_isso_por_uma_string_muito_longa_e_aleatoria
JWT_REFRESH_SECRET=outra_string_diferente_e_muito_longa_aqui
# Servidor
PORT=3000



```
---
### 🔗 Relacionamento geral do ERP
Cliente → Pedido
Usuário → Pedido
Pedido → ItemPedido
ItemPedido → Produto
Produto → Movimentação
Pedido → Financeiro (pode ser integrado depois)

---

### 4. Rodar o projeto

```bash
npm run dev
```

---

## 🔌 Principais Endpoints

### Auth

```
POST /auth/login
```

### Usuários

```
GET    /users
POST   /users
PUT    /users/:id
DELETE /users/:id
```

### Produtos

```
GET    /products
POST   /products
PUT    /products/:id
DELETE /products/:id
```

### Pedidos

```
POST /orders
GET  /orders
```

### Financeiro

```
GET  /finance
POST /finance
```

---

## 🔒 Regras de Negócio

* Não é permitido vender produtos sem estoque
* Toda venda reduz automaticamente o estoque
* Senhas são armazenadas com hash
* Todas as rotas (exceto login) exigem autenticação
* Operações críticas devem usar transações no banco

---

## 📋 Requisitos

### Funcionais

* Autenticação com JWT
* CRUD de usuários, produtos e clientes
* Registro de pedidos
* Controle financeiro
* Dashboard

### Não Funcionais

* Segurança
* Performance
* Escalabilidade
* Código organizado

---

## 🚧 Melhorias Futuras

* Integração com sistemas bancários
* Emissão de nota fiscal
* Dashboard com gráficos avançados
* Exportação de relatórios (CSV/PDF)
* Deploy em nuvem

---

## 👨‍💻 Autor

Desenvolvido como projeto de estudo e prática em arquitetura de sistemas e desenvolvimento full stack.

---

## 📄 Licença

Este projeto está sob a licença MIT.
