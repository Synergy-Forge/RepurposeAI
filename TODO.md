# TODO: Deploy Webapp to Azure

1. ✅ Create Azure Resource Group in North Europe
2. ✅ Create Azure Database for PostgreSQL (Flexible Server)
3. ✅ Create Azure App Service (Linux, Node.js 20 LTS)
4. ✅ Configure database firewall and connection string
5. ✅ Create GitHub Actions workflow for CI/CD
6. ✅ Update package.json build script for Azure
7. ✅ Set environment variables in Azure App Service
8. ✅ Set DATABASE_URL in Azure App Service configuration
9. ✅ Push code to GitHub and trigger deployment
10. ✅ Fix deployment issue: Added .deployment file for proper Next.js deployment
11. ✅ Fix Azure deployment command parsing issue with bash -c wrapper
12. 🔄 Update GitHub DATABASE_URL secret with new password (AzureSecurePass123)
13. 🔄 Test the deployed application after DATABASE_URL fix
14. 🔄 Verify database migrations and API routes
15. 🔄 Consider Azure Front Door for multi-region optimization (Europe + Brazil)
16. ✅ Fix Prisma binary issue in Azure deployment by explicitly running npx prisma generate
17. ✅ Configure Azure App Service to use Node.js 20 LTS to resolve EBADENGINE warnings
