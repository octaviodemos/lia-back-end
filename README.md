# LIA Backend

API REST do **LIA** — marketplace de livros usados com loja, ofertas de venda, reformas e painel administrativo.

Desenvolvido para o Projeto Integrador. Stack: **NestJS**, **Prisma**, **PostgreSQL**.

| | |
|---|---|
| **API local** | `http://localhost:3333/api` |
| **Swagger** | `http://localhost:3333/api/docs` |
| **Uploads** | `http://localhost:3333/uploads/*` |

---

## O que o sistema faz

| Módulo | Responsabilidade |
|--------|------------------|
| **Loja** | Catálogo, vitrine por ISBN, detalhe com variantes de exemplar |
| **Estoque** | Um registro = um exemplar físico (sem quantidade) |
| **Carrinho e pedidos** | Reserva de exemplar ao finalizar compra |
| **Pagamentos** | Checkout Stripe com confirmação por sessão |
| **Ofertas** | Usuário vende livro para a LIA (fotos categorizadas) |
| **Reformas** | Solicitação e triagem de serviços de restauração |
| **Comunidade** | Publicações, comentários e reações |
| **IA** | Identificação de capa, avaliação de conservação e reformas |
| **Recomendações** | Sugestões via integração Skoob (cache em banco) |

---

## Stack

- Node.js 18+ · TypeScript · NestJS 10
- Prisma ORM · PostgreSQL
- JWT (Passport) · class-validator
- Swagger / OpenAPI
- Stripe · Google Gemini (visão e texto)
- Open Library e Google Books (metadados de ISBN)

---

## Início rápido

```bash
npm install
# crie .env na raiz (veja tabela abaixo ou SETUP.md)
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Guia detalhado de instalação e modelo de `.env`: [`SETUP.md`](SETUP.md).

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `DATABASE_URL` | sim | Conexão PostgreSQL para o Prisma |
| `JWT_SECRET` | sim | Segredo para assinatura dos tokens |
| `PORT` | não | Porta HTTP (padrão `3333`) |
| `CORS_ORIGIN` | não | Origem do front (padrão `http://localhost:4200`) |
| `FRONTEND_URL` | não | Redirects pós-pagamento |
| `BACKEND_URL` | não | URLs de retorno do checkout Stripe |
| `STRIPE_SECRET_KEY` | não* | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | não | Assinatura do webhook Stripe |
| `GEMINI_API_KEY` | não* | IA de capa e avaliações |
| `SKOOB_API_BASE_URL` | não | Base da API Skoob (padrão `http://localhost:3000`) |
| `SEED_ADMIN_EMAIL` | não | E-mail do admin no seed |
| `SEED_ADMIN_PASSWORD` | não | Senha do admin no seed |

\* Necessária apenas para usar o recurso correspondente.

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento com hot-reload |
| `npm run build` | Compila TypeScript → `dist/` |
| `npm run start` | Executa build de produção |
| `npm run seed` | Popula catálogo e usuário admin |
| `npm run test` | Testes (Jest) |
| `npm run lint` | ESLint |
| `npm run generate:swagger` | Gera `docs/openapi.json` |

---

## Estrutura

```text
src/
  core/              interceptors, middleware
  modules/
    auth/            login, registro, perfil
    books/           catálogo, avaliações, reações
    stock/           exemplares e preços
    cart/            carrinho
    orders/          pedidos
    payments/        Stripe
    offers/          ofertas de venda
    repairs/         reformas
    addresses/       endereços de entrega
    publications/    comunidade
    ai/              Gemini + lookup de ISBN
    recommendations/ Skoob
    utils/           CEP, estados e municípios
  prisma/
prisma/
  schema.prisma
  migrations/
  seed.js
docs/                OpenAPI e guias de integração
uploads/             imagens servidas estaticamente
```

---

## Regras de negócio

### Vitrine (`GET /api/books`)

Um representante por **ISBN**, escolhido por:

1. `destaque_vitrine = true`
2. maior `nota_conservacao`
3. menor preço disponível
4. menor `id_livro`

Livros sem ISBN não são agrupados entre si.

### Detalhe (`GET /api/books/:id`)

Retorna `outras_opcoes` — outros exemplares do mesmo ISBN ainda disponíveis.

### Avaliações

Gravadas por `id_livro`. Leitura agrega por edição (ISBN → título → livro).

### Estoque e carrinho

- Cada linha de estoque é **um exemplar** (`disponivel: true | false`).
- Carrinho é binário: o item está ou não no carrinho.
- Ao confirmar pedido, o exemplar passa a indisponível.

### Valores monetários

Campos `Decimal` são serializados como **string** `"XX.XX"`. Detalhes em [`docs/FRONTEND_INTEGRATION.md`](docs/FRONTEND_INTEGRATION.md).

### Imagens categorizadas

Campos multipart aceitos em ofertas, reformas e cadastro:

`imagem_Capa` · `imagem_Contracapa` · `imagem_Lombada` · `imagem_MioloPaginas` · `imagem_DetalhesAvarias`

---

## API (resumo)

Referência completa: **Swagger** em `/api/docs`.

| Prefixo | Uso |
|---------|-----|
| `/api/auth` | Registro, login, perfil |
| `/api/users` | Usuários |
| `/api/books` | Catálogo e avaliações |
| `/api/stock` | Estoque |
| `/api/cart` | Carrinho |
| `/api/orders` | Pedidos |
| `/api/payments` | Stripe (checkout, sessão, webhook) |
| `/api/offers` | Ofertas de venda |
| `/api/repairs` | Reformas |
| `/api/addresses` | Endereços |
| `/api/publicacoes` | Comunidade |
| `/api/recommendations` | Recomendações Skoob |
| `/api/ai` | IA (capa, ofertas, reformas) |
| `/api/utils` | CEP e localidades |
| `/api/admin/*` | Rotas administrativas |

### IA

| Endpoint | Auth | Função |
|----------|------|--------|
| `POST /api/ai/identify-cover` | — | Extrai título, autor, ISBN, editora, ano e sinopse da foto da capa |
| `POST /api/ai/evaluate-offer/:id` | admin | Avalia conservação pelas fotos da oferta |
| `POST /api/ai/evaluate-reform/:id` | admin | Avalia solicitação de reforma pelas fotos |

A identificação de capa enriquece metadados via **Open Library** e **Google Books** com timeout curto para não bloquear a requisição.

---

## Documentação adicional

- [`SETUP.md`](SETUP.md) — instalação passo a passo
- [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) — referência da API
- [`docs/FRONTEND_INTEGRATION.md`](docs/FRONTEND_INTEGRATION.md) — contratos para o front
- [`docs/openapi.json`](docs/openapi.json) — especificação OpenAPI versionada

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Erros de tipo Prisma no editor | `npx prisma generate` e reinicie o TS Server |
| IA de capa lenta ou sem resposta | Confirme `GEMINI_API_KEY`; lookup externo tem timeout de ~5s |
| Webhook Stripe falha | Rota `/api/payments/webhook` usa body raw — não altere a ordem dos parsers em `main.ts` |
| Imagens 404 | Verifique se `uploads/` existe e se a URL começa com `/uploads/` |

---

## Licença

MIT
