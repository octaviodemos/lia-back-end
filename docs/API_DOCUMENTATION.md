# 📚 LIA Backend - Documentação Completa da API

## 🔔 ATENÇÃO: Campos Decimais

**IMPORTANTE:** Todos os campos do tipo `Decimal` (preços, valores monetários) são retornados como **strings formatadas** com 2 casas decimais.

**Exemplo:**
```json
{
  "preco": "49.90",          // ✅ Correto
  "preco_unitario": "33.00"  // ✅ Correto
}
```

**Campos afetados:**
- `Estoque.preco` → string "XX.XX"
- `ItemPedido.preco_unitario` → string "XX.XX"
- `Pagamento.valor_pago` → string "XX.XX"
- `Pagamento.taxas_gateway` → string "XX.XX"
- `OfertaVenda.preco_sugerido` → string "XX.XX"

📖 Para mais detalhes, consulte: [`docs/DECIMAL_FIX.md`](../docs/DECIMAL_FIX.md)

---

## 📋 Índice
- [Informações Gerais](#informações-gerais)
- [Autenticação](#autenticação)
- [Módulos](#módulos)
  - [Auth](#auth)
  - [Users](#users)
  - [Books](#books)
  - [Cart](#cart)
  - [Orders](#orders)
  - [Addresses](#addresses)
  - [Offers](#offers)
  - [Repairs](#repairs)
  - [Stock](#stock)
- [Modelos de Dados](#modelos-de-dados)
- [Códigos de Status](#códigos-de-status)
- [Exemplos de Integração](#exemplos-de-integração)

---

## Informações Gerais

### Base URL
```
http://localhost:3333/api
```

### Swagger UI (Documentação Interativa)
```
http://localhost:3333/api/docs
```

### Content-Type
Todas as requisições devem usar:
```
Content-Type: application/json
```

### CORS
O backend está configurado para aceitar requisições de:
```
http://localhost:4200
```

---

## Autenticação

### 🔑 Como Autenticar

1. Faça login usando `/api/auth/login`
2. Receba o `access_token` na resposta
3. Inclua o token no header `Authorization` de todas as requisições protegidas:

```
Authorization: Bearer <seu_access_token>
```

### Credenciais de Teste
```json
{
  "email": "admin@example.com",
  "senha": "minhasenha"
}
```

---

## Módulos

## Auth

### 🔓 Login
Autentica um usuário e retorna um token JWT.

**Endpoint:** `POST /api/auth/login`  
**Autenticação:** ❌ Não requer

**Request Body:**
```json
{
  "email": "admin@example.com",
  "senha": "minhasenha"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE3MDA...",
  "user": {
    "id_usuario": 1,
    "nome": "Admin Seed",
    "email": "admin@example.com",
    "tipo_usuario": "admin"
  }
}
```

**Validações:**
- `email`: Deve ser um email válido (com @)
- `senha`: Mínimo 6 caracteres, tipo string

**Erros Comuns:**
```json
{
  "message": "Credenciais inválidas",
  "statusCode": 401
}
```

---

### ✍️ Registro
Cria uma nova conta de usuário.

**Endpoint:** `POST /api/auth/register`  
**Autenticação:** ❌ Não requer

**Request Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "tipo_usuario": "cliente"
}
```

**Campos:**
- `nome` (string, obrigatório): Nome completo
- `email` (string, obrigatório): Email único
- `password` (string, obrigatório): Mínimo 6 caracteres
- `tipo_usuario` (string, opcional): "cliente" (padrão) ou "admin"

**Response (201 Created):**
```json
{
  "id_usuario": 2,
  "nome": "João Silva",
  "email": "joao@example.com",
  "tipo_usuario": "cliente",
  "created_at": "2025-11-27T20:00:00.000Z"
}
```

**Erros Comuns:**
```json
{
  "message": "Email já cadastrado",
  "statusCode": 401
}
```

---

### 👤 Buscar Perfil
Retorna os dados do usuário autenticado.

**Endpoint:** `GET /api/auth/profile`  
**Autenticação:** ✅ JWT obrigatório

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id_usuario": 1,
  "nome": "Admin Seed",
  "email": "admin@example.com",
  "telefone": null,
  "tipo_usuario": "admin",
  "created_at": "2025-11-27T19:00:00.000Z"
}
```

---

## Users

### 📋 Listar Todos Usuários (Admin)
Lista todos os usuários do sistema.

**Endpoint:** `GET /api/users`  
**Autenticação:** ✅ JWT + Role: admin

**Response (200 OK):**
```json
[
  {
    "id_usuario": 1,
    "nome": "Admin Seed",
    "email": "admin@example.com",
    "tipo_usuario": "admin"
  },
  {
    "id_usuario": 2,
    "nome": "Cliente Teste",
    "email": "cliente@example.com",
    "tipo_usuario": "cliente"
  }
]
```

---

### 👤 Buscar Usuário por ID
Retorna os dados de um usuário específico.

**Endpoint:** `GET /api/users/:id`  
**Autenticação:** ✅ JWT

**Response (200 OK):**
```json
{
  "id_usuario": 2,
  "nome": "Cliente Teste",
  "email": "cliente@example.com",
  "tipo_usuario": "cliente",
  "telefone": "(11) 98765-4321"
}
```

---

## Books

### 📚 Listar Todos Livros
Lista todos os livros disponíveis no marketplace.

**Endpoint:** `GET /api/books`  
**Autenticação:** ❌ Não requer

**Response (200 OK):**
```json
[
  {
    "id_livro": 1,
    "titulo": "Dom Casmurro",
    "sinopse": "Romance de Machado de Assis...",
    "editora": "Companhia das Letras",
    "ano_publicacao": 1899,
    "isbn": "978-8535911664",
    "capa_url": "https://exemplo.com/capa.jpg",
    "autores": ["Machado de Assis"],
    "media_avaliacoes": 4.5,
    "total_avaliacoes": 120
  }
]
```

---

### 📖 Buscar Livro por ID
Retorna detalhes completos de um livro, incluindo estoque e avaliações.

**Endpoint:** `GET /api/books/:id`  
**Autenticação:** ❌ Não requer

**Response (200 OK):**
```json
{
  "id_livro": 1,
  "titulo": "Dom Casmurro",
  "sinopse": "Romance de Machado de Assis que narra a história de Bentinho...",
  "editora": "Companhia das Letras",
  "ano_publicacao": 1899,
  "isbn": "978-8535911664",
  "capa_url": "https://exemplo.com/capa.jpg",
  "autores": ["Machado de Assis"],
  "estoque": [
    {
      "id_estoque": 1,
      "quantidade": 15,
      "preco": "34.90",
      "condicao": "novo"
    },
    {
      "id_estoque": 2,
      "quantidade": 5,
      "preco": "19.90",
      "condicao": "usado_bom"
    }
  ],
  "media_avaliacoes": 4.5,
  "total_avaliacoes": 120
}
```

**Condições de Estoque:**
- `novo`: Livro novo
- `usado_excelente`: Usado em excelente estado
- `usado_bom`: Usado em bom estado
- `usado_aceitavel`: Usado em estado aceitável

---

### ⭐ Listar Avaliações do Livro
Lista todas as avaliações de um livro.

**Endpoint:** `GET /api/books/:id/avaliacoes`  
**Autenticação:** ❌ Não requer

**Response (200 OK):**
```json
[
  {
    "id_avaliacao": 1,
    "nota": 5,
    "comentario": "Obra-prima da literatura brasileira!",
    "created_at": "2025-11-20T10:30:00.000Z",
    "usuario": {
      "id_usuario": 2,
      "nome": "Maria Silva"
    }
  },
  {
    "id_avaliacao": 2,
    "nota": 4,
    "comentario": "Muito bom, recomendo!",
    "created_at": "2025-11-18T14:20:00.000Z",
    "usuario": {
      "id_usuario": 3,
      "nome": "João Santos"
    }
  }
]
```

---

### ✍️ Criar Avaliação
Cria uma nova avaliação para um livro.

**Endpoint:** `POST /api/books/:id/avaliacoes`  
**Autenticação:** ✅ JWT

**Request Body:**
```json
{
  "nota": 5,
  "comentario": "Excelente livro, super recomendo!"
}
```

**Validações:**
- `nota`: Número entre 1 e 5
- `comentario`: String (opcional)

**Response (201 Created):**
```json
{
  "id_avaliacao": 10,
  "id_livro": 1,
  "id_usuario": 2,
  "nota": 5,
  "comentario": "Excelente livro, super recomendo!",
  "created_at": "2025-11-27T20:15:00.000Z"
}
```

---

### ➕ Criar Livro (Admin)
Adiciona um novo livro ao catálogo.

**Endpoint:** `POST /api/books`  
**Autenticação:** ✅ JWT + Role: admin

**Request Body:**
```json
{
  "titulo": "1984",
  "sinopse": "Distopia sobre um regime totalitário...",
  "editora": "Companhia das Letras",
  "ano_publicacao": 1949,
  "isbn": "978-8535914849",
  "capa_url": "https://exemplo.com/1984.jpg",
  "autores": ["George Orwell"],
  "estoque": {
    "quantidade": 20,
    "preco": "39.90",
    "condicao": "novo"
  }
}
```

**Response (201 Created):**
```json
{
  "id_livro": 15,
  "titulo": "1984",
  "isbn": "978-8535914849",
  "created_at": "2025-11-27T20:20:00.000Z"
}
```

---

## Cart

### 🛒 Buscar Carrinho
Retorna o carrinho de compras do usuário autenticado.

**Endpoint:** `GET /api/cart`  
**Autenticação:** ✅ JWT

**Response (200 OK):**
```json
{
  "id_carrinho": 1,
  "id_usuario": 2,
  "created_at": "2025-11-25T10:00:00.000Z",
  "itens": [
    {
      "id_carrinho_item": 1,
      "id_estoque": 1,
      "quantidade": 2,
      "estoque": {
        "id_estoque": 1,
        "preco": "34.90",
        "condicao": "novo",
        "livro": {
          "id_livro": 1,
          "titulo": "Dom Casmurro",
          "capa_url": "https://exemplo.com/capa.jpg",
          "autores": ["Machado de Assis"]
        }
      },
      "subtotal": "69.80"
    }
  ],
  "total": "69.80"
}
```

---

### ➕ Adicionar Item ao Carrinho
Adiciona um livro ao carrinho do usuário.

**Endpoint:** `POST /api/cart/items`  
**Autenticação:** ✅ JWT

**Request Body:**
```json
{
  "id_estoque": 1,
  "quantidade": 2
}
```

**Response (201 Created):**
```json
{
  "id_carrinho_item": 5,
  "id_carrinho": 1,
  "id_estoque": 1,
  "quantidade": 2,
  "created_at": "2025-11-27T20:30:00.000Z"
}
```

**Notas:**
- Se o item já existe no carrinho, a quantidade é incrementada
- O backend valida se há estoque disponível

---

## Orders

### ✅ Confirmar Pedido
Finaliza a compra dos itens no carrinho.

**Endpoint:** `POST /api/orders/confirm`  
**Autenticação:** ✅ JWT

**Request Body:**
```json
{
  "id_endereco": 1,
  "metodo_pagamento": "cartao_credito",
  "observacoes": "Entregar pela manhã"
}
```

**Métodos de Pagamento:**
- `cartao_credito`
- `cartao_debito`
- `pix`
- `boleto`

**Response (200 OK):**
```json
{
  "success": true,
  "id_pedido": 10,
  "total": "139.70",
  "status": "pendente"
}
```

**Notas:**
- O carrinho é esvaziado após a confirmação
- O estoque é decrementado automaticamente
- Se houver estoque insuficiente, retorna erro 400

---

### 📦 Buscar Meus Pedidos
Lista todos os pedidos do usuário autenticado.

**Endpoint:** `GET /api/orders/my-orders`  
**Autenticação:** ✅ JWT

**Response (200 OK):**
```json
[
  {
    "id_pedido": 10,
    "id_usuario": 2,
    "total": "139.70",
    "status": "enviado",
    "metodo_pagamento": "cartao_credito",
    "created_at": "2025-11-27T10:00:00.000Z",
    "endereco": {
      "rua": "Rua Exemplo",
      "numero": "123",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01234-567"
    },
    "itens": [
      {
        "id_pedido_item": 15,
        "quantidade": 2,
        "preco_unitario": "34.90",
        "subtotal": "69.80",
        "livro": {
          "titulo": "Dom Casmurro",
          "capa_url": "https://exemplo.com/capa.jpg"
        }
      }
    ]
  }
]
```

**Status do Pedido:**
- `pendente`: Pedido criado, aguardando pagamento
- `processando`: Pagamento confirmado, preparando envio
- `enviado`: Pedido enviado
- `entregue`: Pedido entregue
- `cancelado`: Pedido cancelado

---

## Addresses

### 📍 Listar Endereços
Lista todos os endereços do usuário autenticado.

**Endpoint:** `GET /api/addresses`  
**Autenticação:** ✅ JWT

**Response (200 OK):**
```json
[
  {
    "id_endereco": 1,
    "id_usuario": 2,
    "rua": "Rua das Flores",
    "numero": "123",
    "complemento": "Apto 45",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567",
    "created_at": "2025-11-20T10:00:00.000Z"
  }
]
```

---

### ➕ Adicionar Endereço
Adiciona um novo endereço ao usuário.

**Endpoint:** `POST /api/addresses`  
**Autenticação:** ✅ JWT

**Request Body:**
```json
{
  "rua": "Av. Paulista",
  "numero": "1000",
  "complemento": "Conj. 801",
  "bairro": "Bela Vista",
  "cidade": "São Paulo",
  "estado": "SP",
  "cep": "01310-100"
}
```

**Campos Obrigatórios:**
- `rua`, `numero`, `bairro`, `cidade`, `estado`, `cep`

**Campos Opcionais:**
- `complemento`

**Response (201 Created):**
```json
{
  "id_endereco": 2,
  "id_usuario": 2,
  "rua": "Av. Paulista",
  "numero": "1000",
  "complemento": "Conj. 801",
  "bairro": "Bela Vista",
  "cidade": "São Paulo",
  "estado": "SP",
  "cep": "01310-100"
}
```

---

## Offers

### 💰 Criar Oferta de Venda
Permite ao usuário oferecer um livro para venda.

**Endpoint:** `POST /api/offers`  
**Autenticação:** ✅ JWT

**Request Body:**
```json
{
  "titulo": "Harry Potter e a Pedra Filosofal",
  "autor": "J.K. Rowling",
  "isbn": "978-8532530787",
  "condicao": "usado_bom",
  "preco_desejado": "25.00",
  "descricao": "Livro em bom estado, algumas marcas de uso na capa"
}
```

**Condições:**
- `novo`
- `usado_excelente`
- `usado_bom`
- `usado_aceitavel`

**Response (201 Created):**
```json
{
  "id_oferta": 5,
  "id_usuario": 2,
  "titulo": "Harry Potter e a Pedra Filosofal",
  "status": "pendente",
  "created_at": "2025-11-27T21:00:00.000Z"
}
```

---

### 📋 Buscar Minhas Ofertas
Lista todas as ofertas do usuário autenticado.

**Endpoint:** `GET /api/offers/my-offers`  
**Autenticação:** ✅ JWT

**Response (200 OK):**
```json
[
  {
    "id_oferta": 5,
    "titulo": "Harry Potter e a Pedra Filosofal",
    "autor": "J.K. Rowling",
    "condicao": "usado_bom",
    "preco_desejado": "25.00",
    "status": "pendente",
    "resposta_admin": null,
    "created_at": "2025-11-27T21:00:00.000Z"
  }
]
```

**Status:**
- `pendente`: Aguardando análise
- `aprovado`: Oferta aprovada
- `rejeitado`: Oferta rejeitada

---

### 📋 Listar Todas Ofertas (Admin)
Lista todas as ofertas do sistema.

**Endpoint:** `GET /api/offers`  
**Autenticação:** ✅ JWT + Role: admin

**Response (200 OK):**
```json
[
  {
    "id_oferta": 5,
    "usuario": {
      "id_usuario": 2,
      "nome": "João Silva",
      "email": "joao@example.com"
    },
    "titulo": "Harry Potter e a Pedra Filosofal",
    "status": "pendente",
    "created_at": "2025-11-27T21:00:00.000Z"
  }
]
```

---

### ✅ Responder Oferta (Admin)
Aprova ou rejeita uma oferta de venda.

**Endpoint:** `PATCH /api/offers/:id/respond`  
**Autenticação:** ✅ JWT + Role: admin

**Request Body:**
```json
{
  "status": "aprovado",
  "resposta_admin": "Oferta aprovada! Entraremos em contato para combinar a entrega."
}
```

**Status:**
- `aprovado`
- `rejeitado`

**Response (200 OK):**
```json
{
  "id_oferta": 5,
  "status": "aprovado",
  "resposta_admin": "Oferta aprovada! Entraremos em contato para combinar a entrega.",
  "updated_at": "2025-11-27T21:30:00.000Z"
}
```

---

## Repairs

### 🔧 Criar Solicitação de Reparo
Permite ao usuário solicitar reparo de um livro.

**Endpoint:** `POST /api/repairs`  
**Autenticação:** ✅ JWT

**Request Body:**
```json
{
  "titulo_livro": "Dom Casmurro",
  "descricao_problema": "Páginas soltas na encadernação, necessita reforço"
}
```

**Response (201 Created):**
```json
{
  "id_solicitacao": 3,
  "id_usuario": 2,
  "titulo_livro": "Dom Casmurro",
  "status": "pendente",
  "created_at": "2025-11-27T22:00:00.000Z"
}
```

---

### 📋 Buscar Minhas Solicitações
Lista todas as solicitações de reparo do usuário.

**Endpoint:** `GET /api/repairs/my-requests`  
**Autenticação:** ✅ JWT

**Response (200 OK):**
```json
[
  {
    "id_solicitacao": 3,
    "titulo_livro": "Dom Casmurro",
    "descricao_problema": "Páginas soltas na encadernação",
    "status": "em_analise",
    "resposta_admin": "Recebemos sua solicitação e estamos analisando",
    "created_at": "2025-11-27T22:00:00.000Z"
  }
]
```

**Status:**
- `pendente`: Aguardando análise
- `em_analise`: Em análise
- `aprovado`: Aprovado para reparo
- `rejeitado`: Não é possível reparar
- `concluido`: Reparo concluído

---

### 📋 Listar Todas Solicitações (Admin)
Lista todas as solicitações de reparo.

**Endpoint:** `GET /api/repairs`  
**Autenticação:** ✅ JWT + Role: admin

**Response (200 OK):**
```json
[
  {
    "id_solicitacao": 3,
    "usuario": {
      "id_usuario": 2,
      "nome": "João Silva",
      "email": "joao@example.com",
      "telefone": "(11) 98765-4321"
    },
    "titulo_livro": "Dom Casmurro",
    "status": "pendente",
    "created_at": "2025-11-27T22:00:00.000Z"
  }
]
```

---

### ✅ Responder Solicitação (Admin)
Atualiza o status e responde uma solicitação de reparo.

**Endpoint:** `PATCH /api/repairs/:id/respond`  
**Autenticação:** ✅ JWT + Role: admin

**Request Body:**
```json
{
  "status": "em_analise",
  "resposta_admin": "Recebemos sua solicitação. Por favor, envie fotos do livro para avaliarmos o orçamento."
}
```

**Response (200 OK):**
```json
{
  "id_solicitacao": 3,
  "status": "em_analise",
  "resposta_admin": "Recebemos sua solicitação...",
  "updated_at": "2025-11-27T22:15:00.000Z"
}
```

---

## Stock

### ➕ Criar Item de Estoque
Adiciona um novo item de estoque para um livro.

**Endpoint:** `POST /api/stock`  
**Autenticação:** ❌ Não requer (deve ser protegido em produção)

**Request Body:**
```json
{
  "id_livro": 1,
  "quantidade": 50,
  "preco": "34.90",
  "condicao": "novo"
}
```

**Response (201 Created):**
```json
{
  "id_estoque": 10,
  "id_livro": 1,
  "quantidade": 50,
  "preco": "34.90",      // ⚠️ String formatada, não objeto
  "condicao": "novo",
  "created_at": "2025-11-27T22:30:00.000Z"
}
```

**⚠️ IMPORTANTE:** O campo `preco` é retornado como string `"XX.XX"` com 2 casas decimais, não como objeto Decimal.

---

### 📝 Atualizar Item de Estoque
Atualiza quantidade ou preço de um item de estoque.

**Endpoint:** `PATCH /api/stock/:id`  
**Autenticação:** ❌ Não requer (deve ser protegido em produção)

**Request Body:**
```json
{
  "quantidade": 45,
  "preco": "29.90"
}
```

**Response (200 OK):**
```json
{
  "id_estoque": 10,
  "quantidade": 45,
  "preco": "29.90",      // ⚠️ String formatada
  "updated_at": "2025-11-27T22:35:00.000Z"
}
```

**⚠️ IMPORTANTE:** O campo `preco` é retornado como string `"XX.XX"` com 2 casas decimais.

---

## Modelos de Dados

### Usuario
```typescript
{
  id_usuario: number;
  nome: string;
  email: string;
  senha: string; // hash bcrypt
  telefone?: string;
  tipo_usuario: 'cliente' | 'admin';
  created_at: Date;
  updated_at: Date;
}
```

### Livro
```typescript
{
  id_livro: number;
  titulo: string;
  sinopse?: string;
  editora?: string;
  ano_publicacao?: number;
  isbn?: string;
  capa_url?: string;
  created_at: Date;
}
```

### Estoque
```typescript
{
  id_estoque: number;
  id_livro: number;
  quantidade: number;
  preco: Decimal; // string no JSON
  condicao?: 'novo' | 'usado_excelente' | 'usado_bom' | 'usado_aceitavel';
  created_at: Date;
}
```

### Carrinho
```typescript
{
  id_carrinho: number;
  id_usuario: number;
  created_at: Date;
}
```

### CarrinhoItem
```typescript
{
  id_carrinho_item: number;
  id_carrinho: number;
  id_estoque: number;
  quantidade: number;
  created_at: Date;
}
```

### Pedido
```typescript
{
  id_pedido: number;
  id_usuario: number;
  id_endereco: number;
  total: Decimal;
  status: 'pendente' | 'processando' | 'enviado' | 'entregue' | 'cancelado';
  metodo_pagamento: string;
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
}
```

### Endereco
```typescript
{
  id_endereco: number;
  id_usuario: number;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string; // UF
  cep: string;
  created_at: Date;
}
```

### Avaliacao
```typescript
{
  id_avaliacao: number;
  id_livro: number;
  id_usuario: number;
  nota: number; // 1-5
  comentario?: string;
  created_at: Date;
}
```

### Oferta
```typescript
{
  id_oferta: number;
  id_usuario: number;
  titulo: string;
  autor?: string;
  isbn?: string;
  condicao?: string;
  preco_desejado?: Decimal;
  descricao?: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  resposta_admin?: string;
  created_at: Date;
  updated_at: Date;
}
```

### SolicitacaoReparo
```typescript
{
  id_solicitacao: number;
  id_usuario: number;
  titulo_livro: string;
  descricao_problema: string;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado' | 'concluido';
  resposta_admin?: string;
  created_at: Date;
  updated_at: Date;
}
```

---

## Códigos de Status

### Sucesso
- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso

### Erros do Cliente
- `400 Bad Request`: Dados inválidos na requisição
- `401 Unauthorized`: Não autenticado ou token inválido
- `403 Forbidden`: Sem permissão para acessar o recurso
- `404 Not Found`: Recurso não encontrado
- `409 Conflict`: Conflito (ex: email já cadastrado, ISBN duplicado)

### Erros do Servidor
- `500 Internal Server Error`: Erro interno do servidor

---

## Exemplos de Integração

### Angular Service - AuthService

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

interface LoginResponse {
  access_token: string;
  user: {
    id_usuario: number;
    nome: string;
    email: string;
    tipo_usuario: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3333/api';
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.tokenSubject.next(token);
    }
  }

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, senha })
      .pipe(
        tap(response => {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.tokenSubject.next(response.access_token);
        })
      );
  }

  register(nome: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, {
      nome,
      email,
      password,
      tipo_usuario: 'cliente'
    });
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/profile`);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.tokenSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}
```

### Angular Interceptor - JwtInterceptor

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
    
    return next.handle(req);
  }
}
```

### Angular Service - BooksService

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BooksService {
  private apiUrl = 'http://localhost:3333/api/books';

  constructor(private http: HttpClient) {}

  getAllBooks(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getBookById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getBookReviews(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/avaliacoes`);
  }

  createReview(id: number, nota: number, comentario: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/avaliacoes`, { nota, comentario });
  }
}
```

### Angular Service - CartService

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:3333/api/cart';
  private cartSubject = new BehaviorSubject<any>(null);
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCart(): Observable<any> {
    return this.http.get(this.apiUrl).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  addItem(id_estoque: number, quantidade: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/items`, { id_estoque, quantidade }).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  getCartItemCount(): number {
    const cart = this.cartSubject.value;
    if (!cart || !cart.itens) return 0;
    return cart.itens.reduce((total: number, item: any) => total + item.quantidade, 0);
  }
}
```

### Angular Guard - AuthGuard

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
```

### Exemplo de Uso no Componente

```typescript
import { Component, OnInit } from '@angular/core';
import { BooksService } from './services/books.service';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.component.html'
})
export class BookDetailComponent implements OnInit {
  book: any;
  reviews: any[] = [];

  constructor(
    private booksService: BooksService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    const bookId = 1; // ou pegar da rota
    
    this.booksService.getBookById(bookId).subscribe(
      book => this.book = book,
      error => console.error('Erro ao carregar livro', error)
    );

    this.booksService.getBookReviews(bookId).subscribe(
      reviews => this.reviews = reviews,
      error => console.error('Erro ao carregar avaliações', error)
    );
  }

  addToCart(id_estoque: number): void {
    this.cartService.addItem(id_estoque, 1).subscribe(
      () => alert('Livro adicionado ao carrinho!'),
      error => console.error('Erro ao adicionar ao carrinho', error)
    );
  }

  submitReview(nota: number, comentario: string): void {
    this.booksService.createReview(this.book.id_livro, nota, comentario).subscribe(
      () => {
        alert('Avaliação enviada com sucesso!');
        // Recarregar avaliações
        this.booksService.getBookReviews(this.book.id_livro).subscribe(
          reviews => this.reviews = reviews
        );
      },
      error => console.error('Erro ao enviar avaliação', error)
    );
  }
}
```

---

## Observações Importantes

### Segurança
1. **Tokens JWT**: Armazene tokens no `localStorage` ou `sessionStorage`
2. **HTTPS**: Em produção, use sempre HTTPS
3. **Validação**: Sempre valide os dados no frontend antes de enviar

### Performance
1. **Cache**: Implemente cache para dados que não mudam frequentemente (ex: lista de livros)
2. **Paginação**: Para listas grandes, considere implementar paginação
3. **Lazy Loading**: Carregue imagens de livros com lazy loading

### Tratamento de Erros
```typescript
// Exemplo de tratamento de erro
this.authService.login(email, senha).subscribe(
  response => {
    // Sucesso
    this.router.navigate(['/home']);
  },
  error => {
    if (error.status === 401) {
      this.errorMessage = 'Email ou senha inválidos';
    } else if (error.status === 400) {
      this.errorMessage = 'Dados inválidos. Verifique os campos.';
    } else {
      this.errorMessage = 'Erro ao fazer login. Tente novamente.';
    }
  }
);
```

### Formatação de Dados
```typescript
// Formatação de preço
formatPrice(price: string): string {
  return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
}

// Formatação de data
formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}
```

---

## Suporte

Para mais informações ou dúvidas sobre a API:
- **Swagger UI**: http://localhost:3333/api/docs
- **Repositório**: https://github.com/octaviodemos/lia-back-end

---

**Última atualização:** 27 de novembro de 2025
