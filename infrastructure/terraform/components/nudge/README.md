<!-- BEGIN_TF_DOCS -->
<!-- markdownlint-disable -->
<!-- vale off -->

## Requirements

No requirements.
## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_apim_auth_token_schedule"></a> [apim\_auth\_token\_schedule](#input\_apim\_auth\_token\_schedule) | Schedule to renew the APIM auth token | `string` | `"rate(9 minutes)"` | no |
| <a name="input_apim_auth_token_url"></a> [apim\_auth\_token\_url](#input\_apim\_auth\_token\_url) | URL to generate an APIM auth token | `string` | `"https://int.api.service.nhs.uk/oauth2/token"` | no |
| <a name="input_apim_base_url"></a> [apim\_base\_url](#input\_apim\_base\_url) | The NHS Notify send message target for nudge communications. Defaults to sandbox | `string` | `"https://sandbox.api.service.nhs.uk"` | no |
| <a name="input_apim_keygen_schedule"></a> [apim\_keygen\_schedule](#input\_apim\_keygen\_schedule) | Schedule to refresh key pairs if necessary | `string` | `"cron(0 14 * * ? *)"` | no |
| <a name="input_aws_account_id"></a> [aws\_account\_id](#input\_aws\_account\_id) | The AWS Account ID (numeric) | `string` | n/a | yes |
| <a name="input_component"></a> [component](#input\_component) | The variable encapsulating the name of this component | `string` | `"nudge"` | no |
| <a name="input_default_tags"></a> [default\_tags](#input\_default\_tags) | A map of default tags to apply to all taggable resources within the component | `map(string)` | `{}` | no |
| <a name="input_environment"></a> [environment](#input\_environment) | The name of the tfscaffold environment | `string` | n/a | yes |
| <a name="input_eventbus_account_id"></a> [eventbus\_account\_id](#input\_eventbus\_account\_id) | The AWS Account ID for the event bus | `string` | n/a | yes |
| <a name="input_force_destroy"></a> [force\_destroy](#input\_force\_destroy) | Flag to force deletion of S3 buckets | `bool` | `false` | no |
| <a name="input_force_lambda_code_deploy"></a> [force\_lambda\_code\_deploy](#input\_force\_lambda\_code\_deploy) | If the lambda package in s3 has the same commit id tag as the terraform build branch, the lambda will not update automatically. Set to True if making changes to Lambda code from on the same commit for example during development | `bool` | `false` | no |
| <a name="input_group"></a> [group](#input\_group) | The group variables are being inherited from (often synonmous with account short-name) | `string` | n/a | yes |
| <a name="input_kms_deletion_window"></a> [kms\_deletion\_window](#input\_kms\_deletion\_window) | When a kms key is deleted, how long should it wait in the pending deletion state? | `string` | `"30"` | no |
| <a name="input_log_level"></a> [log\_level](#input\_log\_level) | The log level to be used in lambda functions within the component. Any log with a lower severity than the configured value will not be logged: https://docs.python.org/3/library/logging.html#levels | `string` | `"INFO"` | no |
| <a name="input_log_retention_in_days"></a> [log\_retention\_in\_days](#input\_log\_retention\_in\_days) | The retention period in days for the Cloudwatch Logs events to be retained, default of 0 is indefinite | `number` | `0` | no |
| <a name="input_parent_acct_environment"></a> [parent\_acct\_environment](#input\_parent\_acct\_environment) | Name of the environment responsible for the acct resources used, affects things like DNS zone. Useful for named dev environments | `string` | `"main"` | no |
| <a name="input_parent_eventbus_environment"></a> [parent\_eventbus\_environment](#input\_parent\_eventbus\_environment) | Name of the environment responsible for the eventbus resources used, affects things like eventbus arns and names. Useful for named dev environments | `string` | `"main"` | no |
| <a name="input_project"></a> [project](#input\_project) | The name of the tfscaffold project | `string` | n/a | yes |
| <a name="input_queue_batch_size"></a> [queue\_batch\_size](#input\_queue\_batch\_size) | maximum number of queue items to process | `number` | `10` | no |
| <a name="input_queue_batch_window_seconds"></a> [queue\_batch\_window\_seconds](#input\_queue\_batch\_window\_seconds) | maximum time in seconds between processing events | `number` | `10` | no |
| <a name="input_region"></a> [region](#input\_region) | The AWS Region | `string` | n/a | yes |
## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_kms"></a> [kms](#module\_kms) | git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/kms | v2.0.10 |
| <a name="module_lambda_apim_key_generation"></a> [lambda\_apim\_key\_generation](#module\_lambda\_apim\_key\_generation) | git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/lambda | v2.0.10 |
| <a name="module_lambda_command_processor"></a> [lambda\_command\_processor](#module\_lambda\_command\_processor) | git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/lambda | v2.0.10 |
| <a name="module_lambda_event_command_transformer"></a> [lambda\_event\_command\_transformer](#module\_lambda\_event\_command\_transformer) | git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/lambda | v2.0.10 |
| <a name="module_lambda_lambda_apim_refresh_token"></a> [lambda\_lambda\_apim\_refresh\_token](#module\_lambda\_lambda\_apim\_refresh\_token) | git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/lambda | v2.0.10 |
| <a name="module_s3bucket_cf_logs"></a> [s3bucket\_cf\_logs](#module\_s3bucket\_cf\_logs) | git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/s3bucket | v1.0.9 |
| <a name="module_s3bucket_static_assets"></a> [s3bucket\_static\_assets](#module\_s3bucket\_static\_assets) | git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/s3bucket | v1.0.9 |
| <a name="module_sqs_command"></a> [sqs\_command](#module\_sqs\_command) | git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/sqs | v2.0.10 |
| <a name="module_sqs_inbound_event"></a> [sqs\_inbound\_event](#module\_sqs\_inbound\_event) | git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/sqs | v2.0.10 |
## Outputs

| Name | Description |
|------|-------------|
| <a name="output_deployment"></a> [deployment](#output\_deployment) | Deployment details used for post-deployment scripts |
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
