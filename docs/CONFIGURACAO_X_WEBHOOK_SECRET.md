# 🔐 Configuração do x-webhook-secret

## 📋 O Que É

`x-webhook-secret` **NÃO é uma variável de ambiente**. É um **header HTTP** usado para autenticar as chamadas do N8N para o backend.

## 🔍 Como Funciona

### No Backend
- **Variável de ambiente:** `WEBHOOK_BRIDGE_SECRET`
- **Valor atual:** `b4b88d0b519c6d1d75261a30788567672b66fda492f2df9c4e00f36de877cea2`
- **Localização:** `/opt/agenda-calendar/backend/.env`

### No N8N
- **Header HTTP:** `x-webhook-secret`
- **Valor:** Deve ser o **mesmo** do `WEBHOOK_BRIDGE_SECRET` do backend
- **Onde configurar:** No node **HTTP Request** que chama o backend

## ✅ Como Configurar no N8N

### Passo 1: Obter o Secret do Backend

```bash
ssh -i ~/.ssh/id_rsa ec2-user@54.207.236.103
cat /opt/agenda-calendar/backend/.env | grep WEBHOOK_BRIDGE_SECRET
```

**Valor atual:**
```
WEBHOOK_BRIDGE_SECRET=b4b88d0b519c6d1d75261a30788567672b66fda492f2df9c4e00f36de877cea2
```

### Passo 2: Configurar no Node HTTP Request do N8N

1. **No N8N, abra o workflow**
2. **Clique no node HTTP Request** (que chama o backend)
3. **Em "Headers", adicione:**
   - **Name:** `x-webhook-secret`
   - **Value:** `b4b88d0b519c6d1d75261a30788567672b66fda492f2df9c4e00f36de877cea2`
4. **Salve** o workflow

## ⚠️ IMPORTANTE

- ✅ O valor deve ser **EXATAMENTE** o mesmo no backend e no N8N
- ✅ O nome do header é **`x-webhook-secret`** (minúsculas, com hífen)
- ✅ Sem esse header, o backend retornará erro 401

## 🧪 Testar

Após configurar, teste chamando o backend do N8N. Se o secret estiver correto, o backend processará o webhook.

## 🆘 Erros Comuns

### Erro: "Missing x-webhook-secret header"
**Causa:** Header não foi adicionado no node HTTP Request do N8N

**Solução:** Adicione o header `x-webhook-secret` com o valor correto

### Erro: "Invalid x-webhook-secret"
**Causa:** O valor do header não bate com o `WEBHOOK_BRIDGE_SECRET` do backend

**Solução:** 
1. Verifique o valor no backend: `cat /opt/agenda-calendar/backend/.env | grep WEBHOOK_BRIDGE_SECRET`
2. Use o **mesmo valor** no header do N8N
3. Certifique-se de não ter espaços extras

## 📝 Resumo

- **Backend:** Variável `WEBHOOK_BRIDGE_SECRET` no `.env`
- **N8N:** Header `x-webhook-secret` no node HTTP Request
- **Valor:** Deve ser **idêntico** em ambos
- **Valor atual:** `b4b88d0b519c6d1d75261a30788567672b66fda492f2df9c4e00f36de877cea2`

