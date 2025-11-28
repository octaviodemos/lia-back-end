# 📋 Documentação da API - LIA Backend

**Base URL:** `http://localhost:3333/api`

---

## 🔐 Autenticação

### Login
**POST** `/auth/login`
- **Autenticação:** ❌ Não requer
- **Body:**
```json
{
  "email": "admin@example.com",
  "senha": "minhasenha"
}
```
- **Resposta (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Registro
**POST** `/auth/register`
- **Autenticação:** ❌ Não requer
- **Body:**
```json
{
  "nome": "Nome Completo",
  "email": "usuario@example.com",
  "password": "senha123",
  "tipo_usuario": "cliente"
}
```

### Buscar Perfil do Usuário
**GET** `/auth/profile`
- **Autenticação:** ✅ JWT obrigatório
- **Headers:**
```
Authorization: Bearer <seu_token_jwt>
```
- **Resposta (200):**
```json
{
  "id_usuario": 1,
  "nome": "Admin Seed",
  "email": "admin@example.com",
  "telefone": null,
  "tipo_usuario": "admin",
  "created_at": "2025-11-27T..."
}
```

---

## 👥 Usuários

### Listar Todos Usuários (Admin)
**GET** `/users`
- **Autenticação:** ✅ JWT + Role: admin
- **Resposta (200):** Array de usuários

### Buscar Usuário por ID
**GET** `/users/:id`
- **Autenticação:** ✅ JWT
- **Resposta (200):** Dados do usuário

---

## 📚 Livros

### Listar Todos Livros
**GET** `/books`
- **Autenticação:** ❌ Não requer
- **Resposta (200):** Array de livros

### Buscar Livro por ID
**GET** `/books/:id`
- **Autenticação:** ❌ Não requer
- **Resposta (200):** Detalhes do livro com estoque
```json
{
  "id_livro": 1,
  "titulo": "Nome do Livro",
  "sinopse": "Descrição...",
  "editora": "Editora",
  "ano_publicacao": 2020,
  "isbn": "978-...",
  "capa_url": "https://...",
  "autores": ["Autor 1", "Autor 2"],
  "estoque": [
    {
      "id_estoque": 1,
      "quantidade": 10,
      "preco": "49.90",
      "condicao": "novo"
    }
  ],
  "media_avaliacoes": 4.5,
  "total_avaliacoes": 10
}
```

### Listar Avaliações do Livro
**GET** `/books/:id/avaliacoes`
- **Autenticação:** ❌ Não requer
- **Resposta (200):** Array de avaliações

### Criar Avaliação
**POST** `/books/:id/avaliacoes`
- **Autenticação:** ✅ JWT
- **Body:**
```json
{
  "nota": 5,
  "comentario": "Ótimo livro!"
}
```

### Criar Livro (Admin)
**POST** `/books`
- **Autenticação:** ✅ JWT + Role: admin
- **Body:**
```json
{
  "titulo": "Nome do Livro",
  "sinopse": "Descrição",
  "editora": "Editora",
  "ano_publicacao": 2024,
  "isbn": "978-...",
  "capa_url": "https://...",
  "autores": ["Autor 1"],
  "estoque": {
    "quantidade": 10,
    "preco": "49.90",
    "condicao": "novo"
  }
}
```

---

## 🛒 Carrinho

### Buscar Carrinho do Usuário
**GET** `/cart`
- **Autenticação:** ✅ JWT
- **Resposta (200):**
```json
{
  "id_carrinho": 1,
  "id_usuario": 1,
  "itens": [
    {
      "id_carrinho_item": 1,
      "id_estoque": 1,
      "quantidade": 2,
      "estoque": {
        "id_estoque": 1,
        "preco": "49.90",
        "livro": {
          "titulo": "Nome do Livro",
          "capa_url": "https://..."
        }
      }
    }
  ]
}
```

### Adicionar Item ao Carrinho
**POST** `/cart/items`
- **Autenticação:** ✅ JWT
- **Body:**
```json
{
  "id_estoque": 1,
  "quantidade": 2
}
```

---

## 📦 Pedidos

### Confirmar Pedido
**POST** `/orders/confirm`
- **Autenticação:** ✅ JWT
- **Body:**
```json
{
  "id_endereco": 1,
  "metodo_pagamento": "cartao_credito"
}
```
- **Resposta (200):**
```json
{
  "success": true,
  "id_pedido": 1
}
```

### Buscar Meus Pedidos
**GET** `/orders/my-orders`
- **Autenticação:** ✅ JWT
- **Resposta (200):** Array de pedidos do usuário

---

## 📍 Endereços

### Listar Endereços do Usuário
**GET** `/addresses`
- **Autenticação:** ✅ JWT
- **Resposta (200):** Array de endereços

### Adicionar Endereço
**POST** `/addresses`
- **Autenticação:** ✅ JWT
- **Body:**
```json
{
  "rua": "Rua Exemplo",
  "numero": "123",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "estado": "SP",
  "cep": "01234-567",
  "complemento": "Apto 45"
}
```

---

## 💰 Ofertas de Venda

### Criar Oferta
**POST** `/offers`
- **Autenticação:** ✅ JWT
- **Body:**
```json
{
  "titulo": "Nome do Livro",
  "autor": "Nome do Autor",
  "isbn": "978-...",
  "condicao": "usado_bom",
  "preco_desejado": "30.00",
  "descricao": "Livro em ótimo estado"
}
```

### Buscar Minhas Ofertas
**GET** `/offers/my-offers`
- **Autenticação:** ✅ JWT
- **Resposta (200):** Array de ofertas do usuário

### Listar Todas Ofertas (Admin)
**GET** `/offers`
- **Autenticação:** ✅ JWT + Role: admin
- **Resposta (200):** Array de todas ofertas

### Responder Oferta (Admin)
**PATCH** `/offers/:id/respond`
- **Autenticação:** ✅ JWT + Role: admin
- **Body:**
```json
{
  "status": "aprovado",
  "resposta_admin": "Oferta aprovada, entraremos em contato"
}
```

---

## 🔧 Solicitações de Reparo

### Criar Solicitação
**POST** `/repairs`
- **Autenticação:** ✅ JWT
- **Body:**
```json
{
  "titulo_livro": "Nome do Livro",
  "descricao_problema": "Páginas soltas na encadernação"
}
```

### Buscar Minhas Solicitações
**GET** `/repairs/my-requests`
- **Autenticação:** ✅ JWT
- **Resposta (200):** Array de solicitações do usuário

### Listar Todas Solicitações (Admin)
**GET** `/repairs`
- **Autenticação:** ✅ JWT + Role: admin
- **Resposta (200):** Array de todas solicitações

### Responder Solicitação (Admin)
**PATCH** `/repairs/:id/respond`
- **Autenticação:** ✅ JWT + Role: admin
- **Body:**
```json
{
  "status": "em_analise",
  "resposta_admin": "Recebemos sua solicitação"
}
```

---

## 📊 Estoque

### Criar Item de Estoque
**POST** `/stock`
- **Body:**
```json
{
  "id_livro": 1,
  "quantidade": 10,
  "preco": "49.90",
  "condicao": "novo"
}
```

### Atualizar Item de Estoque
**PATCH** `/stock/:id`
- **Body:**
```json
{
  "quantidade": 15,
  "preco": "45.00"
}
```

---

## 🔑 Autenticação JWT

Para rotas protegidas, sempre envie o header:
```
Authorization: Bearer <seu_token_jwt>
```

---

## 🧪 Credenciais de Teste

```json
{
  "email": "admin@example.com",
  "senha": "minhasenha"
}
```

---

## ⚠️ Observações Importantes

1. **Campo de senha no login:** O backend aceita tanto `password` quanto `senha` no body do login
2. **Validações:**
   - Email deve ser válido (com @)
   - Senha mínima de 6 caracteres
3. **CORS:** Configurado para aceitar requisições de `http://localhost:4200`
4. **Swagger:** Documentação interativa disponível em `http://localhost:3333/api/docs`

---

## 🚀 Como Usar no Frontend

### Exemplo de Serviço de Autenticação (Angular)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3333/api';

  constructor(private http: HttpClient) {}

  login(email: string, senha: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, senha });
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
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(`${this.apiUrl}/auth/profile`, { headers });
  }
}
```

### Exemplo de Interceptor para JWT

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('access_token');
    
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return next.handle(req);
  }
}
```
