resource "aws_ecs_cluster" "main" {
  name = "openreach-scrapper-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

locals {
  docker_image_uri = "${aws_ecr_repository.openreach_scrapper.repository_url}:latest"
  log_group_name   = "/ecs/openreach-scrapper-app"
}

resource "aws_cloudwatch_log_group" "app" {
  name              = local.log_group_name
  retention_in_days = 14
}

resource "aws_ecs_task_definition" "app" {
  family                   = "openreach-scrapper-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "4096"
  memory                   = "16384"
  task_role_arn            = aws_iam_role.ecs_task.arn
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  container_definitions = jsonencode([
    {
      name  = "app"
      image = local.docker_image_uri
      environment = [
        {
          name  = "S6_KEEP_ENV"
          value = "1"
        },
        {
          name  = "S3_BUCKET_NAME"
          value = "openreach-scrapper"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.app.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "app"
        }
      }
      portMappings = [
        {
          containerPort = 3001
          hostPort      = 3001
          protocol      = "tcp"
        }
      ]

    }
  ])
  depends_on = [aws_ecr_repository.openreach_scrapper]
}

resource "aws_iam_role" "ecs_execution" {
  name = "openreach-scrapper-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "openreach-scrapper-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_s3_full_access" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}
