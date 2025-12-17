# 🚀 Infrastructure as Code - AWS Free Tier

Infraestrutura completa automatizada usando Terraform + Ansible para criar e provisionar a VM AWS EC2 Free Tier.

## 📋 Estrutura

```
infrastructure/
├── terraform-aws/          # Configuração Terraform para AWS
│   ├── main.tf             # Recursos principais
│   ├── variables.tf        # Variáveis
│   ├── outputs.tf          # Outputs
│   ├── user-data.sh        # Script de inicialização
│   └── terraform.tfvars    # Suas credenciais (não commitar!)
│
├── ansible/                # Provisionamento Ansible (compatível AWS e Oracle)
│   ├── playbook.yml        # Playbook principal
│   ├── inventory.ini       # Inventário (não commitar!)
│   └── roles/              # Roles de provisionamento
│
└── deploy-aws.sh           # Script de deploy automatizado
```

## 🎯 Recursos Criados (Todos Free Tier)

- ✅ **EC2 t2.micro**: 750 horas/mês por 12 meses
- ✅ **EBS gp3**: 20 GB (dentro do limite de 30 GB)
- ✅ **VPC Default**: Grátis
- ✅ **Security Group**: Grátis
- ✅ **Internet Gateway**: Grátis

## 🚀 Uso Rápido

```bash
# 1. Configurar credenciais AWS
aws configure

# 2. Configurar Terraform
cd infrastructure/terraform-aws
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Preencher com suas informações

# 3. Deploy completo
cd ..
bash deploy-aws.sh
```

## 📚 Documentação

- **Quick Start**: `QUICKSTART_AWS.md`
- **Guia Completo**: `GUIA_AWS_FREE_TIER.md`
- **Troubleshooting**: Veja seção no guia completo

## 💰 Custos

**Free Tier (12 meses):**
- EC2 t2.micro: 750 horas/mês
- EBS: 30 GB
- Data Transfer: 15 GB saída/mês

**Após 12 meses:**
- EC2 t2.micro: ~$8-10/mês (se usar 24/7)
- EBS: ~$2/mês por 20 GB
- **Total estimado: ~$10-12/mês** (se usar 24/7)

## ✅ Checklist

- [ ] Conta AWS criada
- [ ] AWS CLI configurado
- [ ] Terraform instalado
- [ ] Ansible instalado
- [ ] Chave SSH criada
- [ ] `terraform.tfvars` configurado
- [ ] VM criada
- [ ] Ansible provisionou com sucesso
- [ ] Backend acessível
- [ ] N8N acessível
