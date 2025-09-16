# Test Pages Directory

This directory contains test and debug pages for development and testing purposes. These pages should **NOT** be deployed to production.

## 📁 Directory Structure

```
app/test/
├── README.md                           # This file
├── debug/                              # Debug tools and utilities
│   └── strava-token-check/            # Strava token validation
├── test-automatic-sync/                # Automatic sync testing
├── test-email/                         # Email functionality testing
├── test-full-sync/                     # Full sync process testing
├── test-goal-creation/                 # Goal creation flow testing
├── test-hover-sidebar/                 # Sidebar hover interactions
├── test-password-reset/                # Password reset flow testing
├── test-schema/                        # Database schema testing
├── test-sync/                          # Basic sync functionality
├── test-sync-strategy/                 # Sync strategy testing
├── test-training-load-debug/           # Training load debugging
├── test-week-boundaries/               # Week boundary calculations
└── test-weekly-training-load/          # Weekly training load testing
```

## 🧪 Test Pages Overview

### **Debug Tools**

- **`debug/strava-token-check/`**: Validate and test Strava OAuth tokens

### **Sync Testing**

- **`test-automatic-sync/`**: Test automatic background sync functionality
- **`test-full-sync/`**: Test complete sync process from start to finish
- **`test-sync/`**: Basic sync endpoint testing
- **`test-sync-strategy/`**: Test different sync strategies and configurations

### **Feature Testing**

- **`test-email/`**: Test email sending and configuration
- **`test-goal-creation/`**: Test goal creation and management flows
- **`test-password-reset/`**: Test password reset functionality
- **`test-schema/`**: Test database schema and migrations

### **UI/UX Testing**

- **`test-hover-sidebar/`**: Test sidebar hover interactions and animations
- **`test-training-load-debug/`**: Debug training load calculations and display
- **`test-week-boundaries/`**: Test week boundary calculations and logic
- **`test-weekly-training-load/`**: Test weekly training load widgets and calculations

## 🚀 Usage

### **Development Testing**

```bash
# Navigate to any test page
http://localhost:3000/test/[test-name]
```

### **Common Test Scenarios**

1. **Sync Testing**: Use sync test pages to verify Strava integration
2. **UI Testing**: Use UI test pages to check component behavior
3. **Debug Testing**: Use debug pages to troubleshoot issues
4. **Flow Testing**: Use flow test pages to verify user journeys

## ⚠️ Important Notes

### **Production Safety**

- These pages are **development-only**
- They will be automatically blocked in production by middleware
- Never expose these pages to end users

### **Testing Best Practices**

- Test one feature at a time
- Use browser dev tools for debugging
- Check console for errors and warnings
- Verify data consistency after tests

### **Cleanup**

- Remove test data created during testing
- Reset any modified settings
- Clear browser cache if needed

## 🔧 Adding New Test Pages

When adding new test pages:

1. **Create in appropriate subdirectory**:
   - Feature tests → `test-[feature-name]/`
   - Debug tools → `debug/[tool-name]/`
   - UI tests → `test-[ui-component]/`

2. **Follow naming conventions**:
   - Use `test-` prefix for feature tests
   - Use descriptive names
   - Keep URLs short and memorable

3. **Add to this README**:
   - Document purpose and usage
   - List any dependencies
   - Provide example test scenarios

4. **Include safety measures**:
   - Add production blocking in middleware
   - Include clear "development only" warnings
   - Add proper error boundaries

## 📝 Maintenance

- **Regular cleanup**: Remove obsolete test pages
- **Update documentation**: Keep this README current
- **Security review**: Ensure test pages can't be accessed in production
- **Performance**: Monitor impact on development build times

