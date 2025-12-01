# 🔔 AVISO IMPORTANTE: Integração Backend LIA - Campos Decimais

## ⚠️ Mudança Crítica na API

O backend LIA implementou uma correção na serialização de campos monetários (preços, valores). 
**Todos os campos do tipo `Decimal` agora são retornados como strings formatadas**, não como números.

---

## 📋 O Que Mudou

### ❌ ANTES (Comportamento Incorreto)
```json
{
  "id_estoque": 1,
  "id_livro": 1,
  "quantidade": 10,
  "preco": {
    "s": 1,
    "e": 1,
    "d": [4990]
  }
}
```

### ✅ AGORA (Comportamento Correto)
```json
{
  "id_estoque": 1,
  "id_livro": 1,
  "quantidade": 10,
  "preco": "49.90"
}
```

---

## 🎯 Campos Afetados

Todos os campos monetários na API agora retornam **strings no formato `"XX.XX"`** com 2 casas decimais:

| Endpoint/Modelo | Campo | Tipo Anterior | Tipo Atual |
|-----------------|-------|---------------|------------|
| **Stock** (Estoque) | `preco` | Decimal object | `string` "XX.XX" |
| **Orders** (ItemPedido) | `preco_unitario` | Decimal object | `string` "XX.XX" |
| **Payments** (Pagamento) | `valor_pago` | Decimal object | `string` "XX.XX" |
| **Payments** (Pagamento) | `taxas_gateway` | Decimal object | `string` "XX.XX" |
| **Offers** (OfertaVenda) | `preco_sugerido` | Decimal object | `string` "XX.XX" |

---

## 🛠️ Ações Necessárias no Frontend

### 1. Atualizar Interfaces TypeScript

```typescript
// ❌ ANTES
export interface Estoque {
  id_estoque: number;
  id_livro: number;
  quantidade: number;
  preco: number;  // ❌ Errado
  condicao?: string;
}

// ✅ DEPOIS
export interface Estoque {
  id_estoque: number;
  id_livro: number;
  quantidade: number;
  preco: string;  // ✅ Correto - sempre "XX.XX"
  condicao?: string;
}
```

### 2. Atualizar Exibição nos Templates

```typescript
// ❌ ANTES
<p>Preço: R$ {{ estoque.preco | currency:'BRL' }}</p>

// ✅ DEPOIS - Opção 1: Converter para número
<p>Preço: R$ {{ +estoque.preco | currency:'BRL' }}</p>

// ✅ DEPOIS - Opção 2: Formatar manualmente
<p>Preço: R$ {{ estoque.preco }}</p>
```

### 3. Atualizar Cálculos

```typescript
// ❌ ANTES
const total = item.preco * item.quantidade;

// ✅ DEPOIS
const total = parseFloat(item.preco) * item.quantidade;

// Ou criar um helper
function precoToNumber(preco: string): number {
  return parseFloat(preco);
}

const total = precoToNumber(item.preco) * item.quantidade;
```

### 4. Atualizar Formulários

```typescript
// Ao ENVIAR para a API, continue usando string
const createStock = {
  id_livro: 1,
  quantidade: 10,
  preco: "49.90",  // ✅ String
  condicao: "novo"
};

// Se o usuário digitar no input, converta para string formatada
function formatPreco(valor: number): string {
  return valor.toFixed(2);
}

// Exemplo de reactive form
this.form = this.fb.group({
  preco: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]]
});
```

---

## 📝 Exemplo Completo Angular

### Interface (models/estoque.model.ts)
```typescript
export interface Estoque {
  id_estoque: number;
  id_livro: number;
  quantidade: number;
  preco: string;  // ⚠️ STRING, não number
  condicao?: string;
}

export interface CreateEstoqueDto {
  id_livro: number;
  quantidade: number;
  preco: string;  // ⚠️ Enviar como string "XX.XX"
  condicao?: string;
}
```

### Service (services/estoque.service.ts)
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Estoque, CreateEstoqueDto } from '../models/estoque.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EstoqueService {
  private apiUrl = `${environment.apiUrl}/stock`;

  constructor(private http: HttpClient) {}

  create(dto: CreateEstoqueDto): Observable<Estoque> {
    return this.http.post<Estoque>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreateEstoqueDto>): Observable<Estoque> {
    return this.http.patch<Estoque>(`${this.apiUrl}/${id}`, dto);
  }

  // Helper para converter string para número (se necessário)
  precoToNumber(preco: string): number {
    return parseFloat(preco);
  }

  // Helper para formatar número para string (ao enviar)
  numberToPreco(valor: number): string {
    return valor.toFixed(2);
  }
}
```

### Component (components/estoque-form/estoque-form.component.ts)
```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EstoqueService } from '../../services/estoque.service';

