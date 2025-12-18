# 🧪 Plano de Testes e Revisão - Agenda Calendar

Este documento lista todos os pontos que devem ser testados e revisados no sistema.

## ✅ O que já foi testado/implementado

- ✅ Race condition em bookings (proteção contra double booking)
- ✅ Rate limiting (endpoints críticos)
- ✅ Helmet.js (headers de segurança)
- ✅ Logging estruturado (Winston)
- ✅ Validação de license code (transação atômica)
- ✅ Endpoints básicos funcionando

---

## 🎯 1. TESTES DE FUNCIONALIDADES PRINCIPAIS

### 1.1 Autenticação e Cadastro
- [ ] **Cadastro com license válida**
  - [ ] License ativa e não usada → sucesso
  - [ ] License já usada → erro 400
  - [ ] License inexistente → erro 404
  - [ ] License inativa → erro 400
  - [ ] Email já cadastrado → erro 400
  - [ ] Email inválido → erro 400
  - [ ] Senha muito curta → erro 400

- [ ] **Login**
  - [ ] Credenciais válidas → token JWT
  - [ ] Email inexistente → erro 401
  - [ ] Senha incorreta → erro 401
  - [ ] Token JWT válido → acesso permitido
  - [ ] Token JWT inválido/expirado → erro 401

- [ ] **Get Current User (`/api/auth/me`)**
  - [ ] Com token válido → retorna dados do usuário
  - [ ] Sem token → erro 401
  - [ ] Token inválido → erro 401

### 1.2 Gerenciamento de Slots
- [ ] **Criar Slot (`POST /api/slots`)**
  - [ ] Dados válidos → slot criado
  - [ ] Data no passado → erro 400
  - [ ] Hora fim < hora início → erro 400
  - [ ] Conflito de horário → erro 409
  - [ ] Sem autenticação → erro 401
  - [ ] maxBookings > 1 → múltiplos bookings permitidos

- [ ] **Listar Slots (`GET /api/slots`)**
  - [ ] Retorna slots ordenados (data, hora)
  - [ ] Slots vazios → array vazio
  - [ ] Sem autenticação → erro 401

- [ ] **Deletar Slot (`DELETE /api/slots/:id`)**
  - [ ] Slot sem bookings → deletado
  - [ ] Slot com bookings confirmados → erro 400
  - [ ] Slot inexistente → erro 404
  - [ ] Sem autenticação → erro 401

### 1.3 Agendamentos Públicos
- [ ] **Listar Slots Disponíveis (`GET /api/bookings/slots/:publicLink`)**
  - [ ] PublicLink válido → retorna slots disponíveis
  - [ ] PublicLink inválido → erro 404
  - [ ] Slots totalmente ocupados → não aparecem na lista
  - [ ] Slots com vagas → aparecem na lista

- [ ] **Criar Booking (`POST /api/bookings`)**
  - [ ] Slot disponível → booking criado (HTTP 201)
  - [ ] Slot totalmente ocupado → erro 409
  - [ ] Slot inexistente → erro 404
  - [ ] Dados inválidos (email, telefone) → erro 400
  - [ ] **Race condition** → apenas 1 sucesso (já testado ✅)
  - [ ] maxBookings > 1 → múltiplos bookings permitidos

### 1.4 Validação de Licenses
- [ ] **Validar License (`POST /api/licenses/validate`)**
  - [ ] License válida e disponível → `valid: true`
  - [ ] License já usada → `valid: false`
  - [ ] License inexistente → erro 404
  - [ ] License inativa → `valid: false`
  - [ ] Rate limiting → máximo 20 tentativas/hora

### 1.5 Google Calendar
- [ ] **Conectar Google Calendar (`GET /api/google-calendar/auth`)**
  - [ ] Retorna URL de autenticação OAuth
  - [ ] Redirecionamento funciona
  - [ ] Callback salva tokens no Firebase

- [ ] **Desconectar Google Calendar (`POST /api/google-calendar/disconnect`)**
  - [ ] Remove tokens do Firebase
  - [ ] Atualiza `googleCalendarConnected: false`

- [ ] **Criar Evento no Google Calendar**
  - [ ] Booking criado → evento criado no Google Calendar
  - [ ] Google Calendar não conectado → booking funciona, evento não criado
  - [ ] Token expirado → refresh automático

### 1.6 Webhooks Kiwify
- [ ] **Webhook Kiwify (`POST /api/webhooks/kiwify`)**
  - [ ] Payload válido + secret correto → license criada
  - [ ] Secret incorreto → erro 401
  - [ ] order_approved → license criada
  - [ ] order_pending → salvo em kiwify_events, license não criada
  - [ ] Order duplicado → retorna license existente
  - [ ] Rate limiting → máximo 100/minuto (exceto com secret válido)

