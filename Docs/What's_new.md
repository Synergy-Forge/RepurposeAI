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