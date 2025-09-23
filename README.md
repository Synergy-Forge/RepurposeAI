# RepurposeAI - Intelligent Video Repurposing SaaS

A modern, full-stack SaaS application that transforms long-form video content into engaging, platform-optimized short clips using advanced AI technology. Built with a focus on reliability, scalability, and user experience.

## 🚀 Key Features

### Core Functionality
- **AI-Powered Video Processing**: Advanced algorithms extract the most engaging moments from long-form videos
- **Multi-Platform Optimization**: Generates clips in optimal aspect ratios (9:16 for mobile, 1:1 for social, 16:9 for web)
- **Smart Captioning**: AI-generated, contextually relevant captions for maximum engagement
- **Intelligent Hashtag Generation**: Automated hashtag suggestions based on content analysis
- **Real-time Processing**: Live progress tracking with detailed status updates
- **Batch Processing**: Handle multiple videos simultaneously for increased productivity

### User Interface & Experience
- **Modern Landing Page**: Fully responsive design with engaging animations and parallax effects
- **Dark Theme Optimized**: Professional dark theme with gradient backgrounds and glass morphism effects
- **Interactive Elements**: Smooth transitions, hover effects, and engaging micro-interactions
- **Video Backgrounds**: Cloudinary-hosted optimized videos for enhanced visual appeal
- **Mobile-First Design**: Responsive components that work seamlessly across all device sizes
- **Progressive Enhancement**: Graceful degradation for older browsers and slower connections

### User Management & Authentication
- **Secure Authentication**: Google OAuth integration with NextAuth.js
- **User Dashboard**: Comprehensive video management and analytics
- **Profile Management**: User preferences and account settings

### Subscription & Payments
- **Flexible Pricing**: Multiple subscription tiers (Free, Starter, Creator, Producer)
- **Transparent Billing**: Minutes-processed pricing model for clarity
- **Stripe Integration**: Secure payment processing with comprehensive webhook handling
- **Usage Tracking**: Real-time monitoring of processing minutes

### Communication & Notifications
- **Transactional Email System**: Comprehensive email infrastructure with ZeptoMail
- **Automated Notifications**: Processing completion, subscription updates, and system alerts
- **Template-Based Emails**: Professional, branded email communications
- **Queue-Based Processing**: Reliable email delivery with retry logic

### Developer Experience
- **Code Quality**: ESLint, Prettier, and Husky for consistent, high-quality code
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Automated Testing**: Comprehensive test suite for email and core functionality
- **Modern Development**: Hot reload, fast refresh, and optimized build process

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom dark theme and animations
- **UI Components**: shadcn/ui component library with custom landing page components
- **State Management**: Zustand for client-side state
- **Form Handling**: React Hook Form with validation
- **Media Optimization**: Cloudinary for video hosting and optimization
- **Animations**: Custom CSS animations with Tailwind utilities
- **Typography**: Space Grotesk font for modern, professional appearance

### Backend & APIs
- **API Layer**: tRPC for type-safe, full-stack TypeScript
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: PostgreSQL with Prisma ORM
- **File Processing**: FFmpeg for video manipulation
- **AI Services**:
  - OpenAI Whisper API for audio transcription
  - OpenAI GPT-4o for content generation and analysis

### Infrastructure & Deployment
- **Primary Deployment**: Microsoft Azure App Service
- **Database**: Azure Database for PostgreSQL
- **CI/CD**: GitHub Actions with automated deployments
- **Email Service**: ZeptoMail for transactional emails
- **Job Queue**: BullMQ with Redis for background processing
- **Monitoring**: Azure Application Insights (planned)

### Development Tools
- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks
- **Package Management**: npm with lockfile
- **Version Control**: Git with conventional commits
- **Password Management**: Bitwarden for team credentials

## 📋 Prerequisites

