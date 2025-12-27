# Troubleshooting: Erro 404 no Webhook

## Problema
Erro: "Cannot POST /api/webhooks/kiwify" ao tentar chamar o backend do n8n.

## Diagnóstico Passo a Passo

### 1. Verificar se o Backend está rodando

Na VM, execute:

```bash
# Verificar status do serviço
sudo systemctl status agenda-calendar-backend

# Ver logs do backend
sudo journalctl -u agenda-calendar-backend -n 50 --no-pager

# Testar localmente (deve funcionar)
curl -i http://localhost:3000/health
curl -X POST http://localhost:3000/api/webhooks/kiwify \
  -H 'Content-Type: application/json' \
  -H 'x-webhook-secret: SEU_SECRET_AQUI' \
  -d '{"order_id": "test", "Customer": {"email": "test@test.com"}}'
```

**Se não funcionar localmente:** O problema é no backend. Verifique os logs.

### 2. Verificar configuração do Nginx

```bash
# Ver configuração atual
sudo cat /etc/nginx/conf.d/agenda-calendar.conf

# Verificar sintaxe
sudo nginx -t

# Ver status do Nginx
sudo systemctl status nginx

# Ver logs do Nginx
sudo tail -n 50 /var/log/nginx/error.log
```

**O que procurar:**
- O `server_name` deve ser `agendacalendar.duckdns.org` (ou seu domínio)
- Deve ter `location /` fazendo proxy para `http://127.0.0.1:3000`

### 3. Testar via Nginx (localmente na VM)

```bash
# Testar health check via Nginx
curl -i http://localhost/health

# Testar webhook via Nginx (deve dar 401 se não tiver secret, mas não 404)
curl -i -X POST http://localhost/api/webhooks/kiwify \
  -H 'Content-Type: application/json' \
  -d '{"order_id": "test", "Customer": {"email": "test@test.com"}}'
```

**Se der 404 aqui:** O problema está no Nginx não roteando corretamente.

### 4. Verificar se o domínio está configurado corretamente

```bash
# Ver qual server_name está configurado
sudo grep server_name /etc/nginx/conf.d/agenda-calendar.conf

# Ver se o DNS está resolvendo
dig +short agendacalendar.duckdns.org
```

### 5. Verificar se há redirecionamento HTTPS

Se você configurou HTTPS com Certbot, pode estar redirecionando HTTP para HTTPS. Teste:

```bash
# Testar HTTPS
curl -i https://agendacalendar.duckdns.org/health

# Testar webhook via HTTPS
curl -i -X POST https://agendacalendar.duckdns.org/api/webhooks/kiwify \
  -H 'Content-Type: application/json' \
  -H 'x-webhook-secret: SEU_SECRET_AQUI' \
  -d '{"order_id": "test", "Customer": {"email": "test@test.com"}}'
```

## Soluções Comuns

### Solução 1: Nginx não está configurado para o domínio correto

Se o `server_name` estiver errado ou usando IP, corrija:

```bash
sudo vim /etc/nginx/conf.d/agenda-calendar.conf
```

Certifique-se de que está assim:

```nginx
server {
  listen 80;
  server_name agendacalendar.duckdns.org;  # Seu domínio aqui

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Depois:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Solução 2: Backend não está rodando

```bash
# Reiniciar backend
sudo systemctl restart agenda-calendar-backend
sudo systemctl status agenda-calendar-backend
```

### Solução 3: Porta 3000 não está acessível

```bash
# Verificar se a porta está ouvindo
sudo netstat -tlnp | grep 3000
# ou
sudo ss -tlnp | grep 3000
```

### Solução 4: Nginx precisa ser reiniciado

```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

## Teste Final

Depois de corrigir, teste do n8n novamente. Se ainda não funcionar, execute na VM:

```bash
# Ver logs em tempo real do Nginx
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log

# Ver logs do backend
sudo journalctl -u agenda-calendar-backend -f
```

E tente novamente do n8n. Os logs vão mostrar o que está acontecendo.











