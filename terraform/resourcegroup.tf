resource "aws_resourcegroups_group" "openreach" {
  name        = "openreach-scrapper"
  description = "Resource group for all openreach-scrapper components"

  resource_query {
    type = "TAG_FILTERS_1_0"
    query = jsonencode({
      ResourceTypeFilters = ["AWS::AllSupported"]
      TagFilters = [
        {
          Key    = "Project"
          Values = ["openreach-scrapper"]
        }
      ]
    })
  }
}
