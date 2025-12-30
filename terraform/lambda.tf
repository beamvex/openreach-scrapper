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
  role             = aws_iam_role.lambda.id
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  source_code_hash = data.archive_file.lambda.source_code_hash
  filename         = data.archive_file.lambda.output_path
}