# 🧪 Guia de Testes - Otimizações Implementadas

Este guia mostra como testar as otimizações implementadas na rodada 8.

**Data**: 20/12/2025

---

## 📋 O QUE FOI IMPLEMENTADO

1. ✅ **Otimização de Queries Firestore** - Redução de N+1 queries
2. ✅ **Índices Firestore** - 3 índices compostos criados
3. ✅ **Cache em Memória** - Licenses, slots e dados de usuário
4. ✅ **Debounce no Frontend** - Validações com delay

---

## 🧪 TESTE 1: Cache de Licenses

### Objetivo
Verificar se a validação de license usa cache e reduz requisições ao Firestore.

### Como Testar

1. **Iniciar o backend**:
```bash
cd backend
npm run dev
```

2. **Abrir DevTools do navegador** (F12) → Network tab

3. **Testar validação de license**:
   - Acesse a página de registro
   - Digite um código de license válido
   - Observe a requisição POST `/api/licenses/validate` no Network

4. **Testar cache**:
   - Digite o mesmo código novamente (ou recarregue a página e digite)
   - A requisição deve ser **instantânea** (sem delay de rede)
   - Verifique no console do backend: não deve aparecer log de query ao Firestore

5. **Testar expiração do cache (5 minutos)**:
   - Aguarde 5 minutos
   - Digite o mesmo código
   - Deve fazer nova requisição ao Firestore

### Resultado Esperado
- ✅ Primeira validação: requisição ao Firestore
- ✅ Segunda validação (dentro de 5min): resposta do cache (instantânea)
- ✅ Após 5 minutos: nova requisição ao Firestore

---

## 🧪 TESTE 2: Cache de Slots Disponíveis

### Objetivo
Verificar se slots disponíveis são cacheados por 1 minuto.

### Como Testar

1. **Acessar link público de agendamento**:
   - Exemplo: `http://localhost:5173/agendar/abc123def456`

2. **Observar primeira requisição**:
   - Network tab → GET `/api/bookings/slots/{publicLink}`
   - Deve fazer query ao Firestore

3. **Recarregar a página** (F5):
   - A requisição deve ser **instantânea** (cache)
   - Não deve fazer nova query ao Firestore

4. **Criar um novo booking**:
   - Preencher formulário e criar booking
   - O cache deve ser **limpo automaticamente**
   - Próxima requisição deve buscar do Firestore

5. **Aguardar 1 minuto**:
   - Cache expira automaticamente
   - Nova requisição busca do Firestore

### Resultado Esperado
- ✅ Primeira carga: query ao Firestore
- ✅ Recarregar (dentro de 1min): cache (instantâneo)
- ✅ Após criar booking: cache limpo, próxima busca do Firestore
- ✅ Após 1 minuto: cache expirado, busca do Firestore

---

## 🧪 TESTE 3: Cache de Dados de Usuário

### Objetivo
Verificar se dados do usuário são cacheados por 15 minutos.

### Como Testar

1. **Fazer login** no sistema

2. **Acessar dashboard**:
   - Deve fazer requisição GET `/api/auth/me`
   - Query ao Firestore para buscar dados do usuário

3. **Navegar para outra página e voltar**:
   - Requisição deve ser **instantânea** (cache)
   - Não deve fazer nova query ao Firestore

4. **Aguardar 15 minutos**:
   - Cache expira
   - Nova requisição busca do Firestore

### Resultado Esperado
- ✅ Primeira requisição: query ao Firestore
- ✅ Requisições subsequentes (dentro de 15min): cache (instantâneo)
- ✅ Após 15 minutos: nova query ao Firestore

---

## 🧪 TESTE 4: Debounce na Validação de License Code

### Objetivo
Verificar se a validação de license code usa debounce de 1000ms (1 segundo).

### Como Testar

1. **Abrir página de registro**

2. **Abrir DevTools** → Network tab

3. **Digitar license code rapidamente**:
   - Digite: `ABC123DEF456`
   - Digite rápido, sem pausar

4. **Observar requisições**:
   - Deve aparecer **apenas 1 requisição** após você parar de digitar por 1000ms (1 segundo)
   - Não deve fazer requisição a cada letra digitada

5. **Testar com pausa**:
   - Digite: `ABC` → pause 600ms
   - Deve fazer requisição
   - Continue digitando: `123DEF456`
   - Deve fazer nova requisição após 1000ms (1 segundo) de pausa

### Resultado Esperado
- ✅ Não faz requisição a cada letra
- ✅ Faz requisição apenas após 1000ms (1 segundo) de pausa
- ✅ Campo desabilitado durante validação (feedback visual)

---

## 🧪 TESTE 5: Debounce na Validação de Email

### Objetivo
Verificar se validação de email usa debounce de 300ms.

### Como Testar

#### No Register (cadastro):
1. **Digitar email rapidamente**:
   - Digite: `usuario@email.com`
   - Digite rápido, sem pausar

