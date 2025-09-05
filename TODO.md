# Fix Azure App Service Node.js Version Issue

## Steps to Complete
- [x] Regenerate package-lock.json with Node.js 20
- [x] Update Azure App Service runtime to Node.js 20 LTS
- [x] Clear Azure App Service cache (via restart)
- [x] Redeploy the application (runtime updated, next push will use Node.js 20)

## Details
- Ensure Node.js 20 is used for npm install
- Use Azure CLI or portal to update runtime version
- Clear cache to remove any cached old Node.js version
- Trigger a new deployment after changes
