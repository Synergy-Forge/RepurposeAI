# GitHub Actions Secrets Configuration

## Required Secrets for Worker Deployment Pipeline

Para que o workflow `.github/workflows/worker.yml` funcione corretamente, os seguintes secrets precisam ser configurados no GitHub:

### Azure Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AZURE_CLIENT_ID` | Azure Service Principal Client ID | `12345678-1234-1234-1234-123456789012` |
| `AZURE_TENANT_ID` | Azure Tenant ID | `87654321-4321-4321-4321-210987654321` |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID | `abcdef12-3456-7890-abcd-ef1234567890` |
| `AZURE_ACR_NAME` | Azure Container Registry Name | `repurposeaiacr` |
| `AZURE_CONTAINERAPP_NAME` | Azure Container App Name | `repurposeai-worker` |
| `AZURE_RESOURCE_GROUP` | Azure Resource Group Name | `repurposeai-rg` |

### Como Configurar

1. Acesse o repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione cada secret listado acima

### Valores Específicos do Projeto

Os valores específicos devem ser obtidos do Azure Portal ou da equipe de DevOps responsável pela infraestrutura.

### Status do Workflow

⚠️ **Importante**: O workflow `.github/workflows/worker.yml` só funcionará após todos os secrets serem configurados.

Atualmente o workflow está configurado para rodar apenas quando:
- Push na branch `main`
- Alterações nos arquivos relacionados ao worker:
  - `Dockerfile.worker`
  - `src/lib/redis/**`
  - `src/lib/queues/**`
  - `src/lib/workers/**`
  - `.github/workflows/worker.yml`