---

## 🔒 2. TESTES DE SEGURANÇA

### 2.1 Rate Limiting
- [ ] **API Geral (`/api/*`)**
  - [ ] 100 requisições em 15 minutos → OK
  - [ ] 101 requisições → erro 429
  - [ ] Headers `RateLimit-*` presentes

- [ ] **Registro (`/api/auth/register`)**
  - [ ] 5 tentativas/hora → OK
  - [ ] 6 tentativas → erro 429
  - [ ] Log de tentativas excessivas

- [ ] **Validação License (`/api/licenses/validate`)**
  - [ ] 20 tentativas/hora → OK
  - [ ] 21 tentativas → erro 429

- [ ] **Webhooks (`/api/webhooks/kiwify`)**
  - [ ] 100 requisições/minuto → OK
  - [ ] 101 requisições → erro 429
  - [ ] Com secret válido → rate limit ignorado

### 2.2 Autenticação e Autorização
- [ ] **Rotas Protegidas**
  - [ ] `/api/slots/*` → requer autenticação
  - [ ] `/api/auth/me` → requer autenticação
  - [ ] `/api/google-calendar/*` → requer autenticação
  - [ ] Rotas públicas → não requerem autenticação

- [ ] **Tokens JWT**
  - [ ] Token válido → acesso permitido
  - [ ] Token expirado → erro 401
  - [ ] Token inválido → erro 401
  - [ ] Sem token → erro 401

### 2.3 Validação de Input
- [ ] **Sanitização**
  - [ ] XSS em campos de texto → sanitizado
  - [ ] SQL injection (mesmo sendo NoSQL) → não executado
  - [ ] Caracteres especiais → tratados corretamente

- [ ] **Validação de Formato**
  - [ ] Email inválido → erro 400
  - [ ] Telefone inválido → erro 400
  - [ ] Data inválida → erro 400
  - [ ] Hora inválida → erro 400

### 2.4 Headers de Segurança (Helmet)
- [ ] **CSP (Content Security Policy)**
  - [ ] Headers presentes
  - [ ] Scripts externos bloqueados (exceto permitidos)
  - [ ] Imagens externas permitidas

- [ ] **HSTS**
  - [ ] Header `Strict-Transport-Security` presente
  - [ ] maxAge configurado (1 ano)
  - [ ] includeSubDomains ativo

### 2.5 Webhook Security
- [ ] **Secret Validation**
  - [ ] Secret correto → requisição aceita
  - [ ] Secret incorreto → erro 401
  - [ ] Sem secret → erro 401
  - [ ] Timing-safe comparison → protegido contra timing attacks

---

## 🔄 3. TESTES DE INTEGRAÇÃO

### 3.1 Fluxo Completo Kiwify → N8N → Backend → Firebase
- [ ] **Compra na Kiwify**
  - [ ] Webhook enviado para N8N
  - [ ] N8N processa e envia para backend
  - [ ] Backend cria license no Firebase
  - [ ] License disponível para uso

- [ ] **Fluxo de Cadastro**
  - [ ] License criada via Kiwify
  - [ ] Usuário usa license no cadastro
  - [ ] License marcada como usada
  - [ ] Usuário criado no Firebase Auth
  - [ ] Documento criado em `users/`

- [ ] **Fluxo de Agendamento**
  - [ ] Usuário cria slot
  - [ ] Cliente acessa link público
  - [ ] Cliente faz booking
  - [ ] Booking salvo no Firebase
  - [ ] Evento criado no Google Calendar (se conectado)

### 3.2 Integração Google Calendar
- [ ] **OAuth Flow**
  - [ ] URL de autorização gerada
  - [ ] Callback recebe código
  - [ ] Tokens salvos no Firebase
  - [ ] Calendar ID obtido

- [ ] **Criação de Eventos**
  - [ ] Booking criado → evento criado
  - [ ] Dados corretos no evento
  - [ ] Refresh token automático

---

## ⚡ 4. TESTES DE PERFORMANCE

### 4.1 Tempo de Resposta
- [ ] **Endpoints Críticos**
  - [ ] `/api/bookings/slots/:publicLink` → < 500ms
  - [ ] `/api/slots` → < 300ms
  - [ ] `/api/auth/me` → < 200ms
  - [ ] `/health` → < 100ms

### 4.2 Carga
- [ ] **Múltiplas Requisições Simultâneas**
  - [ ] 10 requisições simultâneas → todas respondem
  - [ ] 50 requisições simultâneas → rate limiting ativo
  - [ ] Sem travamentos ou timeouts

### 4.3 Queries Firestore
- [ ] **Índices**
  - [ ] Todas as queries usam índices ou ordenação em memória
  - [ ] Sem erros de índice faltando
  - [ ] Performance adequada

---

