resource "aws_s3_bucket" "openreach" {
  bucket = "openreach-scrapper"
  versioning {
    enabled = true
  }
}

resource "aws_s3_bucket_notification" "openreach_sns_notifications" {
  bucket = aws_s3_bucket.openreach.id

  topic {
    topic_arn = aws_sns_topic.openreach_scrapper.arn
    events    = ["s3:ObjectCreated:Put"]
    filter_prefix = "openreach/"
    filter_suffix = ".html"
  }
}