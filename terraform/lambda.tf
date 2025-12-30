resource "null_resource" "build_src" {
  triggers = {
    always = timestamp()
  }

  provisioner "local-exec" {
    command = <<EOT
npm run build
EOT
  }
}

data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = "../dist/lambda/processresults/"
  output_path = "../build/processresults.zip"
  depends_on  = [null_resource.build_src]
}

resource "aws_lambda_function" "process_results" {
  function_name    = "openreach-scrapper-process-results"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  
  filename         = data.archive_file.lambda.output_path
}

resource "aws_iam_role" "lambda" {
  name = "openreach-scrapper-process-results-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}