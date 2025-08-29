# What's New - RepurposeAI

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

- **Issue:** The previous "Sign Out" button was navigating to another page with a different sign out button and then redirecting to the Google login page.  
- **Fix:** Updated the button route so it now redirects directly to the home page.  
- **Temporary Alert:** Added a `window.confirm` alert to demonstrate the secondary "Are you sure you want to sign out?" authentication step.

# Hatus Batista - (27/08/2025)

### Enhanced Code Quality and Automated Formatting with ESLint, Prettier, and Husky

To improve our development workflow and ensure a high standard of code quality and consistency across the project, we have implemented a comprehensive linting, formatting, and pre-commit hook system. This will help us catch errors early, maintain a consistent code style, and prevent improperly formatted code from being committed to the repository.

Here’s a detailed breakdown of the changes:

#### 1. Upgraded ESLint Configuration

Our ESLint setup has been enhanced with new plugins to enforce best practices:

-   **`eslint-plugin-react-hooks`**: This plugin enforces the Rules of Hooks, helping us avoid common bugs when working with React Hooks.
-   **`eslint-plugin-jsx-a11y`**: This plugin checks our JSX for common accessibility issues, making our application more inclusive and robust.
-   **`prettier` & `eslint-config-prettier`**: We've integrated Prettier for automated code formatting. `eslint-config-prettier` disables any ESLint rules that might conflict with Prettier's formatting, allowing both tools to work together seamlessly.

The `.eslintrc.json` file has been updated to reflect these changes.

#### 2. Implemented Pre-commit Hooks with Husky and lint-staged

To automate the process of code quality checks, we've set up pre-commit hooks. This means that before any code is committed, it will be automatically checked and formatted.

-   **Husky**: This tool allows us to easily manage Git hooks. We've configured it to run a script before every commit.
-   **lint-staged**: This tool runs linters on files that are staged in Git. We've configured it to run `eslint --fix` on all staged JavaScript and TypeScript files (`.js`, `.jsx`, `.ts`, `.tsx`).

**How it works:**
When a developer runs `git commit`, Husky will trigger `lint-staged`. `lint-staged` will then run `eslint --fix` on only the files that have been changed and are about to be committed. This ensures that all code entering our codebase is automatically formatted and free of linting errors, without needing to lint the entire project on every commit.

This setup significantly improves our development process by:
-   **Automating code formatting**, saving time and eliminating style debates.
-   **Enforcing code quality** before code is even committed.
-   **Improving accessibility** from the ground up.
-   **Maintaining a clean and consistent codebase**, making it easier for everyone to read and maintain.

# Felipe Abe - (29/08/2025)

#### Implemented Bitwarden as the official password manager #### 
- **We are adopting Bitwarden as our standard password manager**, to centralize and secure project and team credentials.