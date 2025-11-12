# Projeto LIA - API Backend

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

API RESTful desenvolvida para o Projeto LIA, um e‑commerce de livros com funcionalidades de loja pessoal e serviços de aquisição e reforma. NestJS — construída com Node.js, NestJS, TypeScript e Prisma, seguindo uma arquitetura modular e orientada a domínios.

---

## Tabela de Conteúdos

1.  [Funcionalidades Atuais](#funcionalidades-atuais)
2.  [Tecnologias Utilizadas](#tecnologias-utilizadas)
3.  [Pré-requisitos](#pré-requisitos)
4.  [Como Rodar o Projeto](#como-rodar-o-projeto)
5.  [Scripts Disponíveis](#scripts-disponíveis)
6.  [Estrutura de Pastas](#estrutura-de-pastas)
7.  [Endpoints da API](#endpoints-da-api)
8.  [Licença](#licença)

---

## Funcionalidades Atuais

-   **Autenticação & Usuários:**
    -   Cadastro de usuários (`cliente` e `admin`).
    -   Login com geração de token JWT.
    -   Busca de perfil do usuário logado.
-   **Autorização:**
    -   Middlewares para rotas protegidas (apenas autenticados).
    -   Middlewares para rotas restritas (apenas administradores).
-   **Livros:**
    -   Listagem e busca de livros (Público).
    -   Criação, atualização e remoção de livros no catálogo (Admin).
-   **Estoque:**
    -   Adição de livros do catálogo ao estoque com preço, quantidade e condição (Admin).
    -   Atualização de itens do estoque (Admin).
-   **Carrinho de Compras:**
    -   Adicionar itens do estoque ao carrinho (Cliente).
    -   Visualizar o conteúdo completo do carrinho com cálculo de total (Cliente).

---

## Tecnologias Utilizadas

Esta API foi construída com um conjunto de ferramentas modernas e robustas. O checklist abaixo indica o status de cada componente no projeto.

-   [x] **Backend:**
    -   [x] **Node.js:** Ambiente de execução JavaScript.
    -   [x] **TypeScript:** Superset do JavaScript que adiciona tipagem estática.
    -   [x] **NestJS:** Framework modular para Node.js que organiza controllers, providers e módulos.

-   [x] **Banco de Dados & ORM:**
    -   [x] **PostgreSQL:** Banco de dados relacional.
    -   [x] **Prisma:** ORM para modelagem, migrações e acesso aos dados.
    -   [x] **pg:** Driver Node.js para conexão com o PostgreSQL.

-   [ ] **Autenticação & Segurança:**
    -   [x] **Passport.js (`passport-jwt`):** Estratégia de autenticação configurada e funcionando.
    -   [x] **JSON Web Token (`jsonwebtoken`):** Geração de tokens de acesso implementada.
    -   [x] **bcryptjs:** Hashing de senhas implementado no cadastro de usuários.
    -   [ ] **Helmet:** _(Instalado, mas ainda não configurado no `app.ts`)_ Adiciona cabeçalhos de segurança HTTP.
    -   [ ] **CORS:** _(Instalado, mas ainda não configurado no `app.ts`)_ Middleware para habilitar o Cross-Origin Resource Sharing.

-   [x] **Validação de Dados:**
    -   [x] **class-validator & class-transformer:** Validação e transformação com DTOs e ValidationPipe do Nest.

-   [x] **Qualidade de Código & Ferramentas de Desenvolvimento:**
    -   [x] **ESLint:** Configurado para análise estática de código.
    -   [x] **Prettier:** Configurado para formatação automática de código.
    -   [x] **ts-node-dev:** Utilizado no script `dev` com hot-reload.
    -   [x] **tsconfig-paths:** Configurado para resolver os "path aliases" (`@/`).

-   [ ] **Testes Automatizados:**
    -   [ ] **Jest & Supertest:** Framework e bibliotecas de teste instalados e configurados.
    -   [ ] **Testes de Unidade:** Cobertura de testes para as regras de negócio nos `services`.
    -   [ ] **Testes de Integração:** Cobertura de testes para os `controllers` e `endpoints`.

-   [x] **Documentação da API:**
    -   [x] **@nestjs/swagger:** Documentação automática gerada a partir de decorators (`@ApiProperty`, `@ApiTags`, etc).
        -   [x] **Gerador de spec:** script `npm run generate:swagger` (CI-friendly) gera um snapshot OpenAPI versionável em `docs/openapi.json`.
        -   [x] **Gerador de spec (dev):** `npm run generate:swagger:dev` executa o gerador direto do TypeScript para desenvolvimento rápido e também atualiza `docs/openapi.json`.

-   [ ] **Pagamentos:**
    -   [x] **Mercado Pago SDK:** Biblioteca instalada.
    -   [ ] **Implementação:** Lógica de criação de preferência de pagamento e webhooks.

-   [x] **Containerização:**
    -   [x] **Docker:** Utilizado para criar e gerenciar o ambiente do banco de dados PostgreSQL.

## Pré-requisitos

Antes de começar, você precisa ter as seguintes ferramentas instaladas:
-   [Node.js](https://nodejs.org/en/) (v18 ou superior)
-   [Docker](https://www.docker.com/products/docker-desktop/) e Docker Compose
-   [Git](https://git-scm.com/)

---

## Como Rodar o Projeto

Siga os passos abaixo para executar a aplicação localmente:

**1. Clone o repositório:**
```bash
git clone git@github.com:octaviodemos/lia-back-end.git
cd lia-back-end
```

**2. Instale as dependências:**
```bash
npm install
```

**3. Configure as variáveis de ambiente:**
Crie uma cópia do arquivo de exemplo `.env.example` e renomeie para `.env`.
```bash
cp .env.example .env
```
Em seguida, abra o arquivo `.env` e preencha as variáveis, principalmente a `DATABASE_URL` e o `JWT_SECRET`.

**4. Inicie o banco de dados com Docker:**
Este comando irá criar e iniciar um contêiner PostgreSQL em segundo plano.
```bash
docker-compose up -d
```

**5. Aplique as migrações do banco de dados:**
Este comando irá ler o `schema.prisma` e criar todas as tabelas no seu banco de dados.
```bash
npx prisma migrate dev
```

**6. Inicie a aplicação:**
```bash
npm run dev
```
O servidor estará rodando em `http://localhost:3333` (ou na porta que você definiu no seu `.env`).

**7. Acesse a documentação (Swagger):**

Após iniciar a aplicação, a UI do Swagger fica disponível em:

```
http://localhost:3333/api/docs
```

Se quiser gerar um snapshot do OpenAPI para uso externo (por exemplo, publicar no Git ou em um gateway), rode:

```bash
npm run generate:swagger
```
O arquivo será escrito em `docs/openapi.json`.
Você também pode gerar localmente sem compilar com:

```bash
npm run generate:swagger:dev
```
Esse comando executa o gerador diretamente do TypeScript (útil para desenvolvimento rápido).

---

## Scripts Disponíveis

-   `npm run dev`: Inicia o servidor em modo de desenvolvimento com hot-reload.
-   `npm run build`: Compila o código TypeScript para JavaScript.
-   `npm run start`: Inicia o servidor a partir dos arquivos compilados (modo de produção).
 -   `npm run start`: Inicia o servidor a partir dos arquivos compilados (modo de produção).
 -   `npm test`: Roda os testes automatizados com Jest.
 -   `npm run lint`: Verifica o código em busca de erros de padrão com ESLint.
 -   `npm run generate:swagger`: Compila o projeto e executa o gerador (CI-friendly). Gera `docs/openapi.json`.
 -   `npm run generate:swagger:dev`: Executa o gerador direto do código TypeScript (sem build) — rápido para desenvolvimento. Gera `docs/openapi.json`.

---

## Estrutura de Pastas

O projeto utiliza uma arquitetura modular para separação de responsabilidades:
```
/src
├── /@types         # Definições de tipos globais
├── /config         # Configurações (ex: banco de dados)
├── /core           # Lógicas centrais (middlewares, erros)
├── /modules        # O coração da aplicação, cada pasta é um domínio
│   ├── /auth
│   ├── /books
│   ├── /cart
│   ├── /stock
│   └── /users
└── /shared         # Código compartilhado entre módulos
```

---

## Endpoints da API

Aqui está uma lista dos principais endpoints disponíveis até o momento.

#### Autenticação (`/api/auth`)
-   `POST /login`: Realiza o login e retorna um token JWT.

#### Usuários (`/api/users`)
-   `POST /`: Cria um novo usuário (cliente ou admin).
-   `GET /me`: **(Protegida)** Retorna os dados do usuário logado.

#### Livros (`/api/books`)
-   `GET /`: Retorna uma lista de todos os livros do catálogo.
-   `GET /:id`: Retorna os detalhes de um livro específico.
-   `POST /`: **(Admin)** Cadastra um novo livro.

#### Estoque (`/api/stock`)
-   `POST /`: **(Admin)** Adiciona um livro ao estoque com preço e quantidade.
        -   Observação: o campo `preco` é enviado e retornado como string no formato monetário com duas casas decimais (ex.: "49.90"). Isso preserva a precisão e evita problemas com ponto flutuante no cliente.
        -   Exemplo de corpo para criação (JSON):

                ```json
                {
                    "id_livro": 1,
                    "quantidade": 10,
                    "preco": "49.90",
                    "condicao": "novo"
                }
                ```
-   `PUT /:id`: **(Admin)** Atualiza um item de estoque.
-   `PUT /:id`: **(Admin)** Atualiza um item de estoque. (Aceita `preco` como string no mesmo formato)

#### Carrinho (`/api/cart`)
-   `GET /`: **(Protegida)** Retorna o conteúdo completo do carrinho do usuário.
-   `POST /items`: **(Protegida)** Adiciona um item de estoque ao carrinho.

---

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---
Feito com ❤️ por **Frank Cardoso**