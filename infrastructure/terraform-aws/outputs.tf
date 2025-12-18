output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.agenda_calendar_vm.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.agenda_calendar_vm.public_dns
}

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.agenda_calendar_vm.id
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ~/.ssh/id_rsa ${var.ansible_user}@${aws_instance.agenda_calendar_vm.public_ip}"
}

output "ansible_inventory_entry" {
  description = "Ansible inventory entry for this instance"
  value       = "${aws_instance.agenda_calendar_vm.public_ip} ansible_user=${var.ansible_user} ansible_ssh_private_key_file=~/.ssh/id_rsa"
}


