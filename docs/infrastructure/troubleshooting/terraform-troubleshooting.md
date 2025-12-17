# 🔧 Troubleshooting - "Out of host capacity"

## Problema

```
Error: 500-InternalError, Out of host capacity.
```

## Causa

A região selecionada não tem VMs Always Free disponíveis no momento. Isso é comum porque:
- Alta demanda por recursos gratuitos
- Limites de capacidade por região
- Recursos Always Free são limitados

## Solução

### Opção 1: Tentar Outra Região (Recomendado)

1. **Editar terraform.tfvars:**
   ```bash
   cd infrastructure/terraform
   nano terraform.tfvars
   ```

2. **Mudar região para uma com mais disponibilidade:**
   ```hcl
   region = "us-ashburn-1"  # EUA - Leste
   ```

3. **Destruir recursos antigos (opcional):**
   ```bash
   terraform destroy
   ```

4. **Tentar novamente:**
   ```bash
   terraform apply
   ```

### Opção 2: Aguardar e Tentar Novamente

Às vezes a capacidade fica disponível depois de algumas horas. Você pode:
- Tentar novamente mais tarde
- Tentar em horários diferentes (madrugada geralmente tem mais disponibilidade)

### Opção 3: Tentar Múltiplas Regiões

Crie um script para tentar várias regiões automaticamente:

```bash
#!/bin/bash
regions=("us-ashburn-1" "us-phoenix-1" "eu-frankfurt-1" "uk-london-1")

for region in "${regions[@]}"; do
    echo "Tentando região: $region"
    sed -i.bak "s/region.*=.*\".*\"/region = \"$region\"/" terraform.tfvars
    terraform apply -auto-approve && break
    echo "Região $region sem capacidade, tentando próxima..."
done
```

## Regiões Recomendadas (Ordem de Prioridade)

1. **us-ashburn-1** (EUA - Leste) - Geralmente tem mais disponibilidade
2. **us-phoenix-1** (EUA - Oeste)
3. **eu-frankfurt-1** (Europa)
4. **uk-london-1** (Reino Unido)
5. **sa-saopaulo-1** (Brasil) - Pode não ter capacidade

## Limpeza de Recursos

Se você criou recursos em uma região e quer tentar outra:

```bash
# Destruir tudo
terraform destroy

# Ou destruir apenas a VM (se a rede estiver OK)
terraform destroy -target=oci_core_instance.agenda_calendar_vm
```

## Verificar Disponibilidade

Infelizmente, a Oracle não fornece uma API pública para verificar disponibilidade. Você precisa tentar criar a VM para descobrir.

## Dica

Se você conseguir criar em uma região, anote qual foi e use sempre essa região para futuros deploys.

