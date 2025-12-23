data "aws_vpc" "default" {
  default = true
}

resource "aws_security_group" "openreach-scrapper" {
  name        = "openreach-scrapper-security-group"
  description = "Security group for openreach-scrapper application"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

output "security_group_id" {
  value       = aws_security_group.openreach-scrapper.id
  description = "The ID of the security group"
}
