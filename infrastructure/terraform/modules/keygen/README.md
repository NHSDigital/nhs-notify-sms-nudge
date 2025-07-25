<!-- BEGIN_TF_DOCS -->
<!-- markdownlint-disable -->
<!-- vale off -->

## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.10.1 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | 5.98.0 |
| <a name="requirement_shell"></a> [shell](#requirement\_shell) | 1.7.10 |
## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_bucket_logging_bucket"></a> [bucket\_logging\_bucket](#input\_bucket\_logging\_bucket) | Name of the bucket access logging bucket | `string` | n/a | yes |
| <a name="input_cdn_waf_arn"></a> [cdn\_waf\_arn](#input\_cdn\_waf\_arn) | Cloudfront WAF ARN | `string` | `""` | no |
| <a name="input_cloudfront_caching_enabled"></a> [cloudfront\_caching\_enabled](#input\_cloudfront\_caching\_enabled) | Whether to enable cloudfront caching | `bool` | `false` | no |
| <a name="input_comms_zone_id"></a> [comms\_zone\_id](#input\_comms\_zone\_id) | Comms Mgr R53 zone id | `string` | `""` | no |
| <a name="input_comms_zone_name"></a> [comms\_zone\_name](#input\_comms\_zone\_name) | Comms Mgr R53 zone name | `string` | `""` | no |
| <a name="input_domain_root"></a> [domain\_root](#input\_domain\_root) | The root domain for this account and environment | `string` | `""` | no |
| <a name="input_enable_backups"></a> [enable\_backups](#input\_enable\_backups) | Enable backups | `bool` | `false` | no |
| <a name="input_keystore_name"></a> [keystore\_name](#input\_keystore\_name) | Identifier for the keystore to be used in resource names | `string` | n/a | yes |
| <a name="input_log_retention_days"></a> [log\_retention\_days](#input\_log\_retention\_days) | How many days to retain Cloudwatch logs | `number` | n/a | yes |
| <a name="input_module"></a> [module](#input\_module) | The variable encapsulating the name of this module | `string` | `"kg"` | no |
| <a name="input_parameter_bundle"></a> [parameter\_bundle](#input\_parameter\_bundle) | Contains all of the default parameters needed by any module in this project | <pre>object(<br/>    {<br/>      project                             = string<br/>      environment                         = string<br/>      component                           = string<br/>      group                               = string<br/>      region                              = string<br/>      account_ids                         = map(string)<br/>      account_name                        = string<br/>      default_kms_deletion_window_in_days = number<br/>      default_tags                        = map(string)<br/>      iam_resource_arns                   = map(string)<br/>      target_env                          = map(any)<br/>      cicd_bucket_name                    = string<br/>      pipeline_overrides                  = map(any)<br/>      cloudwatch_options                  = map(bool)<br/>      cloudwatch_metric_thresholds        = map(map(string))<br/>      terraform_root_dir                  = string<br/>    }<br/>  )</pre> | n/a | yes |
| <a name="input_permission_boundary_arn"></a> [permission\_boundary\_arn](#input\_permission\_boundary\_arn) | ARN for the IAM permissions boundary | `string` | n/a | yes |
| <a name="input_s3_enable_force_destroy"></a> [s3\_enable\_force\_destroy](#input\_s3\_enable\_force\_destroy) | Allow force destroy of buckets and contents via Terraform - DO NOT ENABLE IN PRODUCTION | `bool` | `false` | no |
## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_keygen_lambda"></a> [keygen\_lambda](#module\_keygen\_lambda) | ../../shared_modules/event-driven-lambda | n/a |
## Outputs

| Name | Description |
|------|-------------|
| <a name="output_comms_env_zone_id"></a> [comms\_env\_zone\_id](#output\_comms\_env\_zone\_id) | n/a |
| <a name="output_comms_env_zone_name"></a> [comms\_env\_zone\_name](#output\_comms\_env\_zone\_name) | n/a |
| <a name="output_jwks_access_policy"></a> [jwks\_access\_policy](#output\_jwks\_access\_policy) | n/a |
| <a name="output_jwks_url"></a> [jwks\_url](#output\_jwks\_url) | n/a |
| <a name="output_lambda_log_group_name"></a> [lambda\_log\_group\_name](#output\_lambda\_log\_group\_name) | n/a |
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
