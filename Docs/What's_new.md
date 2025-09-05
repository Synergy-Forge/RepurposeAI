# What's New - RepurposeAI

# Hatus Batista - (05/09/2025)

### Successful Migration from Vercel to Azure: Complete Infrastructure Overhaul

After careful consideration of our growing user base in Europe and Brazil, we have successfully migrated RepurposeAI from Vercel to Microsoft Azure. This strategic move provides better performance, scalability, and cost optimization for our international user base.

## Migration Process & Infrastructure Setup

### 1. Azure Resource Provisioning

- **Resource Group**: Created `RepurposeAI-rg` in North Europe region for optimal performance across Europe and Brazil
- **Database**: Azure Database for PostgreSQL Flexible Server (`repurposeai-db`)
  - PostgreSQL version 15
  - Standard B1ms tier with 32GB storage
  - Configured with public access and proper firewall rules
- **Web App**: Azure App Service (`repurposeai-webapp`)
  - Linux environment with Node.js 20 LTS runtime
  - Standard S1 plan for production workload
  - Configured for Next.js deployment

### 2. Database Migration & Configuration

- **Connection String**: `postgresql://repurposeadmin:AzureSecurePass123@repurposeai-db.postgres.database.azure.com:5432/postgres?sslmode=require`
- **Firewall Rules**: Added GitHub Actions IP ranges (20.87.225.192-20.87.225.207) for CI/CD pipeline access
- **Environment Variables**: Configured `DATABASE_URL` in both GitHub Actions and Azure App Service
- **Prisma Integration**: Maintained existing Prisma schema with Azure PostgreSQL compatibility

### 3. CI/CD Pipeline Implementation

- **GitHub Actions Workflow**: Created `.github/workflows/azure-deploy.yml`
  - Automated build and deployment process
  - Environment variable management for secrets
  - Prisma client generation and database migrations
  - Azure Web App deployment with proper configuration
- **Build Configuration**: Updated `package.json` build script for Azure compatibility
- **Deployment File**: Added `.deployment` file for proper Next.js static generation

### 4. Security & Access Management

- **Service Principal**: Configured Azure service principal for GitHub Actions authentication
- **Secrets Management**: Set up `AZURE_CREDENTIALS` and `DATABASE_URL` in GitHub repository secrets
- **Firewall Configuration**: Implemented secure database access with IP whitelisting
- **Environment Variables**: Properly configured all required secrets (OpenAI, Stripe, NextAuth, etc.)

### 5. Application Architecture Considerations

- **Multi-Region Optimization**: Positioned in North Europe for optimal performance across target markets
- **Scalability**: Azure App Service provides auto-scaling capabilities for future growth
- **Cost Optimization**: Moved from Vercel's usage-based pricing to Azure's predictable pricing model
- **Future Enhancements**: Prepared infrastructure for Azure Front Door implementation to further optimize global performance

## Technical Challenges Resolved

### Database Authentication Issues

- **Problem**: Initial deployment failed due to PostgreSQL authentication errors
- **Solution**: Reset database admin password and updated all connection strings
- **Firewall Configuration**: Added GitHub Actions IP ranges to database firewall rules

### Build Process Optimization

- **Problem**: Next.js deployment configuration for Azure App Service
- **Solution**: Created custom `.deployment` file and updated build scripts
- **Result**: Successful automated deployment pipeline

### Environment Variable Management

- **Problem**: Coordinating secrets between GitHub Actions and Azure App Service
- **Solution**: Implemented dual configuration approach for maximum compatibility
- **Security**: Maintained secure credential management throughout migration

## Benefits Achieved

### Performance Improvements

- **Geographic Optimization**: North Europe region provides better latency for European and Brazilian users
- **Azure CDN**: Built-in content delivery network capabilities
- **Scalable Architecture**: Auto-scaling capabilities for handling traffic spikes

### Cost Optimization

- **Predictable Pricing**: Moved from Vercel's variable pricing to Azure's fixed-cost model
- **Resource Efficiency**: Right-sized Azure resources for current workload
- **Future-Proofing**: Infrastructure ready for growth without immediate cost increases

