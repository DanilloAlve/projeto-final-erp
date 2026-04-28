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
JWT_ACCESS_SECRET="CHAVE SECRETA ACCESS"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_SECRET="CHAVE SECRETA REFRESH"
JWT_REFRESH_EXPIRATION="7d"
GOOGLE_CLIENT_ID="SEU_CLIENT_ID_GOOGLE_OAUTH"
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
npm install express typeorm pg reflect-metadata bcryptjs jsonwebtoken dotenv zod tsx typescript nodemon compression helmet express-rate-limit

npm install -D @types/express @types/node @types/bcryptjs @types/jsonwebtoken @types/compression

npx tsc --init

Crie o arquivo .env na raiz do projeto da seguinte forma:
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=coloque_aqui_sua_senha_do_postgres
DB_NAME=erp_db

JWT_ACCESS_SECRET=troque_isso_por_uma_string_muito_longa_e_aleatoria
JWT_REFRESH_SECRET=outra_string_diferente_e_muito_longa_aqui
PORT=3000



```
---

---

### 4. Rodar o projeto

```bash
npm run dev
```

---


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

## 👨‍💻 Autor

Desenvolvido como projeto de estudo e prática em arquitetura de sistemas e desenvolvimento full stack.

---

