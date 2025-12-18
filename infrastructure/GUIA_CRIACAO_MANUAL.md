# 📝 Guia: Criar VM Manualmente no OCI Console

## Passo a Passo Completo

### 1. Acessar OCI Console
- URL: https://cloud.oracle.com
- Faça login na sua conta

### 2. Navegar para Compute
- Menu lateral > **Compute** > **Instances**
- Clique em **"Create Instance"**

### 3. Configurações Básicas

**Name:**
```
agenda-calendar-vm
```

**Create in compartment:**
- Selecione seu compartment (ou root)

### 4. Image and Shape

**Image:**
- Clique em **"Change Image"**
- Selecione: **"Oracle Linux"**
- Versão: **8** (ou a mais recente disponível)
- Clique em **"Select Image"**

**Shape:**
- Clique em **"Change Shape"**
- Selecione: **"VM.Standard.A1.Flex"** (Always Free - ARM)
- **OCPUs:** `1`
- **Memory:** `6 GB`
- Clique em **"Select Shape"**

### 5. Networking

**Virtual cloud network:**
- Se você já tem uma VCN criada pelo Terraform, selecione ela
- Ou selecione **"Create new virtual cloud network"** (será criada automaticamente)

**Subnet:**
- Se você já tem uma subnet criada pelo Terraform, selecione ela
- Ou selecione **"Create new public subnet"** (será criada automaticamente)

**Assign a public IPv4 address:**
- ✅ **Marcar** (para ter acesso público)

### 6. Add SSH keys ⭐ IMPORTANTE

**Opção a escolher:**
- ✅ **"Paste public keys"** (ou "Paste SSH Keys")

**O que fazer:**
1. Abra o terminal e execute:
   ```bash
   cat ~/.ssh/id_rsa.pub
   ```
2. **Copie TODO o conteúdo** que aparecer (começa com `ssh-rsa`)
3. **Cole no campo** do console

**Exemplo do que você deve colar:**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDX7K/nA7EsMXz61+w5L+mNz5TR5uvk6kk85tNyJHFPDJ0WXjmXyeFPPXO7VKyMw/vk59jm459tcjsnnCKV8gTBm2xMAgPSLkPSsN9OCMPS6Yglce0Vpz7za+g2LDrvwOjpKHNPpctIJzqDkMj0mfeYZB/NnWkPC03J4Frxv6TW2MLjgsA9LMa4BMaWHRkr8cdnCDWv9tsp/UJeO/GsEYegUGVLpIf0HKglUemDLmgirctDRpK5nzQp0S28qaBUBYCHFIuW0Djz5/ByRsTDLuAgSan3Iv/Fe5IWxK0J1OnnMcxjyG3Mq/v59UC5QfUsBpwhkh/ilD+0ZIweuREEDKrIlb+YPYLNftX7MNesc1LbWDFKxey/Wg+RQ2sZKVbdSc0f/Ko+LH0UY/6sqdp3r97+s4sU6cxTlHWZEppBkAzE0kZevEVFJ9cr/CVSxSV62k23+ZTHBDTPgFNDKYzXKMEgi/kZnPh0j2B9+xGpT0G4fVpV6UvqI6+Mm+rO5ZguvH+F2M3zmNyBVS0MV46H/XfJeqIuQfawHkla7WqJR4Exr27eVxDr2XeJnfqPPVVWH6xRfPfNo1NSYUvd0WGGQ0DE157wY2kAtJaVwovWSiQ7eSM40KwoD1XVeR8x4VRQvBPYfRDZHfDla3riBUqqCuPsCeBPHsBCD9CS66jn2YBo9w== agendacalendar
```

### 7. Boot Volume

**Deixe os valores padrão:**
- Size: 50 GB (gratuito no Always Free)
- Encryption: Default

### 8. Advanced Options (Opcional)

Você pode deixar tudo padrão aqui.

### 9. Review and Create

1. Revise todas as configurações
2. Verifique que está usando **VM.Standard.A1.Flex** (Always Free)
3. Clique em **"Create"**

### 10. Aguardar Criação

- A VM será criada em ~2-5 minutos
- **Anote o IP público** que aparecerá na lista de Instances

## ✅ Após Criar a VM

### 1. Anotar Informações

- **IP Público:** `xxx.xxx.xxx.xxx`
- **Usuário:** `opc` (padrão do Oracle Linux)

### 2. Testar Conexão SSH

```bash
ssh opc@SEU_IP_PUBLICO
```

### 3. Configurar Ansible

```bash
cd infrastructure/ansible

# Criar inventory.ini
cat > inventory.ini << EOF
[agenda_calendar]
SEU_IP_PUBLICO ansible_user=opc ansible_ssh_private_key_file=~/.ssh/id_rsa

[agenda_calendar:vars]
ansible_python_interpreter=/usr/bin/python3
EOF

# Substituir SEU_IP_PUBLICO pelo IP real
```

### 4. Atualizar Variáveis

Edite `group_vars/all.yml` e atualize:
- `google_redirect_uri`: `https://SEU_IP/api/google-calendar/callback`
- `n8n_host`: `SEU_IP`
- `n8n_webhook_url`: `http://SEU_IP:5678/webhook/agendamento`

### 5. Executar Ansible

```bash
# Testar conexão
ansible agenda_calendar -m ping

# Executar playbook
ansible-playbook playbook.yml
```

## 🔒 Security List (Firewall)

Após criar a VM, você precisa abrir as portas:

1. **OCI Console** > **Networking** > **Virtual Cloud Networks**
2. Clique na sua VCN
3. Clique em **"Security Lists"**
4. Clique na Security List padrão
5. Clique em **"Add Ingress Rules"**

**Adicione estas regras:**

| Source Type | Source CIDR | IP Protocol | Destination Port Range | Description |
|-------------|-------------|-------------|------------------------|-------------|
| CIDR | 0.0.0.0/0 | TCP | 22 | SSH |
| CIDR | 0.0.0.0/0 | TCP | 3000 | Backend API |
| CIDR | 0.0.0.0/0 | TCP | 5678 | N8N |
| CIDR | 0.0.0.0/0 | TCP | 80 | HTTP |
| CIDR | 0.0.0.0/0 | TCP | 443 | HTTPS |

## ✅ Checklist Final

- [ ] VM criada com shape `VM.Standard.A1.Flex`
- [ ] IP público anotado
- [ ] SSH funcionando
- [ ] Portas abertas no Security List
- [ ] Ansible inventory configurado
- [ ] Variáveis atualizadas
- [ ] Playbook executado com sucesso