### Operational Excellence

- **Automated Deployments**: GitHub Actions provides reliable CI/CD pipeline
- **Monitoring & Logging**: Azure Application Insights integration ready
- **Backup & Recovery**: Automated database backups with Azure's built-in solutions

## Next Steps & Future Enhancements

### Immediate Priorities

- **Testing**: Complete end-to-end testing of deployed application
- **Monitoring**: Set up Azure Application Insights for performance monitoring
- **Optimization**: Fine-tune Azure resource allocation based on usage patterns

### Future Infrastructure Improvements

- **Azure Front Door**: Implement global CDN for multi-region optimization
- **Azure Key Vault**: Enhanced secrets management
- **Azure Monitor**: Comprehensive application and infrastructure monitoring
- **Azure Backup**: Automated backup solutions for database and application

### Migration Learnings

- **Database Migration**: Successfully transitioned from Vercel-hosted to Azure-managed PostgreSQL
- **CI/CD Best Practices**: Established robust deployment pipeline with proper security
- **Multi-Cloud Strategy**: Gained experience in cloud migration and optimization
- **Cost Management**: Implemented more predictable and transparent pricing model

This migration represents a significant milestone in RepurposeAI's infrastructure evolution, positioning us for sustainable growth while optimizing performance for our international user base.

## Technical Updates and Improvements - August 2025

### 1. Database Configuration and Error Resolution

- Fixed PostgreSQL connection issues
- Steps taken:
  1. Properly started PostgreSQL 14 service using `brew services start postgresql@14`
  2. Configured dual database setup:
     - Production: Neon Tech PostgreSQL (maintained in Vercel env)
     - Local: Development database for testing
  3. Updated database URLs in environment configuration

### 2. OpenAI Whisper Integration

- Successfully integrated OpenAI Whisper API for audio transcription
- Implementation details:
  1. Updated OpenAI package to version 5.15.0
  2. Created new transcription service (`src/lib/transcription.ts`):

     ```typescript
     // Basic audio transcription
     transcribeAudio(audioFile: File) -> Promise<string>

     // Video transcription with VTT captions
     transcribeVideoAudio(videoFile: File) -> Promise<string>
     ```

  3. Enhanced video processing (`src/lib/video-processing.ts`):
     - Improved file handling with proper Buffer to File conversion
     - Added support for VTT captions
     - Implemented proper error handling and cleanup

### 3. Vercel Deployment Process

- Successfully deployed to Vercel platform
- Deployment steps:
  1. Code preparation:
     - Committed all changes to GitHub
     - Ensured all environment variables were properly set
  2. Deployment configuration:
     - Verified Vercel CLI installation and login
     - Created preview deployment for testing
  3. Environment configuration:
     - Database URL (Neon Tech PostgreSQL)
     - OpenAI API key
     - Authentication credentials
     - Stripe integration keys

### 4. New Features

- Added VTT caption support for better video accessibility
- Improved error handling in transcription processes
- Enhanced file processing with proper type safety
- Added support for multiple audio/video formats

### 5. Technical Improvements

- Better error handling and logging
- Proper file type handling and conversion
- Improved database connection management
- Enhanced environment variable management

## Next Steps

- Monitor OpenAI Whisper API performance
- Optimize video processing pipeline
- Enhance error reporting and monitoring
- Consider implementing rate limiting for API calls

# Larisssa Melo - (23/08/2025)

- Generated the NEXTAUTH_SECRET using Node.js and set it as an environment variable for secure session encryption.
- Configured the Google Auth environment variables to enable Google sign-in in production.

# Felipe Abe - Fixes (23/08/2025)

### 1. Fixed 404 Error on Login Page

- **Problem:** Users were hitting a 404 error when trying to access the login page.
- **Solution:** The NextAuth.js configuration (`lib/auth.ts`) was pointing to a non-existent custom sign-in page. Removed the custom `pages` configuration to fall back to the auto-generated NextAuth page, resolving the routing issue.

