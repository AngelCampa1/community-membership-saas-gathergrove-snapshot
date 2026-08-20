# GatherGrove Frontend

This is the frontend application for GatherGrove, built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui components.

## Technology Stack

- **Next.js 15.3.2** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible UI components
- **Axios** - HTTP client for API calls
- **Yarn** - Package manager

## Project Structure

```
client/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── page.tsx          # Landing page
│   │   ├── resources/        # Club management resources and guides
│   │   ├── admin/            # Admin dashboard and management
│   │   ├── app/              # Member-facing application
│   │   ├── payment/          # Payment processing pages
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/           # React Components
│   │   ├── features/         # Feature-specific components (e.g., MemberManagement)
│   │   ├── shared/           # Reusable components across the app (e.g., Header, Footer)
│   │   └── ui/               # shadcn/ui components
│   ├── hooks/                # Custom React Hooks (e.g., useDebounce)
│   ├── lib/                  # Utility functions (e.g., utils.ts from shadcn)
│   └── services/             # API client logic
├── public/                   # Static assets
├── .env.local               # Environment variables
└── components.json          # shadcn/ui configuration
```

## Application Architecture

The application is organized into distinct sections:

### Public Pages
- **Landing Page**: Main marketing page at `/`
- **Resources**: Club management guides and resources at `/resources`
- **Payment**: Payment processing pages at `/payment`

### Admin Application  
- **Purpose**: Club administrator dashboard and management tools
- **Layout**: Admin-specific layout with navigation sidebar
- **Pages**: Dashboard, members, events, settings, communications
- **URL Structure**: `/admin/*`

### Member Application
- **Purpose**: Member-facing application for club participation
- **Layout**: Member-specific layout with simplified navigation
- **Pages**: Dashboard, profile, events, chat, directory
- **URL Structure**: `/app/*`

This structure provides clear separation between public content, admin tools, and member features while maintaining clean URL paths.

## Getting Started

### Prerequisites

- Node.js 18+ 
- Yarn package manager

### Installation

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the development server:
   ```bash
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `yarn dev` - Start development server with Turbopack
- `yarn build` - Build the application for production
- `yarn start` - Start the production server
- `yarn lint` - Run ESLint

## Environment Variables

Create a `.env.local` file in the root directory with:

```
NEXT_PUBLIC_API_BASE_URL=https://localhost:7123/api/v1
```

## API Integration

The application uses Axios for API calls to the .NET 8 backend. The API client is configured in `src/services/apiClient.ts` with:

- Base URL from environment variables
- JSON content type headers
- Ready for JWT token interceptors

## UI Components

This project uses shadcn/ui components with:

- **Style**: New York
- **Base Color**: Slate
- **CSS Variables**: Enabled
- **Icon Library**: Lucide React

To add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

## Development Guidelines

- Use TypeScript for all components and utilities
- Follow the established folder structure
- Place feature-specific components in `src/components/features/`
- Place reusable components in `src/components/shared/`
- Use shadcn/ui components from `src/components/ui/`
- Create custom hooks in `src/hooks/`
- Add API services in `src/services/`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
