# 🔧 Soluções Alternativas - "Out of host capacity"

## 📋 Situação Atual

- ✅ **Rede criada com sucesso** (VCN, Subnet, Security List, Internet Gateway)
- ❌ **VM não pode ser criada** - "Out of host capacity" em São Paulo
- ❌ **Outras regiões** - Erro de autenticação (pode ser limitação da API Key)

## 🎯 Soluções

### Opção 1: Aguardar e Tentar Novamente (Recomendado)

A capacidade pode voltar em algumas horas. Tente:

```bash
cd infrastructure/terraform
terraform apply -auto-approve
```

**Dicas:**
- Tente em horários diferentes (madrugada geralmente tem mais disponibilidade)
- Tente em dias diferentes
- A Oracle libera capacidade periodicamente

### Opção 2: Criar VM Manualmente via Console

1. **Acesse OCI Console:** https://cloud.oracle.com
2. **Compute > Instances > Create Instance**
3. **Configurações:**
   - Name: `agenda-calendar-vm`
   - Image: Oracle Linux 8
   - Shape: `VM.Standard.A1.Flex` (Always Free)
   - OCPUs: 1
   - Memory: 6 GB
   - VCN: Use a VCN criada pelo Terraform (ou crie uma nova)
   - Subnet: Use a subnet criada pelo Terraform
   - SSH Key: Cole sua chave pública SSH
4. **Após criar, anote o IP público**

5. **Usar apenas Ansible para provisionar:**
   ```bash
   cd infrastructure/ansible
   
   # Criar inventory.ini
   echo "[agenda_calendar]" > inventory.ini
   echo "SEU_IP_AQUI ansible_user=opc ansible_ssh_private_key_file=~/.ssh/id_rsa" >> inventory.ini
   
   # Atualizar group_vars/all.yml com o IP
   # Executar playbook
   ansible-playbook playbook.yml
   ```

### Opção 3: Verificar Limites da Conta

1. **OCI Console > Limits, Quotas, and Usage**
2. Verifique se há limites específicos na sua conta
3. Verifique se a conta está no Free Tier

### Opção 4: Tentar Outras Regiões (se autenticação funcionar)

Se conseguir resolver o erro de autenticação:

```bash
# Editar terraform.tfvars
region = "us-phoenix-1"  # ou outra região

# Tentar criar
terraform apply -auto-approve
```

## 📝 Status dos Recursos

**Recursos criados em São Paulo:**
- ✅ VCN
- ✅ Subnet  
- ✅ Security List
- ✅ Internet Gateway
- ✅ Route Table

**Recursos NÃO criados:**
- ❌ VM (sem capacidade disponível)

## ⚠️ Importante

Os recursos de rede criados são **gratuitos** e não geram custos. Você pode:
- Deixá-los criados e tentar criar a VM depois
- Ou destruí-los: `terraform destroy`

## 🎯 Recomendação

1. **Deixe os recursos de rede criados** (são gratuitos)
2. **Tente criar a VM novamente em algumas horas**
3. **Se não funcionar, crie manualmente via Console** e use apenas o Ansible

## 📞 Próximos Passos

Após conseguir criar a VM (manualmente ou via Terraform):

1. Anotar o IP público
2. Configurar Ansible
3. Executar playbook para provisionar tudo













