# 📚 Explicação: Máximo de Agendamentos (maxBookings)

## O que é "Máximo de agendamentos"?

O campo **"Máximo de agendamentos"** (`maxBookings`) define **quantas pessoas podem agendar o mesmo horário simultaneamente**.

## 📖 Exemplos Práticos

### Exemplo 1: Consulta Individual (maxBookings = 1)
```
Slot: 10:00 - 11:00, maxBookings = 1
```
- ✅ **1 pessoa pode agendar** → Sucesso
- ❌ **2ª pessoa tenta agendar** → Erro "Slot is fully booked"

**Uso:** Consultas médicas, sessões de coaching, reuniões individuais

---

### Exemplo 2: Aula em Grupo (maxBookings = 10)
```
Slot: 14:00 - 15:30, maxBookings = 10
```
- ✅ **1ª pessoa agenda** → Sucesso
- ✅ **2ª pessoa agenda** → Sucesso
- ✅ **... até 10 pessoas** → Todas têm sucesso
- ❌ **11ª pessoa tenta agendar** → Erro "Slot is fully booked"

**Uso:** Aulas, workshops, eventos em grupo

---

### Exemplo 3: Serviço com Múltiplas Vagas (maxBookings = 3)
```
Slot: 09:00 - 10:00, maxBookings = 3
```
- ✅ **3 pessoas podem agendar o mesmo horário**
- ❌ **4ª pessoa** → Erro "Slot is fully booked"

**Uso:** Serviços que podem atender múltiplos clientes ao mesmo tempo

---

## 🎯 Como Funciona no Sistema

### Quando você cria um slot:
1. Você define: data, hora início, hora fim, **maxBookings**
2. O sistema permite até `maxBookings` agendamentos para aquele slot
3. Cada agendamento é independente (pode ter clientes diferentes)

### Quando alguém tenta agendar:
1. Sistema verifica quantos agendamentos já existem para aquele slot
2. Se `agendamentos < maxBookings` → ✅ Permite agendar
3. Se `agendamentos >= maxBookings` → ❌ Bloqueia com erro

### Proteção contra Race Condition:
- ✅ Usa transações atômicas do Firestore
- ✅ Conta bookings 'confirmed' + 'pending'
- ✅ Apenas 1 pessoa consegue agendar quando há 1 vaga restante

---

## 💡 Casos de Uso Comuns

| Tipo de Serviço | maxBookings Recomendado | Exemplo |
|-----------------|------------------------|---------|
| Consulta individual | 1 | Médico, psicólogo, coach |
| Aula em grupo | 5-20 | Yoga, pilates, curso |
| Workshop | 10-50 | Palestra, treinamento |
| Serviço múltiplo | 2-5 | Salão (múltiplos profissionais) |
| Evento | 50-100+ | Conferência, show |

---

## 🔧 Como Usar no Sistema

### No Dashboard:
1. Clique em "Abrir horário"
2. Preencha data, hora início, hora fim
3. **Defina "Máximo de agendamentos"**:
   - `1` = apenas 1 pessoa pode agendar (padrão)
   - `5` = até 5 pessoas podem agendar
   - etc.
4. Salve

### Exemplo Visual:
```
┌─────────────────────────────────────┐
│ Criar Novo Horário                   │
├─────────────────────────────────────┤
│ Data: [2025-12-20]                   │
│ Hora início: [10:00]                │
│ Hora fim: [11:00]                   │
│ Máximo de agendamentos: [1] ← Aqui! │
│ Intervalo: [30] minutos              │
└─────────────────────────────────────┘
```

---

## ⚠️ Importante

- **maxBookings = 1** é o padrão (mais comum)
- **maxBookings > 1** permite múltiplos agendamentos no mesmo horário
- O sistema **protege contra double booking** mesmo com múltiplas vagas
- Cada agendamento é **independente** (clientes diferentes, dados diferentes)

---

## 🎯 Resumo

**"Máximo de agendamentos"** = **Quantas pessoas podem reservar o mesmo horário ao mesmo tempo**

- `1` = Apenas 1 pessoa (padrão)
- `5` = Até 5 pessoas
- `10` = Até 10 pessoas
- etc.

É útil para:
- ✅ Consultas individuais (1)
- ✅ Aulas em grupo (5-20)
- ✅ Eventos (50+)
- ✅ Serviços com múltiplas vagas (2-5)
