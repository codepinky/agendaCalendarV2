# Guia Completo: Fluxo Kiwify → n8n → Backend → Firebase

Este guia te ajuda a configurar o fluxo completo de webhook da Kiwify, passando pelo n8n para processamento/organização e salvando na coleção `licenses` do Firebase.

## 🎯 Resumo Executivo

**Objetivo:** Quando um cliente compra na Kiwify e o pagamento é aprovado, automaticamente:
1. A Kiwify envia um webhook para o n8n
2. O n8n processa e valida os dados
3. O n8n chama o backend com autenticação segura
4. O backend cria um código de license único e salva no Firebase
5. A license fica disponível para o cliente usar no sistema

**Tempo estimado:** 30-45 minutos

**Pré-requisitos:**
- ✅ VM provisionada com backend e n8n rodando
- ✅ Domínios configurados (DuckDNS ou próprio)
- ✅ HTTPS funcionando (Certbot)
- ✅ Acesso ao n8n (https://n8nagendacalendar.duckdns.org)
- ✅ Acesso ao backend (https://agendacalendar.duckdns.org)
- ✅ Conta na Kiwify com permissão para configurar webhooks

**⚠️ IMPORTANTE - Estrutura do Payload:**
A Kiwify envia os dados dentro de um objeto `body`. No n8n, você deve usar `$json.body.campo` para acessar os dados, e enviar `$json.body` para o backend (não `$json` diretamente). Veja a seção 3.3 para mais detalhes.

## 📋 Visão Geral do Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO                                │
└─────────────────────────────────────────────────────────────────┘

1. Cliente compra na Kiwify
   └─> Pagamento aprovado ✅

2. Kiwify envia Webhook
   POST https://n8nagendacalendar.duckdns.org/webhook/kiwify
   └─> Payload JSON com dados da compra

3. n8n recebe no Webhook Node
   └─> Valida evento (order_approved/paid)

4. n8n processa (opcional)
   └─> Organiza/limpa dados (Set Node)

5. n8n chama Backend
   POST https://agendacalendar.duckdns.org/api/webhooks/kiwify
   Headers: x-webhook-secret: [SECRET]
   Body: Payload completo da Kiwify

6. Backend valida
   └─> Verifica x-webhook-secret ✅
   └─> Valida order_id e email ✅
   └─> Verifica se já existe (idempotência) ✅

7. Backend cria License
   └─> Gera código único (LIC-XXXXXXXX)
   └─> Salva em Firebase:
       • Coleção: licenses (doc ID = licenseCode)
       • Coleção: kiwify_orders (doc ID = orderId)
       • Coleção: kiwify_events (se não for approved)

8. Backend responde ao n8n
   { issued: true, licenseCode: "LIC-XXXXXXXX" }

9. n8n responde à Kiwify
   { success: true, licenseCode: "LIC-XXXXXXXX" }

10. ✅ License disponível no Firebase para uso
```

### 📊 Estrutura de Dados no Firebase

**Coleção `licenses`:**
```json
{
  "LIC-XXXXXXXX": {
    "code": "LIC-XXXXXXXX",
    "email": "cliente@exemplo.com",
    "status": "active",
    "createdAt": "2025-12-17T10:00:00Z",
    "purchaseData": {
      "provider": "kiwify",
      "order_id": "order-123",
      "order_status": "paid",
      "product": { ... },
      "customer": { ... },
      "raw": { ... }
    }
  }
}
```

**Coleção `kiwify_orders` (índice para evitar duplicatas):**
```json
{
  "order-123": {
    "orderId": "order-123",
    "licenseCode": "LIC-XXXXXXXX",
    "email": "cliente@exemplo.com",
    "eventType": "order_approved",
    "orderStatus": "paid",
    "createdAt": "2025-12-17T10:00:00Z"
  }
}
```

## 🔐 Passo 1: Configurar Segurança no Backend

### 1.1 Gerar Secret Forte

Na sua máquina local, gere um token seguro:

```bash
openssl rand -hex 32
```

Ou use um gerador online: https://randomkeygen.com/

**Exemplo de output:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

**⚠️ IMPORTANTE:** Guarde esse secret! Você vai usar ele em 2 lugares:
1. No backend (variável de ambiente)
2. No n8n (header do HTTP Request)

### 1.2 Opção A: Configurar via Ansible (Recomendado para novas instalações)

Se você ainda não provisionou a VM, edite o arquivo do Ansible:

```bash
vim infrastructure/ansible/group_vars/all.yml
```

Adicione/atualize a linha:

```yaml
webhook_bridge_secret: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
```

Depois rode o Ansible novamente (ele vai atualizar o `.env` do backend).

### 1.3 Opção B: Configurar Manualmente na VM (Para VMs já provisionadas)

Na VM, edite o `.env` do backend:

```bash
sudo vim /opt/agenda-calendar/backend/.env
```

Adicione a linha:

```env
WEBHOOK_BRIDGE_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**⚠️ IMPORTANTE:** Use o token que você gerou, não esse exemplo!

### 1.4 Reiniciar Backend

```bash
sudo systemctl restart agenda-calendar-backend
sudo systemctl status agenda-calendar-backend --no-pager -l
```

Valide que subiu sem erro:

```bash
curl -i https://agendacalendar.duckdns.org/health | head -n 10
```

## ⚡ Quick Start (Resumo Rápido)

Se você já sabe o que fazer, aqui está o resumo:

1. **Gerar secret:** `openssl rand -hex 32`
2. **Adicionar no backend:** `.env` → `WEBHOOK_BRIDGE_SECRET=...`
3. **Reiniciar backend:** `sudo systemctl restart agenda-calendar-backend`
4. **Criar workflow no n8n:**
   - Webhook Node (POST, path: `kiwify`)
   - HTTP Request Node (POST para backend, header `x-webhook-secret`)
   - Respond to Webhook Node
5. **Configurar na Kiwify:** URL do webhook do n8n
6. **Testar:** Fazer compra de teste

---

## 🎯 Passo 2: Criar Workflow no n8n

### 2.1 Acessar n8n

1. Abra: `https://n8nagendacalendar.duckdns.org/`
2. Faça login (se necessário)
3. Clique em **"Workflows"** → **"Add workflow"** (ou botão **"+"**)

### 2.2 Node 1: Webhook (Trigger)

1. Arraste um node **"Webhook"** para o canvas
2. Configure:
   - **Name:** `Kiwify Webhook`
   - **HTTP Method:** `POST`
   - **Path:** `kiwify` 
     
     **💡 Dica de Segurança (Opcional):** Se quiser tornar a URL mais difícil de adivinhar, use algo como:
     - `kiwify-a1b2c3d4e5f6` (adicione uma string aleatória)
     - Gere com: `openssl rand -hex 8` (gera 16 caracteres)
     - **Exemplo:** `kiwify-9f3a7b2c1d4e8f5`
     
     ⚠️ **IMPORTANTE:** Este token no path é DIFERENTE do `WEBHOOK_BRIDGE_SECRET`:
     - **Path token:** Apenas para dificultar descobrir a URL do webhook
     - **WEBHOOK_BRIDGE_SECRET:** Usado no header para autenticar n8n → backend
   
   - **Response Mode:** `Last Node` (ou `When Last Node Finishes`)
   - **Response Code:** `200`
   - **Response Headers:** (deixe vazio ou adicione `Content-Type: application/json`)

3. **Salve o workflow** (Ctrl+S ou botão Save)
4. **Ative o workflow** (toggle "Active" no topo)

5. **Copie a URL do webhook** que aparece no node (exemplo):
   ```
   https://n8nagendacalendar.duckdns.org/webhook/kiwify
   ```
   
   Se você usou um path customizado, será algo como:
   ```
   https://n8nagendacalendar.duckdns.org/webhook/kiwify-9f3a7b2c1d4e8f5
   ```

### 2.3 Node 2: IF (Validação - Opcional mas Recomendado)

1. Arraste um node **"IF"** após o Webhook
2. Configure para validar que o evento é de pagamento aprovado:

   **⚠️ IMPORTANTE:** A Kiwify envia os dados dentro de `body`, então use `$json.body.campo`:
   
   **Condition 1:**
   - **Value 1:** `{{ $json.body.webhook_event_type }}`
   - **Operation:** `Equal`
   - **Value 2:** `order_approved`

   **OR**

   **Condition 2:**
   - **Value 1:** `{{ $json.body.order_status }}`
   - **Operation:** `Equal`
   - **Value 2:** `paid`

   **Ou combine ambas** (AND) para maior segurança.

3. **True Output:** Vai para o próximo node (Set ou HTTP Request)
4. **False Output:** (opcional) Adicione um node de **"Respond to Webhook"** com mensagem de erro

**💡 Nota:** Se você quiser ver a estrutura completa do payload no n8n, adicione um node "Code" temporário após o Webhook para debugar:
```javascript
console.log('Full payload:', JSON.stringify($input.all(), null, 2));
return $input.all();
```

**💡 Nota 2:** Se você usar o node Set para organizar (Passo 2.4), depois do Set você pode usar `$json.Order.order_status` e `$json.Order.webhook_event_type` nos próximos nodes.

### 2.4 Node 3: Set (Organizar Dados) - OPCIONAL

**🤔 Vale a pena organizar?**

**Resposta curta:** **Provavelmente NÃO** para o seu caso.

**Quando organizar FAZ SENTIDO:**
- ✅ Você vai **reutilizar esses dados** em outros workflows do n8n
- ✅ Você precisa fazer **validações complexas** ou transformações antes do backend
- ✅ Você quer **documentar visualmente** o que cada campo significa
- ✅ Você vai **enviar para múltiplos destinos** (backend + email + Slack, etc.)

**Quando organizar NÃO FAZ SENTIDO:**
- ❌ Você só vai **enviar direto para o backend** (seu caso)
- ❌ O backend já espera a **estrutura original** da Kiwify
- ❌ Você teria que **reconstruir de qualquer forma**
- ❌ Adiciona **complexidade desnecessária**

**🎯 Nossa Recomendação:** **PULE este node** e vá direto para o Passo 2.5 (HTTP Request). É mais simples, mais rápido e menos propenso a erros.

---

**Se você INSISTIR em organizar** (por exemplo, para validações ou documentação), aqui está como fazer:

1. Arraste um node **"Set"** após o IF
2. Configure os campos organizados:
   - `Order.order_id`: `{{ $json.body.order_id }}`
   - `Order.order_status`: `{{ $json.body.order_status }}`
   - `Customer.email`: `{{ $json.body.Customer.email }}`
   - `Product.product_name`: `{{ $json.body.Product.product_name }}`
   - `Raw.original_body`: `{{ $json.body }}` (backup completo)

3. **Depois, adicione um node "Code"** antes do HTTP Request para reconstruir:
   ```javascript
   const data = $input.first().json;
   return [{ json: data.Raw.original_body }];
   ```

4. **No HTTP Request**, use: `{{ $json }}`

**Mas de novo:** Isso é desnecessário se você só vai enviar ao backend. Use `{{ $json.body }}` direto e pronto!

### 2.5 Node 3: HTTP Request (Chamar Backend)

**✅ Abordagem Simples (Recomendada):**

1. Arraste um node **"HTTP Request"** após o IF
2. Configure:

   **Method:** `POST`
   **URL:** `https://agendacalendar.duckdns.org/api/webhooks/kiwify`
   
   *(Substitua pelo seu domínio do backend se diferente)*

   **Authentication:** `None` (vamos usar header manual)

   **Headers:**
   - Clique em **"Add Header"** ou **"+"**
   - **Name:** `Content-Type`
   - **Value:** `application/json`
   - Clique em **"Add Header"** novamente
   - **Name:** `x-webhook-secret`
   - **Value:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`
     *(Use o mesmo secret que você colocou no backend!)*

   **Body Content Type:** `JSON`
   **Specify Body:** `Using JSON`
   
   **JSON Body (Simples e Direto):**
   ```json
   {{ $json.body }}
   ```
   
   **✅ Pronto!** Isso envia o payload completo da Kiwify exatamente como o backend espera.
   
   **⚠️ IMPORTANTE:** 
   - Use `$json.body` porque a Kiwify envia os dados dentro de `body`
   - O backend já espera a estrutura original da Kiwify
   - Não precisa reconstruir nada!

   **Options (clique em "Show Options"):**
   - **Timeout:** `30000` (30 segundos)
   - **Response:** `JSON`
   - **Ignore SSL Issues:** `false` (deixe desmarcado)


### 2.6 Node 4: IF (Validar Resposta do Backend)

1. Arraste um node **"IF"** após o HTTP Request
2. Configure:

   **Condition:**
   - **Value 1:** `{{ $json["issued"] }}`
   - **Operation:** `Equal`
   - **Value 2:** `true`

3. **True Output:** License criada com sucesso
4. **False Output:** Erro (pode adicionar log/notificação)

### 2.7 Node 5: Respond to Webhook (Sucesso)

1. Arraste um node **"Respond to Webhook"** no output **True** do IF anterior
2. Configure:

   **Response Code:** `200`
   **Response Body:**
   ```json
   {
     "success": true,
     "licenseCode": "{{ $('HTTP Request').item.json.licenseCode }}",
     "message": "License created successfully"
   }
   ```

### 2.8 Node 6: (Opcional) Notificação/Log

Se quiser ser notificado quando uma license for criada:

1. Adicione um node **"Slack"** ou **"Email"** após o sucesso
2. Configure com sua mensagem personalizada

### 2.9 Conectar Todos os Nodes

A ordem final deve ser:

**✅ Abordagem Simples (Recomendada):**
```
Webhook → IF (validação) → HTTP Request → IF (resposta) → Respond to Webhook
                                                                    ↓
                                                              (False) → Log/Notificação
```

**⚠️ Abordagem com Organização (Só se realmente precisar):**
```
Webhook → IF (validação) → Set (organizar) → Code (reconstruir) → HTTP Request → IF (resposta) → Respond to Webhook
                                                                                                        ↓
                                                                                              (False) → Log/Notificação
```

**💡 Recomendação:** Use a abordagem simples. Só organize se você vai reutilizar os dados em outros workflows ou fazer transformações complexas. Para apenas enviar ao backend, a organização é desnecessária.

### 2.10 Salvar e Ativar

1. **Salve o workflow** (Ctrl+S)
2. **Ative o workflow** (toggle "Active")
3. **Teste manualmente** (veja Passo 3)

## 🧪 Passo 3: Testar o Fluxo

### 3.1 Teste 1: Direto no Backend (pular n8n)

Para validar que o backend está funcionando:

```bash
curl -X POST https://agendacalendar.duckdns.org/api/webhooks/kiwify \
  -H 'Content-Type: application/json' \
  -H 'x-webhook-secret: SEU_SECRET_AQUI' \
  -d '{
    "order_id": "test-order-123",
    "order_ref": "REF-123",
    "order_status": "paid",
    "webhook_event_type": "order_approved",
    "created_at": "2025-12-17T10:00:00Z",
    "approved_date": "2025-12-17T10:00:00Z",
    "Customer": {
      "email": "cliente.teste@exemplo.com",
      "full_name": "Cliente Teste",
      "mobile": "+5511999999999"
    },
    "Product": {
      "product_id": "prod-123",
      "product_name": "Produto Teste"
    },
    "store_id": "store-123",
    "product_type": "digital",
    "payment_method": "credit_card"
  }'
```

**Resposta esperada:**
```json
{
  "received": true,
  "issued": true,
  "licenseCode": "LIC-XXXXXXXX",
  "alreadyExisted": false
}
```

### 3.2 Teste 2: Via n8n (fluxo completo)

Com o workflow ativo, teste chamando o webhook do n8n. **Nota:** O n8n vai receber isso dentro de `body`, então você pode enviar direto:

```bash
curl -X POST https://n8nagendacalendar.duckdns.org/webhook/kiwify \
  -H 'Content-Type: application/json' \
  -d '{
    "order_id": "test-order-456",
    "order_status": "paid",
    "webhook_event_type": "order_approved",
    "Customer": {
      "email": "teste2@exemplo.com",
      "full_name": "Teste 2"
    },
    "Product": {
      "product_name": "Produto Teste 2"
    }
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "licenseCode": "LIC-XXXXXXXX",
  "message": "License created successfully"
}
```

**💡 Dica:** Para simular exatamente como a Kiwify envia (com query string de signature), você pode fazer:
```bash
curl -X POST "https://n8nagendacalendar.duckdns.org/webhook/kiwify?signature=test-signature" \
  -H 'Content-Type: application/json' \
  -d '{ ... }'
