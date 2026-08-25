# Portainer deployment

The image publishing workflow uses a Portainer **service webhook**, not a stack GitOps webhook.

## Required configuration

- HML service image: `ghcr.io/wassis-erp/wassis-crm:hml`
- production service image: `ghcr.io/wassis-erp/wassis-crm:latest`
- repository secrets:
  - `PORTAINER_CRM_HML_WEBHOOK_URL`
  - `PORTAINER_CRM_PROD_WEBHOOK_URL`

Create the webhook from the running Docker service in Portainer. The workflow appends `?tag=hml` or `?tag=latest`; Portainer then pulls that tag and forces a service update.

Do not use the webhook from a Git-backed stack. That endpoint only redeploys when the stack repository content changes, so publishing a new image under the same tag can return success without replacing the running task.

The workflow requires HTTP `202`, which is the service-webhook success response. A missing secret or a stack webhook now fails the workflow explicitly.

If the webhook returns `Error pulling image with the specified tag` and `unauthorized`, the image was built and pushed successfully. Configure `ghcr.io` under Portainer Registries with a GitHub user and a token containing `read:packages`, then associate that registry credential with the service/stack. Recreating the webhook alone does not fix registry authentication.
