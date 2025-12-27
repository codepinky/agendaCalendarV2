# 🔍 Índices Firestore - Documentação

Este documento lista todos os índices compostos necessários para otimizar as queries do Firestore.

**Última atualização**: 20/12/2025

---

## 📋 ÍNDICES NECESSÁRIOS

### 1. Collection: `users`

#### Índice: `publicLink` (Single Field)
- **Campos**: `publicLink` (Ascending)
- **Uso**: Buscar usuário por public link
- **Queries que usam**:
  - `bookingsService.ts` - `getAvailableSlotsByPublicLink()`
  - `bookingsService.ts` - `createBooking()`
- **Status**: ✅ Criado automaticamente pelo Firestore (single field index)

---

### 2. Collection: `users/{userId}/availableSlots`

#### Índice: `status + date` (Composite)
- **Campos**: 
  - `status` (Ascending)
  - `date` (Ascending)
- **Uso**: Filtrar slots por status e data futura
- **Queries que usam**:
  - `bookingsService.ts` - `getAvailableSlotsByPublicLink()` - `where('status', 'in', ['available', 'reserved']).where('date', '>=', today)`
- **Status**: ✅ **CRIADO** (20/12/2025)

**Como criar no Firebase Console:**
1. Vá para Firestore → Indexes
2. Clique em "Create Index"
3. Collection ID: `availableSlots`
4. Collection group: `availableSlots`
5. Fields:
   - `status` (Ascending)
   - `date` (Ascending)
6. Query scope: Collection
7. Clique em "Create"

---

#### Índice: `date + status` (Composite)
- **Campos**: 
  - `date` (Ascending)
  - `status` (Ascending)
- **Uso**: Filtrar slots por data e status para validação de conflitos
- **Queries que usam**:
  - `slotsService.ts` - `createSlot()` - `where('date', '==', slotData.date).where('status', 'in', ['available', 'reserved', 'confirmed'])`
- **Status**: ✅ **CRIADO** (20/12/2025)

**Como criar no Firebase Console:**
1. Vá para Firestore → Indexes
2. Clique em "Create Index"
3. Collection ID: `availableSlots`
4. Collection group: `availableSlots`
5. Fields:
   - `date` (Ascending)
   - `status` (Ascending)
6. Query scope: Collection
7. Clique em "Create"

---

### 3. Collection: `users/{userId}/bookings`

#### Índice: `slotId + status` (Composite)
- **Campos**: 
  - `slotId` (Ascending)
  - `status` (Ascending)
- **Uso**: Contar bookings confirmados/pendentes por slot
- **Queries que usam**:
  - `bookingsService.ts` - `getAvailableSlotsByPublicLink()` - `where('status', '==', 'confirmed')` (agrupado por slotId em memória)
  - `transactions.ts` - `processBookingTransaction()` - `where('slotId', '==', slotId).where('status', 'in', ['confirmed', 'pending'])`
- **Status**: ✅ **CRIADO** (20/12/2025)

**Como criar no Firebase Console:**
1. Vá para Firestore → Indexes
2. Clique em "Create Index"
3. Collection ID: `bookings`
4. Collection group: `bookings`
5. Fields:
   - `slotId` (Ascending)
   - `status` (Ascending)
6. Query scope: Collection
7. Clique em "Create"

---

#### Índice: `status` (Single Field)
- **Campos**: `status` (Ascending)
- **Uso**: Filtrar bookings por status
- **Queries que usam**:
  - `bookingsService.ts` - `getAvailableSlotsByPublicLink()` - `where('status', '==', 'confirmed')`
- **Status**: ✅ Criado automaticamente pelo Firestore (single field index)

---

## 🚀 OTIMIZAÇÕES IMPLEMENTADAS

### 1. Eliminação de N+1 Queries
**Antes**: `getAvailableSlotsByPublicLink()` fazia uma query para cada slot (N queries)
```typescript
for (const slot of slots) {
  const confirmedBookings = await bookingsRef
    .where('slotId', '==', slot.id)
    .where('status', '==', 'confirmed')
    .get();
}
```