```

### 3.3 Estrutura Real do Payload da Kiwify

A Kiwify envia o webhook com esta estrutura:

```json
{
  "headers": { ... },
  "params": {},
  "query": {
    "signature": "31f7dc02540f0ed87dfe1ab6405b29a52aa2b7c1"
  },
  "body": {
    "order_id": "d75cb434-e4a8-4a45-86f5-32f144bb8f90",
    "order_status": "paid",
    "webhook_event_type": "order_approved",
    "Customer": {
      "email": "johndoe@example.com",
      "full_name": "John Doe",
      ...
    },
    "Product": {
      "product_name": "Example product",
      ...
    },
    ...
  }
}
```

**Pontos importantes:**
- ✅ Os dados reais estão em `body`
- ✅ A `signature` vem em `query.signature` (pode ser usada para validação futura)
- ✅ No n8n, use `$json.body.campo` para acessar os dados
- ✅ Para enviar ao backend, use `$json.body` no JSON Body do HTTP Request

### 3.4 Capturar Payload Real da Kiwify (Opcional mas Recomendado)

Antes de configurar na Kiwify, você pode capturar um payload real para testar:

1. **No n8n, adicione um node "Code" temporário** após o Webhook:
   - **Mode:** `Run Once for All Items`
   - **Code:**
   ```javascript
   // Log completo do payload
   console.log('Kiwify Full Payload:', JSON.stringify($input.all(), null, 2));
   console.log('Kiwify Body:', JSON.stringify($input.all()[0].json.body, null, 2));
   console.log('Kiwify Signature:', $input.all()[0].json.query.signature);
   
   // Retorna o payload para o próximo node
   return $input.all();
   ```

2. **Ative o workflow** e faça uma compra de teste na Kiwify
3. **Veja os logs** no n8n (Executions → Seu workflow → Abrir execution)
4. **Copie o payload completo** e use nos testes manuais

### 3.4 Validar no Firebase

1. Acesse Firebase Console → Firestore
2. Vá na coleção **`licenses`**
3. Procure pelo código retornado (ex.: `LIC-XXXXXXXX`)
4. Confirme que tem:
   - `code`, `email`, `status: 'active'`, `createdAt`
   - `purchaseData` completo com todos os dados da Kiwify
5. Verifique também a coleção **`kiwify_orders`** para confirmar o índice

## 🔗 Passo 4: Configurar na Kiwify

### 4.1 Acessar Configurações de Webhook

1. Acesse: https://app.kiwify.com.br/
2. Vá em **Configurações** → **Webhooks** (ou **Integrações**)
3. Clique em **"Adicionar Webhook"** ou **"Criar Webhook"**

### 4.2 Configurar Webhook

**URL do Webhook:**
```
https://n8nagendacalendar.duckdns.org/webhook/kiwify
```

**Eventos para escutar:**
- ✅ `order.approved` (pagamento aprovado)
- ✅ `order.paid` (pagamento confirmado)
- (Opcional) `order.refunded` (se quiser tratar reembolsos)

**Método:** `POST`

**Headers (se a Kiwify permitir):**
- `Content-Type: application/json`

### 4.3 Testar na Kiwify

1. Salve o webhook
2. Faça uma **compra de teste** na sua loja Kiwify
3. Verifique nos **logs do n8n** se o webhook foi recebido
4. Confirme no **Firebase** que a license foi criada

## 📊 Passo 5: Monitoramento e Logs

### 5.1 Logs do n8n

Para ver o que está chegando no n8n:

```bash
cd /opt/agenda-calendar/n8n
docker-compose logs -f n8n
```

Ou no próprio n8n: **Workflows** → Seu workflow → **Executions** (veja histórico)

### 5.2 Logs do Backend

Para ver se o backend está recebendo:

```bash
sudo journalctl -u agenda-calendar-backend -f
```

### 5.3 Validações no Firebase

**Coleção `licenses`:**
- Cada documento tem o `code` como ID
- Campos: `code`, `email`, `status`, `createdAt`, `purchaseData`

**Coleção `kiwify_orders`:**
- Índice por `order_id` (evita duplicatas)
- Campos: `orderId`, `licenseCode`, `email`, `eventType`, `orderStatus`

**Coleção `kiwify_events`:**
- Eventos que não geraram license (ex.: `order_pending`)
- Para auditoria/debug

## 🔒 Passo 6: Segurança Adicional (Recomendado)

### 6.1 Usar Path Mais Seguro no n8n

Em vez de `/webhook/kiwify`, use algo difícil de adivinhar:

```
/webhook/kiwify-a1b2c3d4e5f6g7h8
```

Atualize na Kiwify também.

### 6.2 Validar Assinatura da Kiwify (Futuro)

A Kiwify envia uma `signature` no query string (ex.: `?signature=31f7dc02540f0ed87dfe1ab6405b29a52aa2b7c1`).

**Status atual:** O backend já recebe e armazena a signature, mas não valida ainda.

**Para implementar validação futura:**

1. **Consulte a documentação da Kiwify** sobre como validar a signature (geralmente é um HMAC-SHA256 do payload com uma chave secreta)

2. **No n8n, adicione validação antes de chamar o backend:**
   - Adicione um node **"Code"** após o Webhook
   - Valide a signature usando a chave secreta da Kiwify
   - Só continue se a signature for válida

3. **Ou valide no backend:**
   - O backend já recebe `req.query.signature`
   - Adicione lógica de validação HMAC no `webhooksController.ts`

**Exemplo de validação (quando tiver a chave secreta da Kiwify):**
```javascript
// No n8n (node Code)
const crypto = require('crypto');
const signature = $json.query.signature;
const payload = JSON.stringify($json.body);
const secret = 'SUA_CHAVE_SECRETA_KIWIFY'; // Obter na documentação da Kiwify

