# Agenda Calendar V2

Aplicação web completa para agendamentos com integração ao Google Calendar.

## Estrutura do Projeto

```
AgendaCalendarV2/
├── frontend/     # React + TypeScript + Vite
├── backend/      # Node.js + Express + TypeScript
└── README.md
```

## Tecnologias

- **Frontend**: React 18 + TypeScript + Vite + React Bootstrap
- **Backend**: Node.js + Express + TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Integration**: Google Calendar API (OAuth 2.0)

## Configuração

### Frontend

1. Instalar dependências:
```bash
cd frontend
npm install
```

2. Configurar variáveis de ambiente (criar `.env`):
```
VITE_API_URL=http://localhost:3000/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

3. Executar em desenvolvimento:
```bash
npm run dev
```

### Backend

1. Instalar dependências:
```bash
cd backend
npm install
```

2. Configurar variáveis de ambiente (criar `.env` baseado em `.env.example`):
```
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
PORT=3000
CORS_ORIGIN=http://localhost:5173
N8N_WEBHOOK_URL=...
```

3. Executar em desenvolvimento:
```bash
npm run dev
```

## Funcionalidades

- Sistema de licenças via Kiwify
- Cadastro e autenticação de proprietários
- Abertura de horários disponíveis (slots)
- Agendamento público via link único
- Integração com Google Calendar (OAuth 2.0)
- Prevenção de conflitos de horários
- Sistema de ordem de pedido para agendamentos

## Desenvolvimento

O projeto segue metodologia Mobile First e código em inglês com interface em português.

