# 📢 Como Publicar Workflow no N8N (Versão com Botão Publish)

## 🎯 Problema

Na versão mais recente do N8N, não há mais o toggle "Active/Inactive". Em vez disso, há um botão **"Publish"** para publicar workflows.

## ✅ Solução: Publicar o Workflow

### Passo 1: Salvar o Workflow

1. No N8N, certifique-se de que o workflow está **salvo**
2. Pressione **Ctrl+S** ou clique no botão **"Save"**

### Passo 2: Publicar o Workflow

1. **Procure pelo botão "Publish"** no topo do editor
   - Pode estar no canto superior direito
   - Ou em um menu dropdown
   - Ou como um botão destacado

2. **Clique em "Publish"**
   - O workflow será publicado e ficará ativo
   - Você pode ver um indicador de que está "Published" ou "Live"

### Passo 3: Verificar Status

Após publicar:
- O workflow deve mostrar status "Published" ou "Live"
- A URL de produção aparecerá no node Webhook (sem `/webhook-test/`)
- A URL será: `https://n8nagendacalendar.duckdns.org/webhook/agendamento/kiwify-bdbe5c330b909380`

### Passo 4: Obter URL de Produção

1. **Clique no node Webhook**
2. A URL de **PRODUÇÃO** aparecerá (sem `/webhook-test/`)
3. Copie essa URL para usar na Kiwify

### Passo 5: Configurar na Kiwify

Use a URL de produção:
```
https://n8nagendacalendar.duckdns.org/webhook/agendamento/kiwify-bdbe5c330b909380
```

## 🔍 Onde Encontrar o Botão Publish

O botão "Publish" pode estar em diferentes lugares dependendo da versão:

1. **No topo do editor:**
   - Canto superior direito
   - Ao lado do nome do workflow
   - Como um botão destacado

2. **No menu:**
   - Menu de três pontos (⋮)
   - Menu "Workflow"
   - Dropdown no topo

3. **Como um toggle:**
   - Algumas versões mostram "Unpublished" / "Published"
   - Clique para alternar entre os estados

## 📋 Checklist

- [ ] Workflow está **SALVO** (Ctrl+S)
- [ ] Workflow está **PUBLICADO** (botão Publish clicado)
- [ ] Status mostra "Published" ou "Live"
- [ ] URL de produção aparece no node Webhook (sem `/webhook-test/`)
- [ ] Aguardou **10-15 segundos** após publicar
- [ ] URL na Kiwify está correta (URL de produção)

## 🧪 Testar Após Publicar

Após publicar, aguarde 10-15 segundos e teste:

```bash
curl -X POST https://n8nagendacalendar.duckdns.org/webhook/agendamento/kiwify-bdbe5c330b909380 \
  -H 'Content-Type: application/json' \
  -d '{"test": true}'
```

**Resposta esperada (sucesso):**
- Status 200 ou resposta do workflow
- Não deve retornar erro 404

**Resposta de erro (não publicado):**
```json
{
  "code": 404,
  "message": "The requested webhook \"POST agendamento/kiwify-bdbe5c330b909380\" is not registered."
}
```

## 🆘 Ainda Não Funciona?

### Verificar se Está Publicado

1. No N8N, veja o status do workflow
2. Deve mostrar "Published" ou "Live"
3. Se mostrar "Unpublished" ou "Draft", clique em "Publish" novamente

### Reiniciar N8N

Se ainda não funcionar após publicar:

```bash
ssh -i ~/.ssh/id_rsa ec2-user@54.207.236.103
cd /opt/agenda-calendar/n8n
docker-compose restart n8n
```

Aguarde 30 segundos e teste novamente.

### Verificar Logs

Para ver se o webhook está sendo registrado:

```bash
cd /opt/agenda-calendar/n8n
docker-compose logs -f n8n
```

Procure por mensagens como:
- `Webhook registered` - sucesso
- `The requested webhook ... is not registered` - não publicado

## 💡 Diferença: Teste vs Produção

- **URL de Teste:** `/webhook-test/...` - só funciona no editor
- **URL de Produção:** `/webhook/...` - funciona para webhooks reais (após publicar)

## 📝 Nota

Em versões mais antigas do N8N, havia um toggle "Active/Inactive". Nas versões mais recentes, isso foi substituído pelo botão "Publish". O conceito é o mesmo: o workflow precisa estar "publicado" para receber webhooks de produção.



