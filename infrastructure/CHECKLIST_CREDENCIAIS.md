# ✅ Checklist de Credenciais

## Credenciais Fornecidas

- [x] **Tenancy OCID** ✅
  - `ocid1.tenancy.oc1..aaaaaaaavmcntyikitlpiqe6jm35zxk26smhdmzkleiur6vlj6d4tcsz7vma`

- [x] **User OCID** ✅
  - `ocid1.user.oc1..aaaaaaaaaplhzt7czq3hzyerrfzcesfofdc6tj7a57sxi7tpjbeuu72kn7ya`

- [x] **Compartment OCID** ✅
  - `ocid1.tenancy.oc1..aaaaaaaavmcntyikitlpiqe6jm35zxk26smhdmzkleiur6vlj6d4tcsz7vma`

- [x] **API Key Fingerprint** ✅
  - `97:97:ce:46:53:cc:90:b2:6b:85:f2:f9:e6:0b:ca:f9`

- [x] **Chave SSH Pública** ✅
  - `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDX7K/nA7EsMXz61+w5L+mNz5TR5uvk6kk85tNyJHFPDJ0WXjmXyeFPPXO7VKyMw/vk59jm459tcjsnnCKV8gTBm2xMAgPSLkPSsN9OCMPS6Yglce0Vpz7za+g2LDrvwOjpKHNPpctIJzqDkMj0mfeYZB/NnWkPC03J4Frxv6TW2MLjgsA9LMa4BMaWHRkr8cdnCDWv9tsp/UJeO/GsEYegUGVLpIf0HKglUemDLmgirctDRpK5nzQp0S28qaBUBYCHFIuW0Djz5/ByRsTDLuAgSan3Iv/Fe5IWxK0J1OnnMcxjyG3Mq/v59UC5QfUsBpwhkh/ilD+0ZIweuREEDKrIlb+YPYLNftX7MNesc1LbWDFKxey/Wg+RQ2sZKVbdSc0f/Ko+LH0UY/6sqdp3r97+s4sU6cxTlHWZEppBkAzE0kZevEVFJ9cr/CVSxSV62k23+ZTHBDTPgFNDKYzXKMEgi/kZnPh0j2B9+xGpT0G4fVpV6UvqI6+Mm+rO5ZguvH+F2M3zmNyBVS0MV46H/XfJeqIuQfawHkla7WqJR4Exr27eVxDr2XeJnfqPPVVWH6xRfPfNo1NSYUvd0WGGQ0DE157wY2kAtJaVwovWSiQ7eSM40KwoD1XVeR8x4VRQvBPYfRDZHfDla3riBUqqCuPsCeBPHsBCD9CS66jn2YBo9w== agendacalendar`

- [x] **Região** ✅
  - `sa-saopaulo-1` (Brazil East - Sao Paulo)

---

## ⚠️ Ação Necessária: Chave Privada da API Key

**FALTA:** Você precisa ter o arquivo da chave privada da API Key.

### O que fazer:

1. **Se você já baixou a chave privada:**
   - Mova o arquivo para: `~/.oci/oci_api_key.pem`
   - Dê permissões: `chmod 600 ~/.oci/oci_api_key.pem`

2. **Se você NÃO baixou a chave privada:**
   - Acesse: OCI Console > Identity > Users > Seu usuário > API Keys
   - Encontre a API Key com fingerprint: `97:97:ce:46:53:cc:90:b2:6b:85:f2:f9:e6:0b:ca:f9`
   - Se não tiver botão de download, você precisa criar uma NOVA API Key
   - Ao criar, selecione "Generate Key Pair" e baixe o arquivo .pem

### Verificar se a chave existe:

```bash
# Criar diretório se não existir
mkdir -p ~/.oci

# Verificar se o arquivo existe
ls -la ~/.oci/oci_api_key.pem

# Se existir, verificar permissões
chmod 600 ~/.oci/oci_api_key.pem
```

---

## ✅ Status Final

- **Terraform configurado:** ✅ `terraform.tfvars` criado com todas as credenciais
- **Chave privada API:** ⚠️ **VERIFICAR** se o arquivo existe em `~/.oci/oci_api_key.pem`

---

## 🚀 Próximo Passo

Após verificar/baixar a chave privada da API Key:

```bash
cd infrastructure
bash deploy.sh
```

Ou manualmente:

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```