### 2. Resolved Vercel Build Failures

- **Problem:** The deployment process on Vercel was failing during the build step.
- **Solution:** The build required the `OPENAI_API_KEY` at compile time, which was missing. Configured all necessary environment variables (`OPENAI_API_KEY`, `DATABASE_URL`, `NEXTAUTH_URL`, etc.) in the Vercel project settings to ensure they are available during the build process.

### 3. Automated Production Database Migrations

- **Problem:** After a successful login, the application would fail with a `Callback` error because the production database schema was not synchronized with the Prisma schema.
- **Solution:** Implemented an automated database migration workflow. The `package.json` build script was updated to `prisma generate && prisma migrate deploy && next build`. This forces Vercel to apply any new migrations from the committed `prisma/migrations` folder to the production database on every deploy, ensuring the database schema is always in sync with the application code.

# Larissa Melo - (24/08/2025)

- Removed the previous Neon database and the test Prisma instance, and created the new Prisma database that will be used as the official one for the project. Environment variables on Vercel were automatically organized accordingly to reflect this change.

# Larissa Melo - (25/08/2025)

- Fixed Google sign-in button redirection: the button no longer redirects to a page with a duplicate login button.

- Corrected NEXTAUTH_URL variable: previously included the Google callback URL, which caused a redirect loop back to the login page.

# Larissa Melo - (26/08/2025)

### Fixed Sign Out Button Behavior

### Fixed Sign Out Button Behavior

- **Issue:** The previous "Sign Out" button was navigating to another page with a different sign out button and then redirecting to the Google login page.
- **Fix:** Updated the button route so it now redirects directly to the home page.
- **Issue:** The previous "Sign Out" button was navigating to another page with a different sign out button and then redirecting to the Google login page.
- **Fix:** Updated the button route so it now redirects directly to the home page.
- **Temporary Alert:** Added a `window.confirm` alert to demonstrate the secondary "Are you sure you want to sign out?" authentication step.

# Hatus Batista - (27/08/2025)

### Enhanced Code Quality and Automated Formatting with ESLint, Prettier, and Husky

To improve our development workflow and ensure a high standard of code quality and consistency across the project, we have implemented a comprehensive linting, formatting, and pre-commit hook system. This will help us catch errors early, maintain a consistent code style, and prevent improperly formatted code from being committed to the repository.

Here’s a detailed breakdown of the changes:

#### 1. Upgraded ESLint Configuration

Our ESLint setup has been enhanced with new plugins to enforce best practices:

- **`eslint-plugin-react-hooks`**: This plugin enforces the Rules of Hooks, helping us avoid common bugs when working with React Hooks.
- **`eslint-plugin-jsx-a11y`**: This plugin checks our JSX for common accessibility issues, making our application more inclusive and robust.
- **`prettier` & `eslint-config-prettier`**: We've integrated Prettier for automated code formatting. `eslint-config-prettier` disables any ESLint rules that might conflict with Prettier's formatting, allowing both tools to work together seamlessly.
- **`eslint-plugin-react-hooks`**: This plugin enforces the Rules of Hooks, helping us avoid common bugs when working with React Hooks.
- **`eslint-plugin-jsx-a11y`**: This plugin checks our JSX for common accessibility issues, making our application more inclusive and robust.
- **`prettier` & `eslint-config-prettier`**: We've integrated Prettier for automated code formatting. `eslint-config-prettier` disables any ESLint rules that might conflict with Prettier's formatting, allowing both tools to work together seamlessly.

The `.eslintrc.json` file has been updated to reflect these changes.

#### 2. Implemented Pre-commit Hooks with Husky and lint-staged

To automate the process of code quality checks, we've set up pre-commit hooks. This means that before any code is committed, it will be automatically checked and formatted.

