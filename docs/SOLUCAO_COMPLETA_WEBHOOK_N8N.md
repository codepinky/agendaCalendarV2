# 🔧 Solução Completa: Webhook N8N Não Funciona

## 🔴 Problema Identificado

Após análise completa, identifiquei **2 problemas principais**:

### Problema 1: WEBHOOK_URL com Prefixo `/agendamento`
O `WEBHOOK_URL` está configurado como:
```
WEBHOOK_URL=https://n8nagendacalendar.duckdns.org/webhook/agendamento
```

Isso força **TODOS** os webhooks a terem o prefixo `/webhook/agendamento/`, o que pode causar confusão.

### Problema 2: Workflow Não Está Publicado
Os workflows existentes **não estão publicados/ativos**, por isso retornam 404:
```json
{
  "code": 404,
  "message": "The requested webhook \"POST agendamento/kiwify-bdbe5c330b909380\" is not registered."
}
```

## ✅ Solução Passo a Passo

### Passo 1: Corrigir WEBHOOK_URL (Recomendado)

A configuração atual força o prefixo `/agendamento`. Vamos simplificar:

1. **Editar docker-compose.yml:**
   ```bash
   ssh -i ~/.ssh/id_rsa ec2-user@54.207.236.103
   cd /opt/agenda-calendar/n8n
   sudo nano docker-compose.yml
   ```

2. **Alterar a linha:**
   ```yaml
   - WEBHOOK_URL=https://n8nagendacalendar.duckdns.org/webhook/agendamento
   ```
   
   **Para:**
   ```yaml
   - WEBHOOK_URL=https://n8nagendacalendar.duckdns.org/webhook
   ```

3. **Reiniciar N8N:**
   ```bash
   docker-compose restart n8n
   ```

**⚠️ IMPORTANTE:** Após essa mudança, os webhooks antigos com prefixo `/agendamento/` não funcionarão mais. Você precisará:
- Criar novos workflows OU
- Manter o prefixo `/agendamento/` nos paths dos webhooks

### Passo 2: Publicar o Workflow no N8N

1. **Acesse o N8N:**
   ```
   https://n8nagendacalendar.duckdns.org
   ```

2. **Abra o workflow que você criou** (provavelmente "My workflow 3")

3. **Verifique o node Webhook:**
   - Path deve ser: `kiwify-bdbe5c330b909380` (ou apenas `kiwify`)
   - Método: `POST`

4. **PUBLIQUE o workflow:**
   - Procure pelo botão **"Publish"** no topo
   - Clique em **"Publish"**
   - O workflow deve mostrar status "Published" ou "Live"

5. **Salve o workflow** (Ctrl+S)

6. **Aguarde 10-15 segundos** para o N8N registrar o webhook

### Passo 3: Obter URL de Produção

Após publicar:

1. **Clique no node Webhook**
2. A URL de **PRODUÇÃO** aparecerá (sem `/webhook-test/`)
3. **Se WEBHOOK_URL foi corrigido** (sem `/agendamento`):
   ```
   https://n8nagendacalendar.duckdns.org/webhook/kiwify-bdbe5c330b909380
   ```
4. **Se WEBHOOK_URL mantém `/agendamento`**:
   ```
   https://n8nagendacalendar.duckdns.org/webhook/agendamento/kiwify-bdbe5c330b909380
   ```

### Passo 4: Configurar na Kiwify

Use a URL de **PRODUÇÃO** exibida no node Webhook do N8N.

### Passo 5: Testar

```bash
# Se corrigiu WEBHOOK_URL (sem /agendamento):
curl -X POST https://n8nagendacalendar.duckdns.org/webhook/kiwify-bdbe5c330b909380 \
  -H 'Content-Type: application/json' \
  -d '{"test": true}'

# Se manteve WEBHOOK_URL (com /agendamento):
curl -X POST https://n8nagendacalendar.duckdns.org/webhook/agendamento/kiwify-bdbe5c330b909380 \
  -H 'Content-Type: application/json' \
  -d '{"test": true}'
```

**Resposta esperada (sucesso):**
- Status 200
- Resposta do workflow (depende do que você configurou)

**Resposta de erro (não publicado):**
```json
{
  "code": 404,
  "message": "The requested webhook \"POST ...\" is not registered."
}
```

## 🔍 Diagnóstico Atual

### Status dos Serviços
- ✅ N8N está rodando (container ativo)
- ✅ Nginx está configurado corretamente
- ✅ SSL está funcionando
- ✅ Webhooks estão chegando no N8N
- ❌ Workflows não estão publicados

### Workflows Existentes
```
LkjbHLyYnqKyxmOq|My workflow
6LRBtNQwrdUUE5xk|My workflow 2
VC8Wpill1Gfe2nmK|My workflow 3
```

**Nenhum deles está publicado/ativo!**

### Configuração Atual
```yaml
WEBHOOK_URL=https://n8nagendacalendar.duckdns.org/webhook/agendamento
N8N_HOST=n8nagendacalendar.duckdns.org
N8N_PROTOCOL=https
```

## 🆘 Se Ainda Não Funcionar

### Verificar se Workflow Está Publicado

1. No N8N, veja o status do workflow
2. Deve mostrar "Published" ou "Live"
3. Se mostrar "Unpublished" ou "Draft", clique em "Publish"

### Verificar Logs

```bash
ssh -i ~/.ssh/id_rsa ec2-user@54.207.236.103
cd /opt/agenda-calendar/n8n
docker-compose logs -f n8n
```

Procure por:
- `Webhook registered` - sucesso
- `The requested webhook ... is not registered` - não publicado

### Reiniciar N8N

```bash
cd /opt/agenda-calendar/n8n
docker-compose restart n8n
```

Aguarde 30 segundos e teste novamente.

## 📋 Checklist Final

- [ ] WEBHOOK_URL está correto (com ou sem `/agendamento`)
- [ ] Workflow está **PUBLICADO** (botão Publish clicado)
- [ ] Workflow está **SALVO** (Ctrl+S)
- [ ] Aguardou **10-15 segundos** após publicar
- [ ] URL de produção aparece no node Webhook (sem `/webhook-test/`)
- [ ] URL na Kiwify está correta (URL de produção)
- [ ] Testou manualmente e recebeu resposta diferente de 404

## 💡 Recomendação

**Opção 1: Manter `/agendamento` (Mais Simples)**
- Não precisa alterar nada
- Use paths como: `kiwify-bdbe5c330b909380`
- URL final: `/webhook/agendamento/kiwify-bdbe5c330b909380`

**Opção 2: Remover `/agendamento` (Mais Limpo)**
- Altere `WEBHOOK_URL` para não incluir `/agendamento`
- Use paths como: `kiwify-bdbe5c330b909380`
- URL final: `/webhook/kiwify-bdbe5c330b909380`

**Recomendo a Opção 1** (manter como está) para não quebrar workflows existentes.

