<!-- BEGIN_TF_DOCS -->
<!-- markdownlint-disable -->
<!-- vale off -->

## Requirements

No requirements.
## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_aws_account_id"></a> [aws\_account\_id](#input\_aws\_account\_id) | The AWS Account ID (numeric) | `string` | n/a | yes |
| <a name="input_csi"></a> [csi](#input\_csi) | CSI for use in resources without a global namespace, i.e. Lambdas | `string` | n/a | yes |
| <a name="input_csi_global"></a> [csi\_global](#input\_csi\_global) | CSI for use in resources with a global namespace, i.e. S3 Buckets | `string` | n/a | yes |
| <a name="input_default_tags"></a> [default\_tags](#input\_default\_tags) | Default tags for resources | `map(string)` | n/a | yes |
## Modules

No modules.
## Outputs

No outputs.
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
