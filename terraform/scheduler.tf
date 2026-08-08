data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_iam_role" "scheduler" {
  name = "openreach-scrapper-scheduler-role"

  tags = {
    Name = "iam role"
  }

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "scheduler" {
  name = "openreach-scrapper-scheduler-policy"
  role = aws_iam_role.scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:RunTask"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "ecs:cluster" = aws_ecs_cluster.main.arn
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.ecs_execution.arn,
          aws_iam_role.ecs_task.arn
        ]
      }
    ]
  })
}

resource "aws_cloudwatch_event_rule" "openreach_scrapper" {
  name                = "openreach-scrapper-rule"
  description         = "EventBridge rule to trigger openreach-scrapper ECS task"
  schedule_expression = "rate(60 minutes)"

  tags = {
    Name = "event rule"
  }
}

resource "aws_cloudwatch_event_target" "openreach_scrapper" {
  rule      = aws_cloudwatch_event_rule.openreach_scrapper.name
  arn       = aws_ecs_cluster.main.arn
  role_arn  = aws_iam_role.scheduler.arn
  target_id = "openreach-scrapper"

  ecs_target {
    task_definition_arn = aws_ecs_task_definition.app.arn
    launch_type         = "FARGATE"
    platform_version    = "LATEST"

    network_configuration {
      subnets          = data.aws_subnets.default.ids
      security_groups  = [aws_security_group.openreach-scrapper.id]
      assign_public_ip = true
    }
  }
}

output "rule_name" {
  value       = aws_cloudwatch_event_rule.openreach_scrapper.name
  description = "The name of the CloudWatch Events rule"
}

output "rule_arn" {
  value       = aws_cloudwatch_event_rule.openreach_scrapper.arn
  description = "The ARN of the CloudWatch Events rule"
}
