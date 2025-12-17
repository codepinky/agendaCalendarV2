# Agenda Calendar V2

Aplicação web completa para agendamentos com integração ao Google Calendar.

## 📚 Documentação

Toda a documentação do projeto foi organizada na pasta [`docs/`](docs/). Consulte:

- **📖 Documentação Geral:** [`docs/project/`](docs/project/)
- **🏗️ Infraestrutura:** [`docs/infrastructure/`](docs/infrastructure/)
- **🔧 Scripts:** [`docs/scripts/`](docs/scripts/)

## 🚀 Início Rápido

### Desenvolvimento Local

1. **Instalar dependências:**
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Backend
   cd backend && npm install
   ```

2. **Configurar variáveis de ambiente:**
   - Frontend: Veja [`docs/project/CREDENTIALS.md`](docs/project/CREDENTIALS.md)
   - Backend: Veja [`docs/project/CREDENTIALS.md`](docs/project/CREDENTIALS.md)

3. **Executar:**
   ```bash
   # Frontend (terminal 1)
   cd frontend && npm run dev
   
   # Backend (terminal 2)
   cd backend && npm run dev
   ```

### Deploy

- **AWS:** Veja [`docs/infrastructure/aws/QUICKSTART_AWS.md`](docs/infrastructure/aws/QUICKSTART_AWS.md)
- **Oracle Cloud:** Veja [`docs/infrastructure/guides/QUICKSTART.md`](docs/infrastructure/guides/QUICKSTART.md)

## 🏗️ Estrutura do Projeto

```
AgendaCalendarV2/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Node.js + Express + TypeScript
├── infrastructure/    # Terraform + Ansible
├── scripts/           # Scripts de deploy e setup
└── docs/              # 📚 Documentação organizada
```

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Integration**: Google Calendar API (OAuth 2.0)
- **Infrastructure**: Terraform + Ansible

## ✨ Funcionalidades

- Sistema de licenças via Kiwify
- Cadastro e autenticação de proprietários
- Abertura de horários disponíveis (slots)
- Agendamento público via link único
- Integração com Google Calendar (OAuth 2.0)
- Prevenção de conflitos de horários
- Sistema de ordem de pedido para agendamentos

## 📝 Notas

O projeto segue metodologia Mobile First e código em inglês com interface em português.
