variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1" # Free Tier disponível em todas as regiões
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 instance"
  type        = string
}

variable "ansible_user" {
  description = "User for Ansible (default: ec2-user for Amazon Linux)"
  type        = string
  default     = "ec2-user"
}














