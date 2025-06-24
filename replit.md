# PLAYERSTATS - Football Analytics Platform

## Overview

This is a full-stack web application for football player analysis and comparison. The platform provides advanced statistics, scouting reports, and player comparisons using real-time data from external APIs like FBref and Transfermarkt. Built with modern web technologies, it features a React frontend with TypeScript, Express.js backend, and PostgreSQL database with Drizzle ORM.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool and development server
- **TailwindCSS** for styling with shadcn/ui components
- **Wouter** for client-side routing (lightweight React Router alternative)
- **TanStack Query** for server state management and data fetching
- **Component Structure**:
  - Pages: Home, PlayerProfile, Comparison, NotFound
  - UI Components: Comprehensive shadcn/ui component library
  - Custom Components: Header, Footer, SearchBar, PlayerCard, StatsTable, etc.

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with `/api` endpoints
- **Middleware**: JSON parsing, request logging, error handling
- **Services Layer**: 
  - Scraper service for external API integration
  - Football API services (FBref, Transfermarkt)
- **Storage Layer**: Abstract storage interface with in-memory implementation
- **Development Integration**: Vite middleware for hot reload

### Database Schema (PostgreSQL + Drizzle)
- **Players Table**: Core player information (name, age, position, team, market value, etc.)
- **Player Stats Table**: Seasonal statistics (goals, assists, xG, xA, passing stats, etc.)
- **Comparisons Table**: Saved player comparisons
- **Scouting Reports Table**: Advanced analytics and percentile rankings
- **Foreign Key Relationships**: Proper relational structure between entities

## Key Components

### Data Scraping & External APIs
- **FBref Integration**: Player search, profiles, and detailed statistics
- **Transfermarkt Integration**: Market values and transfer information  
- **Rate Limiting**: Built-in delays to respect API limits
- **Error Handling**: Graceful fallbacks when external services are unavailable

### Search & Discovery
- **Intelligent Search**: Searches local database first, then external APIs
- **Real-time Results**: Debounced search with instant feedback
- **Player Autocomplete**: Dropdown suggestions with player details
- **Caching Strategy**: Local storage for frequently accessed players

### Statistics & Analytics
- **Per-90 Calculations**: Normalized statistics for fair comparisons
- **Percentile Rankings**: Position-specific performance metrics
- **Visual Components**: Progress bars, heatmaps, and comparison tables
- **Comprehensive Stats**: Attacking, defensive, passing, and advanced metrics

### User Interface
- **Dark Theme**: Modern football-themed design with custom colors
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Component Library**: Consistent UI using shadcn/ui components
- **Interactive Elements**: Tooltips, modals, and smooth animations

## Data Flow

1. **User Search** → Frontend search component
2. **API Request** → Backend `/api/players/search` endpoint
3. **Local Check** → Storage layer searches existing players
4. **External Scraping** → If not found locally, scrape from FBref/Transfermarkt
5. **Data Storage** → Store scraped data in PostgreSQL
6. **Response** → Return player data to frontend
7. **Display** → Render player profile with stats and analytics

## External Dependencies

### Core Technologies
- **Node.js 20** - Runtime environment
- **PostgreSQL 16** - Primary database
- **TypeScript** - Type safety across the stack

### Frontend Libraries
- **@tanstack/react-query** - Server state management
- **wouter** - Lightweight routing
- **@radix-ui/* components** - Accessible UI primitives
- **tailwindcss** - Utility-first CSS framework
- **class-variance-authority** - Component variant management

### Backend Libraries
- **drizzle-orm** - Type-safe SQL toolkit
- **@neondatabase/serverless** - PostgreSQL driver
- **axios** - HTTP client for external APIs
- **cheerio** - Server-side HTML parsing
- **express** - Web application framework

### Development Tools
- **vite** - Build tool and dev server
- **tsx** - TypeScript execution
- **esbuild** - Fast JavaScript bundler
- **drizzle-kit** - Database migrations

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite compiles React app to `dist/public`
2. **Backend Build**: esbuild bundles server code to `dist/index.js`
3. **Database Setup**: Drizzle migrations ensure schema consistency

### Environment Configuration
- **Development**: `npm run dev` - Hot reload with Vite middleware
- **Production**: `npm run start` - Optimized builds with static file serving
- **Database**: Environment variable `DATABASE_URL` for connection

### Replit Integration
- **Auto-scaling deployment** with build and run commands
- **PostgreSQL module** provisioned automatically
- **Port configuration** (5000 internal, 80 external)
- **Workflow automation** for development and deployment

## Changelog
- June 24, 2025: Initial setup with full-stack architecture
- June 24, 2025: Migrated to PostgreSQL database with authentic player data
- June 24, 2025: Added Teams and Leagues pages with comprehensive search functionality
- June 24, 2025: Enhanced heatmap visualization with realistic position-based data
- June 24, 2025: Fixed text contrast issues for better readability
- June 24, 2025: Integrated OpenAI and ScrapNinja APIs for enhanced scraping
- June 24, 2025: Added comprehensive fallback system for player data
- June 24, 2025: Created Git repository with professional documentation
- June 24, 2025: Finalized project structure ready for GitHub deployment
- June 24, 2025: Successfully migrated from Replit Agent to standard Replit environment
- June 24, 2025: Enhanced search system with Transfermarkt integration for broader player coverage
- June 24, 2025: Improved text contrast across the entire application for better readability

## User Preferences

Preferred communication style: Simple, everyday language.
Preferred features: Search functionality covering all professional players from Transfermarkt, better text contrast for readability.