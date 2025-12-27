# 🔧 Solução: URL de Teste vs URL de Produção no N8N

## 🎯 Problema Identificado

Você está vendo uma URL de **TESTE** no N8N:
```
https://n8nagendacalendar.duckdns.org/webhook/agendamento/webhook-test/kiwify-bdbe5c330b909380
```

**⚠️ URLs de teste (`/webhook-test/`) NÃO funcionam para webhooks reais da Kiwify!**

## ✅ Solução

### Passo 1: Ativar o Workflow

1. No N8N, abra o workflow que você criou
2. **No canto superior direito**, procure pelo toggle/interruptor
3. **Clique para ATIVAR** (deve ficar verde/ativo)
4. **Salve o workflow** (Ctrl+S ou botão Save)

### Passo 2: Obter a URL de Produção

Após ativar o workflow:

1. **Clique no node Webhook**
2. A URL de **PRODUÇÃO** aparecerá (sem `/webhook-test/`)
3. Deve ser algo como:
   ```
   https://n8nagendacalendar.duckdns.org/webhook/agendamento/kiwify-bdbe5c330b909380
   ```

**Diferença:**
- ❌ **Teste:** `/webhook-test/` - só funciona no editor
- ✅ **Produção:** `/webhook/` - funciona para webhooks reais

### Passo 3: Configurar na Kiwify

Use a URL de **PRODUÇÃO** (sem `/webhook-test/`):

```
https://n8nagendacalendar.duckdns.org/webhook/agendamento/kiwify-bdbe5c330b909380
```

### Passo 4: Aguardar e Testar

1. Após ativar, **aguarde 10-15 segundos**
2. Teste com curl:
   ```bash
   curl -X POST https://n8nagendacalendar.duckdns.org/webhook/agendamento/kiwify-bdbe5c330b909380 \
     -H 'Content-Type: application/json' \
     -d '{"test": true}'
   ```

## 🔍 Como Saber se Está Funcionando

### ✅ Sucesso (Workflow Ativo)
- Resposta diferente de 404
- Status 200 (ou resposta do seu workflow)
- No N8N, aparece em **"Executions"**

### ❌ Erro (Workflow Inativo)
```json
{
  "code": 404,
  "message": "The requested webhook \"POST agendamento/kiwify-bdbe5c330b909380\" is not registered."
}
```

## 📋 Checklist Rápido

- [ ] Workflow está **ATIVO** (toggle verde no topo)
- [ ] Workflow foi **SALVO** (Ctrl+S)
- [ ] Aguardou **10-15 segundos** após ativar
- [ ] Usou URL de **PRODUÇÃO** (sem `/webhook-test/`)
- [ ] URL na Kiwify está correta
- [ ] Testou manualmente e recebeu resposta diferente de 404

## 💡 Dica Importante

**No N8N:**
- URLs de **teste** aparecem quando o workflow está **inativo**
- URLs de **produção** aparecem quando o workflow está **ativo**
- Sempre use a URL de **produção** para webhooks reais!

## 🆘 Ainda Não Funciona?

Se após ativar ainda não funcionar:

1. **Reinicie o N8N:**
   ```bash
   ssh -i ~/.ssh/id_rsa ec2-user@54.207.236.103
   cd /opt/agenda-calendar/n8n
   docker-compose restart n8n
   ```

2. **Aguarde 30 segundos** e teste novamente

3. **Verifique os logs:**
   ```bash
   cd /opt/agenda-calendar/n8n
   docker-compose logs -f n8n
   ```

