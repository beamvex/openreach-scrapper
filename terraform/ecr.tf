provider "aws" {
  region = "eu-west-2"

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

