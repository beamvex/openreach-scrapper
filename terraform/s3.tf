resource "aws_s3_bucket" "openreach" {
  bucket = "openreach-scrapper"
  versioning {
    enabled = true
  }
}

data "aws_iam_policy_document" "openreach_allow_cloudfront_read" {
  statement {
    sid     = "AllowCloudFrontRead"
    effect  = "Allow"
    actions = ["s3:GetObject"]

    resources = ["${aws_s3_bucket.openreach.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.openreach.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "openreach" {
  bucket = aws_s3_bucket.openreach.id
  policy = data.aws_iam_policy_document.openreach_allow_cloudfront_read.json
}

locals {
  asset_mime_types = {
    "css"  = "text/css"
    "html" = "text/html"
    "js"   = "text/javascript"
    "png"  = "image/png"
  }

  asset_files = setunion(
    fileset("${path.module}/../assets", "**/*.css"),
    fileset("${path.module}/../assets", "**/*.js"),
    fileset("${path.module}/../assets", "**/*.png"),
    fileset("${path.module}/../assets", "index.html")
  )
}

resource "aws_s3_object" "assets" {
  for_each = toset(local.asset_files)

  bucket = aws_s3_bucket.openreach.id
  key    = "${each.value}"
  source = "${path.module}/../assets/${each.value}"
  etag   = filemd5("${path.module}/../assets/${each.value}")

  content_type = lookup(local.asset_mime_types, lower(element(split(".", each.value), length(split(".", each.value)) - 1)), "application/octet-stream")
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

