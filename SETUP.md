# 🚀 Guia de Instalação e Execução - LIA Backend

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** v18 ou superior ([Download](https://nodejs.org/))
- **PostgreSQL** v14 ou superior ([Download](https://www.postgresql.org/download/))
- **npm** ou **yarn** (incluído com Node.js)
- **Git** ([Download](https://git-scm.com/))

---

## 📥 1. Clonar o Repositório

```bash
git clone https://github.com/octaviodemos/lia-back-end.git
cd lia-back-end
```

---

## 📦 2. Instalar Dependências

```bash
npm install
```

---

## 🗄️ 3. Configurar Banco de Dados

### 3.1. Criar o Banco de Dados PostgreSQL

Abra o terminal do PostgreSQL (psql) ou use um cliente gráfico como pgAdmin:

```sql
CREATE DATABASE lia_db;
```

### 3.2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Banco de Dados
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=lia_db
DB_PASSWORD=sua_senha_aqui
DB_PORT=5432

# URL de Conexão Prisma
DATABASE_URL=postgresql://postgres:sua_senha_aqui@localhost:5432/lia_db?schema=public

# JWT Secret
JWT_SECRET=seu-secret-jwt-muito-forte-aqui

# Porta do Servidor
PORT=3333

# CORS Origin (URL do frontend)
CORS_ORIGIN=http://localhost:4200

# Credenciais do Admin (opcional - para seed)
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=minhasenha
```

**⚠️ IMPORTANTE:** Substitua `sua_senha_aqui` pela senha do seu PostgreSQL.

---

## 🔄 4. Executar Migrações do Prisma

Aplique as migrações do banco de dados:

```bash
npx prisma migrate deploy
```

Ou, para desenvolvimento:

```bash
npx prisma migrate dev
```

---

## 🌱 5. Popular o Banco de Dados (Seed)

Execute o seed para criar o usuário admin e importar livros:

```bash
npm run seed
```

Isso criará:
- **Usuário Admin**: `admin@example.com` / `minhasenha`
- **Livros**: Importados de `prisma/books_br.json` (se existir)

---

## ▶️ 6. Iniciar o Servidor

### Modo Desenvolvimento (com hot reload)

```bash
npm run dev
```

### Modo Produção

```bash
npm run build
npm start
```

---

## ✅ 7. Verificar Instalação

Se tudo correu bem, você verá:

```
🚀 Nest server running on port 3333
```

Acesse:
- **API**: http://localhost:3333/api
- **Swagger Docs**: http://localhost:3333/api/docs

---

## 🧪 8. Testar a API

### Usando o Swagger UI

1. Acesse http://localhost:3333/api/docs
2. Clique em **POST /api/auth/login**
3. Teste com as credenciais:
   ```json
   {
     "email": "admin@example.com",
     "senha": "minhasenha"
   }
   ```

### Usando curl (PowerShell)

```powershell
Invoke-WebRequest -Uri "http://localhost:3333/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","senha":"minhasenha"}'
```

### Usando curl (Bash/Linux/Mac)

```bash
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","senha":"minhasenha"}'
```

---

## 🛠️ Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor em modo desenvolvimento |
| `npm run build` | Compila o projeto TypeScript |
| `npm start` | Inicia servidor em modo produção |
| `npm run seed` | Popula banco de dados com dados iniciais |
| `npm run lint` | Verifica erros de linting |
| `npm run lint:fix` | Corrige erros de linting automaticamente |
| `npm run format` | Formata código com Prettier |
| `npm test` | Executa testes |
| `npx prisma studio` | Abre interface gráfica do Prisma |
| `npx prisma generate` | Gera cliente Prisma |
| `npx prisma migrate dev` | Cria e aplica migração |

---

## 🗂️ Estrutura do Projeto

```
lia-backend/
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados
│   ├── migrations/            # Migrações do Prisma
│   ├── seed.js                # Script de seed
│   └── books_br.json          # Dados de livros (opcional)
├── src/
│   ├── modules/
│   │   ├── auth/              # Autenticação e autorização
│   │   ├── users/             # Gerenciamento de usuários
│   │   ├── books/             # Catálogo de livros
│   │   ├── cart/              # Carrinho de compras
│   │   ├── orders/            # Pedidos
│   │   ├── addresses/         # Endereços
│   │   ├── offers/            # Ofertas de venda
│   │   ├── repairs/           # Solicitações de reparo
│   │   └── stock/             # Controle de estoque
│   ├── prisma/                # Módulo Prisma
│   ├── core/                  # Decorators e middleware
│   ├── shared/                # Módulos compartilhados
│   ├── swagger/               # Gerador Swagger
│   ├── app.ts                 # Módulo principal
│   └── main.ts                # Entry point
├── .env                       # Variáveis de ambiente
├── package.json               # Dependências
├── tsconfig.json              # Configuração TypeScript
└── README.md                  # Documentação principal
```

---

## 🐛 Solução de Problemas

### Erro: "Port 3333 is already in use"

**Solução:**
```powershell
# Windows
netstat -ano | findstr :3333
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3333 | xargs kill -9
```

Ou altere a porta no `.env`:
```
PORT=3334
```

---

### Erro: "Cannot connect to database"

**Solução:**
1. Verifique se PostgreSQL está rodando:
   ```powershell
   # Windows
   Get-Service postgresql*
   
   # Linux/Mac
   sudo service postgresql status
   ```

2. Verifique as credenciais no `.env`
3. Teste a conexão:
   ```bash
   psql -U postgres -d lia_db
   ```

---

### Erro: "Prisma Client not generated"

**Solução:**
```bash
npx prisma generate
```

---

### Erro: "Migration failed"

**Solução:**
```bash
# Resete o banco (CUIDADO: apaga todos os dados)
npx prisma migrate reset

# Ou aplique manualmente
npx prisma migrate deploy
```

---

### Erro: "Module not found"

**Solução:**
```bash
# Limpe node_modules e reinstale
rm -rf node_modules package-lock.json
npm install

# Windows PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

## 🔐 Credenciais Padrão

Após executar o seed, use estas credenciais para testes:

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | `admin@example.com` | `minhasenha` |

---

## 🌐 Integração com Frontend

### Angular

Instale o interceptor JWT no frontend:

```typescript
// app.config.ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './interceptors/jwt.interceptor';

export const appConfig = {
  providers: [
    provideHttpClient(withInterceptors([jwtInterceptor]))
  ]
};
```

Configure a baseURL do serviço:

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3333/api'
};
```

---

## 📚 Documentação Adicional

- **API Completa**: Ver `API_DOCUMENTATION.md`
- **Rotas**: Ver `ROTAS_API.md`
- **Swagger**: http://localhost:3333/api/docs (após iniciar servidor)

---

## 🤝 Suporte

Para problemas ou dúvidas:
- **Issues**: https://github.com/octaviodemos/lia-back-end/issues
- **Email**: [seu-email]
- **Documentação**: `/docs` no projeto

---

## 📝 Checklist de Setup

- [ ] Node.js instalado
- [ ] PostgreSQL instalado e rodando
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` criado e configurado
- [ ] Banco de dados criado (`lia_db`)
- [ ] Migrações aplicadas (`npx prisma migrate deploy`)
- [ ] Seed executado (`npm run seed`)
- [ ] Servidor iniciado (`npm run dev`)
- [ ] API testada (Swagger ou curl)
- [ ] Frontend configurado para apontar para `http://localhost:3333/api`

---

**Última atualização:** 27 de novembro de 2025
