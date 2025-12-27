# 🔧 Correção: URL de Webhook com `/webhook/` Duplicado

## 🔴 Problema Identificado

A URL de produção estava mostrando `/webhook/` **duplicado**:
```
https://n8nagendacalendar.duckdns.org/webhook/agendamento/webhook/kiwify-bdbe5c330b909380
                                                      ^^^^^^^^
                                                      DUPLICADO!
```

## 🔍 Causa

O `WEBHOOK_URL` estava configurado como:
```yaml
WEBHOOK_URL=https://n8nagendacalendar.duckdns.org/webhook/agendamento
```

O N8N **adiciona automaticamente** `/webhook/` ao início do path, então quando você configura um path no webhook node, ele fica:
- N8N adiciona: `/webhook/`
- Seu path: `agendamento/kiwify-...`
- WEBHOOK_URL já tinha: `/webhook/agendamento`
- Resultado: `/webhook/agendamento/webhook/kiwify-...` ❌

## ✅ Solução Aplicada

Corrigi o `WEBHOOK_URL` para:
```yaml
WEBHOOK_URL=https://n8nagendacalendar.duckdns.org/
```

Agora o N8N vai construir a URL corretamente:
- N8N adiciona: `/webhook/`
- Seu path no node: `agendamento/kiwify-bdbe5c330b909380`
- Resultado: `/webhook/agendamento/kiwify-bdbe5c330b909380` ✅

## 📋 Próximos Passos

### 1. Verificar URL de Produção no N8N

Após a correção, você precisa:

1. **Acesse o N8N:** `https://n8nagendacalendar.duckdns.org`
2. **Abra o workflow**
3. **Clique no node Webhook**
4. **Verifique a URL de Produção** - deve ser:
   ```
   https://n8nagendacalendar.duckdns.org/webhook/agendamento/kiwify-bdbe5c330b909380
   ```
   (sem o `/webhook/` duplicado)

### 2. Publicar o Workflow

1. **Clique em "Publish"** no topo do workflow
2. **Salve** (Ctrl+S)
3. **Aguarde 10-15 segundos**

### 3. Atualizar na Kiwify

Use a nova URL de produção (sem `/webhook/` duplicado):
```
https://n8nagendacalendar.duckdns.org/webhook/agendamento/kiwify-bdbe5c330b909380
```

### 4. Testar

```bash
curl -X POST https://n8nagendacalendar.duckdns.org/webhook/agendamento/kiwify-bdbe5c330b909380 \
  -H 'Content-Type: application/json' \
  -d '{"test": true}'
```

## ⚠️ Importante

Se o path do seu webhook node no N8N for apenas `kiwify-bdbe5c330b909380` (sem `agendamento/`), então:

1. **Opção A:** Adicione `agendamento/` no path do node:
   - Path: `agendamento/kiwify-bdbe5c330b909380`
   - URL final: `/webhook/agendamento/kiwify-bdbe5c330b909380`

2. **Opção B:** Remova `agendamento/` do path:
   - Path: `kiwify-bdbe5c330b909380`
   - URL final: `/webhook/kiwify-bdbe5c330b909380`
   - Mas você precisaria ajustar o `WEBHOOK_URL` novamente

**Recomendo a Opção A** para manter compatibilidade.

## 🔄 Se Precisar Reverter

Se algo der errado, você pode reverter:

```bash
ssh -i ~/.ssh/id_rsa ec2-user@54.207.236.103
cd /opt/agenda-calendar/n8n
cp docker-compose.yml.backup docker-compose.yml
docker-compose restart n8n
```

## ✅ Checklist

- [ ] `WEBHOOK_URL` foi corrigido (sem `/webhook/agendamento`)
- [ ] N8N foi reiniciado
- [ ] URL de produção no N8N não tem `/webhook/` duplicado
- [ ] Workflow está publicado
- [ ] URL na Kiwify está atualizada
- [ ] Teste manual funcionou

