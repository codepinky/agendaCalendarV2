# 🧪 Como Funcionam os Testes - Guia Completo

Este documento explica como funcionam os testes unitários no projeto Agenda Calendar.

---

## 📚 O QUE SÃO TESTES?

Testes são **código que verifica se outro código funciona corretamente**. Eles são como "verificadores automáticos" que garantem que suas funcionalidades fazem o que deveriam fazer.

### Analogia Simples:
Imagine que você tem uma calculadora. Os testes seriam como:
- ✅ Teste: `2 + 2 = 4` → **PASSA** ✅
- ✅ Teste: `10 / 2 = 5` → **PASSA** ✅
- ❌ Teste: `5 * 5 = 20` → **FALHA** ❌ (deveria ser 25)

---

## 🎯 OBJETIVO DOS TESTES

### ✅ **NÃO são feitos para "sempre passar"**

Os testes são feitos para:
1. **Detectar quando algo quebra** - Se você mudar o código e quebrar algo, o teste falha
2. **Garantir que funcionalidades funcionam** - Se o teste passa, a funcionalidade está OK
3. **Documentar como usar o código** - Testes servem como exemplos
4. **Prevenir regressões** - Evita que bugs antigos voltem

### Exemplo Real:

```typescript
// Código original (funciona)
function somar(a: number, b: number): number {
  return a + b;
}

// Teste
test('deve somar 2 + 2 = 4', () => {
  expect(somar(2, 2)).toBe(4); // ✅ PASSA
});

// Você muda o código (erro acidental)
function somar(a: number, b: number): number {
  return a - b; // ❌ Erro! Mudou + para -
}

// Teste roda novamente
test('deve somar 2 + 2 = 4', () => {
  expect(somar(2, 2)).toBe(4); // ❌ FALHA! Retornou 0 em vez de 4
});
```

**O teste FALHOU e te avisou que algo está errado!** 🚨

---

## 🔄 CICLO DE DESENVOLVIMENTO COM TESTES

### 1. **Escrever Código**
```typescript
// Criar função
function criarSlot(data: string, hora: string) {
  // ... código ...
}
```

### 2. **Escrever Teste**
```typescript
test('deve criar slot com data e hora válidos', () => {
  const slot = criarSlot('2025-12-20', '14:00');
  expect(slot.data).toBe('2025-12-20');
  expect(slot.hora).toBe('14:00');
});
```

### 3. **Rodar Teste**
```bash
npm test
```

### 4. **Resultado:**
- ✅ **PASSA** → Código está funcionando, pode continuar
- ❌ **FALHA** → Algo está errado, precisa corrigir

### 5. **Fazer Mudanças**
- Se mudar o código, roda os testes novamente
- Se algum teste falhar, você sabe que quebrou algo

---

## 📝 ESTRUTURA DE UM TESTE

### Padrão AAA (Arrange, Act, Assert)

```typescript
test('deve criar booking quando slot está disponível', () => {
  // 1. ARRANGE (Preparar)
  const mockSlot = {
    id: 'slot123',
    status: 'available',
    maxBookings: 1,
  };
  const mockBookingData = {
    clientName: 'João',
    clientEmail: 'joao@exemplo.com',
  };

  // 2. ACT (Agir/Executar)
  const result = criarBooking(mockSlot, mockBookingData);

  // 3. ASSERT (Verificar/Validar)
  expect(result.success).toBe(true);
  expect(result.booking.clientName).toBe('João');
});
```

---

## 🎭 MOCKS (Simulações)

### O que são Mocks?

Mocks são **simulações** de dependências externas. Em vez de usar o Firebase real (que seria lento e complicado), simulamos ele.

### Exemplo Real do Nosso Código:

```typescript
// ❌ SEM MOCK (não queremos fazer isso)
test('deve buscar slots do Firebase', async () => {
  // Isso conectaria no Firebase REAL - lento e complicado!
  const slots = await buscarSlotsDoFirebase(); // ❌
});

// ✅ COM MOCK (o que fazemos)
jest.mock('../../services/firebase'); // Simula Firebase

test('deve buscar slots', async () => {
  // Mock: simula resposta do Firebase
  mockFirebase.collection.mockReturnValue({
    get: jest.fn().mockResolvedValue({
      docs: [{ id: 'slot1', data: () => ({ date: '2025-12-20' }) }],
    }),
  });

  const slots = await buscarSlots(); // ✅ Usa o mock
  expect(slots).toHaveLength(1);
});
```

### Por que usar Mocks?

1. **Rapidez** - Não precisa conectar em serviços reais
2. **Isolamento** - Testa apenas sua função, não dependências
3. **Controle** - Você controla o que o mock retorna
4. **Reprodutibilidade** - Sempre retorna o mesmo resultado

---

## ✅ QUANDO TESTES PASSAM

### Teste PASSA quando:
- ✅ O código faz exatamente o que o teste espera
- ✅ Todas as verificações (`expect`) são verdadeiras
- ✅ Não há erros ou exceções

### Exemplo:

```typescript
test('deve retornar erro quando slot não existe', async () => {
  // Mock: simula slot não encontrado
  mockFirebase.get.mockResolvedValue({ exists: false });

  // Espera que lance erro
  await expect(buscarSlot('slot-inexistente'))
    .rejects
    .toThrow('Slot not found'); // ✅ PASSA se lançar esse erro
});
```

---

## ❌ QUANDO TESTES FALHAM

### Teste FALHA quando:
- ❌ O código não faz o que o teste espera
- ❌ Alguma verificação (`expect`) é falsa
- ❌ Há erros ou exceções inesperadas

### Exemplo:

