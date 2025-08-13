This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables (copy `.env.example` to `.env.local`)

3. Install Husky git hooks:

```bash
npm run prepare
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Check TypeScript types
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run ci` - Run all CI checks locally

### Git Hooks

This project uses Husky to run pre-commit hooks that ensure:

- TypeScript compilation passes
- ESLint rules are satisfied
- Tests pass

### Testing

Tests are written using Jest and React Testing Library. Run tests with:

```bash
npm test
```

For coverage reports:

```bash
npm run test:coverage
```

## CI/CD

This project uses GitHub Actions for continuous integration. The CI pipeline runs on every push and pull request to ensure:

- ✅ TypeScript compilation
- ✅ Code linting
- ✅ Code formatting
- ✅ Test suite execution
- ✅ Build verification
- ✅ Security audits

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
