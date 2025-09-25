# AI Agent Prompt: Refactor Dashboard for Next.js Web App

## Context
You need to refactor a new dashboard design into an existing Next.js 14 web application. The app is a SaaS platform called "RepurposeAI" for intelligent video repurposing with the following tech stack:

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with custom dark theme
- **State Management**: Zustand for client-side state
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: PostgreSQL with Prisma ORM
- **APIs**: tRPC for type-safe, full-stack TypeScript

## Current Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard (TO BE REPLACED)
│   ├── login/             # Authentication pages
│   ├── register/          # Registration pages
│   ├── subscription/      # Subscription management
│   └── video/[id]/        # Video detail pages
├── components/            # React components
│   ├── providers/         # Context providers
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── store.ts          # Zustand store
│   └── trpc.ts           # tRPC configuration
└── types/                # TypeScript type definitions
```

## Task Requirements

### 1. Replace Dashboard Pages
- Replace existing dashboard in `src/app/dashboard/` with new design
- Convert HTML structure to Next.js React components with TypeScript
- Integrate with existing authentication and data systems

### 2. Component Architecture
Create these components in `src/components/dashboard/`:

#### Core Layout Components:
- `DashboardLayout.tsx` - Main dashboard wrapper with sidebar
- `Sidebar.tsx` - Navigation sidebar with gradient background
- `Header.tsx` - Top header with user menu and theme toggle
- `UserMenu.tsx` - User profile dropdown with subscription info

#### Page Components:
- `DashboardPage.tsx` - Main analytics dashboard with charts
- `UploadPage.tsx` - File upload interface with drag & drop
- `AIClipsPage.tsx` - AI clip finder interface
- `ProjectsPage.tsx` - Projects management with empty/populated states
- `TemplatesPage.tsx` - Template browser with search functionality
- `EditorPage.tsx` - Video editor interface with timeline
- `SettingsPage.tsx` - User settings with tabbed interface

#### UI Components:
- `KPICard.tsx` - Metric display cards
- `ChartContainer.tsx` - Chart wrapper components
- `TemplateCard.tsx` - Template preview cards
- `ThemeToggle.tsx` - Light/dark theme switcher

### 3. Styling Requirements
- Convert CSS to Tailwind CSS classes while maintaining exact visual design
- Preserve gradient backgrounds, animations, and hover effects
- Implement proper dark/light theme system using CSS variables
- Use custom CSS only where Tailwind is insufficient
- Create `src/styles/dashboard.css` for custom animations and effects

### 4. Next.js Integration
- Use Next.js App Router for routing (`/dashboard/upload`, `/dashboard/projects`, etc.)
- Implement proper SEO with metadata for each page
- Use Next.js `Image` component for optimized images
- Handle client-side routing with proper loading states
- Ensure proper TypeScript typing throughout

### 5. Authentication Integration
- Connect with existing NextAuth.js system from `lib/auth.ts`
- Show user information in header and user menu
- Implement proper protected routes
- Handle loading and error states for user data
- Display subscription information and usage metrics

### 6. Data Integration
- Connect with existing tRPC APIs for user data, projects, and metrics
- Implement real data fetching for KPI cards and charts
- Handle loading states and error handling
- Cache data appropriately for performance

### 7. Interactive Features
- Implement Chart.js integration for dashboard analytics
- Add proper file upload functionality with progress tracking
- Create working search and filter functionality for templates
- Implement sidebar navigation with active state management
- Add proper form handling for settings pages

## Key Design Elements to Preserve

### Visual Design
- Gradient sidebar: `linear-gradient(to bottom, #4f46e5, #a78bfa)` (dark theme)
- Custom color scheme with CSS variables for theming
- Glass morphism effects and subtle shadows
- Hover animations and smooth transitions
- Inter font family throughout

### Interactive Elements
- Collapsible sidebar with toggle button
- Theme switcher with smooth transitions
- User menu dropdown with subscription progress
- Template search with real-time filtering
- Editor tool selection with active states

### Layout Structure
- Fixed sidebar with main content area
- Responsive design with mobile considerations
- Proper scroll handling for different sections
- Loading states and empty states

## Routing Structure

Update routing to use Next.js App Router:
```
/dashboard              → DashboardPage (analytics)
/dashboard/upload       → UploadPage
/dashboard/ai-clips     → AIClipsPage
/dashboard/projects     → ProjectsPage
/dashboard/templates    → TemplatesPage
/dashboard/editor       → EditorPage
/dashboard/settings     → SettingsPage
```

## Data Integration Points

### User Data
- Display user name, email, and avatar
- Show subscription plan and usage metrics
- Handle authentication state changes

### Analytics Data
- Time saved, videos processed, words transcribed
- Project status distribution (completed, processing, draft)
- ROI charts with actual data from database

### Projects Data
- List user projects with status and metadata
- Handle empty states vs populated project lists
- Project creation and management functionality

### Templates Data
- Template library with search and filtering
- Template categories and tags
- Template usage tracking

## Performance Considerations

- Implement lazy loading for heavy components
- Use React.memo for expensive computations
- Optimize chart rendering and updates
- Implement proper loading states
- Cache frequently accessed data

## TypeScript Requirements

Create type definitions in `src/types/dashboard.ts`:
```typescript
interface DashboardMetrics {
  timeSaved: number;
  videosProcessed: number;
  wordsTranscribed: number;
  hashtagsCreated: number;
}

interface Project {
  id: string;
  name: string;
  status: 'completed' | 'processing' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

interface Template {
  id: string;
  name: string;
  description: string;
  tags: string[];
  thumbnail?: string;
}
```

## State Management

Integrate with existing Zustand store:
- Dashboard metrics state
- Current page/navigation state
- Theme preferences
- User preferences and settings
- Upload progress tracking

## Authentication Requirements

- Protect all dashboard routes with authentication
- Redirect unauthenticated users to login
- Handle session expiration gracefully
- Show appropriate loading states during auth checks

## Chart Integration

Implement Chart.js with proper theming:
- ROI bar chart with gradient colors
- Project status pie chart
- Proper theme-aware color schemes
- Responsive chart sizing
- Chart data updates based on real metrics

## Theme System

Implement comprehensive theming:
- CSS variables for all colors
- Smooth theme transitions
- Persistent theme preferences
- Chart color updates on theme change
- Proper contrast ratios for accessibility

## Error Handling

- Implement proper error boundaries
- Handle API errors gracefully
- Show user-friendly error messages
- Provide retry mechanisms where appropriate
- Log errors for debugging

## Accessibility

- Ensure proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management for interactive elements

## Testing Considerations

- Component unit tests
- Integration tests for data fetching
- E2E tests for critical user flows
- Performance testing for chart rendering
- Accessibility testing

## Deliverables Required

1. **Dashboard Layout** (`src/app/dashboard/layout.tsx`)
   - Main dashboard wrapper with authentication checks
   - Sidebar and header integration

2. **Page Components** (in `src/app/dashboard/[page]/page.tsx`)
   - Each dashboard page as separate route
   - Proper metadata and SEO

3. **Reusable Components** (in `src/components/dashboard/`)
   - All dashboard-specific components
   - Proper TypeScript interfaces
   - Responsive and accessible design

4. **Styles** (`src/styles/dashboard.css`)
   - Custom animations and theme variables
   - Chart.js theme integration

5. **Types** (`src/types/dashboard.ts`)
   - TypeScript interfaces for all data structures
   - Component prop definitions

6. **API Integration**
   - tRPC router updates for dashboard data
   - Proper error handling and loading states

## Migration Notes

- Preserve all existing functionality
- Maintain compatibility with current authentication system
- Ensure smooth user experience during transition
- Test thoroughly across different screen sizes
- Validate accessibility compliance

## Additional Requirements

- Use React Server Components where appropriate
- Implement proper loading.tsx files for each route
- Add proper error.tsx files for error handling
- Follow Next.js 14 best practices
- Maintain consistent code style with existing codebase

Please provide complete, production-ready code that seamlessly integrates with the existing RepurposeAI application architecture while delivering the enhanced dashboard experience.