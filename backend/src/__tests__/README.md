# 🧪 Testes Unitários - Backend

Este diretório contém os testes unitários do backend do Agenda Calendar.

## 📋 Estrutura

```
__tests__/
├── setup.ts                    # Configuração global de mocks
├── services/
│   └── slotsService.test.ts     # Testes do serviço de slots
├── middleware/
│   └── validation.test.ts      # Testes de validação
└── README.md                    # Este arquivo
```

## 🚀 Como Executar

### Executar todos os testes
```bash
npm test
```

### Executar testes em modo watch (re-executa ao salvar arquivos)
```bash
npm run test:watch
```

### Executar testes com cobertura
```bash
npm run test:coverage
```

## 📊 Cobertura de Testes

### ✅ Implementado

- **slotsService.ts**
  - ✅ Criação de slots (sem conflitos)
  - ✅ Validação de conflitos diretos de horário
  - ✅ Validação de buffer time (intervalo mínimo)
  - ✅ Ordenação de slots por data e hora
  - ✅ Deleção de slots (com validações)

- **validation.ts** (express-validator)
  - ✅ Validação de registro
  - ✅ Validação de criação de slot
  - ✅ Validação de criação de booking
  - ✅ Validação de código de licença

### 🔄 Em Progresso

- **bookingsService.ts** - Testes pendentes
- **transactions.ts** - Testes pendentes
- **utils/** - Testes pendentes

## 🧩 Mocks

Os seguintes módulos são mockados automaticamente:

- **Firebase Admin** (`services/firebase.ts`)
- **Google Calendar Service** (`services/googleCalendarService.ts`)
- **Logger** (`utils/logger.ts`)

## 📝 Escrevendo Novos Testes

### Exemplo: Teste de Serviço

```typescript
import { minhaFuncao } from '../../services/meuService';
import { db } from '../../services/firebase';

jest.mock('../../services/firebase');

describe('meuService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve fazer algo corretamente', async () => {
    // Arrange
    const mockData = { ... };
    
    // Act
    const result = await minhaFuncao(mockData);
    
    // Assert
    expect(result).toBeDefined();
    expect(result).toHaveProperty('propriedade');
  });
});
```

### Exemplo: Teste de Middleware

```typescript
import { meuMiddleware } from '../../middleware/meuMiddleware';
import { Request, Response, NextFunction } from 'express';

describe('meuMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { body: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('deve processar requisição corretamente', () => {
    meuMiddleware(mockReq as Request, mockRes as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalled();
  });
});
```

## 🎯 Boas Práticas

1. **Use `beforeEach`** para limpar mocks entre testes
2. **Siga o padrão AAA**: Arrange, Act, Assert
3. **Teste casos de sucesso e erro**
4. **Use nomes descritivos** para os testes
5. **Mantenha testes isolados** (não dependam uns dos outros)
6. **Mock dependências externas** (Firebase, APIs, etc.)

## 🔍 Debugging

### Executar um teste específico
```bash
npm test -- slotsService.test.ts
```

### Executar um teste específico por nome
```bash
npm test -- -t "deve criar um slot quando não há conflitos"
```

### Ver logs detalhados
```bash
npm test -- --verbose
```

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Última atualização**: 19/12/2025

