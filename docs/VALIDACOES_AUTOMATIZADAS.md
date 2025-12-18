# 🤖 Validações Automatizadas

Este documento lista todas as validações que podem ser testadas automaticamente e como executá-las.

## 📋 Validações que Podem ser Automatizadas

### ✅ 1. Validações de Formato (100% Automatizável)

#### Email
- ✅ Email sem @
- ✅ Email sem domínio
- ✅ Email com múltiplos @
- ✅ Email com espaços
- ✅ Email com caracteres especiais inválidos
- ✅ Email muito longo

#### Telefone
- ✅ Telefone sem formatação
- ✅ Telefone incompleto
- ✅ Telefone com letras
- ✅ Telefone vazio
- ✅ Telefone com formato incorreto

#### Data
- ✅ Data formato inválido (DD/MM/YYYY)
- ✅ Data no passado
- ✅ Data muito no futuro
- ✅ Data com formato incorreto

#### Hora
- ✅ Hora formato inválido (10h00)
- ✅ Hora inválida (25:00)
- ✅ Hora fim < hora início
- ✅ Hora fim = hora início

### ✅ 2. Validações de Campos Obrigatórios (100% Automatizável)

- ✅ Campos vazios
- ✅ Campos null
- ✅ Campos undefined
- ✅ Campos ausentes no body

### ✅ 3. Validações de Autenticação (100% Automatizável)

- ✅ Endpoint protegido sem token
- ✅ Endpoint protegido com token inválido
- ✅ Endpoint protegido com token expirado
- ✅ Endpoint protegido com token malformado

### ✅ 4. Validações de Rate Limiting (100% Automatizável)

- ✅ Múltiplas requisições excedendo limite
- ✅ Rate limit por endpoint específico
- ✅ Headers de rate limit presentes

### ✅ 5. Validações de Lógica de Negócio (Parcialmente Automatizável)

- ✅ License já usada
- ✅ License inativa
- ✅ License inexistente
- ✅ Slot totalmente ocupado
- ✅ Conflito de horários (requer dados reais)

### ✅ 6. Validações de Sanitização (Parcialmente Automatizável)

- ✅ XSS em campos de texto
- ✅ SQL injection (mesmo sendo NoSQL)
- ✅ Caracteres especiais
- ⚠️ Verificação real requer inspeção do banco

### ✅ 7. Validações de Tamanho (100% Automatizável)

- ✅ Campos muito longos
- ✅ Payload muito grande
- ✅ Limites de caracteres

---

## 🚀 Como Executar os Testes

### Script Básico (Bash)

```bash
cd scripts
./test-validations.sh
```

**Variáveis de ambiente:**
```bash
# Opcional: mudar URL do backend
export BACKEND_URL="https://agendacalendar.duckdns.org"

# Opcional: adicionar token para testes autenticados
export AUTH_TOKEN="seu_token_jwt_aqui"

./test-validations.sh
```

### Script Avançado (Node.js)

```bash
cd scripts
node test-validations-advanced.js
```

**Variáveis de ambiente:**
```bash
export BACKEND_URL="https://agendacalendar.duckdns.org"
export AUTH_TOKEN="seu_token_jwt_aqui"
node test-validations-advanced.js
```

---

## 📊 O que Cada Script Testa

### `test-validations.sh` (Bash)

**Testa:**
- ✅ Validação de license (campos vazios, formato)
- ✅ Validação de cadastro (email, senha, campos obrigatórios)
- ✅ Validação de slots (data, hora, formato)
- ✅ Validação de agendamento (email, telefone, campos)
- ✅ Autenticação (sem token, token inválido)
- ✅ Rate limiting (múltiplas requisições)
- ✅ Endpoints públicos (health check, slots públicos)

**Tempo estimado:** 1-2 minutos

### `test-validations-advanced.js` (Node.js)

**Testa:**
- ✅ Validação de data (passado, futuro)
- ✅ Validação de email (múltiplos formatos inválidos)
- ✅ Validação de telefone (múltiplos formatos inválidos)
- ✅ Sanitização (XSS, caracteres especiais)
- ✅ Tamanho de campos (muito longos)

**Tempo estimado:** 2-3 minutos

---

## 🎯 Validações que NÃO Podem ser Automatizadas (Fáceis)

### Requerem Interação Manual

1. **Fluxo Completo End-to-End**
   - Cadastro → Login → Criar Slot → Agendamento → Visualizar
   - Requer navegação no navegador

2. **UI/UX**
   - Mensagens de erro aparecem corretamente
   - Loading states
   - Responsividade
   - Feedback visual

3. **Integração Google Calendar**
   - OAuth flow completo
   - Criação de eventos
   - Requer autorização manual

4. **Validações Visuais**
   - Formatação de dados exibidos
   - Ordenação visual
   - Status visuais

---

## 📝 Exemplo de Uso Completo

```bash
# 1. Obter token de autenticação (fazer login manualmente primeiro)
#    Ou usar token de desenvolvimento

# 2. Executar testes básicos
cd scripts
./test-validations.sh

# 3. Executar testes avançados (com token)
export AUTH_TOKEN="seu_token_aqui"
node test-validations-advanced.js

# 4. Verificar resultados
#    ✅ = Passou
#    ❌ = Falhou
#    ⚠️  = Aviso/Pulado
```

---

## 🔄 Integração com CI/CD

Os scripts podem ser integrados em pipelines CI/CD:

```yaml
# Exemplo: GitHub Actions
- name: Run Validation Tests
  run: |
    cd scripts
    chmod +x test-validations.sh
    ./test-validations.sh
  env:
    BACKEND_URL: ${{ secrets.BACKEND_URL }}
```

---

## 📈 Cobertura de Testes

### Cobertura Atual (Automática)

- ✅ **Formato de dados:** ~90%
- ✅ **Campos obrigatórios:** ~100%
- ✅ **Autenticação:** ~80%
- ✅ **Rate limiting:** ~70%
- ✅ **Lógica de negócio:** ~50%
- ✅ **Sanitização:** ~60%

### Cobertura Total (Manual + Automática)

- ✅ **Formato de dados:** ~95%
- ✅ **Campos obrigatórios:** ~100%
- ✅ **Autenticação:** ~90%
- ✅ **Rate limiting:** ~80%
- ✅ **Lógica de negócio:** ~85%
- ✅ **Sanitização:** ~70%
- ✅ **UI/UX:** ~60%
- ✅ **Fluxo completo:** ~70%

---

## 🎯 Próximos Passos

1. **Executar testes básicos agora:**
   ```bash
   cd scripts && ./test-validations.sh
   ```

2. **Obter token e executar testes avançados:**
   - Fazer login no sistema
   - Copiar token JWT
   - Executar: `export AUTH_TOKEN="token" && node test-validations-advanced.js`

3. **Testes manuais:**
   - Fluxo completo
   - UI/UX
   - Google Calendar

---

## ✅ Checklist Rápido

- [ ] Executar `test-validations.sh`
- [ ] Obter token de autenticação
- [ ] Executar `test-validations-advanced.js`
- [ ] Revisar resultados
- [ ] Corrigir falhas (se houver)
- [ ] Executar testes manuais



