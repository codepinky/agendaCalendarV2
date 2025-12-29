# 🚀 Guia de Deploy do Backend

Este guia explica como fazer deploy do backend usando Ansible, evitando os problemas de deploy manual.

---

## ✅ Por que usar Ansible?

O Ansible garante:
- ✅ **Sincronização completa** - Remove arquivos antigos (`--delete`)
- ✅ **Build automático** - Compila TypeScript automaticamente
- ✅ **Reinício do serviço** - Reinicia o backend após deploy
- ✅ **Health check** - Verifica se o serviço está funcionando
- ✅ **Consistência** - Sempre o mesmo processo

---

## 📋 Pré-requisitos

1. **Ansible instalado:**
   ```bash
   pip3 install ansible
   ```

2. **Inventory configurado:**
   Edite `infrastructure/ansible/inventory.ini`:
   ```ini
   [agenda_calendar]
   54.207.236.103 ansible_user=ec2-user ansible_ssh_private_key_file=~/.ssh/id_rsa
   ```

3. **SSH configurado:**
   Certifique-se de que consegue conectar na VM:
   ```bash
   ssh -i ~/.ssh/id_rsa ec2-user@54.207.236.103
   ```

---

## 🚀 Deploy Rápido (Apenas Backend)

**Use este comando quando quiser atualizar apenas o backend:**

```bash
cd infrastructure/ansible
ansible-playbook playbook.yml --tags deploy --limit agenda_calendar
```

**Ou use o script:**
```bash
./scripts/deploy-backend-quick.sh
```

**O que faz:**
1. Sincroniza arquivos do `backend/` local para a VM
2. Remove arquivos antigos/duplicados
3. Instala dependências (`npm install`)
4. Compila TypeScript (`npm run build`)
5. Reinicia o serviço systemd
6. Verifica health check

**Tempo:** ~2-5 minutos

---

## 🔧 Deploy Completo (Provisionamento)

**Use este comando apenas na primeira vez ou quando precisar reprovisionar tudo:**

```bash
cd infrastructure/ansible
ansible-playbook playbook.yml
```

**O que faz:**
- Instala Docker, Node.js, N8N
- Configura tudo do zero
- Faz deploy do backend

**Tempo:** ~15-20 minutos

---

## 📝 Fluxo de Trabalho Recomendado

### 1. Fazer mudanças localmente
```bash
# Editar arquivos em backend/src/
# Testar localmente
npm run build
```

### 2. Commit e push
```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

### 3. Deploy na VM
```bash
cd infrastructure/ansible
ansible-playbook playbook.yml --tags deploy --limit agenda_calendar
```

### 4. Verificar
```bash
curl https://agendacalendar.duckdns.org/health
```

---

## 🐛 Troubleshooting

### Erro: "Host key verification failed"
```bash
ssh-keyscan -H 54.207.236.103 >> ~/.ssh/known_hosts
```

### Erro: "Permission denied"
Verifique se a chave SSH está correta:
```bash
ssh -i ~/.ssh/id_rsa ec2-user@54.207.236.103
```

### Erro: "Module not found"
Instale o Ansible:
```bash
pip3 install ansible
```

### Build falha na VM
Verifique logs:
```bash
ssh ec2-user@54.207.236.103
cd /opt/agenda-calendar/backend
npm run build
sudo journalctl -u agenda-calendar-backend -f
```

---

## ⚠️ Importante

### ❌ NÃO faça deploy manual
```bash
# ❌ EVITE ISSO:
scp backend/src/controllers/*.ts ec2-user@VM:/opt/agenda-calendar/backend/src/controllers/
```

### ✅ SEMPRE use Ansible
```bash
# ✅ FAÇA ISSO:
ansible-playbook playbook.yml --tags deploy
```

---

## 📚 Comandos Úteis

### Ver o que será executado (dry-run)
```bash
ansible-playbook playbook.yml --tags deploy --check
```

### Deploy apenas de arquivos (sem build)
```bash
ansible-playbook playbook.yml --tags deploy --skip-tags build
```

### Ver logs do serviço
```bash
ssh ec2-user@54.207.236.103
sudo journalctl -u agenda-calendar-backend -f
```

### Reiniciar serviço manualmente
```bash
ssh ec2-user@54.207.236.103
sudo systemctl restart agenda-calendar-backend
```

---

## 🎯 Resumo

| Situação | Comando |
|----------|---------|
| **Deploy rápido do backend** | `ansible-playbook playbook.yml --tags deploy` |
| **Deploy completo (primeira vez)** | `ansible-playbook playbook.yml` |
| **Verificar status** | `curl https://agendacalendar.duckdns.org/health` |

---

## 💡 Dica

Crie um alias no seu `~/.bashrc` ou `~/.zshrc`:
```bash
alias deploy-backend='cd ~/Projetos/AgendaCalendarV2/infrastructure/ansible && ansible-playbook playbook.yml --tags deploy --limit agenda_calendar'
```

Depois é só usar:
```bash
deploy-backend
```











