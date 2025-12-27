# 🔍 Diagnóstico: Webhook N8N não está recebendo dados da Kiwify

## ✅ Status Atual (26/12/2025)

- **N8N está rodando:** ✅ Container ativo
- **Nginx está configurado:** ✅ Proxy funcionando
- **Webhook está chegando:** ✅ Requisições chegam no N8N
- **Problema:** ❌ Workflow não está registrado/ativo

## 🔴 Erro Atual

Quando testamos o webhook, recebemos:
```json
{
  "code": 404,
  "message": "The requested webhook \"POST kiwify\" is not registered.",
  "hint": "The workflow must be active for a production URL to run successfully..."
}
```

## 📋 Checklist de Verificação

### 1. Verificar se o Workflow está ATIVO

**No N8N (https://n8nagendacalendar.duckdns.org):**

1. Acesse o workflow que você criou
2. **VERIFIQUE o toggle no canto superior direito** - deve estar **VERDE/ATIVO**
3. Se estiver cinza/inativo, **clique para ativar**
4. **Salve o workflow** (Ctrl+S ou botão Save)

### 2. Verificar o Path do Webhook

**No node Webhook do seu workflow:**

1. Clique no node Webhook
2. Verifique o campo **"Path"**
3. Deve estar configurado como: `kiwify` (sem barra inicial)
4. **NÃO deve ser:** `/kiwify` ou `/webhook/kiwify`
5. A URL completa será: `https://n8nagendacalendar.duckdns.org/webhook/kiwify`

### 3. Verificar o Método HTTP

1. No node Webhook, verifique **"HTTP Method"**
2. Deve estar como: `POST`
3. **NÃO deve ser:** GET, PUT, DELETE, etc.

### 4. Verificar se o Workflow foi Salvo

1. Após fazer alterações, **SEMPRE salve** (Ctrl+S)
2. Verifique se aparece "Saved" ou "✓" no topo
3. Se não salvar, as mudanças não serão aplicadas

### 5. Verificar a URL na Kiwify

**Na configuração do webhook na Kiwify:**

A URL deve ser **EXATAMENTE**:
```
https://n8nagendacalendar.duckdns.org/webhook/kiwify
```

**Verifique:**
- ✅ HTTPS (não HTTP)
- ✅ Domínio correto: `n8nagendacalendar.duckdns.org`
- ✅ Path: `/webhook/kiwify` (com barra inicial)
- ❌ Sem espaços extras
- ❌ Sem caracteres especiais

## 🧪 Teste Manual

Após verificar tudo acima, teste manualmente:

```bash
curl -X POST https://n8nagendacalendar.duckdns.org/webhook/kiwify \
  -H 'Content-Type: application/json' \
  -d '{
    "order_id": "test-123",
    "order_status": "paid",
    "Customer": {
      "email": "test@test.com"
    }
  }'
```

**Resposta esperada (sucesso):**
- Status 200
- Alguma resposta do workflow (depende do que você configurou)

**Resposta de erro (workflow inativo):**
```json
{
  "code": 404,
  "message": "The requested webhook \"POST kiwify\" is not registered."
}
```

## 🔧 Solução Passo a Passo

### Passo 1: Criar/Editar Workflow

1. Acesse: https://n8nagendacalendar.duckdns.org
2. Clique em **"Workflows"** → **"Add workflow"** (ou edite o existente)
3. Arraste um node **"Webhook"** para o canvas

### Passo 2: Configurar Webhook Node

1. Clique no node Webhook
2. Configure:
   - **Name:** `Kiwify Webhook`
   - **HTTP Method:** `POST`
   - **Path:** `kiwify` ⚠️ **SEM barra inicial, SEM /webhook/**
   - **Response Mode:** `Last Node`
   - **Response Code:** `200`

3. **Copie a URL** que aparece no node (deve ser algo como):
   ```
   https://n8nagendacalendar.duckdns.org/webhook/kiwify
   ```

### Passo 3: Adicionar Node de Resposta (Opcional mas Recomendado)

1. Arraste um node **"Respond to Webhook"** após o Webhook
2. Configure:
   - **Response Code:** `200`
   - **Response Body:** 
   ```json
   {
     "success": true,
     "message": "Webhook received"
   }
   ```

### Passo 4: Salvar e Ativar

1. **Salve o workflow** (Ctrl+S ou botão Save)
2. **Ative o workflow** (toggle no canto superior direito - deve ficar VERDE)
3. **Aguarde 5-10 segundos** para o N8N registrar o webhook

### Passo 5: Testar

1. Use o comando curl acima ou teste pela Kiwify
2. Verifique se recebe resposta 200
3. No N8N, vá em **"Executions"** para ver se o webhook foi executado

## 🆘 Problemas Comuns

### Problema: "Workflow must be active"

**Causa:** O workflow não está ativado

**Solução:**
1. Abra o workflow no N8N
2. Ative o toggle no topo (deve ficar verde)
3. Salve o workflow
4. Aguarde alguns segundos

### Problema: "Path not found" ou 404

**Causa:** Path configurado incorretamente

**Solução:**
1. No node Webhook, verifique o campo "Path"
2. Deve ser apenas: `kiwify` (sem `/` no início)
3. A URL completa será: `/webhook/kiwify` (o `/webhook/` é adicionado automaticamente pelo N8N)

### Problema: Workflow ativo mas ainda não funciona

**Causa:** N8N precisa de alguns segundos para registrar webhooks

**Solução:**
1. Ative o workflow
2. Salve
3. Aguarde 10-15 segundos
4. Teste novamente

### Problema: Kiwify não consegue enviar

**Causa:** URL incorreta ou problema de rede

**Solução:**
1. Verifique a URL na Kiwify (deve ser exatamente como mostrado acima)
2. Teste manualmente com curl primeiro
3. Verifique se o certificado SSL está válido (deve estar, pois usamos Certbot)

## 📊 Verificar Logs

Para ver os logs do N8N em tempo real:

```bash
ssh -i ~/.ssh/id_rsa ec2-user@54.207.236.103
cd /opt/agenda-calendar/n8n
docker-compose logs -f n8n
```

Procure por:
- `Received request for unknown webhook` - workflow não ativo
- `Webhook received` - webhook funcionando
- `POST kiwify` - tentativa de acessar o webhook

## ✅ Checklist Final

Antes de reportar problema, verifique:

- [ ] Workflow está **SALVO** (Ctrl+S)
- [ ] Workflow está **ATIVO** (toggle verde no topo)
- [ ] Path do webhook é `kiwify` (sem barra inicial)
- [ ] Método HTTP é `POST`
- [ ] URL na Kiwify está correta: `https://n8nagendacalendar.duckdns.org/webhook/kiwify`
- [ ] Aguardou 10-15 segundos após ativar o workflow
- [ ] Testou manualmente com curl e recebeu resposta diferente de 404

## 🔄 Reiniciar N8N (Se necessário)

Se nada funcionar, tente reiniciar o N8N:

```bash
ssh -i ~/.ssh/id_rsa ec2-user@54.207.236.103
cd /opt/agenda-calendar/n8n
docker-compose restart n8n
```

Aguarde 30 segundos e teste novamente.

