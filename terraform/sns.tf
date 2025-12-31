resource "aws_sns_topic" "openreach_scrapper" {
  name = "openreach-scrapper-sns-topic"
}

resource "aws_sns_topic_policy" "openreach_scrapper_allow_s3" {
  arn = aws_sns_topic.openreach_scrapper.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3BucketToPublish"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.openreach_scrapper.arn
        Condition = {
          ArnLike = {
            "aws:SourceArn" = aws_s3_bucket.openreach.arn
          }
        }
      }
    ]
  })
}

resource "aws_lambda_permission" "allow_sns_invoke_process_results" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.process_results.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.openreach_scrapper.arn
}

resource "aws_sns_topic_subscription" "openreach_scrapper_to_process_results" {
  topic_arn = aws_sns_topic.openreach_scrapper.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.process_results.arn

  depends_on = [aws_lambda_permission.allow_sns_invoke_process_results]
}