# 🧪 Plano de Testes - Execução Prática

Este documento lista os testes que vamos executar agora, em ordem de prioridade.

## ✅ O que já foi testado
- ✅ Race condition em bookings (proteção contra double booking)
- ✅ Visualização de bookings no dashboard
- ✅ Endpoints básicos funcionando

---

## 🎯 TESTES PARA EXECUTAR AGORA

### 1. TESTE DO FLUXO COMPLETO (Prioridade MÁXIMA)

**Objetivo:** Validar que todo o sistema funciona do início ao fim.

#### 1.1 Fluxo: Cadastro → Criar Slot → Agendamento → Visualização

**Passos:**
1. [ ] **Cadastro com License**
   - Acessar página de registro
   - Inserir license válida (se tiver)
   - Preencher dados (nome, email, senha)
   - Verificar se cadastro foi bem-sucedido
   - Verificar se redirecionou para dashboard

2. [ ] **Login**
   - Fazer logout
   - Fazer login com credenciais criadas
   - Verificar se token foi salvo
   - Verificar se dashboard carrega

3. [ ] **Criar Slot**
   - No dashboard, clicar em "Abrir horário"
   - Preencher: data (futura), hora início, hora fim, maxBookings
   - Salvar
   - Verificar se slot aparece na lista
   - Verificar se status está correto

4. [ ] **Copiar Link Público**
   - Clicar em "Copiar link"
   - Verificar se link foi copiado
   - Verificar formato do link

5. [ ] **Agendamento Público**
   - Abrir link público em aba anônima/outro navegador
   - Verificar se slots aparecem
   - Preencher formulário de agendamento
   - Submeter
   - Verificar mensagem de sucesso

6. [ ] **Visualizar Agendamento no Dashboard**
   - Voltar ao dashboard (usuário logado)
   - Verificar se agendamento aparece na seção "Agendamentos"
   - Verificar se dados estão corretos (nome, email, telefone, data, hora)
   - Verificar se status está "Confirmado"

**Resultado esperado:** ✅ Todo o fluxo funciona sem erros

---

### 2. TESTES DE VALIDAÇÃO E ERROS

#### 2.1 Validação de License
- [ ] License válida → sucesso
- [ ] License já usada → erro "License code already used"
- [ ] License inexistente → erro "License code not found"
- [ ] License inativa → erro "License is not active"
- [ ] Campo vazio → erro de validação

#### 2.2 Validação de Cadastro
- [ ] Email inválido → erro de formato
- [ ] Senha muito curta → erro de validação
- [ ] Campos obrigatórios vazios → erro de validação
- [ ] Email já cadastrado → erro apropriado

#### 2.3 Validação de Slot
- [ ] Data no passado → erro
- [ ] Hora fim < hora início → erro
- [ ] Campos vazios → erro
- [ ] maxBookings < 1 → erro

#### 2.4 Validação de Agendamento
- [ ] Email inválido → erro
- [ ] Telefone inválido → erro
- [ ] Campos obrigatórios vazios → erro
- [ ] Slot totalmente ocupado → erro "Slot is fully booked"

---

### 3. TESTES DE CONCORRÊNCIA

#### 3.1 Múltiplos Agendamentos no Mesmo Slot
- [ ] Criar slot com maxBookings = 1
- [ ] Fazer 2 agendamentos simultâneos (já testado ✅)
- [ ] Verificar que apenas 1 teve sucesso
- [ ] Verificar que o segundo recebeu erro

#### 3.2 Múltiplos Agendamentos em Slot com Vagas
- [ ] Criar slot com maxBookings = 3
- [ ] Fazer 3 agendamentos
- [ ] Verificar que todos tiveram sucesso
- [ ] Fazer 4º agendamento
- [ ] Verificar que recebeu erro "Slot is fully booked"

---

### 4. TESTES DE INTEGRAÇÃO GOOGLE CALENDAR

