# 🧪 Como Testar as Otimizações - Guia Prático

Este guia mostra como testar cada otimização implementada de forma prática e rápida.

**Data**: 20/12/2025

---

## 🚀 PREPARAÇÃO

### 1. Abrir DevTools do Navegador
- Pressione **F12** ou **Cmd+Option+I** (Mac)
- Vá para a aba **Network** (Rede)
- Deixe aberto durante os testes

### 2. Configurar DevTools para Testar Cache do Backend
- **Marque "Disable cache"** no Network tab
- Isso força o navegador a fazer novas requisições ao backend
- Assim você pode ver o cache do backend funcionar
- ⚠️ **Importante**: Isso é apenas para TESTE. Clientes normais sempre terão cache HTTP ativo (comportamento padrão)

### 3. Acessar a Aplicação
- URL: https://agendacalendar-cae1a.web.app
- Ou sua URL customizada do Firebase

---

## 📚 ENTENDENDO OS CACHES

### Cache HTTP do Navegador (Automático)
- **Onde**: No navegador do cliente
- **Quando**: Primeira requisição guarda, segunda usa
- **Status**: `304 Not Modified`
- **Benefício**: Não faz requisição ao servidor
- **Para clientes**: Sempre ativo (comportamento padrão)

### Cache do Backend (Nossa Implementação)
- **Onde**: No servidor (memória com node-cache)
- **Quando**: Primeira requisição guarda, segunda usa
- **Status**: `200 OK` (mas resposta instantânea)
- **Benefício**: Não faz query ao Firestore
- **TTL**: Licenses (5min), Slots (1min), Usuário (15min)

### Dupla Camada de Cache
**Para clientes normais:**
1. Primeira vez: Navegador → Backend → Firestore (~300ms)
2. Segunda vez (cache HTTP ativo): Navegador → Cache HTTP (~0ms) ✅
3. Se cache HTTP expirar: Navegador → Backend → Cache Backend (~2ms) ✅

**Resultado**: Performance máxima com duas camadas de proteção!

---

## ✅ TESTE 1: Debounce na Validação de License Code

### O que testar:
Verificar se a validação não faz requisição a cada letra digitada.

### Como testar:

1. **Acesse a página de registro**:
   - Clique em "Cadastrar" ou acesse `/register`

2. **Abra o DevTools** → Network tab

3. **Digite um license code rapidamente**:
   - Digite: `ABC123DEF456`
   - Digite rápido, sem pausar entre as letras

4. **Observe o Network tab**:
   - ✅ **Resultado esperado**: Deve aparecer **apenas 1 requisição** após você parar de digitar por 500ms
   - ❌ **Se estiver errado**: Apareceriam múltiplas requisições (uma a cada letra)

5. **Teste com pausa**:
   - Digite: `ABC` → **pause 600ms**
   - Deve fazer 1 requisição
   - Continue: `123DEF456` → **pause 600ms**
   - Deve fazer nova requisição

### ✅ Critério de Sucesso:
- Não faz requisição a cada letra
- Faz requisição apenas após 500ms de pausa
- Campo fica desabilitado durante validação (feedback visual)

---

## ✅ TESTE 2: Debounce na Validação de Email

### O que testar:
Verificar se validação de email não acontece a cada letra.

### Como testar:

1. **Na página de registro**, vá para o campo de email

2. **Digite um email rapidamente**:
   - Digite: `usuario@email.com`
   - Digite rápido, sem pausar

3. **Observe a validação**:
   - ✅ **Resultado esperado**: Erro de formato (se inválido) aparece **apenas após 300ms de pausa**
   - ❌ **Se estiver errado**: Erro apareceria a cada letra (piscando)

4. **Teste com email válido**:
   - Digite: `teste@exemplo.com`
   - Após 300ms de pausa, o erro deve desaparecer

### ✅ Critério de Sucesso:
- Validação não acontece a cada letra
- Validação acontece após 300ms de pausa
- Feedback visual suave (sem "piscar")

---

## ✅ TESTE 3: Debounce na Validação de Telefone

### O que testar:
Verificar se validação de telefone não acontece a cada caractere.

### Como testar:

1. **Acesse um link público de agendamento**:
   - Exemplo: `https://agendacalendar-cae1a.web.app/agendar/SEU_LINK_PUBLICO`