## 🐛 5. TESTES DE EDGE CASES

### 5.1 Dados Limites
- [ ] **Campos Vazios/Nulos**
  - [ ] Email vazio → erro 400
  - [ ] Nome vazio → erro 400
  - [ ] License code vazio → erro 400

- [ ] **Campos Muito Longos**
  - [ ] Nome > 100 caracteres → erro 400 ou truncado
  - [ ] Notes muito longo → tratado corretamente

- [ ] **Datas e Horas**
  - [ ] Data no passado → erro 400
  - [ ] Hora inválida (25:00) → erro 400
  - [ ] Timezone → tratado corretamente

### 5.2 Estados Inconsistentes
- [ ] **Slot com Status Inválido**
  - [ ] Slot com status 'cancelled' → não aparece
  - [ ] Slot deletado → erro 404

- [ ] **Booking Órfão**
  - [ ] Booking sem slot → tratado corretamente
  - [ ] Slot deletado com bookings → erro ao deletar

### 5.3 Concorrência
- [ ] **Múltiplos Usuários**
  - [ ] 2 usuários criam slots simultaneamente → ambos criados
  - [ ] 2 usuários agendam mesmo slot → apenas 1 sucesso (já testado ✅)

---

## 🎨 6. TESTES DE UX/UI (Frontend)

### 6.1 Dashboard
- [ ] **Visualização**
  - [ ] Slots listados corretamente
  - [ ] Status visual (available, reserved, confirmed)
  - [ ] Link público copiável
  - [ ] Google Calendar conectado/desconectado

- [ ] **Ações**
  - [ ] Criar slot → modal abre
  - [ ] Deletar slot → confirmação
  - [ ] Copiar link → feedback visual

### 6.2 Página Pública de Agendamento
- [ ] **Visualização**
  - [ ] Slots disponíveis listados
  - [ ] Formulário de agendamento
  - [ ] Validação em tempo real

- [ ] **Agendamento**
  - [ ] Preenchimento → validação
  - [ ] Submissão → loading
  - [ ] Sucesso → mensagem
  - [ ] Erro → mensagem clara

### 6.3 Autenticação
- [ ] **Login/Registro**
  - [ ] Formulários funcionais
  - [ ] Validação de campos
  - [ ] Mensagens de erro claras
  - [ ] Redirecionamento após login

---

## 📊 7. MONITORAMENTO E LOGS

### 7.1 Logging
- [ ] **Logs Estruturados**
  - [ ] Erros logados com contexto
  - [ ] Tentativas suspeitas logadas
  - [ ] Rate limiting logado
  - [ ] Logs salvos em arquivo

### 7.2 Métricas
- [ ] **Health Check**
  - [ ] `/health` retorna status
  - [ ] Monitoramento ativo

---

## 🚀 8. PRÓXIMOS PASSOS SUGERIDOS

### Prioridade ALTA
1. **Testar fluxo completo de cadastro** (license → registro → dashboard)
2. **Testar visualização de bookings** (implementar endpoint se não existir)
3. **Testar integração Google Calendar** (conectar e criar evento)
4. **Validar todos os endpoints** com dados válidos e inválidos

### Prioridade MÉDIA
1. **Testes de carga** (múltiplas requisições simultâneas)
2. **Testes de edge cases** (dados limites, estados inconsistentes)
3. **Revisar validações de input** (express-validator se necessário)
4. **Implementar visualização de bookings** no dashboard

### Prioridade BAIXA
1. **Testes de performance** (tempo de resposta)
2. **Otimizações** (queries, índices)
3. **Documentação de API** (Swagger/OpenAPI)
4. **Testes automatizados** (Jest, Supertest)

---

## 📝 Checklist Rápido

### Funcionalidades Críticas
- [ ] Cadastro funciona
- [ ] Login funciona
- [ ] Criar slots funciona
- [ ] Agendamento público funciona
- [ ] Race condition protegida ✅
- [ ] Webhook Kiwify funciona

### Segurança
- [ ] Rate limiting ativo ✅
- [ ] Helmet.js configurado ✅
- [ ] Logging implementado ✅
- [ ] Validação de input básica ✅
- [ ] Webhook secret validado ✅

### Integrações
- [ ] Google Calendar conecta
- [ ] Eventos criados no Google Calendar
- [ ] N8N recebe webhooks
- [ ] Backend recebe do N8N

---

## 🎯 Teste Rápido Agora

**O que podemos testar imediatamente:**

1. **Fluxo completo de cadastro** (se tiver license disponível)
2. **Criar e listar slots** (via dashboard)
3. **Agendamento público** (via link público)
4. **Visualizar bookings** (se endpoint existir)
5. **Conectar Google Calendar** (testar OAuth flow)

**Qual você quer testar primeiro?** 🚀

