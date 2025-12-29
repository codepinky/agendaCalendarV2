## Objetivo

Este guia te permite **subir uma VM na AWS** e **provisionar Backend + n8n** usando **Terraform + Ansible**, e então configurar:

- **DuckDNS** (domínio grátis apontando para a VM)
- **Nginx** (reverse proxy)
- **HTTPS** com **Certbot/Let's Encrypt**
- Segurança no **Security Group** (deixar só 22/80/443)

O frontend pode continuar no **Firebase Hosting**.

## Visão final (URLs)

- **Backend (API)**: `https://SEU_DOMINIO_BACKEND/health`
- **n8n (UI)**: `https://SEU_DOMINIO_N8N/` (protegido por senha)
- **Webhooks do n8n**: `https://SEU_DOMINIO_N8N/webhook/...` (público, sem senha)

## Pré-requisitos (na sua máquina)

- AWS CLI configurado (`aws configure`)
- Terraform instalado
- Ansible instalado
- Uma chave SSH (ex.: `~/.ssh/id_rsa` e `~/.ssh/id_rsa.pub`)

## 1) Subir VM na AWS (Terraform)

Entre na pasta do kit Terraform:

```bash
cd onboarding/aws/terraform
```

Copie o arquivo de variáveis e preencha:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edite `terraform.tfvars` e ajuste pelo menos:
- `aws_region`
- `ssh_public_key` (conteúdo de `~/.ssh/id_rsa.pub`)
- `ansible_user` (Amazon Linux: `ec2-user`)

Depois:

```bash
terraform init
terraform apply
```

Ao final, anote o **IP público** da instância (ou saída do `terraform output`, se existir).

## 2) Preparar o Ansible (inventário + variáveis)

Entre na pasta do kit Ansible:

```bash
cd onboarding/ansible
```

Crie seus arquivos locais (não commitáveis):

```bash
cp inventory.ini.example inventory.ini
cp group_vars/all.yml.example group_vars/all.yml
```

Edite `inventory.ini` e substitua:
- `SEU_IP_OU_HOST_AQUI` pelo IP público/DNS da VM
- confirme `ansible_user=ec2-user`
- confirme o caminho da chave: `ansible_ssh_private_key_file=~/.ssh/id_rsa`

Edite `group_vars/all.yml` e preencha:
- Firebase (`firebase_project_id`, `firebase_client_email`, `firebase_private_key`)
- Google OAuth (se usar)
- `cors_origin` (URL do seu frontend no Firebase Hosting)
- n8n (`n8n_password`, `n8n_host`, `n8n_protocol`, `n8n_webhook_url`)

## 3) Rodar o Ansible (provisionar backend + n8n)

Prévia (não aplica):

```bash
ansible-playbook playbook.app.yml --check
```

Aplicar:

```bash
ansible-playbook playbook.app.yml
```

Ao final, valide na VM:
- backend: `curl -i http://localhost:3000/health`
- n8n: `curl -i http://localhost:5678/healthz`

## 4) DuckDNS (domínio grátis apontando para a VM)

No site do DuckDNS (`https://www.duckdns.org`):

1. Crie um domínio base (ex.: `meuprojeto.duckdns.org`)
2. Se o provedor **não resolver subdomínios**, crie **dois domínios separados**:
   - `meuprojeto.duckdns.org` (backend)
   - `n8nmeuprojeto.duckdns.org` (n8n)
3. Atualize o IP para o IP público da VM

Recomendação (para evitar “IP mudou e quebrou”): configurar um updater na VM via **systemd timer**.

Exemplo (Amazon Linux 2023):

1) Na VM, criar serviço/timer (substitua `SEU_TOKEN_AQUI` e o `domains=`):

```bash
sudo tee /etc/systemd/system/duckdns-update.service >/dev/null <<'EOF'
[Unit]
Description=DuckDNS updater

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -fsS https://www.duckdns.org/update?domains=SEU_DOMINIO&token=SEU_TOKEN_AQUI&ip=
EOF

sudo tee /etc/systemd/system/duckdns-update.timer >/dev/null <<'EOF'
[Unit]
Description=Run DuckDNS updater every 5 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
Unit=duckdns-update.service

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now duckdns-update.timer
```

## 5) Nginx (reverse proxy) + Basic Auth no n8n + exceção para webhooks

Na VM:

```bash
sudo dnf install -y nginx httpd-tools
sudo systemctl enable --now nginx
```

Crie um usuário/senha para proteger a UI do n8n:

```bash
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

Crie o arquivo do Nginx (ajuste os `server_name` conforme seus domínios):

```bash
sudo tee /etc/nginx/conf.d/agenda-calendar.conf >/dev/null <<'EOF'
# Backend
server {
  listen 80;
  server_name SEU_DOMINIO_BACKEND;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

# n8n
server {
  listen 80;
  server_name SEU_DOMINIO_N8N;

  # Webhooks públicos (sem senha) - para Kiwify/Stripe/etc.
  location ~ ^/(webhook|webhook-test)/ {
    proxy_pass http://127.0.0.1:5678;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # UI protegida com senha
  location / {
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;

    proxy_pass http://127.0.0.1:5678;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
EOF

sudo nginx -t
sudo systemctl reload nginx
```

## 6) HTTPS com Certbot (Let's Encrypt)

Por que precisa do Certbot?
- Ele emite certificados TLS gratuitos do Let's Encrypt, e deixa tudo em **HTTPS** (obrigatório para produção).

Na VM:

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d SEU_DOMINIO_BACKEND -d SEU_DOMINIO_N8N
```

Validação:

```bash
curl -i https://SEU_DOMINIO_BACKEND/health | head -n 10
curl -I https://SEU_DOMINIO_N8N/ | head -n 5
```

## 7) Segurança (AWS Security Group)

Após Nginx+HTTPS, deixe inbound apenas:
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)

E **feche**:
- 3000 (backend)
- 5678 (n8n)

## Checklist final

- `https://SEU_DOMINIO_BACKEND/health` retorna 200
- `https://SEU_DOMINIO_N8N/` pede usuário/senha
- `https://SEU_DOMINIO_N8N/webhook-test/...` não pede senha (pode retornar 404, ok)

## Observações importantes

- Nunca commite `inventory.ini` e `group_vars/all.yml` (contêm IPs e segredos). O `.gitignore` do repositório já ignora esses arquivos dentro de `onboarding/`.\n+















