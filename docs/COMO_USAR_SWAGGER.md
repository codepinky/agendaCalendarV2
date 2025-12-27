# 📚 Como Usar o Swagger - Guia Completo

Este guia explica como usar a documentação Swagger da API Agenda Calendar.

## 🌐 Acessando o Swagger

### Produção
```
https://agendacalendar.duckdns.org/api-docs
```

### Desenvolvimento Local
```
http://localhost:3000/api-docs
```

---

## 🎯 Funcionalidades Principais

### 1. **Navegação pelos Endpoints**

O Swagger organiza os endpoints por categorias (tags):
- **Auth** - Autenticação e registro
- **Slots** - Gerenciamento de horários
- **Bookings** - Agendamentos
- **Licenses** - Validação de licenças
- **Google Calendar** - Integração com Google Calendar
- **Webhooks** - Webhooks externos (Kiwify)

### 2. **Visualizar Documentação**

Cada endpoint mostra:
- **Método HTTP** (GET, POST, DELETE, etc.)
- **Caminho** da rota
- **Descrição** do que o endpoint faz
- **Parâmetros** necessários (query, path, body)
- **Exemplos** de requisição
- **Respostas** possíveis (200, 400, 401, etc.)
- **Schemas** de dados (estrutura JSON)

---

## 🧪 Testar Endpoints

### Passo a Passo:

1. **Encontre o endpoint** que deseja testar
2. **Clique no endpoint** para expandir
3. **Clique em "Try it out"** (botão no canto direito)
4. **Preencha os parâmetros**:
   - **Query parameters**: Parâmetros na URL
   - **Path parameters**: IDs na rota (ex: `:id`)
   - **Request body**: Dados JSON para POST/PUT
5. **Clique em "Execute"**
6. **Veja a resposta**:
   - **Status code**: 200, 400, 401, etc.
   - **Response body**: Dados retornados
   - **Response headers**: Cabeçalhos HTTP

### Exemplo: Testar Validação de License

1. Vá para **Licenses** → `POST /api/licenses/validate`
2. Clique em **"Try it out"**
3. No **Request body**, preencha:
   ```json
   {
     "code": "LIC-A1B2C3D4E5F6"
   }
   ```
4. Clique em **"Execute"**
5. Veja a resposta:
   - Se válido: `200 OK` com `valid: true`
   - Se inválido: `400` ou `404` com mensagem de erro

---

## 🔐 Autenticação (Bearer Token)

Para testar endpoints protegidos (que requerem login):

### 1. Obter Token Firebase

**Opção A: Via Frontend**
- Faça login no frontend
- Abra o DevTools (F12) → Console
- Execute: `localStorage.getItem('firebase:authUser:...')`
- Copie o `accessToken`

**Opção B: Via API de Registro**
- Use o endpoint `POST /api/auth/register`
- A resposta inclui um `token` (custom token Firebase)
- Use este token para autenticação

### 2. Autorizar no Swagger

