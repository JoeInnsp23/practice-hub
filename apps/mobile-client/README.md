# Practice Hub Client - Mobile App

Mobile portal for clients to access their documents, proposals, and communicate with their accountant.

## 🚀 Quick Start

```bash
# Install dependencies (from monorepo root)
cd /home/user/practice-hub
pnpm install

# Start development server
cd apps/mobile-client
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android
```

## 📱 Features

- ✅ View documents and proposals
- ✅ Sign documents electronically
- ✅ Secure messaging with accountant
- ✅ Invoice and payment tracking
- ✅ Type-safe API with tRPC
- ✅ Shared types with web app
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

Configure in your tRPC provider:

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
      "bundleIdentifier": "com.practicehub.client"
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
      "package": "com.practicehub.client"
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

## 🔐 Security

- ✅ Multi-tenant data isolation (tenantId + clientId)
- ✅ Secure token storage (expo-secure-store)
- ✅ Better Auth session management
- ✅ End-to-end type safety

## 📱 App Store Listing

**Name:** Practice Hub Client
**Bundle ID:** com.practicehub.client
**Category:** Business / Finance
**Platforms:** iOS 13+, Android 8+
