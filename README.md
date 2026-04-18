# LIA Backend

API REST do projeto LIA, construída com NestJS + Prisma + PostgreSQL.

## Visão geral

O sistema atende três frentes principais:

- Loja/catálogo de livros.
- Oferta de venda de livros para a LIA.
- Solicitações de reforma.

Regras centrais atuais do domínio:

- Cada linha de `estoque` representa um exemplar único.
- Vitrine agrupa por ISBN e escolhe um representante por prioridade.
- Avaliações são agregadas por edição (ISBN) com fallback por título.
- Upload de imagens é categorizado por tipo (Capa, Contracapa, Lombada, MioloPaginas, DetalhesAvarias).

## Stack

- Node.js + TypeScript
- NestJS
- Prisma ORM
- PostgreSQL
- JWT (autenticação)
- Swagger/OpenAPI
- Stripe (checkout/webhooks)

## Pré-requisitos

- Node.js 18+
- PostgreSQL
- npm

## Configuração local

1) Instale dependências:

```bash
npm install
```

2) Configure `.env` com as variáveis essenciais:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` (opcional)
- `CORS_ORIGIN` (opcional)
- `STRIPE_SECRET_KEY` (se usar pagamentos)
- `STRIPE_WEBHOOK_SECRET` (se usar webhook assinado)
- `BACKEND_URL` (para URLs de retorno do checkout)

3) Aplique migrations:

```bash
npx prisma migrate deploy
```

4) Gere o client do Prisma:

```bash
npx prisma generate
```

5) Rode em desenvolvimento:

```bash
npm run dev
```

API: `http://localhost:3333`  
Swagger: `http://localhost:3333/api/docs`

## Scripts úteis

- `npm run dev` inicia com hot-reload.
- `npm run build` compila TypeScript.
- `npm run start` executa build em produção.
- `npm run seed` popula dados iniciais.
- `npm run lint` valida padrão de código.
- `npm run lint:fix` corrige problemas auto-fixáveis.
- `npm run generate:swagger` gera `docs/openapi.json`.
- `npm run generate:swagger:dev` gera OpenAPI sem build completo.

## Estrutura resumida

```text
src/
  core/
  modules/
    auth/
    books/
    cart/
    offers/
    orders/
    payments/
    repairs/
    stock/
    users/
  prisma/
  shared/
prisma/
  migrations/
  schema.prisma
```

## Regras de negócio importantes

### Catálogo e vitrine

- A vitrine (`GET /api/books`) retorna um representante por ISBN.
- Critério de escolha:
  1. `destaque_vitrine = true`
  2. maior `nota_conservacao`
  3. menor preço disponível
  4. menor `id_livro`
- Livros sem ISBN não são agrupados entre si.

### Detalhe do livro

- `GET /api/books/:id` retorna `outras_opcoes` com outros exemplares do mesmo ISBN disponíveis.
- Cada opção inclui preço, condição, imagens e nota de conservação.

### Avaliações

- Avaliações continuam gravadas por `id_livro`.
- Leitura e média agregam por edição:
  - primeiro ISBN,
  - fallback por título exato,
  - fallback final por `id_livro`.

### Estoque/carrinho/pedido

- Não existe quantidade por item de estoque.
- Exemplar está disponível ou indisponível (`disponivel`).
- Carrinho é binário: item está ou não no carrinho.
- Ao finalizar pedido, o exemplar é marcado como indisponível.

### Imagens categorizadas

Campos esperados no multipart para upload:

- `imagem_Capa`
- `imagem_Contracapa`
- `imagem_Lombada`
- `imagem_MioloPaginas`
- `imagem_DetalhesAvarias`

As URLs ficam sob `/uploads/*` e são servidas estaticamente.

## Endpoints (resumo)

A referência oficial é o Swagger (`/api/docs`), mas os principais grupos são:

- `/api/auth`
- `/api/users`
- `/api/books`
- `/api/stock`
- `/api/cart`
- `/api/orders`
- `/api/payments`
- `/api/offers`
- `/api/repairs`
- `/api/admin/*`

## Observações

- O arquivo `docs/openapi.json` pode ser versionado para integração com frontend/QA.
- Se após mudança de schema aparecer erro de tipagem Prisma no editor, rode `npx prisma generate` e reinicie o TS Server.

## Licença

MIT.