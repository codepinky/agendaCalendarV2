# 🔧 Correção: Variável de Ambiente WEBHOOK_URL Não Atualizada

## 🔴 Problema Identificado

O N8N ainda está usando a variável de ambiente antiga:
```
WEBHOOK_URL=https://n8nagendacalendar.duckdns.org/webhook/agendamento
```

Mesmo após alterar o `docker-compose.yml`, o container não recarregou a nova configuração.

## ✅ Solução: Recriar o Container

O problema é que `docker-compose restart` **não recarrega** variáveis de ambiente. É necessário **recriar** o container:

```bash
cd /opt/agenda-calendar/n8n
docker-compose down
docker-compose up -d
```

## 📋 Passo a Passo Completo

### 1. Verificar Configuração Atual

```bash
ssh -i ~/.ssh/id_rsa ec2-user@54.207.236.103
cd /opt/agenda-calendar/n8n
cat docker-compose.yml | grep WEBHOOK_URL
```

**Deve mostrar:**
```yaml
WEBHOOK_URL=https://n8nagendacalendar.duckdns.org/
```

### 2. Recriar o Container

```bash
cd /opt/agenda-calendar/n8n
docker-compose down
docker-compose up -d
```

**Aguarde 15-20 segundos** para o N8N inicializar completamente.

### 3. Verificar se Foi Aplicado

```bash
docker-compose exec -T n8n env | grep WEBHOOK_URL
```

**Deve mostrar:**
```
WEBHOOK_URL=https://n8nagendacalendar.duckdns.org/
```

### 4. No N8N, Verificar URL de Produção

1. **Acesse:** `https://n8nagendacalendar.duckdns.org`
2. **Abra o workflow**
3. **Clique no node Webhook**
4. **Verifique a URL de Produção**

A URL deve ser:
```
https://n8nagendacalendar.duckdns.org/webhook/kiwify-bdbe5c330b909380
```

**NÃO deve ter:**
- ❌ `/webhook/agendamento/webhook/...` (duplicado)
- ❌ `/webhook/agendamento/...` (se o path do node não tiver `agendamento/`)

### 5. Ajustar Path do Webhook (Se Necessário)

Se a URL ainda estiver errada, você precisa ajustar o **path** no node Webhook:

**Se você quer usar `/webhook/agendamento/kiwify-...`:**
- Path no node: `agendamento/kiwify-bdbe5c330b909380`

**Se você quer usar `/webhook/kiwify-...`:**
- Path no node: `kiwify-bdbe5c330b909380`

### 6. Publicar o Workflow

1. **Clique em "Publish"** no topo
2. **Salve** (Ctrl+S)
3. **Aguarde 10-15 segundos**

## 🔍 Diferença: Restart vs Down/Up

- **`docker-compose restart`**: Reinicia o container **sem recarregar** variáveis de ambiente
- **`docker-compose down && up -d`**: **Recria** o container com as novas variáveis

## ⚠️ Importante

Após recriar o container:
- O N8N pode levar alguns segundos para inicializar
- Você precisará verificar a URL de produção novamente no node Webhook
- Pode ser necessário ajustar o path do webhook node
- Publique o workflow novamente

## 📝 Sobre o Backend

**O backend NÃO está causando o problema.** O backend está correto e funcionando. O problema é apenas na configuração do N8N.

O backend:
- ✅ Está configurado corretamente em `/api/webhooks/kiwify`
- ✅ Espera receber chamadas do N8N (não da Kiwify diretamente)
- ✅ Não interfere na URL do webhook do N8N

## ✅ Checklist

- [ ] `docker-compose.yml` tem `WEBHOOK_URL=https://n8nagendacalendar.duckdns.org/`
- [ ] Container foi **recriado** (down + up, não apenas restart)
- [ ] Variável de ambiente foi aplicada (verificado com `env | grep WEBHOOK_URL`)
- [ ] URL de produção no N8N está correta
- [ ] Path do webhook node está correto
- [ ] Workflow está publicado
- [ ] Teste manual funcionou