2. **Selecione um slot disponível**

3. **Vá para o campo de telefone**

4. **Digite telefone rapidamente**:
   - Digite: `(11) 98765-4321`
   - Digite rápido, sem pausar

5. **Observe a validação**:
   - ✅ **Resultado esperado**: Erro de formato aparece **apenas após 300ms de pausa**
   - ❌ **Se estiver errado**: Erro apareceria a cada caractere

### ✅ Critério de Sucesso:
- Validação não acontece a cada caractere
- Validação acontece após 300ms de pausa
- Feedback visual suave

---

## ✅ TESTE 4: Cache de Licenses

### O que testar:
Verificar se validação de license usa cache e é mais rápida na segunda vez.

### Como testar:

1. **Marque "Disable cache"** no Network tab do DevTools
   - Isso força novas requisições ao backend para testar nosso cache

2. **Abra DevTools** → Network tab
   - Filtre por "validate" ou "licenses"
   - Limpe o Network tab (ícone de limpar)

3. **Na página de registro**, digite um license code válido
   - Exemplo: `ABC123DEF456`

4. **Observe a primeira requisição**:
   - Deve aparecer: `POST /api/licenses/validate`
   - ✅ **Status**: Deve ser `200` (não 304)
   - ✅ **Anote o tempo de resposta** (ex: 200ms)

5. **Limpe o campo e digite o mesmo código novamente**:
   - Ou recarregue a página e digite o mesmo código

6. **Observe a segunda requisição**:
   - ✅ **Resultado esperado**: 
     - Status: `200` (não 304)
     - **Tempo deve ser muito menor** (2-10ms vs 200ms)
     - Redução de ~95% no tempo de resposta
   - ✅ **Resposta**: Deve ser instantânea

### ✅ Critério de Sucesso:
- Primeira validação: ~200-300ms (query ao Firestore), Status 200
- Segunda validação (dentro de 5min): ~2-10ms (cache do backend), Status 200
- Redução de ~95% no tempo de resposta

---

## ✅ TESTE 5: Cache de Slots Disponíveis

### O que testar:
Verificar se slots disponíveis são cacheados por 1 minuto.

### ⚠️ IMPORTANTE: Cache HTTP vs Cache do Backend

**Duas camadas de cache funcionam juntas:**

1. **Cache HTTP do Navegador** (automático):
   - O navegador guarda respostas automaticamente
   - Status: `304 Not Modified`
   - Não chega ao backend (não testa nosso cache)

2. **Cache do Backend** (nosso):
   - Backend guarda em memória (node-cache)
   - Status: `200 OK` (mas resposta instantânea)
   - Testa nosso cache implementado

**Para testar o cache do backend:**
- ✅ **Marque "Disable cache"** no Network tab do DevTools
- Isso força o navegador a fazer nova requisição ao backend
- Assim você vê o cache do backend funcionar

**Para clientes normais:**
- Eles sempre terão cache HTTP ativo (comportamento padrão)
- Nosso cache do backend também funciona para eles
- **Resultado**: Dupla camada de cache = melhor performance!

### Como testar:

1. **Marque "Disable cache"** no Network tab do DevTools
   - Isso é importante para testar o cache do backend!

2. **Acesse um link público de agendamento**:
   - Exemplo: `https://agendacalendar-cae1a.web.app/agendar/SEU_LINK_PUBLICO`

3. **Abra DevTools** → Network tab
   - Filtre por "slots" ou "bookings"
   - Limpe o Network tab (ícone de limpar)

4. **Carregue a página pela primeira vez**:
   - Deve aparecer: `GET /api/bookings/slots/{publicLink}`
   - ✅ **Status**: Deve ser `200` (não 304)
   - ✅ **Anote o tempo de resposta** (ex: 300ms)

5. **Recarregue a página** (F5):
   - ✅ **Resultado esperado**: 
     - Status: `200` (não 304)
     - **Tempo deve ser muito menor** (2-10ms vs 300ms)
     - Redução de ~95% no tempo
   - ✅ **Dados**: Devem aparecer instantaneamente

6. **Crie um novo booking**:
   - Preencha o formulário e crie um agendamento

