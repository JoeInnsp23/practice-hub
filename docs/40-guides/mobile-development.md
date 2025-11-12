---
title: Mobile Development Guide
description: Complete guide to developing, building, and deploying Practice Hub iOS and Android mobile applications
tags: [guide, mobile, ios, android, expo, react-native, monorepo, app-store, google-play]
related:
  - ../10-system/architecture-detailed/mobile-architecture.md
  - testing/README.md
  - integrations/README.md
---

# Practice Hub Mobile Apps - Monorepo Guide

This document explains how the Practice Hub monorepo is structured for both web and mobile development, and how to build and submit the mobile apps to iOS App Store and Google Play.

## 📁 Monorepo Structure

```
practice-hub/
├── apps/
│   ├── mobile-employee/       # Employee Hub - iOS & Android app
│   ├── mobile-client/          # Client Portal - iOS & Android app
│   └── web/                    # (Future) Next.js web app moved here
│
├── packages/
│   ├── shared-types/           # Shared TypeScript types and Zod schemas
│   ├── api-client/             # Shared tRPC client for React Native
│   └── db-schema/              # Database schema types and exports
│
├── pnpm-workspace.yaml         # pnpm workspace configuration
└── package.json                # Root package.json
```

## 🎯 Why Monorepo?

**Benefits:**
- ✅ **Type Safety**: Shared types between web and mobile (no drift)
- ✅ **tRPC Integration**: Same API client on web and mobile
- ✅ **Code Sharing**: Business logic, validation, utilities shared
- ✅ **Single Source of Truth**: Changes propagate automatically
- ✅ **Developer Experience**: One repo, one install, consistent tooling

**Independent Deployment:**
- Each app has its own build process
- Separate App Store and Google Play listings
- Independent version numbers and releases

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# Install all dependencies (web + mobile + shared packages)
pnpm install
```

This installs:
- Root dependencies
- Mobile app dependencies (Expo, React Native)
- Shared package dependencies (tRPC, Zod, etc.)

### 2. Run Mobile Apps

**Employee Hub:**
```bash
cd apps/mobile-employee
pnpm start              # Start Expo dev server
pnpm ios                # Run on iOS simulator
pnpm android            # Run on Android emulator
```

**Client Portal:**
```bash
cd apps/mobile-client
pnpm start              # Start Expo dev server
pnpm ios                # Run on iOS simulator
pnpm android            # Run on Android emulator
```

## 📦 Shared Packages

### `@practice-hub/shared-types`

Shared TypeScript types and Zod schemas used across all apps.

```typescript
// packages/shared-types/src/index.ts
import { z } from "zod";

export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  tenantId: z.string(),
});

export type Client = z.infer<typeof clientSchema>;
```

**Usage in mobile app:**
```typescript
import type { Client } from "@practice-hub/shared-types";

const client: Client = {
  id: "123",
  name: "ABC Corp",
  email: "contact@abc.com",
  tenantId: "tenant-1",
};
```

### `@practice-hub/api-client`

Shared tRPC client for React Native apps.

```typescript
// packages/api-client/src/index.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@practice-hub/db-schema";

export const trpc = createTRPCReact<AppRouter>();
```

**Usage in mobile app:**
```typescript
import { trpc } from "@practice-hub/api-client";

function ClientsList() {
  const { data: clients } = trpc.clients.list.useQuery();
  return <FlatList data={clients} ... />;
}
```

### `@practice-hub/db-schema`

Database schema types exported for use in mobile apps.

## 🏗️ Building for Production

### iOS App Store

#### Prerequisites
- macOS computer
- Xcode installed
- Apple Developer Account ($99/year)
- EAS Build account (free tier available)

#### Build Process

```bash
cd apps/mobile-employee

# Install EAS CLI globally (first time only)
pnpm install -g eas-cli

# Login to Expo account
eas login

# Configure the project (first time only)
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

**What you get:**
- Bundle ID: `com.practicehub.employee` (configure in `app.json`)
- Standalone `.ipa` file
- Automatic upload to App Store Connect
- TestFlight beta testing ready

#### App Store Configuration

Edit `apps/mobile-employee/app.json`:
```json
{
  "expo": {
    "name": "Practice Hub Employee",
    "slug": "practice-hub-employee",
    "ios": {
      "bundleIdentifier": "com.practicehub.employee",
      "buildNumber": "1.0.0"
    }
  }
}
```

### Google Play Store

#### Prerequisites
- Google Play Developer Account ($25 one-time fee)
- EAS Build account

#### Build Process

