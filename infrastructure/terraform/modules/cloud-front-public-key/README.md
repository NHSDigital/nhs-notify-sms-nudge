<!-- BEGIN_TF_DOCS -->
<!-- markdownlint-disable -->
<!-- vale off -->

## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.10.1 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | 5.98.0 |
## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_api_waf_acl_arn"></a> [api\_waf\_acl\_arn](#input\_api\_waf\_acl\_arn) | ARN of the WAF Access Control List to use to protect the API | `string` | `""` | no |
| <a name="input_apig_options"></a> [apig\_options](#input\_apig\_options) | Provides API Gateway options for this api deployment.  quota\_limit => per day limit. rate\_limit => stead state limit measured in requests per second, but averaged over a 5 min period. burst\_limit => max rate over a few seconds | <pre>object({<br/>    enable_logging      = bool,<br/>    enable_metrics      = optional(bool),<br/>    enable_data_tracing = optional(bool),<br/>    enable_xray_traces  = optional(bool),<br/>    logging_level       = optional(string),<br/>    quota_limit         = optional(number),<br/>    rate_limit          = optional(number),<br/>    burst_limit         = optional(number),<br/>  })</pre> | <pre>{<br/>  "burst_limit": 0,<br/>  "enable_data_tracing": true,<br/>  "enable_logging": false,<br/>  "enable_metrics": true,<br/>  "enable_xray_traces": true,<br/>  "quota_limit": 0,<br/>  "rate_limit": 0<br/>}</pre> | no |
| <a name="input_apigw_needed"></a> [apigw\_needed](#input\_apigw\_needed) | To determine whether we need to call lambda openapi module | `bool` | `false` | no |
| <a name="input_bucket_logging_bucket"></a> [bucket\_logging\_bucket](#input\_bucket\_logging\_bucket) | Name of the bucket access logging bucket | `string` | n/a | yes |
| <a name="input_cdn_waf_acl_arn"></a> [cdn\_waf\_acl\_arn](#input\_cdn\_waf\_acl\_arn) | ARN of the WAF Access Control List to use to protect the CloudFront Distribution | `string` | `""` | no |
| <a name="input_cloudfront_caching_enabled"></a> [cloudfront\_caching\_enabled](#input\_cloudfront\_caching\_enabled) | Whether to enable cloudfront caching | `bool` | n/a | yes |
| <a name="input_cloudfront_default_ttl"></a> [cloudfront\_default\_ttl](#input\_cloudfront\_default\_ttl) | The default amount of time (in seconds) that an object is in a CloudFront cache before CloudFront forwards another request in the absence of an Cache-Control max-age or Expires header | `number` | `0` | no |
| <a name="input_cloudfront_fqdn"></a> [cloudfront\_fqdn](#input\_cloudfront\_fqdn) | CloudFront fully qualified domain name | `string` | n/a | yes |
| <a name="input_cloudfront_max_ttl"></a> [cloudfront\_max\_ttl](#input\_cloudfront\_max\_ttl) | The maximum amount of time (in seconds) that an object is in a CloudFront cache before CloudFront forwards another request to your origin to determine whether the object has been updated | `number` | `86400` | no |
| <a name="input_cloudfront_min_ttl"></a> [cloudfront\_min\_ttl](#input\_cloudfront\_min\_ttl) | The minimum amount of time (in seconds) that you want objects to stay in CloudFront caches before CloudFront queries your origin to see whether the object has been updated | `number` | `0` | no |
| <a name="input_enable_backups"></a> [enable\_backups](#input\_enable\_backups) | Enable backups | `bool` | `false` | no |
| <a name="input_endpoint_type"></a> [endpoint\_type](#input\_endpoint\_type) | Allows creating API Gateway using a private endpoint for mock VPC access | `string` | `"REGIONAL"` | no |
| <a name="input_extra_oa3_env_vars"></a> [extra\_oa3\_env\_vars](#input\_extra\_oa3\_env\_vars) | Extra environment variables to pass to the openapi3 module | `map(string)` | `{}` | no |
| <a name="input_log_retention_days"></a> [log\_retention\_days](#input\_log\_retention\_days) | How many days to retain Cloudwatch logs | `number` | `180` | no |
| <a name="input_module"></a> [module](#input\_module) | The variable encapsulating the name of this module | `string` | `"fe"` | no |
| <a name="input_parameter_bundle"></a> [parameter\_bundle](#input\_parameter\_bundle) | Contains all of the default parameters needed by any module in this project | <pre>object(<br/>    {<br/>      project                             = string<br/>      environment                         = string<br/>      component                           = string<br/>      group                               = string<br/>      region                              = string<br/>      account_ids                         = map(string)<br/>      account_name                        = string<br/>      default_kms_deletion_window_in_days = number<br/>      default_tags                        = map(string)<br/>      iam_resource_arns                   = map(string)<br/>      target_env                          = map(any)<br/>      cicd_bucket_name                    = string<br/>      pipeline_overrides                  = map(any)<br/>      cloudwatch_options                  = map(bool)<br/>      cloudwatch_metric_thresholds        = map(map(string))<br/>      terraform_root_dir                  = string<br/>    }<br/>  )</pre> | n/a | yes |
| <a name="input_pipeline_component_lambda"></a> [pipeline\_component\_lambda](#input\_pipeline\_component\_lambda) | Name of the pipeline component for the lambda functions | `string` | `""` | no |
| <a name="input_pipeline_component_static"></a> [pipeline\_component\_static](#input\_pipeline\_component\_static) | Name of the pipeline component for the static content | `string` | `""` | no |
| <a name="input_route53_zone_id"></a> [route53\_zone\_id](#input\_route53\_zone\_id) | ID of the Route53 Public Hosted Zone in which to create cloudfront records for the front end | `string` | n/a | yes |
| <a name="input_s3_enable_force_destroy"></a> [s3\_enable\_force\_destroy](#input\_s3\_enable\_force\_destroy) | Allow force destroy of buckets and contents via Terraform - DO NOT ENABLE IN PRODUCTION | `bool` | `false` | no |
| <a name="input_web_path_patterns"></a> [web\_path\_patterns](#input\_web\_path\_patterns) | List of top level web paths in the OpenApi3.0 spec | `list(string)` | `[]` | no |
## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_lambda_openapi"></a> [lambda\_openapi](#module\_lambda\_openapi) | ../lambda-openapi3 | n/a |
## Outputs

| Name | Description |
|------|-------------|
| <a name="output_static_s3_bucket"></a> [static\_s3\_bucket](#output\_static\_s3\_bucket) | n/a |
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
