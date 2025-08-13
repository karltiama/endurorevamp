# GitHub Actions Setup Guide

This guide explains how to set up and use GitHub Actions for the EnduroRevamp project.

## 🚀 Overview

The project includes three main GitHub Actions workflows:

1. **CI/CD Pipeline** (`ci.yml`) - Main quality gates and testing
2. **Security Scan** (`security.yml`) - Security vulnerability scanning
3. **Deploy** (`deploy.yml`) - Production deployment

## 📋 Prerequisites

### Required GitHub Secrets

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

#### Core Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Strava Integration

```
NEXT_PUBLIC_STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
STRAVA_REFRESH_TOKEN=your_strava_refresh_token
```

#### Deployment (Optional - for Vercel)

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

#### Deployment (Optional - for Netlify)

```
NETLIFY_AUTH_TOKEN=your_netlify_auth_token
NETLIFY_SITE_ID=your_netlify_site_id
```

## 🔧 Workflow Details

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

- **Quality Gates**: TypeScript compilation, linting, tests, build verification
- **Advanced Quality**: Dependency analysis, bundle size checks
- **Database Check**: Schema validation (main branch only)
- **Summary**: Results reporting and PR comments

**Features:**

- ✅ Caching for faster builds
- ✅ Test coverage reporting
- ✅ Security audit
- ✅ PR status comments
- ✅ Timeout protection

### 2. Security Scan (`security.yml`)

**Triggers:**

- Weekly schedule (Mondays at 2 AM UTC)
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual trigger

**Jobs:**

- **Dependency Scan**: npm audit for vulnerabilities
- **Code Scan**: GitHub CodeQL analysis
- **Secret Scan**: TruffleHog for exposed secrets
- **Security Summary**: Results reporting and issue creation

**Features:**

- ✅ Automated vulnerability detection
- ✅ Code security analysis
- ✅ Secret exposure scanning
- ✅ Automatic issue creation for security alerts

### 3. Deploy (`deploy.yml`)

**Triggers:**

- Push to `main` branch
- Manual trigger with environment selection

**Jobs:**

- **Deploy**: Build, test, and prepare deployment artifacts

**Features:**

- ✅ Multiple deployment platform support
- ✅ Environment-specific deployments
- ✅ Build artifact upload
- ✅ Deployment status reporting

## 🛠️ Setup Instructions

### 1. Enable GitHub Actions

1. Go to your repository on GitHub
2. Navigate to `Settings > Actions > General`
3. Ensure "Allow all actions and reusable workflows" is selected
4. Save changes

### 2. Configure Branch Protection

1. Go to `Settings > Branches`
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Select "CI/CD Pipeline" as required status check
   - ✅ Require branches to be up to date before merging

### 3. Set Up Dependabot

1. Go to `Settings > Code security and analysis`
2. Enable "Dependency graph"
3. Enable "Dependabot alerts"
4. Enable "Dependabot security updates"

### 4. Configure CodeQL (Optional)

1. Go to `Settings > Code security and analysis`
2. Enable "Code scanning"
3. Select "CodeQL" as the analysis tool

## 📊 Monitoring and Maintenance

### Viewing Workflow Results

1. **Actions Tab**: View all workflow runs and their status
2. **Pull Requests**: See CI/CD status directly in PRs
3. **Security Tab**: Monitor security alerts and vulnerabilities
4. **Issues**: Automated security issues will be created here

### Common Issues and Solutions

#### Build Failures

- **TypeScript Errors**: Fix type errors in your code
- **Linting Errors**: Run `npm run lint:fix` locally
- **Test Failures**: Update tests or fix failing code
- **Missing Dependencies**: Ensure all required secrets are set

#### Security Alerts

- **Dependency Vulnerabilities**: Update affected packages
- **Code Security Issues**: Review and fix security issues
- **Exposed Secrets**: Remove or rotate exposed secrets

#### Performance Issues

- **Slow Builds**: Check caching configuration
- **Timeout Errors**: Optimize build process or increase timeout

## 🔄 Workflow Customization

### Adding New Jobs

To add a new job to the CI pipeline:

```yaml
new-job:
  runs-on: ubuntu-latest
  needs: quality-gates
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
    # Add your steps here
```

### Environment-Specific Configurations

Create environment-specific workflows by copying existing ones and modifying:

```yaml
# .github/workflows/ci-staging.yml
name: CI/CD Pipeline (Staging)
on:
  push:
    branches: [staging]
# ... rest of configuration
```

### Custom Deployment Platforms

To add support for a new deployment platform:

1. Add the deployment step to `deploy.yml`
2. Add required secrets to GitHub
3. Update documentation

## 📈 Best Practices

### Code Quality

- ✅ Write tests for new features
- ✅ Maintain good test coverage
- ✅ Fix linting errors promptly
- ✅ Keep dependencies updated

### Security

- ✅ Review security alerts regularly
- ✅ Update vulnerable dependencies
- ✅ Never commit secrets to code
- ✅ Use environment variables for sensitive data

### Performance

- ✅ Optimize build times with caching
- ✅ Keep workflows focused and efficient
- ✅ Use appropriate timeouts
- ✅ Monitor resource usage

## 🆘 Troubleshooting

### Workflow Not Running

1. Check if Actions are enabled in repository settings
2. Verify workflow files are in `.github/workflows/`
3. Check for syntax errors in workflow files
4. Ensure triggers are configured correctly

### Secret Issues

1. Verify all required secrets are set
2. Check secret names match workflow expectations
3. Ensure secrets have correct permissions
4. Rotate secrets if compromised

### Build Failures

1. Run commands locally to reproduce issues
2. Check for environment-specific problems
3. Review logs for specific error messages
4. Update dependencies if needed

## 📞 Support

For issues with GitHub Actions:

1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review workflow logs for specific error messages
3. Create an issue in the repository with detailed information
4. Contact the development team

## 🔄 Updates and Maintenance

### Regular Maintenance Tasks

- [ ] Review and update GitHub Actions versions monthly
- [ ] Monitor security alerts weekly
- [ ] Update dependencies as needed
- [ ] Review and optimize workflow performance
- [ ] Update documentation for changes

### Version Updates

- [ ] Keep Node.js version updated
- [ ] Update action versions regularly
- [ ] Test workflow changes in development
- [ ] Monitor for breaking changes

---

**Last Updated**: January 2024
**Maintainer**: Development Team
