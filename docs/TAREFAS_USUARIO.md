# 📋 Tarefas Pendentes - Sua Parte (Manuais)

Este documento lista as tarefas que **você precisa fazer manualmente** (não podem ser automatizadas).

**Última atualização**: 20/12/2025

---

## ✅ TAREFAS JÁ CONCLUÍDAS

### 1. ✅ Índices Firestore
- ✅ Índices compostos criados no Firebase Console
- ✅ `availableSlots`: `status + date` e `date + status`
- ✅ `bookings`: `slotId + status`

---

## ⏳ TAREFAS PENDENTES

### 1. 🔍 Verificar Índices Firestore (Alta Prioridade)

#### O que verificar:
- [ ] Confirmar que todos os índices estão criados e ativos
- [ ] Verificar se há erros de índice no console do Firebase
- [ ] Testar queries otimizadas para garantir que estão usando os índices

#### Como verificar:
1. Acesse: [Firebase Console](https://console.firebase.google.com)
2. Vá em: **Firestore Database** > **Indexes**
3. Verifique se os seguintes índices existem:

**Coleção: `users/{userId}/availableSlots`**
- ✅ `status` (Ascending) + `date` (Ascending)
- ✅ `date` (Ascending) + `status` (Ascending)

**Coleção: `users/{userId}/bookings`**
- ✅ `slotId` (Ascending) + `status` (Ascending)

#### Documentação completa:
- Ver: `docs/FIRESTORE_INDICES.md`

---

### 2. 🧪 Testar Otimizações Implementadas (Média Prioridade)

#### O que testar:
- [ ] Testar cache de licenses (deve ser mais rápido na segunda requisição)
- [ ] Testar cache de slots disponíveis (deve ser mais rápido na segunda requisição)
- [ ] Testar cache de dados de usuário (deve ser mais rápido na segunda requisição)
- [ ] Testar debounce no frontend (validações não devem disparar a cada tecla)
- [ ] Verificar que queries estão usando índices (sem erros no console)

#### Como testar:
1. **Backend - Cache:**
   - Fazer requisição de validação de license
   - Fazer a mesma requisição novamente (deve ser mais rápida)
   - Ver logs do backend para confirmar uso de cache

2. **Frontend - Debounce:**
   - Abrir página de registro
   - Digitar código de license (não deve validar a cada tecla)
   - Aguardar 1000ms (1 segundo) após parar de digitar (deve validar)
   - Verificar que não há múltiplas requisições no Network tab

#### Documentação completa:
- Ver: `docs/GUIA_TESTES_OTIMIZACOES.md`

---

### 3. 🚀 Deploy das Mudanças (Alta Prioridade)

#### Backend:
- [ ] Fazer deploy das mudanças para a VM de produção
- [ ] Instalar nova dependência: `node-cache`
- [ ] Reiniciar serviço do backend
- [ ] Verificar que tudo está funcionando

#### Frontend:
- [ ] Fazer deploy das mudanças para Firebase Hosting
- [ ] Verificar que debounce está funcionando
- [ ] Testar validações em tempo real

#### Como fazer deploy:

**Backend (usando Ansible):**
```bash
cd /Users/marcosraia/Projetos/AgendaCalendarV2
ansible-playbook -i infrastructure/ansible/inventory.ini infrastructure/ansible/deploy-backend.yml
```

**Ou manualmente:**
```bash
# Na VM
cd /opt/agenda-calendar-backend
git pull
npm install  # Instala node-cache
npm run build
sudo systemctl restart agenda-calendar-backend
```

**Frontend:**
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

---

### 4. 📊 Monitorar Performance (Baixa Prioridade)

#### O que monitorar:
- [ ] Verificar logs do backend para confirmar uso de cache
- [ ] Verificar métricas do Firestore (leituras reduzidas)
- [ ] Verificar tempo de resposta das APIs
- [ ] Verificar uso de memória (cache)

#### Como monitorar:
1. **Firebase Console:**
   - Firestore > Usage
   - Verificar redução em "Document reads"

2. **Backend Logs:**
   - Verificar mensagens de cache hit/miss
   - Verificar tempo de resposta

3. **Frontend:**
   - Network tab do DevTools
   - Verificar redução de requisições

---

## 🎯 RESUMO DAS PRIORIDADES

### 🔴 Alta Prioridade (Fazer Agora):
1. ✅ **Verificar Índices Firestore** - Já feito!
2. ⏳ **Deploy das Mudanças** - Fazer agora

### 🟡 Média Prioridade (Fazer Depois):
3. ⏳ **Testar Otimizações** - Validar que tudo funciona

### 🟢 Baixa Prioridade (Opcional):
4. ⏳ **Monitorar Performance** - Acompanhar melhorias

---

## 📝 CHECKLIST RÁPIDO

### Antes de Fazer Deploy:
- [ ] Todos os testes passando localmente
- [ ] Índices Firestore criados
- [ ] Variáveis de ambiente configuradas
- [ ] Backup do banco de dados (opcional, mas recomendado)

### Após Deploy:
- [ ] Testar endpoints principais
- [ ] Verificar logs de erro
- [ ] Testar cache (segunda requisição mais rápida)
- [ ] Testar debounce no frontend
- [ ] Verificar que índices estão sendo usados

---

## 💡 DICAS

### Se encontrar erros de índice:
- Firebase pode criar índices automaticamente quando necessário
- Mas é melhor criar manualmente para evitar delays
- Verifique se o nome da coleção está correto

### Se cache não funcionar:
- Verifique se `node-cache` foi instalado
- Verifique logs do backend
- Limpe cache manualmente se necessário

### Se debounce não funcionar:
- Verifique console do navegador para erros
- Verifique Network tab para ver requisições
- Limpe cache do navegador

---

**Status**: Pronto para deploy! 🚀

