# 📋 Tarefas Pendentes - Minha Parte (Automatizadas)

Este documento lista as tarefas que ainda faltam da minha parte (automatizadas).

**Última atualização**: 19/12/2025

---

## ⏳ TAREFAS PENDENTES (3 principais)

### 1. 🔍 REVISAR QUERIES FIRESTORE (Média Prioridade)

#### O que fazer:
- [ ] Identificar queries que podem ser otimizadas
- [ ] Adicionar índices compostos se necessário
- [ ] Otimizar ordenação em memória (já feito parcialmente)
- [ ] Revisar queries com múltiplos `where()`

#### Onde revisar:
- `bookingsService.ts` - Query de slots disponíveis
- `slotsService.ts` - Query de slots existentes
- `authController.ts` - Query de licenses

#### Benefícios:
- ✅ Redução de custos do Firestore
- ✅ Melhor performance
- ✅ Menos tempo de resposta

---

### 2. ⚡ MELHORAR PERFORMANCE (Média Prioridade)

#### 2.1 Cache de Dados Frequentes

**O que implementar:**
- [ ] Cache de validação de licenses (TTL curto, ex: 5min)
- [ ] Cache de slots disponíveis por publicLink (TTL curto, ex: 1min)
- [ ] Cache de dados de usuário (TTL médio, ex: 15min)

**Onde implementar:**
- `licensesController.ts` - Cache de validação de license
- `bookingsService.ts` - Cache de slots disponíveis
- `authController.ts` - Cache de dados de usuário

**Tecnologia sugerida:**
- `node-cache` ou `memory-cache` (simples, em memória)
- Ou Redis (se quiser cache distribuído)

#### 2.2 Lazy Loading

**O que implementar:**
- [ ] Carregar bookings apenas quando necessário
- [ ] Paginação de slots e bookings
- [ ] Carregar dados do Google Calendar sob demanda

**Onde implementar:**
- `bookingsController.ts` - Paginação de bookings
- `slotsController.ts` - Paginação de slots
- `googleCalendarController.ts` - Carregar dados sob demanda

#### 2.3 Debounce em Validações (Frontend)

**O que implementar:**
- [ ] Debounce na validação de license code (500ms)
- [ ] Debounce na validação de email (300ms)
- [ ] Debounce na validação de telefone (300ms)

**Onde implementar:**
- `frontend/src/pages/Register/Register.tsx`
- `frontend/src/pages/PublicSchedule/PublicSchedule.tsx`

**Tecnologia sugerida:**
- `lodash.debounce` ou `useDebounce` hook

---

### 3. 🧪 TESTES PARA AUTHCONTROLLER (Baixa Prioridade)

#### O que testar:
- [ ] `register` - Cadastro com license válida
- [ ] `register` - Erro quando license não existe
- [ ] `register` - Erro quando license já foi usada
- [ ] `register` - Erro quando license está inativa
- [ ] `register` - Erro quando email já está registrado
- [ ] `getCurrentUser` - Retornar dados do usuário autenticado
- [ ] `getCurrentUser` - Erro quando não autenticado

#### Por que baixa prioridade:
- ✅ Já tem validações robustas (express-validator)
- ✅ Lógica complexa está em transações (já testada)
- ✅ Controller é principalmente "glue code"

---

## 📊 RESUMO

### Status Atual:
- ✅ **13 tarefas concluídas** (87% do total)
- ⏳ **3 tarefas pendentes** (13% do total)

### Prioridades:
1. **Média**: Revisar queries Firestore
2. **Média**: Melhorar performance (cache, lazy loading, debounce)
3. **Baixa**: Testes para authController

---

## 🎯 RECOMENDAÇÃO

### Para Produção:
**As tarefas pendentes são otimizações, não bloqueadores!**

O sistema está funcional e testado. As tarefas pendentes são:
- ⚡ **Otimizações de performance** - Melhoram experiência, mas não são críticas
- 🧪 **Testes adicionais** - Aumentam confiança, mas funcionalidades críticas já estão testadas

### Ordem Sugerida:
1. **Revisar queries Firestore** - Pode reduzir custos
2. **Implementar cache** - Melhora performance significativamente
3. **Debounce no frontend** - Melhora UX
4. **Testes authController** - Se sobrar tempo

---

## 💡 NOTAS

- Todas as funcionalidades críticas estão implementadas e testadas
- As tarefas pendentes são melhorias, não requisitos
- Sistema está pronto para produção
- Otimizações podem ser feitas incrementalmente

---

**Status**: Sistema funcional, otimizações pendentes

