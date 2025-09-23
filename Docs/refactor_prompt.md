# AI Agent Prompt: Refactor Landing Page for Next.js Web App

## Context
You need to refactor a new landing page design into an existing Next.js 14 web application. The app is a SaaS platform called "Repurpose AI" for video repurposing with the following tech stack:

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with custom dark theme
- **Authentication**: NextAuth.js with Google provider
- **Payments**: Stripe integration
- **Database**: PostgreSQL with Prisma ORM

## Current Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── video/[id]/        # Video details page
│   └── page.tsx           # Main landing page (TO BE REPLACED)
├── components/            # React components
│   ├── providers/         # Context providers
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   ├── store.ts          # Zustand store
│   └── trpc.ts           # tRPC configuration
└── types/                # TypeScript type definitions
```

## Task Requirements

### 1. Replace Current Landing Page
- Replace `src/app/page.tsx` with the new landing page design
- Convert the HTML structure to Next.js React components
- Integrate with the existing app architecture

### 2. Component Structure
Create these components in `src/components/`:

- `landing/` folder containing:
  - `Hero.tsx` - Hero section with parallax effect
  - `Features.tsx` - Features grid section with video background
  - `HowItWorks.tsx` - How it works section with video
  - `Pricing.tsx` - Pricing cards section
  - `CTA.tsx` - Call-to-action section
  - `Navigation.tsx` - Header navigation component

### 3. Styling Requirements
- Convert CSS to Tailwind CSS classes
- Maintain the exact visual design including:
  - Gradient backgrounds with fixed attachment
  - Fire animation effect on "reborn" text
  - Parallax sections
  - Video backgrounds
  - Glass morphism effects on header
  - Hover animations and transitions
- Use custom CSS only where Tailwind is insufficient
- Create custom CSS file if needed in `src/styles/`

### 4. Next.js Integration
- Use Next.js `Image` component for optimized images
- Use Next.js `Link` component for navigation
- Implement proper SEO with metadata
- Handle video assets properly (place in `public/assets/`)
- Ensure proper TypeScript typing

### 5. Authentication Integration
- Replace login/signup links with NextAuth.js integration
- Show different states for authenticated/unauthenticated users
- Integrate with existing auth system from `lib/auth.ts`

### 6. Responsive Design
- Maintain all existing breakpoints and responsive behavior
- Ensure mobile hamburger menu works with Next.js state management
- Test on all device sizes

### 7. Performance Optimization
- Implement lazy loading for videos
- Optimize font loading (Space Grotesk)
- Ensure proper hydration
- Use Next.js best practices for performance

### 8. Content Updates
- Update pricing to match current SaaS model
- Ensure feature descriptions align with actual app capabilities
- Update CTA buttons to route to proper app pages
- Add proper loading states and error handling

## Key Design Elements to Preserve

### Visual Design
- Multi-color gradient background: `linear-gradient(to right, rgba(245, 186, 7, 1.0), rgba(106, 26, 107, 0.8), rgba(176, 48, 94, 1.0), rgba(26, 61, 255, 0.6), rgba(255, 255, 255, 0.5))`
- Fire animation on "reborn" text with keyframes
- Glass morphism header with blur effect
- Video backgrounds with overlay
- Parallax sections

### Typography
- Font: Space Grotesk (weights: 400, 500, 700)
- Responsive text sizing with clamp()
- Text shadows and glows

### Interactive Elements
- Smooth scroll behavior
- Hover animations
- Mobile hamburger menu
- Pricing card hover effects

## Deliverables Required

1. **Main Page Component** (`src/app/page.tsx`)
   - Clean, typed React component
   - Proper imports and metadata
   - SEO optimization

2. **Individual Components** (in `src/components/landing/`)
   - Each section as separate component
   - Proper TypeScript interfaces
   - Reusable and maintainable code

3. **Styles** (`src/styles/landing.css` if needed)
   - Custom animations and effects
   - Any CSS that can't be achieved with Tailwind

4. **Types** (`src/types/landing.ts` if needed)
   - TypeScript interfaces for components
   - Props definitions

## Authentication Integration Points

- Header navigation should check auth state
- Login/signup buttons should use NextAuth.js
- Show user avatar/name when authenticated
- Redirect authenticated users to dashboard
- Implement proper loading states

## Routing Updates

Update these links to proper Next.js routes:
- `/login/login.html` → `/auth/signin`
- `/cadastro/cadastro.html` → `/auth/signup`
- Pricing CTAs → `/dashboard` (for authenticated users)
- Features links → proper app sections

## Performance Considerations

- Lazy load video content
- Optimize gradient rendering
- Use Next.js Image optimization
- Implement proper loading states
- Minimize layout shift

## Testing Requirements

- Ensure responsive design works
- Test authentication flow
- Verify all animations work
- Check performance metrics
- Test accessibility

## Language Requirements

- **Convert all Portuguese content to English**
- Update all text content including:
  - Navigation menu items
  - Hero section text
  - Feature descriptions
  - Pricing plan names and descriptions
  - CTA button text
  - Footer content
- Use professional, marketing-focused English copy
- Maintain the same tone and messaging intent

## Content Translation Guidelines

### Navigation
- "Recursos" → "Features"
- "Como Funciona" → "How It Works"
- "Preços" → "Pricing"
- "Entrar" → "Sign In"
- "Cadastrar" → "Sign Up"

### Features Section
- "Ferramentas poderosas, resultados profissionais" → "Powerful tools, professional results"
- "Edição Inteligente com IA" → "AI-Powered Smart Editing"
- "Biblioteca de Recursos" → "Resource Library"
- And so on for all feature descriptions...

### Pricing Plans
- "Grátis" → "Free"
- "Criador" → "Creator"
- "Pro" → "Pro"
- "Equipes" → "Teams"

### CTA Section
- "Pronto para criar vídeos que impressionam?" → "Ready to create videos that impress?"
- "Comece a criar de graça" → "Start creating for free"

## Additional Notes

- **Convert from Portuguese to English** while maintaining professional tone
- Preserve all visual effects and animations
- Ensure compatibility with existing app theme
- Use TypeScript strictly
- Follow Next.js 14 app directory conventions
- Maintain dark theme compatibility
- Use modern, engaging copy that appeals to content creators and video professionals

Please provide complete, production-ready code that can be directly integrated into the existing Next.js application.