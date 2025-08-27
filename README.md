# 🚴‍♂️ EnduroRevamp

A modern, performance-focused web application for athletes to track, analyze, and optimize their training using Strava integration and advanced analytics. Built with Next.js 14, TypeScript, and a comprehensive testing strategy.

[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://reactjs.org/)
[![Jest](https://img.shields.io/badge/Jest-29.7.0-red?logo=jest)](https://jestjs.io/)
[![Supabase](https://img.shields.io/badge/Supabase-2.49.10-green?logo=supabase)](https://supabase.com/)

## ✨ Features

- **🏃‍♀️ Strava Integration**: Seamless OAuth-based API connection for activity sync
- **📊 Advanced Analytics**: Training load analysis, performance metrics, and trend visualization
- **🎯 Dynamic Goal Management**: Adaptive training goals with progress tracking
- **📱 Modern Architecture**: Built with Next.js 14 App Router and server/client component separation
- **🧪 Comprehensive Testing**: 100% test coverage with Jest + React Testing Library
- **🎨 Beautiful UI**: Modern design with Tailwind CSS, Framer Motion, and Radix UI
- **📈 Real-time Data**: React Query for efficient data fetching and caching
- **🔒 Secure Authentication**: Supabase Auth with role-based access control

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15.3.2 (App Router)
- **Language**: TypeScript 5.0
- **UI Library**: React 19.0.0
- **Styling**: Tailwind CSS 4.0
- **State Management**: React Query (TanStack Query)
- **Animations**: Framer Motion
- **UI Components**: Radix UI, Headless UI, Lucide React

### Backend & Database

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js API Routes
- **Real-time**: Supabase Realtime

### Development & Testing

- **Testing**: Jest 29.7.0, React Testing Library
- **Linting**: ESLint 9.30.1
- **Formatting**: Prettier 3.3.3
- **Git Hooks**: Husky, lint-staged
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
endurorevamp/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   └── onboarding-demo/   # Onboarding flow
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components
│   ├── dashboard/         # Dashboard-specific components
│   ├── goals/             # Goal management components
│   └── strava/            # Strava integration components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and API clients
├── providers/              # React context providers
├── __tests__/              # Comprehensive test suite
├── types/                  # TypeScript type definitions
└── supabase/               # Database migrations and config
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Git**: For version control

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/endurorevamp.git
   cd endurorevamp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Strava API
   STRAVA_CLIENT_ID=your_strava_client_id
   STRAVA_CLIENT_SECRET=your_strava_client_secret

   # Email (Resend)
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Database Setup**

   ```bash
   # Start Supabase locally (if using local development)
   npm run supabase:start

   # Run migrations
   npm run db:migrate
   ```

5. **Start Development Server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

This project maintains comprehensive test coverage across all components, hooks, and utilities.

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests in CI mode
npm run ci
```

### Test Structure

- **Component Tests**: UI components with React Testing Library
- **Hook Tests**: Custom React hooks with proper cleanup
- **API Tests**: API route testing with mocked Supabase
- **Integration Tests**: End-to-end user flows
- **Utility Tests**: Pure function testing

### Testing Patterns

- **Mocking Strategy**: Comprehensive mocking of external dependencies
- **Test Data**: Fixtures and factories for consistent test data
- **Error Scenarios**: Testing error boundaries and edge cases
- **Performance**: Optimized test execution with Jest configuration

## 🚀 Available Scripts

| Command                 | Description                             |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | Start development server with Turbopack |
| `npm run build`         | Build for production                    |
| `npm run start`         | Start production server                 |
| `npm run lint`          | Run ESLint                              |
| `npm run lint:fix`      | Fix ESLint issues automatically         |
| `npm run type-check`    | Check TypeScript types                  |
| `npm run test`          | Run test suite                          |
| `npm run test:coverage` | Run tests with coverage report          |
| `npm run format`        | Format code with Prettier               |
| `npm run format:check`  | Check code formatting                   |
| `npm run ci`            | Run all CI checks locally               |

## 🔧 Development

### Code Quality

- **ESLint**: Strict linting rules for code consistency
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict type checking
- **Husky**: Pre-commit hooks for quality assurance

### Git Workflow

1. **Pre-commit Hooks**: Automatically run linting, formatting, and tests
2. **Branch Strategy**: Feature branches with descriptive names
3. **Commit Messages**: Conventional commit format
4. **Pull Requests**: Required for all changes

### Database Development

- **Migrations**: Version-controlled database schema changes
- **Seed Data**: Development data for testing
- **Schema Validation**: SQL scripts for schema verification

## 📊 CI/CD Pipeline

GitHub Actions automatically runs on every push and pull request:

- ✅ **TypeScript Compilation**
- ✅ **Code Linting** (ESLint)
- ✅ **Code Formatting** (Prettier)
- ✅ **Test Suite Execution** (Jest)
- ✅ **Build Verification** (Next.js build)
- ✅ **Security Audits**

## 🏗️ Architecture

### Component Architecture

- **Server Components**: SEO-optimized, server-side rendered components
- **Client Components**: Interactive components with client-side state
- **Layout Components**: Consistent page structure and navigation
- **Feature Components**: Domain-specific functionality

### Data Flow

- **React Query**: Efficient data fetching and caching
- **Supabase Client**: Type-safe database operations
- **API Routes**: Server-side API endpoints
- **Real-time Updates**: Live data synchronization

### State Management

- **React Query**: Server state management
- **Context API**: Global application state
- **Local State**: Component-level state with useState/useReducer

## 🔐 Security

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Role-based access control
- **API Security**: Rate limiting and input validation
- **Environment Variables**: Secure configuration management

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized images, fonts, and bundle size

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Write tests**: Ensure new functionality has test coverage
4. **Follow coding standards**: Use the established patterns and tools
5. **Commit your changes**: Use conventional commit format
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Provide clear description and testing notes

### Development Guidelines

- **Test Coverage**: Maintain 100% test coverage
- **Type Safety**: Use TypeScript for all new code
- **Component Design**: Follow established component patterns
- **Performance**: Consider bundle size and rendering performance
- **Accessibility**: Ensure components are accessible

## 📚 Documentation

- [API Reference](./docs/api.md) - API endpoints and usage
- [Database Schema](./docs/database.md) - Database structure and relationships
- [Testing Patterns](./docs/testing-patterns.md) - Testing best practices
- [Component Library](./docs/components.md) - UI component documentation
- [Deployment Guide](./docs/deployment.md) - Production deployment instructions

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on every push to main

### Self-Hosted

1. Build the application: `npm run build`
2. Start the production server: `npm run start`
3. Configure reverse proxy (nginx/Apache)
4. Set up SSL certificates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Strava**: For their comprehensive API and athlete data
- **Next.js Team**: For the amazing framework and App Router
- **Supabase**: For the excellent backend-as-a-service platform
- **React Testing Library**: For testing best practices
- **Tailwind CSS**: For the utility-first CSS framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/karltiama/endurorevamp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/karltiama/endurorevamp/discussions)
- **Documentation**: [Project Wiki](https://github.com/karltiama/endurorevamp/wiki)

---

**Built with ❤️ for the athletic community**