#### 4.1 Conectar Google Calendar
- [ ] Clicar em "Conectar com Google Calendar"
- [ ] Verificar redirecionamento para Google
- [ ] Autorizar acesso
- [ ] Verificar callback
- [ ] Verificar se status mudou para "Conectado"

#### 4.2 Criar Evento no Google Calendar
- [ ] Com Google Calendar conectado
- [ ] Fazer um agendamento público
- [ ] Verificar se evento foi criado no Google Calendar
- [ ] Verificar se dados do evento estão corretos

#### 4.3 Desconectar Google Calendar
- [ ] Clicar em "Desconectar"
- [ ] Verificar se status mudou para "Não conectado"
- [ ] Fazer novo agendamento
- [ ] Verificar se booking foi criado (mesmo sem Google Calendar)

---

### 5. TESTES DE UI/UX

#### 5.1 Dashboard
- [ ] Slots listados corretamente
- [ ] Agendamentos listados corretamente
- [ ] Status visuais funcionando
- [ ] Botões funcionando
- [ ] Modais abrindo/fechando
- [ ] Mensagens de sucesso/erro aparecendo

#### 5.2 Página Pública
- [ ] Slots disponíveis aparecendo
- [ ] Formulário funcionando
- [ ] Validação em tempo real
- [ ] Mensagens de feedback
- [ ] Loading states

---

### 6. TESTES DE EDGE CASES

#### 6.1 Dados Limites
- [ ] Nome muito longo
- [ ] Email muito longo
- [ ] Telefone com formatos diferentes
- [ ] Observações muito longas
- [ ] Data muito no futuro

#### 6.2 Estados Inconsistentes
- [ ] Slot deletado com bookings
- [ ] Booking sem slot (se possível)
- [ ] Múltiplos slots no mesmo horário (deve ser bloqueado)

---

### 7. TESTES DE PERFORMANCE

#### 7.1 Tempo de Resposta
- [ ] Dashboard carrega em < 2 segundos
- [ ] Lista de slots carrega rapidamente
- [ ] Lista de bookings carrega rapidamente
- [ ] Agendamento público responde rapidamente

#### 7.2 Múltiplas Requisições
- [ ] 10 requisições simultâneas → todas respondem
- [ ] Rate limiting funciona (já testado ✅)

---

## 📋 CHECKLIST RÁPIDO - TESTE AGORA

### Funcionalidades Críticas (Fazer Primeiro)
- [ ] **Fluxo completo:** Cadastro → Login → Criar Slot → Agendamento → Visualizar
- [ ] **Validações:** License, email, telefone, datas
- [ ] **Concorrência:** Múltiplos agendamentos no mesmo slot
- [ ] **Visualização:** Bookings aparecem no dashboard

### Funcionalidades Importantes (Fazer Depois)
- [ ] **Google Calendar:** Conectar e criar eventos
- [ ] **Edge Cases:** Dados limites, estados inconsistentes
- [ ] **UI/UX:** Interface responsiva e intuitiva

### Funcionalidades Opcionais (Se Tiver Tempo)
- [ ] **Performance:** Tempo de resposta
- [ ] **Carga:** Múltiplas requisições simultâneas

---

## 🚀 ORDEM RECOMENDADA DE EXECUÇÃO

1. **AGORA:** Teste do fluxo completo (1.1)
2. **DEPOIS:** Testes de validação (2.1 - 2.4)
3. **DEPOIS:** Testes de concorrência (3.1 - 3.2)
4. **DEPOIS:** Testes de Google Calendar (4.1 - 4.3)
5. **OPCIONAL:** Edge cases e performance

---

## 📝 COMO REPORTAR PROBLEMAS

Ao encontrar um problema, anote:
- **O que estava fazendo:** (ex: "Tentando criar slot")
- **O que aconteceu:** (ex: "Erro 500 no console")
- **O que esperava:** (ex: "Slot deveria ser criado")
- **Screenshot/Logs:** Se possível

---

## ✅ PRÓXIMO PASSO

**Vamos começar pelo teste do fluxo completo!**

Quer que eu te guie passo a passo ou prefere testar sozinho e me reportar os resultados?