@Component({
  selector: 'app-estoque-form',
  templateUrl: './estoque-form.component.html'
})
export class EstoqueFormComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private estoqueService: EstoqueService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      id_livro: ['', [Validators.required]],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      preco: ['', [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/)  // Formato: "XX.XX"
      ]],
      condicao: ['']
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const formValue = this.form.value;
      
      // Garantir que preco está em formato string
      const dto = {
        ...formValue,
        preco: typeof formValue.preco === 'number' 
          ? formValue.preco.toFixed(2) 
          : formValue.preco
      };

      this.estoqueService.create(dto).subscribe({
        next: (estoque) => {
          console.log('Estoque criado:', estoque);
          // estoque.preco será string "XX.XX"
        },
        error: (err) => console.error('Erro:', err)
      });
    }
  }
}
```

### Template (estoque-form.component.html)
```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <div>
    <label>Livro ID:</label>
    <input type="number" formControlName="id_livro">
  </div>

  <div>
    <label>Quantidade:</label>
    <input type="number" formControlName="quantidade">
  </div>

  <div>
    <label>Preço:</label>
    <input 
      type="text" 
      formControlName="preco" 
      placeholder="49.90"
      pattern="^\d+(\.\d{1,2})?$">
    <small>Formato: XX.XX (ex: 49.90)</small>
  </div>

  <div>
    <label>Condição:</label>
    <input type="text" formControlName="condicao">
  </div>

  <button type="submit" [disabled]="!form.valid">Salvar</button>
</form>
```

### Exibição (estoque-list.component.html)
```html
<div *ngFor="let item of estoques">
  <h3>{{ item.livro?.titulo }}</h3>
  
  <!-- Opção 1: Converter para número e usar pipe currency -->
  <p>Preço: {{ +item.preco | currency:'BRL' }}</p>
  
  <!-- Opção 2: Exibir string diretamente -->
  <p>Preço: R$ {{ item.preco }}</p>
  
  <!-- Opção 3: Usar helper do service -->
  <p>Preço: {{ estoqueService.precoToNumber(item.preco) | currency:'BRL' }}</p>
  
  <p>Quantidade: {{ item.quantidade }}</p>
  <p>Total: {{ (+item.preco * item.quantidade) | currency:'BRL' }}</p>
</div>
```

---

## 🎨 Pipe Customizado (Opcional)

Crie um pipe para facilitar a conversão:

```typescript
// pipes/preco.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'preco'
})
export class PrecoPipe implements PipeTransform {
  transform(value: string | number): number {
    if (typeof value === 'number') return value;
    return parseFloat(value) || 0;
  }
}

// Uso no template
<p>Preço: {{ item.preco | preco | currency:'BRL' }}</p>
```

---

## ✅ Checklist de Migração

- [ ] Atualizar todas as interfaces TypeScript (`preco: string`)
- [ ] Revisar componentes que exibem preços
- [ ] Atualizar formulários (validação pattern para string)
- [ ] Ajustar cálculos (usar `parseFloat()` ou `+` operator)
- [ ] Testar envio de dados para API (garantir formato "XX.XX")
- [ ] Testar exibição de preços nos templates
- [ ] Atualizar testes unitários
- [ ] Revisar pipes customizados

---

## 🧪 Como Testar

### 1. Teste de Integração Simples

```typescript
// test.service.ts
this.http.get<Estoque>('http://localhost:3333/api/stock/1')
  .subscribe(estoque => {
    console.log(typeof estoque.preco);  // Deve ser "string"
    console.log(estoque.preco);          // Deve ser "49.90"
  });
```

### 2. Validação no Console

```typescript
// No navegador, após receber resposta da API
console.assert(typeof response.preco === 'string', 'Preço deve ser string!');
console.assert(/^\d+\.\d{2}$/.test(response.preco), 'Preço deve ter formato XX.XX');
```

---

## ❓ FAQ

### P: Por que mudou de number para string?
**R:** O PostgreSQL usa tipo `DECIMAL` para precisão monetária. O Prisma (ORM do backend) retornava objetos complexos `{s, e, d}` que quebravam o JSON. A solução foi serializar como string formatada.

### P: Posso converter para number no frontend?
**R:** Sim! Use `parseFloat(preco)` ou o operador `+preco` para cálculos. Mas mantenha a interface TypeScript como `string` para refletir a API real.

### P: E se eu precisar enviar um número?
**R:** Sempre envie como string formatada: `valor.toFixed(2)`. A API valida o formato "XX.XX".

### P: Funciona com pipe `currency`?
**R:** Sim! Use `{{ +preco | currency:'BRL' }}` ou `{{ parseFloat(preco) | currency:'BRL' }}`.

### P: Preciso mudar meu código existente?
**R:** Sim, se você estava tratando `preco` como `number`. Atualize interfaces e conversões.

---

## 📚 Documentação Adicional

- **API Completa**: Ver `API_DOCUMENTATION.md` no backend
- **Detalhes Técnicos**: Ver `docs/DECIMAL_FIX.md` no backend
- **Swagger**: http://localhost:3333/api/docs

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique se está usando a versão mais recente do backend
2. Valide o formato das strings recebidas (deve ser "XX.XX")
3. Confira os logs do navegador e do backend
4. Consulte exemplos completos neste documento

---

**Data:** 27 de novembro de 2025  
**Versão Backend:** 1.0.0  
**Breaking Change:** Sim (campos Decimal agora são strings)  
**Retrocompatibilidade:** Não (requer atualização das interfaces frontend)