2. **Observar validação**:
   - Erro de formato deve aparecer **apenas após 300ms de pausa**
   - Não deve validar a cada letra

#### No PublicSchedule (agendamento):
1. **Mesmo teste** no formulário de booking
2. **Validação deve ser debounced** (300ms)

### Resultado Esperado
- ✅ Validação não acontece a cada letra
- ✅ Validação acontece após 300ms de pausa
- ✅ Feedback visual suave (sem "piscar" de erros)

---

## 🧪 TESTE 6: Debounce na Validação de Telefone

### Objetivo
Verificar se validação de telefone usa debounce de 300ms.

### Como Testar

1. **Acessar página de agendamento público**

2. **Selecionar um slot**

3. **Digitar telefone rapidamente**:
   - Digite: `(11) 98765-4321`
   - Digite rápido, sem pausar

4. **Observar validação**:
   - Erro de formato deve aparecer **apenas após 300ms de pausa**
   - Não deve validar a cada caractere

### Resultado Esperado
- ✅ Validação não acontece a cada caractere
- ✅ Validação acontece após 300ms de pausa
- ✅ Feedback visual suave

---

## 🧪 TESTE 7: Otimização de Queries (N+1 Eliminado)

### Objetivo
Verificar se a query de slots disponíveis não faz N+1 queries.

### Como Testar

1. **Criar múltiplos slots** no dashboard (ex: 10 slots)

2. **Abrir DevTools** → Network tab

3. **Acessar link público**:
   - GET `/api/bookings/slots/{publicLink}`

4. **Verificar logs do backend**:
   - Deve fazer **apenas 2 queries**:
     1. Query para buscar usuário por publicLink
     2. Query para buscar slots (com filtros)
     3. Query para buscar TODOS os bookings confirmados (uma única query)
   - **NÃO deve fazer** uma query por slot

### Resultado Esperado
- ✅ Antes: 1 query usuário + 1 query slots + N queries bookings (N = número de slots)
- ✅ Agora: 1 query usuário + 1 query slots + 1 query bookings (todos de uma vez)
- ✅ Redução de ~90% em leituras do Firestore

---

## 🧪 TESTE 8: Índices Firestore

### Objetivo
Verificar se os índices estão funcionando (sem erros).

### Como Testar

1. **Acessar Firebase Console**:
   - https://console.firebase.google.com
   - Firestore → Indexes

2. **Verificar índices criados**:
   - ✅ `availableSlots` - `status + date`
   - ✅ `availableSlots` - `date + status`
   - ✅ `bookings` - `slotId + status`

3. **Testar queries**:
   - Criar slots e fazer agendamentos
   - Não deve aparecer erros de "index missing"

4. **Verificar logs do backend**:
   - Não deve aparecer erros de índice faltando

### Resultado Esperado
- ✅ Todos os índices criados
- ✅ Sem erros de índice faltando
- ✅ Queries funcionando normalmente

---

## 📊 MÉTRICAS PARA OBSERVAR

### Performance
- **Tempo de resposta**: Deve ser mais rápido com cache
- **Requisições ao Firestore**: Deve reduzir significativamente
- **UX**: Validações mais suaves (sem "piscar" de erros)

### Console do Backend
- **Logs de cache hit**: Não deve aparecer (cache é silencioso)
- **Logs de queries**: Deve reduzir após implementação de cache
- **Erros**: Não deve haver erros relacionados a cache ou índices

### Network Tab (Frontend)
- **Requisições duplicadas**: Não deve haver (cache previne)
- **Tempo de resposta**: Deve ser mais rápido com cache
- **Validações**: Devem ser debounced (não a cada letra)

---

## 🐛 TROUBLESHOOTING

### Cache não está funcionando?
- Verifique se o backend está rodando
- Verifique logs do backend para erros
- Limpe o cache do navegador (Ctrl+Shift+R)

### Debounce não está funcionando?
- Verifique se o hook `useDebounce` está importado corretamente
- Verifique console do navegador para erros
- Verifique se os delays estão corretos (1000ms license, 300ms email/phone)

### Índices não estão funcionando?
- Verifique Firebase Console → Indexes
- Verifique se os índices estão "Enabled" (não "Building")
- Aguarde alguns minutos se os índices ainda estão sendo criados

---

## ✅ CHECKLIST DE TESTES

- [ ] Cache de licenses funciona (5min TTL)
- [ ] Cache de slots funciona (1min TTL)
- [ ] Cache de usuário funciona (15min TTL)
- [ ] Cache é limpo quando dados são atualizados
- [ ] Debounce de license code funciona (500ms)
- [ ] Debounce de email funciona (300ms)
- [ ] Debounce de telefone funciona (300ms)
- [ ] N+1 queries foi eliminado
- [ ] Índices Firestore estão criados e funcionando
- [ ] Performance melhorou (tempo de resposta)
- [ ] UX melhorou (validações mais suaves)

---

**Status**: Pronto para testes! 🚀