- **Husky**: This tool allows us to easily manage Git hooks. We've configured it to run a script before every commit.
- **lint-staged**: This tool runs linters on files that are staged in Git. We've configured it to run `eslint --fix` on all staged JavaScript and TypeScript files (`.js`, `.jsx`, `.ts`, `.tsx`).
- **Husky**: This tool allows us to easily manage Git hooks. We've configured it to run a script before every commit.
- **lint-staged**: This tool runs linters on files that are staged in Git. We've configured it to run `eslint --fix` on all staged JavaScript and TypeScript files (`.js`, `.jsx`, `.ts`, `.tsx`).

**How it works:**
When a developer runs `git commit`, Husky will trigger `lint-staged`. `lint-staged` will then run `eslint --fix` on only the files that have been changed and are about to be committed. This ensures that all code entering our codebase is automatically formatted and free of linting errors, without needing to lint the entire project on every commit.

This setup significantly improves our development process by:

- **Automating code formatting**, saving time and eliminating style debates.
- **Enforcing code quality** before code is even committed.
- **Improving accessibility** from the ground up.
- **Maintaining a clean and consistent codebase**, making it easier for everyone to read and maintain.

- **Automating code formatting**, saving time and eliminating style debates.
- **Enforcing code quality** before code is even committed.
- **Improving accessibility** from the ground up.
- **Maintaining a clean and consistent codebase**, making it easier for everyone to read and maintain.

# Felipe Abe - (29/08/2025)

#### Implemented Bitwarden as the official password manager

#### Implemented Bitwarden as the official password manager

- **We are adopting Bitwarden as our standard password manager**, to centralize and secure project and team credentials.

# Felipe Abe - (29/08/2025)

#### Made Processing Engine is smarter & more powerful

- **This update is focused on making your clip generation faster, more reliable, and more intelligent.**

### What's New & Improved

- **A More Intelligent Clipping Engine**
  Our core AI has been upgraded. It's now better at analyzing long-form content to identify high-potential moments, ensuring the clips are more relevant and engaging than before.

### Under the Hood: Reliability & Security

- **More Reliable Processing:** We've rebuilt our processing pipeline from the ground up to be more resilient. It now intelligently handles different video formats, pre-emptively checks for issues (like missing audio), and provides clearer feedback if a problem occurs.
- **Enhanced Security:** We've implemented additional safeguards to ensure your content is processed with the utmost protection.

# Larissa Melo - (31/08/2025)

### Fixed Google login and registration

- # Fixed the issue where Google login and Google registration buttons did not work due to missing NextAuth and signIn.

# Felipe Abe- (03/09/2025)

### After a deep analysis of the market and our core brand value of "Simplicity Intelligent," I've established our go-to-market pricing strategy.

- **Decided to move away from the confusing "credits" model used by competitors and adopted a transparent "Minutes Processed" system. This is a key differentiator and aligns with our user-centric approach.**
- **Defined four clear user tiers (Free, Starter, Creator, Producer), each with a distinct value proposition to create a clear upgrade path.**
- **Also conducted a full financial analysis, calculating our variable/fixed costs, margins, and break-even points to ensure this model is sustainable for the business from day one.**

# Felipe Abe- (04/09/2025)

### Foundational infrastructure for our asynchronous processing architecture, getting us ready to scale.

- **Provisioned a new project on Railway which will house our core backend services. This includes setting up the PostgreSQL database and a Redis instance that we'll use for our upcoming BullMQ job queue.**
- **I've also configured ZeptoMail as our transactional email provider. This will handle all system notifications like sign-ups, password resets, and job completion alerts.**

**This is a crucial first step towards building a backend that can handle long-running video processing jobs reliably.**

# Felipe Abe - (05/09/2025)

### Complete refactor of the video processing pipeline for improved reliability and performance.

- **Implemented audio stream validation before processing and significantly improved FFmpeg error handling with detailed stderr capture.**
- **Added transcription with precise timestamps and text sanitization for safer captions, while simplifying to single aspect ratio (9:16) for performance optimization.**
- **Removed unused functions and implemented structured AI response validation in JSON format, with detailed progress logging throughout the entire pipeline.**

**This refactor establishes a solid and reliable foundation for video processing, eliminating failure points and optimizing the user experience.**