1. Clique no botão **"Authorize"** (canto superior direito, ícone de cadeado 🔒)
2. No campo **"bearerAuth"**, cole o token:
   ```
   eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   (sem a palavra "Bearer", apenas o token)
3. Clique em **"Authorize"**
4. Clique em **"Close"**

### 3. Testar Endpoints Protegidos

Agora você pode testar endpoints que requerem autenticação:
- `GET /api/auth/me` - Obter dados do usuário
- `POST /api/slots` - Criar horário
- `GET /api/slots` - Listar horários
- `DELETE /api/slots/:id` - Deletar horário
- `GET /api/bookings/my-bookings` - Ver agendamentos

---

## 📋 Exemplos Práticos

### Exemplo 1: Validar License (Público)

```
POST /api/licenses/validate
```

**Request Body:**
```json
{
  "code": "LIC-A1B2C3D4E5F6"
}
```

**Resposta Sucesso (200):**
```json
{
  "valid": true,
  "email": "comprador@exemplo.com",
  "license": {
    "code": "LIC-A1B2C3D4E5F6",
    "email": "comprador@exemplo.com",
    "status": "active",
    "createdAt": "2025-12-18T10:00:00Z"
  }
}
```

---

### Exemplo 2: Criar Slot (Requer Autenticação)

**Primeiro:** Autorize com token (veja seção acima)

```
POST /api/slots
```

**Request Body:**
```json
{
  "date": "2025-12-20",
  "startTime": "14:30",
  "endTime": "15:30",
  "bufferMinutes": 30
}
```

**Resposta Sucesso (201):**
```json
{
  "id": "slot123",
  "date": "2025-12-20",
  "startTime": "14:30",
  "endTime": "15:30",
  "status": "available",
  "maxBookings": 1,
  "bufferMinutes": 30,
  "createdAt": "2025-12-18T10:00:00Z"
}
```

---

### Exemplo 3: Criar Agendamento (Público)

```
POST /api/bookings
```

**Request Body:**
```json
{
  "publicLink": "a1b2c3d4e5f6g7h8",
  "slotId": "slot123",
  "clientName": "Maria Santos",
  "clientEmail": "maria@exemplo.com",
  "clientPhone": "(11) 98765-4321",
  "notes": "Cliente prefere horário da manhã"
}
```

**Resposta Sucesso (201):**
```json
{
  "success": true,
  "booking": {
    "id": "booking123",
    "slotId": "slot123",
    "clientName": "Maria Santos",
    "clientEmail": "maria@exemplo.com",
    "clientPhone": "(11) 98765-4321",
    "status": "confirmed",
    "orderNumber": 1703001234567,
    "confirmedAt": "2025-12-18T10:00:00Z"
  },
  "message": "Booking confirmed successfully"
}
```

---

## 🔍 Entender os Schemas

O Swagger mostra a estrutura de dados em **"Schemas"** (rolagem para baixo):

### Schemas Disponíveis:
- **User** - Dados do usuário
- **AvailableSlot** - Horário disponível
- **Booking** - Agendamento
- **License** - Licença
- **Error** - Resposta de erro

Cada schema mostra:
- **Propriedades** e seus tipos
- **Campos obrigatórios** (marcados com `*`)
- **Exemplos** de valores
- **Descrições** de cada campo

---

## ⚠️ Códigos de Status HTTP

O Swagger mostra os possíveis códigos de resposta:

- **200 OK** - Sucesso
- **201 Created** - Recurso criado com sucesso
- **400 Bad Request** - Erro de validação ou dados inválidos
- **401 Unauthorized** - Não autenticado (token inválido ou ausente)
- **404 Not Found** - Recurso não encontrado
- **409 Conflict** - Conflito (ex: horário já reservado)
- **429 Too Many Requests** - Rate limit excedido
- **500 Internal Server Error** - Erro interno do servidor

---

## 💡 Dicas

1. **Use "Try it out"** para testar endpoints sem precisar de ferramentas externas (Postman, curl, etc.)

2. **Copie requisições cURL**: Cada endpoint tem um botão para copiar o comando cURL equivalente

3. **Veja exemplos**: Todos os schemas têm exemplos de valores válidos

4. **Validações**: O Swagger mostra todas as validações (formato de email, tamanho mínimo/máximo, etc.)

5. **Rate Limiting**: Alguns endpoints têm rate limiting (veja nas descrições)

---

## 🐛 Troubleshooting

### "401 Unauthorized"
- Verifique se autorizou com o token (botão "Authorize")
- Confirme que o token não expirou
- Certifique-se de colar apenas o token (sem "Bearer")

### "400 Bad Request"
- Verifique o formato dos dados (JSON válido)
- Confirme que todos os campos obrigatórios estão preenchidos
- Veja a mensagem de erro na resposta para mais detalhes

### "404 Not Found"
- Verifique se o endpoint existe
- Confirme que o ID/parâmetro está correto
- Veja se o recurso realmente existe no banco

### Swagger não carrega
- Verifique se o servidor está rodando
- Confirme a URL (com ou sem barra final: `/api-docs` ou `/api-docs/`)
- Limpe o cache do navegador

---

## 📖 Recursos Adicionais

- **Documentação OpenAPI**: O Swagger gera documentação no formato OpenAPI 3.0
- **Exportar Spec**: Você pode exportar a especificação completa em JSON/YAML
- **Integração com Postman**: Importe a spec do Swagger no Postman

---

## ✅ Checklist de Uso

- [ ] Acessei o Swagger em `/api-docs`
- [ ] Naveguei pelas categorias de endpoints
- [ ] Li a documentação de um endpoint
- [ ] Testei um endpoint público (sem autenticação)
- [ ] Obteve um token Firebase
- [ ] Autorizei no Swagger com o token
- [ ] Testei um endpoint protegido (com autenticação)
- [ ] Entendi os códigos de status HTTP
- [ ] Vi os schemas de dados

---

**Pronto para usar!** 🚀

Se tiver dúvidas, consulte a documentação de cada endpoint no Swagger ou veja os exemplos acima.









