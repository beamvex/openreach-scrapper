data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_iam_role" "scheduler" {
  name = "openreach-scrapper-scheduler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
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

resource "aws_scheduler_schedule" "openreach_scrapper" {
  name       = "openreach-scrapper-schedule"
  schedule_expression = "rate(3 hours)"
  
  flexible_time_window {
    mode = "FLEXIBLE"
    maximum_window_in_minutes = 10
  }
  
  target {
    arn      = aws_ecs_cluster.main.arn
    role_arn = aws_iam_role.scheduler.arn

    ecs_parameters {
      task_definition_arn = aws_ecs_task_definition.app.arn
      launch_type         = "FARGATE"
      platform_version    = "LATEST"

      network_configuration {
        subnets          = data.aws_subnets.default.ids
        security_groups  = [aws_security_group.openreach-scrapper.id]
        assign_public_ip = "ENABLED"
      }
    }
  }
  
  state = "ENABLED"
}



output "scheduler_schedule_name" {
  value = aws_scheduler_schedule.openreach_scrapper.name
  description = "The name of the scheduler schedule"
}

output "scheduler_schedule_arn" {
  value = aws_scheduler_schedule.openreach_scrapper.arn
  description = "The ARN of the scheduler schedule"
}
