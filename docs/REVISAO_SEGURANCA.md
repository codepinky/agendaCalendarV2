# Revisão de Segurança - Agenda Calendar

Este documento lista os pontos de segurança que devem ser revisados e implementados no projeto.

## 🔒 Status Atual

### ✅ O que já está implementado

1. **Autenticação Firebase**
   - ✅ Tokens JWT validados via Firebase Admin SDK
   - ✅ Middleware de autenticação (`authenticate`)
   - ✅ Rotas protegidas com `authenticate`

2. **CORS Configurado**
   - ✅ Apenas origem permitida (`CORS_ORIGIN`)
   - ✅ Credentials habilitados

3. **Validação de Webhooks**
   - ✅ Secret compartilhado (`WEBHOOK_BRIDGE_SECRET`)
   - ✅ Comparação timing-safe (evita timing attacks)
   - ✅ Validação de payload

4. **Transações Firestore**
   - ✅ Race conditions evitadas (cadastro de license)
   - ✅ Atomicidade garantida

5. **Validação de Input**
   - ✅ Campos obrigatórios validados
   - ✅ Formato de email validado
   - ✅ Tamanho mínimo de senha

6. **HTTPS**
   - ✅ Certbot/Let's Encrypt configurado
   - ✅ Redirecionamento HTTP → HTTPS

## ⚠️ O que precisa ser implementado/melhorado

### 1. Rate Limiting (Prioridade ALTA)

**Problema:** Endpoints públicos podem ser abusados (DDoS, brute force).

**Solução:** Implementar rate limiting nos endpoints críticos.

**Endpoints que precisam:**
- `/api/auth/register` - Prevenir criação massiva de contas
- `/api/licenses/validate` - Prevenir brute force de códigos
- `/api/webhooks/kiwify` - Prevenir spam de webhooks
- `/api/auth/login` (se implementar) - Prevenir brute force

**Implementação sugerida:**

```bash
cd backend
npm install express-rate-limit
```

```typescript
// backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

// Rate limit para registro (5 tentativas por hora por IP)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 tentativas
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit para validação de license (20 tentativas por hora)
export const licenseValidationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many validation attempts, please try again later.',
});

// Rate limit para webhooks (100 por minuto)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  message: 'Too many webhook requests.',
});
```

**Aplicar nas rotas:**
```typescript
// backend/src/routes/auth.ts
import { registerLimiter } from '../middleware/rateLimit';

router.post('/register', registerLimiter, register);
```

### 2. Helmet.js (Prioridade ALTA)

**Problema:** Headers de segurança não configurados.

**Solução:** Adicionar Helmet para configurar headers HTTP de segurança.

```bash
npm install helmet
```

```typescript
// backend/src/index.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 3. Validação de Input Mais Robusta (Prioridade MÉDIA)

**Problema:** Validação básica pode não ser suficiente.

**Solução:** Usar biblioteca de validação (ex: `express-validator` ou `zod`).

**Exemplo com express-validator:**

```bash
npm install express-validator
```

```typescript
import { body, validationResult } from 'express-validator';

export const register = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('licenseCode').matches(/^LIC-[A-F0-9]{12}$/),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... resto do código
  }
];
```

### 4. Sanitização de Input (Prioridade MÉDIA)

**Problema:** Dados do usuário podem conter XSS ou SQL injection (mesmo usando NoSQL).

**Solução:** Sanitizar inputs antes de salvar.

```bash
npm install express-validator
```

```typescript
import { sanitize } from 'express-validator';

// Sanitizar campos de texto
body('name').trim().escape(),
body('email').normalizeEmail(),
```

### 5. Logging e Monitoramento (Prioridade MÉDIA)

**Problema:** Falta visibilidade de tentativas de ataque ou erros.

**Solução:** Implementar logging estruturado.

**Opções:**
- Winston (logging)
- Sentry (error tracking)
- CloudWatch (se usar AWS)

**Exemplo básico:**

```typescript
// backend/src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Logar tentativas suspeitas
if (req.ip && failedAttempts > 3) {
  logger.warn('Suspicious activity', {
    ip: req.ip,
    endpoint: req.path,
    attempts: failedAttempts,
  });
}
```

### 6. Proteção contra CSRF (Prioridade BAIXA)

**Problema:** Se usar cookies para autenticação, pode ser vulnerável a CSRF.

**Status:** Não é crítico porque usa JWT em headers, não cookies.

**Solução (se necessário):**
```bash
npm install csurf
```

### 7. Timeout de Requisições (Prioridade BAIXA)

**Problema:** Requisições podem travar o servidor.

**Solução:** Configurar timeout.

```typescript
// backend/src/index.ts
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 segundos
  res.setTimeout(30000);
  next();
});
```

### 8. Validação de Tamanho de Payload (Prioridade BAIXA)

**Problema:** Payloads muito grandes podem causar DoS.

**Solução:** Limitar tamanho do body.

```typescript
// backend/src/index.ts
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### 9. Rate Limiting por Usuário (Prioridade BÉDIA)

**Problema:** Rate limiting por IP pode ser contornado.

**Solução:** Rate limiting por usuário autenticado.

```typescript
import rateLimit from 'express-rate-limit';

const userLimiter = rateLimit({
  keyGenerator: (req) => {
    return req.user?.uid || req.ip;
  },
  windowMs: 60 * 1000,
  max: 30,
});
```

### 10. Validação de Assinatura Kiwify (Prioridade BAIXA)

**Problema:** Webhook da Kiwify pode ser falsificado.

**Status:** Kiwify envia `signature` no query string, mas não está sendo validada.

**Solução:** Validar assinatura HMAC (quando tiver a chave secreta da Kiwify).

```typescript
// No n8n ou no backend
import crypto from 'crypto';

const signature = req.query.signature;
const payload = JSON.stringify(req.body);
const secret = process.env.KIWIFY_WEBHOOK_SECRET;

const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

## 📋 Checklist de Implementação

### Prioridade ALTA (Fazer primeiro)
- [ ] Rate limiting em endpoints críticos
- [ ] Helmet.js para headers de segurança
- [ ] Logging de tentativas suspeitas

### Prioridade MÉDIA (Fazer depois)
- [ ] Validação de input mais robusta (express-validator)
- [ ] Sanitização de dados
- [ ] Rate limiting por usuário
- [ ] Monitoramento/alertas

### Prioridade BAIXA (Opcional)
- [ ] Proteção CSRF (se necessário)
- [ ] Timeout de requisições
- [ ] Validação de assinatura Kiwify
- [ ] Limite de tamanho de payload

## 🚀 Implementação Rápida (Mínimo Viável)

Para começar rápido, implemente apenas:

1. **Rate Limiting** nos endpoints públicos
2. **Helmet.js** para headers básicos
3. **Logging** de erros e tentativas suspeitas

Isso já cobre 80% das vulnerabilidades comuns.

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)



