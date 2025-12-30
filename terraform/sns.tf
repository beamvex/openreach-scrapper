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