```typescript
test('deve criar slot com data válida', () => {
  const slot = criarSlot('2025-12-20', '14:00');
  
  expect(slot.data).toBe('2025-12-20'); // ✅ Espera '2025-12-20'
  // Mas o código retorna '2025-12-21' → ❌ FALHA
});
```

### O que fazer quando um teste falha?

1. **Ler a mensagem de erro** - Diz o que esperava vs o que recebeu
2. **Verificar o código** - O que mudou?
3. **Corrigir** - Ajustar código ou teste (se o teste estiver errado)
4. **Rodar novamente** - Verificar se passou

---

## 🔍 EXEMPLOS REAIS DO NOSSO PROJETO

### Exemplo 1: Teste de Criação de Slot

```typescript
// Teste: slotsService.test.ts
test('deve criar um slot quando não há conflitos', async () => {
  // ARRANGE: Preparar dados
  const slotData = {
    date: '2025-12-20',
    startTime: '14:00',
    endTime: '15:00',
    status: 'available',
  };

  // Mock: simula que não há slots existentes
  mockFirebase.where.mockReturnValue({
    get: jest.fn().mockResolvedValue({ docs: [] }), // Nenhum slot
  });

  // ACT: Executar função
  const result = await createSlot('user123', slotData);

  // ASSERT: Verificar resultado
  expect(result).toHaveProperty('id');
  expect(result.date).toBe('2025-12-20');
  expect(result.startTime).toBe('14:00');
});
```

**O que acontece:**
- ✅ Se `createSlot` criar o slot corretamente → **PASSA**
- ❌ Se `createSlot` não criar ou retornar dados errados → **FALHA**

### Exemplo 2: Teste de Validação

```typescript
// Teste: transactions.test.ts
test('deve lançar erro quando slot está totalmente reservado', async () => {
  // ARRANGE: Preparar slot já reservado
  const mockSlot = {
    id: 'slot123',
    maxBookings: 1,
    status: 'available',
  };

  // Mock: simula que já tem 1 booking (slot cheio)
  mockTransaction.get
    .mockResolvedValueOnce({ exists: true, data: () => mockSlot }) // Slot
    .mockResolvedValueOnce({ size: 1 }) // 1 booking confirmado
    .mockResolvedValueOnce({ size: 0 }); // 0 bookings pendentes

  // ACT + ASSERT: Espera que lance erro
  await expect(
    processBookingTransaction('user123', 'slot123', bookingData)
  ).rejects.toThrow('Slot is fully booked'); // ✅ PASSA se lançar erro
});
```

**O que acontece:**
- ✅ Se a função lançar erro "Slot is fully booked" → **PASSA**
- ❌ Se a função criar o booking (não deveria) → **FALHA**

---

## 🚦 TIPOS DE TESTES

### 1. **Testes de Sucesso (Happy Path)**
Testam quando tudo funciona corretamente.

```typescript
test('deve criar booking quando dados são válidos', async () => {
  // Testa o caso ideal
});
```

### 2. **Testes de Erro (Error Cases)**
Testam quando algo dá errado.

```typescript
test('deve lançar erro quando slot não existe', async () => {
  // Testa tratamento de erro
});
```

### 3. **Testes de Validação**
Testam regras de negócio.

```typescript
test('deve filtrar slots totalmente reservados', async () => {
  // Testa lógica de filtragem
});
```

---

## 🔄 FLUXO COMPLETO

### Cenário: Você muda uma função

```typescript
// ANTES (funciona)
function calcularTotal(preco: number, quantidade: number) {
  return preco * quantidade;
}

// Teste
test('deve calcular total', () => {
  expect(calcularTotal(10, 2)).toBe(20); // ✅ PASSA
});

// DEPOIS (você muda)
function calcularTotal(preco: number, quantidade: number) {
  return preco + quantidade; // ❌ Erro! Mudou * para +
}

// Teste roda novamente
test('deve calcular total', () => {
  expect(calcularTotal(10, 2)).toBe(20); // ❌ FALHA! Retornou 12
});

// Mensagem de erro:
// Expected: 20
// Received: 12
```

**O teste te avisou que algo está errado!** 🚨

---

## 💡 BOAS PRÁTICAS

### ✅ FAZER:
- Testar casos de sucesso E erro
- Testar validações e regras de negócio
- Usar mocks para dependências externas
- Manter testes simples e focados
- Nomear testes de forma descritiva

### ❌ NÃO FAZER:
- Testar código de bibliotecas (ex: Firebase, Express)
- Fazer testes muito complexos
- Depender de ordem dos testes
- Usar dados reais de produção

---

## 📊 RESUMO

| Pergunta | Resposta |
|----------|----------|
| **Testes são feitos para sempre passar?** | ❌ Não. Eles passam quando o código está correto e falham quando há problemas. |
| **O que acontece quando um teste falha?** | 🚨 Significa que algo está errado no código ou no teste. Precisa investigar. |
| **Por que usar mocks?** | Para isolar o teste, torná-lo rápido e controlável. |
| **Quando rodar testes?** | Sempre que mudar código, antes de fazer commit, em CI/CD. |
| **Quantos testes são suficientes?** | O suficiente para cobrir funcionalidades críticas (nossa meta: 80%+). |

---

## 🎯 CONCLUSÃO

**Testes são seus "guardas" do código:**
- ✅ **PASSAM** quando tudo está OK
- ❌ **FALHAM** quando algo está errado
- 🚨 **Te avisam** antes que problemas cheguem em produção

**Eles NÃO são feitos para sempre passar** - eles são feitos para **detectar problemas** e **garantir qualidade**! 🛡️

---

**Última atualização**: 19/12/2025