**Depois**: Uma única query para todos os bookings
```typescript
const allBookingsSnapshot = await bookingsRef
  .where('status', '==', 'confirmed')
  .get();
// Agrupa em memória por slotId
```

**Benefício**: Redução de 90%+ nas leituras do Firestore para listas grandes de slots.

---

### 2. Combinação de Queries
**Antes**: `processBookingTransaction()` fazia 2 queries separadas
```typescript
const confirmedBookings = await transaction.get(...where('status', '==', 'confirmed'));
const pendingBookings = await transaction.get(...where('status', '==', 'pending'));
```

**Depois**: Uma única query com operador `in`
```typescript
const activeBookings = await transaction.get(
  bookingsRef
    .where('slotId', '==', slotId)
    .where('status', 'in', ['confirmed', 'pending'])
);
```

**Benefício**: Redução de 50% nas leituras dentro de transações.

---

### 3. Filtros Firestore
**Antes**: Buscava todos os slots e filtrava em memória
```typescript
const slotsSnapshot = await slotsRef.get(); // Todos os slots
const slots = allSlots.filter(slot => slot.status === 'available' || slot.status === 'reserved');
```

**Depois**: Filtra no Firestore antes de transferir dados
```typescript
const slotsSnapshot = await slotsRef
  .where('status', 'in', ['available', 'reserved'])
  .where('date', '>=', today)
  .get();
```

**Benefício**: Redução de transferência de dados e custos.

---

### 4. Paginação Opcional
**Adicionado**: Suporte a paginação em `getUserBookings()` e `getSlots()`
- Reduz quantidade de dados transferidos
- Melhora performance para usuários com muitos registros
- Retrocompatível (sem parâmetros = retorna tudo)

---

## 📊 IMPACTO ESPERADO

### Redução de Custos
- **N+1 Queries**: Redução de ~90% em leituras para `getAvailableSlotsByPublicLink()`
- **Queries Combinadas**: Redução de ~50% em leituras dentro de transações
- **Filtros Firestore**: Redução de ~30-50% em transferência de dados

### Melhoria de Performance
- **Tempo de resposta**: Redução de 50-70% em endpoints que listam slots disponíveis
- **Escalabilidade**: Sistema suporta mais usuários simultâneos
- **Latência**: Menos queries = menos round-trips = menor latência

---

## ⚠️ AÇÕES NECESSÁRIAS

### 1. Criar Índices no Firebase Console ✅ CONCLUÍDO

Todos os índices foram criados com sucesso:

1. ✅ **`availableSlots` - `status + date`** - Criado em 20/12/2025
   - Collection: `availableSlots`
   - Fields: `status` (Asc), `date` (Asc)

2. ✅ **`availableSlots` - `date + status`** - Criado em 20/12/2025
   - Collection: `availableSlots`
   - Fields: `date` (Asc), `status` (Asc)

3. ✅ **`bookings` - `slotId + status`** - Criado em 20/12/2025
   - Collection: `bookings`
   - Fields: `slotId` (Asc), `status` (Asc)

### 2. Verificar Erros de Índice
Após deploy, monitorar logs do Firebase para erros como:
```
The query requires an index. You can create it here: [link]
```

Se aparecer, clique no link para criar o índice automaticamente.

---

## 🔍 MONITORAMENTO

### Métricas a Observar
1. **Firestore Reads**: Deve diminuir significativamente
2. **Tempo de Resposta**: Endpoints devem responder mais rápido
3. **Erros de Índice**: Não deve haver erros de índice faltando

### Como Verificar
1. Firebase Console → Firestore → Usage
2. Verificar leituras por dia/semana
3. Comparar antes/depois das otimizações

---

## 📝 NOTAS

- **Índices Simples**: Firestore cria automaticamente índices para campos únicos
- **Índices Compostos**: Precisam ser criados manualmente ou via link de erro
- **Custo de Índices**: Índices ocupam espaço de armazenamento, mas são essenciais para performance
- **Limite de `in`**: Firestore suporta até 10 valores no operador `in`

---

**Status**: ✅ Otimizações implementadas e índices criados no Firebase Console (20/12/2025)

