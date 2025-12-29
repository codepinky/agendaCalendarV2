# Deploy do Frontend no Firebase Hosting

## ✅ O que já está pronto

- ✅ `firebase.json` criado
- ✅ `.firebaserc` configurado com projeto `agendacalendar-cae1a`
- ✅ Build do frontend feito (`frontend/dist/`)
- ✅ Firebase CLI instalado

## 🚀 Passos para Deploy

### 1. Fazer Login no Firebase

Execute no terminal:

```bash
cd /Users/marcosraia/Projetos/AgendaCalendarV2
firebase login
```

Isso vai abrir o navegador para você fazer login com sua conta Google.

### 2. Verificar Projeto

```bash
firebase use agendacalendar-cae1a
```

### 3. Fazer Deploy

```bash
firebase deploy --only hosting
```

## 📋 Comandos Completos (copie e cole)

```bash
cd /Users/marcosraia/Projetos/AgendaCalendarV2

# Login (vai abrir navegador)
firebase login

# Verificar projeto
firebase use agendacalendar-cae1a

# Deploy
firebase deploy --only hosting
```

## ✅ Após o Deploy

O frontend estará disponível em:
- **URL Principal:** `https://agendacalendar-cae1a.web.app`
- **URL Alternativa:** `https://agendacalendar-cae1a.firebaseapp.com`

## 🔄 Para Atualizar (deploys futuros)

```bash
cd /Users/marcosraia/Projetos/AgendaCalendarV2

# 1. Build
cd frontend && npm run build && cd ..

# 2. Deploy
firebase deploy --only hosting
```

## 📝 Notas

- O backend já está configurado para aceitar requisições de `https://agendacalendar-cae1a.web.app`
- O frontend já está configurado com a API URL: `https://agendacalendar.duckdns.org/api`
- Após o deploy, tudo deve funcionar automaticamente!













