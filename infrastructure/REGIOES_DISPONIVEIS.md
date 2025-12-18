# 🌍 Regiões Disponíveis para Always Free

## ⚠️ Problema: "Out of host capacity"

Quando você vê o erro "Out of host capacity", significa que a região não tem VMs Always Free disponíveis no momento.

## ✅ Solução: Tentar Outra Região

### Regiões Recomendadas (em ordem de prioridade):

1. **us-ashburn-1** (EUA - Leste) ⭐ Mais disponível
2. **us-phoenix-1** (EUA - Oeste)
3. **eu-frankfurt-1** (Europa)
4. **uk-london-1** (Reino Unido)
5. **sa-saopaulo-1** (Brasil) - Atualmente sem capacidade

### Como Mudar a Região

1. **Editar terraform.tfvars:**
   ```bash
   cd infrastructure/terraform
   nano terraform.tfvars
   ```

2. **Alterar a região:**
   ```hcl
   region = "us-ashburn-1"  # ou outra região
   ```

3. **Destruir recursos criados (opcional, mas recomendado):**
   ```bash
   terraform destroy
   ```

4. **Tentar novamente:**
   ```bash
   terraform apply
   ```

## 📝 Nota sobre Latência

- **Região próxima (Brasil):** Menor latência, mas pode não ter capacidade
- **Região distante (EUA/Europa):** Maior latência (~100-200ms), mas geralmente tem capacidade

Para uma aplicação web, a diferença de latência é aceitável.

## 🔄 Estratégia

1. Tente `us-ashburn-1` primeiro (geralmente tem mais disponibilidade)
2. Se não funcionar, tente `us-phoenix-1`
3. Continue tentando outras regiões até conseguir

## ✅ Recursos Já Criados

Os recursos de rede (VCN, Subnet, etc.) já foram criados em São Paulo. Você pode:
- Deixar como está e tentar outra região (criará nova VCN)
- Ou destruir tudo e começar de novo: `terraform destroy`



