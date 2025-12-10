provider "aws" {
  region = "eu-west-2"

}
resource "aws_iam_role" "lambda_exec_role" {
  name = "openreach-scrapper-lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_ecr_repository" "openreach_scrapper" {
  name = "openreach-scrapper"
}

resource "null_resource" "build_and_push_image" {
  triggers = {
    always = timestamp()
  }

  provisioner "local-exec" {
    command = <<EOT
npm run build

aws ecr get-login-password --region eu-west-2 \
  | docker login --username AWS --password-stdin ${aws_ecr_repository.openreach_scrapper.repository_url}

DOCKER_BUILDKIT=1 docker build --platform linux/amd64 --provenance=false -t openreach-scrapper ..
docker tag openreach-scrapper:latest ${aws_ecr_repository.openreach_scrapper.repository_url}:latest
docker push ${aws_ecr_repository.openreach_scrapper.repository_url}:latest
EOT
  }
}

resource "aws_lambda_function" "openreach_scrapper" {
  
  function_name = "openreach-scrapper"
  role          = aws_iam_role.lambda_exec_role.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.openreach_scrapper.repository_url}:latest"
  timeout       = 240
  memory_size   = 1024
  depends_on = [null_resource.build_and_push_image]

  architectures = ["x86_64"]

  environment {
    variables = {
      S3_BUCKET_NAME = "openreach-scrapper"
      S3_REGION = "eu-west-2"
    }
  }
}
