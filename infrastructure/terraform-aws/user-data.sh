#!/bin/bash

# User data script for Amazon Linux 2023
# This script runs once when the instance is first launched

set -e

echo "🚀 Iniciando provisionamento inicial da VM AWS..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
sudo dnf update -y

# Instalar dependências básicas
echo "📦 Instalando dependências básicas..."
sudo dnf install -y \
    curl \
    wget \
    git \
    tar \
    gzip \
    unzip \
    python3 \
    python3-pip

# Instalar Docker
echo "🐳 Instalando Docker..."
sudo dnf install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# Instalar Docker Compose
echo "🐳 Instalando Docker Compose..."
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
sudo curl -L "https://github.com/docker/compose/releases/download/$${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Node.js 20.x via NodeSource
echo "📦 Instalando Node.js 20.x..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Instalar PM2 globalmente
echo "📦 Instalando PM2..."
sudo npm install -g pm2

# Criar estrutura de diretórios
echo "📁 Criando estrutura de diretórios..."
sudo mkdir -p /opt/agenda-calendar/{backend,n8n,logs}
sudo mkdir -p /opt/agenda-calendar/n8n/{data,workflows}
sudo chown -R ec2-user:ec2-user /opt/agenda-calendar

# Configurar firewall (se necessário)
echo "🔥 Configurando firewall..."
# Amazon Linux 2023 usa firewalld, mas security groups já fazem isso

echo "✅ Provisionamento inicial concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Aguarde alguns minutos para o sistema estar totalmente pronto"
echo "2. Execute o Ansible para provisionamento completo"
echo "3. Configure o backend e N8N"












