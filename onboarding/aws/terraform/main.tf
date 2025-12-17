terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "AgendaCalendar"
      Environment = "Production"
      ManagedBy   = "Terraform"
    }
  }
}

# Get default VPC (Free Tier)
data "aws_vpc" "default" {
  default = true
}

# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Create Security Group (Free Tier)
resource "aws_security_group" "agenda_calendar_sg" {
  name        = "agenda-calendar-sg"
  description = "Security group for Agenda Calendar application"
  vpc_id      = data.aws_vpc.default.id

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # IMPORTANTE:
  # Não exponha 3000/5678 publicamente em produção.
  # Backend e n8n devem ficar atrás do Nginx (80/443). Se precisar debugar,
  # abra temporariamente e feche após validar.

  # All outbound traffic
  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "agenda-calendar-sg"
  }
}

# Get latest Amazon Linux 2023 AMI (Free Tier eligible)
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Create Key Pair
resource "aws_key_pair" "agenda_calendar_key" {
  key_name   = "agenda-calendar-key"
  public_key = var.ssh_public_key

  tags = {
    Name = "agenda-calendar-key"
  }
}

# Create EC2 Instance (t2.micro - Free Tier)
resource "aws_instance" "agenda_calendar_vm" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro" # Free Tier eligible (t2.micro pode não estar disponível em todas as regiões)
  key_name               = aws_key_pair.agenda_calendar_key.key_name
  vpc_security_group_ids = [aws_security_group.agenda_calendar_sg.id]
  
  # User data script for initial setup
  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    ansible_user = var.ansible_user
  }))

  # Enable detailed monitoring (optional, can be disabled to save costs)
  monitoring = false

  tags = {
    Name = "agenda-calendar-vm"
  }

  root_block_device {
    volume_type = "gp3" # Free Tier: 30 GB gp3 storage
    volume_size = 30    # Free Tier: até 30 GB (mínimo para Amazon Linux 2023)
    encrypted   = false # Encryption pode ter custo adicional
  }
}