7. **Recarregue a página novamente**:
   - ✅ **Resultado esperado**: Deve fazer nova requisição ao Firestore (cache foi limpo)
   - ✅ **Tempo**: Deve voltar a ser ~300ms (cache limpo)
   - ✅ **Motivo**: Cache é limpo automaticamente quando booking é criado

### ✅ Critério de Sucesso:
- Primeira carga: ~300-500ms (query ao Firestore), Status 200
- Recarregar (dentro de 1min): ~2-10ms (cache do backend), Status 200
- Redução de ~95% no tempo de resposta
- Após criar booking: cache limpo, nova query ao Firestore (~300ms)

### 🔍 O que observar:
- **Status 304** = Cache HTTP do navegador (não testa nosso cache)
- **Status 200 com tempo baixo** = Cache do backend funcionando ✅
- **Status 200 com tempo alto** = Query ao Firestore (cache vazio ou expirado)

---

## ✅ TESTE 6: Cache de Dados de Usuário

### O que testar:
Verificar se dados do usuário são cacheados por 15 minutos.

### Como testar:

1. **Marque "Disable cache"** no Network tab do DevTools
   - Isso força novas requisições ao backend para testar nosso cache

2. **Faça login** no sistema

3. **Abra DevTools** → Network tab
   - Filtre por "auth" ou "me"
   - Limpe o Network tab (ícone de limpar)

4. **Acesse o dashboard**:
   - Deve fazer requisição: `GET /api/auth/me`
   - ✅ **Status**: Deve ser `200` (não 304)
   - ✅ **Anote o tempo de resposta** (ex: 150ms)

5. **Navegue para outra página e volte**:
   - Ou recarregue a página (F5)

6. **Observe a segunda requisição**:
   - ✅ **Resultado esperado**: 
     - Status: `200` (não 304)
     - **Tempo deve ser muito menor** (2-10ms vs 150ms)
     - Redução de ~95% no tempo de resposta
   - ✅ **Dados**: Devem aparecer instantaneamente

### ✅ Critério de Sucesso:
- Primeira requisição: ~150-200ms (query ao Firestore), Status 200
- Requisições subsequentes (dentro de 15min): ~2-10ms (cache do backend), Status 200
- Redução de ~95% no tempo de resposta

---

## ✅ TESTE 7: Otimização de Queries (N+1 Eliminado)

### O que testar:
Verificar se não há N+1 queries ao buscar slots disponíveis.

### Como testar:

1. **Crie múltiplos slots** no dashboard (ex: 10 slots)

2. **Acesse o link público** de agendamento

3. **Abra DevTools** → Network tab

4. **Observe as requisições**:
   - Deve aparecer: `GET /api/bookings/slots/{publicLink}`
   - ✅ **Resultado esperado**: Apenas **1 requisição** para buscar todos os slots
   - ❌ **Se estiver errado**: Apareceriam múltiplas requisições (uma por slot)

5. **Verifique o tempo de resposta**:
   - ✅ **Resultado esperado**: Deve ser rápido mesmo com muitos slots
   - ✅ **Motivo**: Busca todos os bookings de uma vez, não um por slot

### ✅ Critério de Sucesso:
- Apenas 1 requisição para buscar slots
- Performance rápida mesmo com muitos slots
- Sem múltiplas requisições ao Firestore

---

## ✅ TESTE 8: Índices Firestore

### O que testar:
Verificar se não há erros de índice faltando.

### Como testar:

1. **Execute todas as operações normais**:
   - Criar slots
   - Fazer agendamentos
   - Buscar slots disponíveis

2. **Verifique o console do navegador** (F12 → Console):
   - ✅ **Resultado esperado**: Não deve aparecer erros de "index missing"
   - ❌ **Se estiver errado**: Apareceria erro como "The query requires an index"

3. **Verifique logs do backend** (se tiver acesso):
   - ✅ **Resultado esperado**: Não deve aparecer erros de índice
   - ✅ **Queries**: Devem funcionar normalmente

### ✅ Critério de Sucesso:
- Sem erros de índice faltando
- Todas as queries funcionando
- Performance adequada

---

## 📊 RESUMO DOS TESTES

