# Practice Hub Employee - Mobile App

Mobile application for accountancy firm staff to manage clients, proposals, and practice operations on the go.

## 🚀 Quick Start

```bash
# Install dependencies (from monorepo root)
cd /home/user/practice-hub
pnpm install

# Start development server
cd apps/mobile-employee
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android
```

## 📱 Features

- ✅ Client management
- ✅ Proposal tracking
- ✅ Multi-tenant data isolation
- ✅ Type-safe API with tRPC
- ✅ Shared types with web app
- ✅ Offline support (coming soon)
- ✅ Push notifications (coming soon)

## 🏗️ Tech Stack

- **Framework:** Expo / React Native
- **API:** tRPC (shared with web app)
- **Types:** TypeScript with shared types from `@practice-hub/shared-types`
- **State:** React Query (via tRPC)
- **Authentication:** Better Auth (shared with web app)

## 📦 Shared Packages

This app uses shared packages from the monorepo:

- `@practice-hub/shared-types` - TypeScript types and Zod schemas
- `@practice-hub/api-client` - tRPC client configuration
- `@practice-hub/db-schema` - Database schema types

## 🔧 Configuration

### API Endpoint

Edit `src/providers/TRPCProvider.tsx`:

```typescript
url: "http://localhost:3000/api/trpc", // Development
url: "https://api.practicehub.com/api/trpc", // Production
```

### Bundle ID (iOS)

Edit `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.practicehub.employee"
    }
  }
}
```

### Package Name (Android)

Edit `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.practicehub.employee"
    }
  }
}
```

## 📤 Build & Deploy

### iOS

```bash
# Install EAS CLI (first time)
pnpm install -g eas-cli

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Android

```bash
# Build for Android
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

## 📚 Documentation

See [MONOREPO_MOBILE_GUIDE.md](/MONOREPO_MOBILE_GUIDE.md) for complete monorepo documentation.

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage
```

## 🔐 Environment Variables

Create `.env` file:
```bash
API_URL=https://api.practicehub.com
SENTRY_DSN=https://...
```

## 📱 App Store Listing

**Name:** Practice Hub Employee
**Bundle ID:** com.practicehub.employee
**Category:** Business / Productivity
**Platforms:** iOS 13+, Android 8+
