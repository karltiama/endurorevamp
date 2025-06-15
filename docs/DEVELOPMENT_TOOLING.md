# Development Tooling & Security

## 🛠️ Internal Development Tools

This project includes several internal development and testing tools that are **not intended for production use**.

### Test Pages

- `/test-sync` - Comprehensive Strava sync testing and debugging tools

### Security Measures

All development tools are protected by multiple layers:

1. **Environment Check** - Pages redirect to dashboard in production
2. **Middleware Protection** - Server-level blocking of test routes in production
3. **Visual Indicators** - Clear warnings that tools are development-only

## 🚨 Security Best Practices

### ✅ DO:
- Keep all debugging/testing tools behind environment checks
- Use clear visual indicators (dev warnings, environment badges)
- Protect sensitive API endpoints with proper authentication
- Log access attempts to protected routes in production

### ❌ DON'T:
- Leave debug routes accessible in production
- Expose internal API details to end users
- Include sensitive environment variables in client-side code
- Allow testing tools to be indexed by search engines

## 🔧 Development Environment

The following routes are only available in development mode:

- `/test-sync` - Strava integration testing
- `/debug/*` - General debugging tools
- `/api/test/*` - Test API endpoints
- `/admin/debug/*` - Admin debugging interfaces

## 📁 File Structure

```
components/
├── dev/              # Development-only components
│   └── DevFooter.tsx # Shows dev environment status
├── strava/           # Strava integration components
│   ├── *Tester.tsx   # Testing components (dev only)
│   └── *Debugger.tsx # Debugging components (dev only)
app/
├── test-sync/        # Testing pages (protected)
middleware.ts         # Route protection
```

## 🚀 Production Deployment

When deploying to production:

1. All test routes will automatically redirect to `/dashboard`
2. Development components will not render
3. Debug logs will be filtered out
4. Environment warnings will be hidden

## 🧪 Testing Strategy

Our development tools follow a layered testing approach:

1. **Configuration Layer** - Environment variables and setup
2. **Authentication Layer** - OAuth flows and token management  
3. **Database Layer** - Connection status and data persistence
4. **Sync Layer** - End-to-end functionality testing

Each layer must pass before testing the next layer for optimal debugging workflow. 