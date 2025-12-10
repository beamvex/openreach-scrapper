resource "aws_s3_bucket" "openreach" {
    bucket = "openreach-scrapper"
    versioning {
        enabled = true
    }
}