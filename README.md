  # Repurpose AI - Video Repurposing SaaS

A modern, full-stack SaaS application for repurposing long-form video content into engaging short-form clips optimized for social media platforms.

## 🚀 Features

- **AI-Powered Video Processing**: Automatically extracts key moments from long-form videos
- **Multi-Platform Optimization**: Generates clips in multiple aspect ratios (9:16, 1:1, 16:9)
- **Smart Captioning**: AI-generated engaging captions for each clip
- **Hashtag Generation**: Automatically suggests relevant hashtags
- **Real-time Processing**: Live progress tracking during video processing
- **User Authentication**: Google OAuth integration with NextAuth.js
- **Subscription Management**: Stripe-powered subscription system
- **Modern UI**: Dark-themed, responsive design with shadcn/ui components

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with custom dark theme
- **State Management**: Zustand
- **Backend**: tRPC for type-safe APIs
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google provider
- **Payments**: Stripe for subscription management
- **AI/Video Processing**: 
  - OpenAI Whisper API for transcription
  - OpenAI GPT-4o for content generation
  - FFmpeg for video processing
- **Deployment**: Vercel (serverless)

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- FFmpeg installed on your system
- OpenAI API key
- Google OAuth credentials
- Stripe account

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

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
STRIPE_SECRET_KEY="sk_test_12345"
STRIPE_WEBHOOK_SECRET="whsec_12345"
STRIPE_PRO_PLAN_PRODUCT_ID="prod_12345"
OPENAI_API_KEY="sk-12345"
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

### 5. Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [FFmpeg official website](https://ffmpeg.org/download.html)

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

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── video/[id]/        # Video details page
│   └── page.tsx           # Main landing page
├── components/            # React components
│   ├── providers/         # Context providers
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   ├── store.ts          # Zustand store
│   ├── trpc.ts           # tRPC configuration
│   └── video-processing.ts # Video processing utilities
├── server/               # tRPC server
│   └── api/              # API routers
└── types/                # TypeScript type definitions
```

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set all environment variables in your Vercel dashboard:

- `DATABASE_URL`: Your production PostgreSQL connection string
- `NEXTAUTH_SECRET`: A secure random string
- `NEXTAUTH_URL`: Your production domain
- `GOOGLE_CLIENT_ID`: Production Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Production Google OAuth client secret
- `STRIPE_SECRET_KEY`: Production Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Production Stripe webhook secret
- `OPENAI_API_KEY`: Your OpenAI API key

## 🔒 Security Features

- Type-safe API layer with tRPC
- Protected routes with NextAuth.js
- Input validation with Zod
- Secure file upload handling
- Environment variable protection
- CORS configuration

## 📈 Performance Optimizations

- Server-side rendering with Next.js
- Optimized video processing with FFmpeg
- Efficient database queries with Prisma
- Client-side state management with Zustand
- Lazy loading and code splitting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🔮 Roadmap

- [ ] Advanced video editing features
- [ ] Custom branding templates
- [ ] Batch processing
- [ ] Analytics dashboard
- [ ] Team collaboration features
- [ ] Mobile app
- [ ] API for third-party integrations

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