| Teste | O que Verificar | Critério de Sucesso | Status Esperado |
|-------|----------------|---------------------|-----------------|
| **1. Debounce License** | Network tab | 1 requisição após 500ms de pausa | 200 |
| **2. Debounce Email** | Validação visual | Erro aparece após 300ms de pausa | - |
| **3. Debounce Telefone** | Validação visual | Erro aparece após 300ms de pausa | - |
| **4. Cache Licenses** | Tempo de resposta | 2ª requisição ~95% mais rápida | 200 (não 304) |
| **5. Cache Slots** | Tempo de resposta | 2ª requisição ~95% mais rápida | 200 (não 304) |
| **6. Cache Usuário** | Tempo de resposta | 2ª requisição ~95% mais rápida | 200 (não 304) |
| **7. Queries Otimizadas** | Número de requisições | Apenas 1 requisição para slots | 200 |
| **8. Índices Firestore** | Erros no console | Sem erros de índice | - |

### ⚠️ Importante sobre Status HTTP:
- **Status 304** = Cache HTTP do navegador (não testa nosso cache)
- **Status 200 com tempo baixo** = Cache do backend funcionando ✅
- **Status 200 com tempo alto** = Query ao Firestore (cache vazio)

---

## 🎯 ORDEM RECOMENDADA DE TESTES

1. **Teste 1** - Debounce License (mais fácil de ver)
2. **Teste 4** - Cache Licenses (impacto visível)
3. **Teste 2 e 3** - Debounce Email/Telefone (UX)
4. **Teste 5** - Cache Slots (impacto visível)
5. **Teste 6** - Cache Usuário (menos visível)
6. **Teste 7** - Queries Otimizadas (precisa de muitos slots)
7. **Teste 8** - Índices (verificação geral)

---

## 🐛 TROUBLESHOOTING

### Cache não está funcionando?
- ✅ **Verifique se "Disable cache" está marcado** no DevTools
- ✅ **Status deve ser 200, não 304** (304 = cache HTTP do navegador)
- Verifique se o backend está rodando
- Verifique logs do backend para erros
- Limpe cache do navegador (Ctrl+Shift+R)

### Vejo Status 304 em vez de 200?
- **Status 304** = Cache HTTP do navegador (comportamento normal)
- Para testar o cache do backend, marque "Disable cache" no DevTools
- Isso força novas requisições ao backend

### Tempo não diminui na segunda requisição?
- Verifique se "Disable cache" está marcado
- Verifique se o status é 200 (não 304)
- Se status for 304, o navegador está usando cache HTTP (não testa nosso cache)
- Limpe o Network tab e teste novamente

### Debounce não está funcionando?
- Verifique console do navegador para erros JavaScript
- Verifique se o hook `useDebounce` está importado
- Verifique se os delays estão corretos (500ms license, 300ms email/phone)

### Queries ainda são lentas?
- Verifique se os índices foram criados no Firebase Console
- Verifique se os índices estão "Enabled" (não "Building")
- Aguarde alguns minutos se os índices ainda estão sendo criados

---

## ✅ CHECKLIST FINAL

### Preparação
- [ ] "Disable cache" marcado no DevTools (para testar cache do backend)
- [ ] Network tab aberto e limpo

### Testes de Debounce
- [ ] Debounce de license code funciona (500ms)
- [ ] Debounce de email funciona (300ms)
- [ ] Debounce de telefone funciona (300ms)

### Testes de Cache (Status 200, não 304)
- [ ] Cache de licenses funciona (5min TTL) - Status 200, tempo reduzido
- [ ] Cache de slots funciona (1min TTL) - Status 200, tempo reduzido
- [ ] Cache de usuário funciona (15min TTL) - Status 200, tempo reduzido
- [ ] Cache é limpo quando dados são atualizados

### Testes de Performance
- [ ] N+1 queries foi eliminado
- [ ] Índices Firestore estão funcionando
- [ ] Performance melhorou (tempo de resposta reduzido)
- [ ] UX melhorou (validações mais suaves)

### Observações Importantes
- [ ] Entendi a diferença entre cache HTTP (304) e cache do backend (200)
- [ ] Sei que clientes normais sempre terão cache HTTP ativo
- [ ] Sei que nosso cache do backend funciona para todos os clientes

---

**Status**: Pronto para testes! 🚀

**Dica**: Comece pelos testes mais fáceis (debounce e cache de licenses) para ver o impacto imediatamente.