const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}

return $input.all();
```

### 6.3 Rate Limiting (Opcional)

No n8n, você pode adicionar um node **"Wait"** ou configurar rate limiting no backend para evitar spam.

## ✅ Checklist Final

- [ ] Secret configurado no backend (`.env`)
- [ ] Backend reiniciado e funcionando
- [ ] Workflow criado no n8n com todos os nodes
- [ ] Workflow ativado no n8n
- [ ] Teste direto no backend passou
- [ ] Teste via n8n passou
- [ ] License criada no Firebase
- [ ] Webhook configurado na Kiwify
- [ ] Compra de teste na Kiwify funcionou
- [ ] Logs sendo monitorados

## 🆘 Troubleshooting

### Erro: "Missing x-webhook-secret header"

**Causa:** O n8n não está enviando o header `x-webhook-secret`.

**Solução:** 
1. No node HTTP Request do n8n, verifique se o header está configurado
2. Nome do header: `x-webhook-secret` (exatamente assim, minúsculas)
3. Valor: O mesmo secret que está no backend `.env`

### Erro: "Invalid x-webhook-secret"

**Causa:** O secret no n8n não bate com o do backend.

**Solução:** 
1. Confirme que ambos usam o mesmo valor (sem espaços extras)
2. No backend: `cat /opt/agenda-calendar/backend/.env | grep WEBHOOK_BRIDGE_SECRET`
3. No n8n: Verifique o valor no header do HTTP Request node
4. Se necessário, gere um novo secret e atualize ambos

### Erro: "order_id is required" ou "Customer.email is required"

**Causa:** O payload da Kiwify não tem os campos esperados.

**Solução:**
1. Veja o payload completo no n8n (Execution logs)
2. Verifique se a estrutura está correta:
   ```json
   {
     "order_id": "...",
     "Customer": {
       "email": "..."
     }
   }
   ```
3. Se os campos tiverem nomes diferentes, ajuste o código do backend ou use um node "Set" no n8n para mapear

### License não está sendo criada

**Causa:** O evento não é `order_approved` ou `order_status` não é `paid`.

**Solução:** 
1. Veja o payload completo no n8n (Execution logs)
2. Verifique os campos:
   - `webhook_event_type` deve ser `order_approved`
   - OU `order_status` deve ser `paid` ou `approved`
3. Ajuste a validação no node IF do n8n
4. Ou remova a validação temporariamente para debug
5. Verifique os logs do backend: `sudo journalctl -u agenda-calendar-backend -f`

### Webhook da Kiwify não chega no n8n

**Causa:** URL errada, workflow inativo, ou firewall bloqueando.

**Solução:**
1. Confirme que o workflow está **Active** (toggle no topo)
2. Confirme a URL do webhook (aparece no node Webhook)
3. Teste manualmente o webhook do n8n:
   ```bash
   curl -X POST https://n8nagendacalendar.duckdns.org/webhook/kiwify \
     -H 'Content-Type: application/json' \
     -d '{"test": true}'
   ```
4. Veja logs do n8n: 
   ```bash
   cd /opt/agenda-calendar/n8n
   docker-compose logs -f n8n
   ```
5. Verifique se o Nginx está permitindo o path `/webhook/*`

### Backend retorna 500 Internal Server Error

**Causa:** Erro no código do backend ou Firebase não configurado.

**Solução:**
1. Veja logs detalhados:
   ```bash
   sudo journalctl -u agenda-calendar-backend -f --no-pager
   ```
2. Verifique se o Firebase está configurado corretamente:
   ```bash
   cat /opt/agenda-calendar/backend/.env | grep FIREBASE
   ```
3. Teste a conexão com Firebase:
   ```bash
   curl -i https://agendacalendar.duckdns.org/health
   ```

### License já existe (idempotência funcionando)

**Causa:** A Kiwify enviou o webhook duas vezes (normal em alguns casos).

**Solução:** Isso é esperado! O backend retorna a license existente:
```json
{
  "received": true,
  "issued": true,
  "licenseCode": "LIC-XXXXXXXX",
  "alreadyExisted": true
}
```
Isso evita criar licenses duplicadas para a mesma compra.

## 📝 Próximos Passos

Depois que estiver funcionando:

1. **Adicionar tratamento de reembolsos** (se necessário)
   - Criar workflow separado para `order_refunded`
   - Atualizar status da license para `revoked` no Firebase

2. **Criar notificações** (email/Slack quando license for criada)
   - Adicionar node "Email" ou "Slack" no n8n após sucesso
   - Enviar código da license para o cliente

3. **Dashboard de monitoramento** (quantas licenses criadas hoje/semana)
   - Criar query no Firebase para contar licenses por período
   - Ou usar n8n para enviar relatórios periódicos

4. **Validação de assinatura** da Kiwify (se disponível)
   - Se a Kiwify enviar um hash/assinatura, validar no n8n antes de chamar backend

5. **Backup e recuperação**
   - Exportar workflows do n8n regularmente
   - Ter backup do Firebase

## 🚀 Melhores Práticas de Produção

### Segurança

- ✅ **Nunca exponha o secret** em logs ou código versionado
- ✅ **Use HTTPS** sempre (já configurado via Certbot)
- ✅ **Rotacione o secret** periodicamente (a cada 3-6 meses)
- ✅ **Monitore tentativas de acesso** não autorizadas nos logs

### Monitoramento

- ✅ **Configure alertas** no n8n para falhas de webhook
- ✅ **Monitore logs do backend** regularmente
- ✅ **Verifique o Firebase** periodicamente para licenses órfãs
- ✅ **Tenha um dashboard** de métricas (licenses criadas, erros, etc)

### Performance

- ✅ **Configure timeouts** adequados (30s é suficiente)
- ✅ **Use idempotência** (já implementado no backend)
- ✅ **Evite processamento pesado** no n8n (deixe o backend fazer)
- ✅ **Cache** informações que não mudam frequentemente

### Manutenção

- ✅ **Teste após atualizações** do backend ou n8n
- ✅ **Documente mudanças** no workflow do n8n
- ✅ **Tenha um ambiente de staging** para testar antes de produção
- ✅ **Versionamento** dos workflows do n8n (exporte JSON regularmente)

## 📚 Referências

- **n8n Docs:** https://docs.n8n.io/
- **Kiwify API Docs:** https://developers.kiwify.com.br/
- **Firebase Firestore:** https://firebase.google.com/docs/firestore
- **Express.js:** https://expressjs.com/

## 💡 Dicas Finais

1. **Sempre teste** com compras reais pequenas antes de ir para produção
2. **Monitore os primeiros dias** após deploy para garantir estabilidade
3. **Tenha um plano B** (processo manual) caso o webhook falhe
4. **Comunique-se com a equipe** sobre mudanças no fluxo
5. **Documente tudo** para facilitar manutenção futura

