# Infrastructure as Code - Oracle Cloud

Infraestrutura completa automatizada usando Terraform + Ansible para criar e provisionar a VM Oracle Cloud Free Tier.

## 📋 Pré-requisitos

### 1. Instalar Ferramentas

**Terraform:**
```bash
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

**Ansible:**
```bash
# macOS
brew install ansible

# Linux
pip3 install ansible
```

**OCI CLI (Opcional, para obter credenciais):**
```bash
# macOS
brew install oci-cli

# Linux
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
```

### 2. Obter Credenciais OCI

1. **Acesse OCI Console:** https://cloud.oracle.com
2. **Criar API Key:**
   - Identity > Users > Seu usuário
   - API Keys > Add API Key
   - Baixe a chave privada
   - Copie o fingerprint e OCIDs

3. **Informações necessárias:**
   - `tenancy_ocid`: OCI Console > Tenancy Details
   - `user_ocid`: OCI Console > Identity > Users > Seu usuário
   - `compartment_id`: OCI Console > Identity > Compartments
   - `fingerprint`: Da API Key criada
   - `private_key_path`: Caminho para o arquivo .pem baixado

## 🚀 Uso

### Passo 1: Configurar Terraform

```bash
cd infrastructure/terraform

# Copiar template de variáveis
cp terraform.tfvars.example terraform.tfvars

# Editar terraform.tfvars com suas credenciais
nano terraform.tfvars
```

**Preencher `terraform.tfvars`:**
```hcl
tenancy_ocid     = "ocid1.tenancy.oc1..xxxxx"
user_ocid        = "ocid1.user.oc1..xxxxx"
fingerprint      = "xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx"
private_key_path = "~/.oci/oci_api_key.pem"
region           = "us-ashburn-1"
compartment_id   = "ocid1.compartment.oc1..xxxxx"
ssh_public_key   = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAB... user@machine"
```

### Passo 2: Criar a VM com Terraform

```bash
cd infrastructure/terraform

# Inicializar Terraform
terraform init

# Validar configuração
terraform validate

# Ver plano de execução
terraform plan

# Criar a VM
terraform apply
```

**Após aplicar, você verá:**
- `instance_public_ip`: IP público da VM
- `ssh_command`: Comando para conectar via SSH

### Passo 3: Configurar Ansible

```bash
cd infrastructure/ansible

# Copiar template de inventory
cp inventory.ini.example inventory.ini

# Editar inventory.ini com o IP da VM
nano inventory.ini
```

**Preencher `inventory.ini`:**
```ini
[agenda_calendar]
123.456.789.0 ansible_user=opc ansible_ssh_private_key_file=~/.ssh/id_rsa
```

**Atualizar variáveis em `group_vars/all.yml`:**
- `google_redirect_uri`: `https://VM_IP/api/google-calendar/callback`
- `n8n_host`: IP da VM
- `n8n_webhook_url`: `http://VM_IP:5678/webhook/agendamento`
- `n8n_password`: Senha segura para N8N

### Passo 4: Provisionar com Ansible

```bash
cd infrastructure/ansible

# Testar conexão
ansible agenda_calendar -m ping

# Executar playbook completo
ansible-playbook playbook.yml

# Ou com verbose
ansible-playbook playbook.yml -v
```

### Passo 5: Verificar

Após o provisionamento:

1. **Backend:** `http://VM_IP:3000/health`
2. **N8N:** `http://VM_IP:5678` (admin / senha configurada)
3. **SSH:** `ssh opc@VM_IP`

## 📁 Estrutura

```
infrastructure/
├── terraform/
│   ├── main.tf              # Recursos principais
│   ├── variables.tf         # Variáveis
│   ├── outputs.tf           # Outputs
│   ├── terraform.tfvars     # Suas credenciais (não commitar!)
│   └── user-data.sh         # Script de inicialização
│
└── ansible/
    ├── playbook.yml         # Playbook principal
    ├── ansible.cfg          # Configuração Ansible
    ├── inventory.ini       # Inventário (não commitar!)
    ├── group_vars/
    │   └── all.yml         # Variáveis globais
    └── roles/
        ├── docker/         # Instalação Docker
        ├── nodejs/         # Instalação Node.js + PM2
        ├── n8n/            # Configuração N8N
        └── backend/         # Deploy do backend
```

## 🔧 Comandos Úteis

### Terraform

```bash
# Ver estado atual
terraform show

# Destruir infraestrutura
terraform destroy

# Atualizar apenas a VM
terraform apply -target=oci_core_instance.agenda_calendar_vm
```

### Ansible

```bash
# Executar apenas um role
ansible-playbook playbook.yml --tags docker

# Verificar sem executar (dry-run)
ansible-playbook playbook.yml --check

# Executar com mais verbosidade
ansible-playbook playbook.yml -vvv
```

## 🔒 Segurança

1. **Nunca commite:**
   - `terraform.tfvars`
   - `inventory.ini`
   - Arquivos `.pem` (chaves privadas)
   - Arquivos `.env`

2. **Use variáveis de ambiente:**
   ```bash
   export TF_VAR_tenancy_ocid="ocid1.tenancy..."
   ```

3. **Altere senhas padrão:**
   - N8N password em `group_vars/all.yml`

## 🆘 Troubleshooting

### Terraform não conecta
- Verifique credenciais em `terraform.tfvars`
- Verifique se a API key está correta
- Verifique região

### Ansible não conecta
- Verifique SSH key no `inventory.ini`
- Teste conexão: `ansible agenda_calendar -m ping`
- Verifique firewall da VM

### Backend não inicia
- Verifique logs: `ssh opc@VM_IP 'sudo journalctl -u agenda-calendar-backend -f'`
- Verifique `.env` na VM
- Verifique se porta 3000 está aberta

## 📝 Checklist

- [ ] Terraform instalado
- [ ] Ansible instalado
- [ ] Credenciais OCI obtidas
- [ ] `terraform.tfvars` configurado
- [ ] VM criada com Terraform
- [ ] `inventory.ini` configurado
- [ ] `group_vars/all.yml` atualizado
- [ ] Playbook executado com sucesso
- [ ] Backend acessível
- [ ] N8N acessível
- [ ] Senhas alteradas