```bash
cd apps/mobile-employee

# Build for Android
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

**What you get:**
- Package name: `com.practicehub.employee` (configure in `app.json`)
- `.aab` (Android App Bundle) file
- Automatic upload to Google Play Console
- Internal testing track ready

#### Google Play Configuration

Edit `apps/mobile-employee/app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.practicehub.employee",
      "versionCode": 1
    }
  }
}
```

## 📱 App Store Listings

### Employee Hub App

**Name:** Practice Hub Employee
**Bundle ID:** `com.practicehub.employee` (iOS)
**Package Name:** `com.practicehub.employee` (Android)

**Description:** Mobile app for accountancy firm staff to manage clients, proposals, and practice operations on the go.

### Client Portal App

**Name:** Practice Hub Client
**Bundle ID:** `com.practicehub.client` (iOS)
**Package Name:** `com.practicehub.client` (Android)

**Description:** Secure mobile portal for clients to access their documents, proposals, and communicate with their accountant.

## 🔄 Development Workflow

### Making Changes to Shared Packages

```bash
# 1. Edit shared package
nano packages/shared-types/src/index.ts

# 2. No build step needed - TypeScript handles it
# Changes are immediately available to all apps

# 3. Test in mobile app
cd apps/mobile-employee
pnpm start
```

### Adding New Dependencies

**To a shared package:**
```bash
cd packages/shared-types
pnpm add zod
```

**To a mobile app:**
```bash
cd apps/mobile-employee
pnpm add expo-secure-store
```

### TypeScript Configuration

Each package has its own `tsconfig.json`:
- Packages use `"moduleResolution": "bundler"`
- Mobile apps use `"jsx": "react-native"`
- All inherit strict mode and common settings

## 🌐 Connecting to API

### Development

```typescript
// packages/api-client/src/index.ts
const API_URL = __DEV__
  ? "http://localhost:3000/api/trpc"  // Local development
  : "https://api.practicehub.com/api/trpc";  // Production
```

### iOS Simulator

- Use `http://localhost:3000` - works directly

### Android Emulator

- Use `http://10.0.2.2:3000` - emulator loopback
- Or use your computer's IP: `http://192.168.1.100:3000`

### Physical Devices

- Use your computer's IP address
- Or use Expo tunnel: `pnpm start --tunnel`

## 📊 Over-the-Air Updates

Expo supports **OTA (Over-the-Air) updates** for JavaScript changes without App Store review:

```bash
cd apps/mobile-employee

# Publish an update
eas update --branch production --message "Fix login bug"
```

**What can be updated OTA:**
- ✅ JavaScript code
- ✅ React components
- ✅ Assets (images, fonts)
- ❌ Native code changes (requires new build)

## 🔐 Environment Variables

### Mobile Apps

Create `apps/mobile-employee/.env`:
```bash
API_URL=https://api.practicehub.com
SENTRY_DSN=https://...
```

Access in code:
```typescript
import Constants from 'expo-constants';
const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

Configure in `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": process.env.API_URL
    }
  }
}
```

## 🧪 Testing

### Unit Tests
```bash
# Test shared packages
cd packages/shared-types
pnpm test

# Test mobile apps (using Jest)
cd apps/mobile-employee
pnpm test
```

### E2E Tests (Detox)
```bash
cd apps/mobile-employee
pnpm test:e2e
```

## 📚 Key Resources

**Expo:**
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)

**tRPC + React Native:**
- [tRPC React Native Setup](https://trpc.io/docs/client/react/setup)
- [tRPC Client Configuration](https://trpc.io/docs/client/react/useQuery)

**App Store Submission:**
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

## ❓ FAQ

### Q: Can we build the apps without a Mac?

**A:** Yes! Use **EAS Build** cloud service:
- Builds iOS apps without a Mac
- Free tier available
- `eas build --platform ios`

### Q: Do we need separate repos for iOS and Android?

**A:** No! Expo/React Native builds both from the same codebase:
- ~95% code sharing
- Platform-specific code: `Platform.OS === 'ios'`
- One repo, two apps

### Q: How do we handle different API endpoints for Employee vs Client app?

**A:** Use environment variables in each app:
```typescript
// apps/mobile-employee/.env
API_URL=https://api.practicehub.com/employee

// apps/mobile-client/.env
API_URL=https://api.practicehub.com/client-portal
```

### Q: Can we use the same authentication as the web app?

**A:** Yes! Better Auth works with React Native:
- Store token in `expo-secure-store`
- Pass token in tRPC headers
- Same session management

## 🚦 Next Steps

1. **Move web app to `apps/web`** - Complete monorepo structure
2. **Extract tRPC router types** - Share with `@practice-hub/db-schema`
3. **Set up EAS Build** - Configure cloud builds
4. **Create app icons** - Design 1024x1024 app icons
5. **Configure app.json** - Bundle IDs, permissions, etc.
6. **Test on devices** - iOS and Android physical devices
7. **Submit to stores** - Beta testing first, then production

## 📝 Notes

- **pnpm not npm**: Always use `pnpm` commands (this repo uses pnpm workspaces)
- **Workspace protocol**: `"workspace:*"` in package.json means local package
- **Type safety**: Changes to shared types update everywhere instantly
- **Build independence**: Each app builds separately for App Store submission
- **Version control**: Commit mobile apps to same Git repo