- **Node.js**: Version 18 or higher
- **PostgreSQL**: Version 14 or higher
- **FFmpeg**: For video processing capabilities
- **Redis**: For email queue and background jobs
- **OpenAI API Key**: For AI-powered features
- **Google OAuth Credentials**: For authentication
- **Stripe Account**: For payment processing
- **ZeptoMail Account**: For email services

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd repurpose_ai
```

### 2. Install dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Payments
STRIPE_SECRET_KEY="sk_test_your_stripe_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
STRIPE_PRO_PLAN_PRODUCT_ID="prod_your_product_id"

# AI Services
OPENAI_API_KEY="sk-your-openai-key"

# Email System
ZEPTOMAIL_API_KEY="your-zeptomail-key"
REDIS_URL="redis://localhost:6379"
EMAIL_FROM_ADDRESS="noreply@yourdomain.com"
EMAIL_FROM_NAME="RepurposeAI"

# Azure Deployment (for production)
AZURE_CREDENTIALS="your-azure-credentials-json"
```

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### 4. Install System Dependencies

**macOS:**
```bash
brew install ffmpeg redis postgresql@14
brew services start postgresql@14
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg redis-server postgresql
sudo systemctl start postgresql
sudo systemctl start redis-server
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔧 Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Copy the Client ID and Client Secret to your `.env.local`

### Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the dashboard
3. Create products and pricing plans in Stripe
4. Set up webhook endpoints for subscription events
5. Update the webhook secret in your `.env.local`

### OpenAI Setup

1. Create an account at [OpenAI](https://openai.com)
2. Generate an API key
3. Add the key to your `.env.local`

### Cloudinary Setup (for video hosting)

1. Create a [Cloudinary account](https://cloudinary.com)
2. Upload your video assets to Cloudinary
3. Use the provided URLs in the landing page components
4. Videos are automatically optimized with `q_auto` and `f_auto` parameters

## 📁 Project Structure

```
├── .github/workflows/          # CI/CD pipelines
│   └── azure-deploy.yml       # Azure deployment workflow
├── Docs/                      # Documentation
│   ├── What's_new.md         # Change log and updates
│   └── refactor_prompt.md    # Landing page refactor documentation
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migration files
├── public/                    # Static assets
│   ├── assets/               # Media assets directory
│   └── *.svg                 # Icon files
├── scripts/                   # Utility scripts
│   ├── deploy.sh             # Deployment utilities
│   ├── setup-stripe.ts       # Stripe setup script
│   └── startup.sh            # Development setup
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   ├── debug/       # Debug endpoints
│   │   │   ├── trpc/        # tRPC API endpoints
│   │   │   └── webhooks/    # Webhook handlers
│   │   ├── dashboard/       # User dashboard
│   │   ├── login/           # Authentication pages
│   │   ├── register/        # Registration pages
│   │   ├── subscription/    # Subscription management
│   │   ├── video/[id]/      # Video detail pages
│   │   ├── favicon.ico      # App icon
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout component
│   │   └── page.tsx         # Landing page (refactored)
│   ├── components/          # React components
│   │   ├── landing/         # Landing page components
│   │   │   ├── Navigation.tsx # Header navigation with auth
│   │   │   ├── Hero.tsx     # Hero section with fire animation
│   │   │   ├── Features.tsx # Features grid with video background
│   │   │   ├── HowItWorks.tsx # How it works with steps
│   │   │   ├── Pricing.tsx  # Pricing cards section
│   │   │   └── CTA.tsx      # Call-to-action section
│   │   ├── providers/       # Context providers
│   │   └── ui/             # Reusable UI components (shadcn/ui)
│   ├── lib/                # Utility libraries
│   │   ├── auth.ts         # NextAuth configuration
│   │   ├── email/          # Email system
│   │   │   ├── config.ts   # Email configuration
│   │   │   ├── queue.ts    # Email queue management
│   │   │   ├── providers/  # Email service providers
│   │   │   └── templates/  # Email templates
│   │   ├── prisma.ts       # Prisma client setup
│   │   ├── store.ts        # Zustand store
│   │   ├── theme.ts        # Theme configuration
│   │   ├── trpc.ts         # tRPC client/server setup
│   │   ├── trpc-client.ts  # tRPC client utilities
│   │   ├── transcription.ts # Audio transcription
│   │   ├── types.ts        # Common type definitions
│   │   ├── utils.ts        # Utility functions
│   │   └── video-processing.ts # Video processing logic
│   ├── server/             # tRPC server implementation
│   │   └── api/            # API routers
│   │       └── routers/    # Business logic routers
│   ├── styles/             # Custom styles
│   │   └── landing.css     # Landing page animations and effects
│   └── types/              # TypeScript type definitions
│       ├── index.ts        # Main type exports
│       └── next-auth.d.ts  # NextAuth type extensions
├── .deployment             # Azure deployment configuration
├── .eslintrc.json          # ESLint configuration
├── components.json         # shadcn/ui configuration
├── eslint.config.mjs       # Modern ESLint configuration
├── next.config.ts          # Next.js configuration
├── next-env.d.ts           # Next.js type definitions
├── postcss.config.mjs      # PostCSS configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── tsconfig.tsbuildinfo    # TypeScript build cache
└── TODO.md                 # Project todo list
```

## 🔧 Service Configuration

### Google OAuth Setup

1. Access [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project and enable Google+ API
3. Configure OAuth 2.0 credentials
4. Add authorized domains
5. Copy credentials to environment variables

### Stripe Configuration

1. Create [Stripe account](https://stripe.com)
2. Configure products and pricing in dashboard
3. Set up webhook endpoints for subscription events
4. Add webhook secret to environment variables

### Email System Setup

1. Create [ZeptoMail account](https://zeptomail.com)
2. Configure sender addresses and domains
3. Set up email templates in ZeptoMail dashboard
4. Add API key to environment variables

### Azure Deployment Setup

1. Create Azure account and resource group
2. Set up Azure Database for PostgreSQL
3. Configure Azure App Service
4. Set up GitHub Actions service principal
5. Configure deployment credentials

## 🚀 Deployment

### Azure Production Deployment

The application is configured for automated deployment to Azure:

1. **Infrastructure**: Azure App Service with PostgreSQL database
2. **Region**: North Europe for optimal performance
3. **CI/CD**: GitHub Actions workflow with automated migrations
4. **Environment**: Production environment variables configured in Azure

### Environment Variables (Production)

Configure these in your Azure App Service settings:

```env
DATABASE_URL="postgresql://user:pass@host:port/db"
NEXTAUTH_SECRET="production-secret"
NEXTAUTH_URL="https://yourdomain.com"
GOOGLE_CLIENT_ID="production-google-id"
GOOGLE_CLIENT_SECRET="production-google-secret"
STRIPE_SECRET_KEY="sk_live_production_key"
STRIPE_WEBHOOK_SECRET="whsec_production_webhook"
OPENAI_API_KEY="sk-production-openai-key"
ZEPTOMAIL_API_KEY="production-zeptomail-key"
REDIS_URL="redis://production-redis-url"
```

## 🔒 Security Features

- **Type-Safe APIs**: tRPC with full TypeScript coverage
- **Authentication**: Secure session management with NextAuth.js
- **Input Validation**: Comprehensive validation with Zod schemas
- **File Security**: Secure upload handling with type checking
- **Environment Protection**: Secure credential management
- **CORS Configuration**: Proper cross-origin request handling
- **Webhook Verification**: Stripe webhook signature validation

## 📈 Performance & Scalability

- **Server-Side Rendering**: Optimized with Next.js 14
- **Database Optimization**: Efficient queries with Prisma
- **Background Processing**: Queue-based job processing with BullMQ
- **Caching Strategy**: Intelligent caching for improved performance
- **Auto-Scaling**: Azure App Service auto-scaling capabilities
- **CDN Integration**: Azure CDN for global content delivery

## 🧪 Testing

The project includes comprehensive testing:

- **Email Testing**: Template validation and delivery testing
- **Component Testing**: React component unit tests
- **Integration Testing**: API endpoint testing
- **E2E Testing**: User workflow testing (planned)

## 🗺️ Roadmap

### Recent Completions
- [x] Landing page redesign and refactoring
- [x] Modern component architecture with TypeScript
- [x] Cloudinary video integration for optimized loading
- [x] Enhanced responsive design with mobile-first approach
- [x] Custom animations and micro-interactions

### Immediate Priorities
- [ ] Email analytics and tracking
- [ ] Advanced video editing features
- [ ] Team collaboration tools
- [ ] Mobile application

### Future Enhancements
- [ ] Custom branding templates
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations
- [ ] Multi-language support
- [ ] Advanced AI features (sentiment analysis, trend detection)

### Infrastructure Improvements
- [ ] Azure Front Door implementation
- [ ] Advanced monitoring with Application Insights
- [ ] Automated backup solutions
- [ ] Multi-region deployment

---

Built with ❤️ using cutting-edge technologies and best practices for a scalable, reliable SaaS platform.
