---
title: Mobile Architecture
description: Architecture overview of Practice Hub iOS and Android mobile applications built with Expo and React Native in a monorepo
tags: [architecture, mobile, ios, android, expo, react-native, monorepo]
related:
  - api-design.md
  - authentication.md
  - multi-tenancy.md
---

# Mobile Architecture

## Overview

Practice Hub includes native iOS and Android mobile applications built with **Expo (React Native)** in a **pnpm monorepo** architecture. The monorepo enables code sharing between web and mobile apps while maintaining independent deployment cycles.

## Architecture Principles

### 1. Monorepo Structure

```
practice-hub/
├── apps/
│   ├── mobile-employee/       # Employee Hub iOS/Android
│   ├── mobile-client/          # Client Portal iOS/Android
│   └── web/                    # Next.js web app (future)
│
├── packages/
│   ├── shared-types/           # TypeScript types + Zod schemas
│   ├── api-client/             # tRPC React Native client
│   └── db-schema/              # Database schema type exports
│
└── pnpm-workspace.yaml         # Workspace configuration
```

**Why Monorepo:**
- ✅ **Type Safety** - Shared types prevent drift between platforms
- ✅ **Single API Contract** - tRPC types shared across web/mobile
- ✅ **Code Reuse** - Business logic, validation, utilities
- ✅ **Developer Experience** - One repo, consistent tooling
- ✅ **Independent Deployment** - Separate app store submissions

### 2. Mobile Apps

#### Employee Hub Mobile (`apps/mobile-employee`)

**Purpose:** Native mobile app for accountancy firm staff

**Features:**
- Client management
- Proposal tracking
- Document access
- Multi-tenant data isolation
- Offline support (planned)
- Push notifications (planned)

**App Store Listing:**
- **Name:** Practice Hub Employee
- **Bundle ID:** `com.practicehub.employee` (iOS)
- **Package:** `com.practicehub.employee` (Android)
- **Platforms:** iOS 13+, Android 8+

#### Client Portal Mobile (`apps/mobile-client`)

**Purpose:** Client-facing mobile app for document access and communication

**Features:**
- View documents and proposals
- Electronic signature (DocuSeal integration)
- Secure messaging
- Invoice tracking
- Multi-tenant + client isolation
- Push notifications (planned)

**App Store Listing:**
- **Name:** Practice Hub Client
- **Bundle ID:** `com.practicehub.client` (iOS)
- **Package:** `com.practicehub.client` (Android)
- **Platforms:** iOS 13+, Android 8+

### 3. Shared Packages

#### `@practice-hub/shared-types`

**Purpose:** Shared TypeScript types and Zod validation schemas

**Contents:**
```typescript
// packages/shared-types/src/index.ts
import { z } from "zod";

export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  tenantId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Client = z.infer<typeof clientSchema>;
```

**Usage:**
- Form validation (React Hook Form + Zod)
- Type-safe API contracts
- Runtime validation
- Shared across web and mobile

#### `@practice-hub/api-client`

**Purpose:** tRPC client configured for React Native

**Contents:**
```typescript
// packages/api-client/src/index.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@practice-hub/db-schema";

export const trpc = createTRPCReact<AppRouter>();
```

**Features:**
- Type-safe API calls
- React Query integration
- Authentication headers
- Superjson transformer (Date, Map, Set support)

#### `@practice-hub/db-schema`

**Purpose:** Database schema type exports

**Contents:**
- AppRouter type from tRPC
- Database table types
- Drizzle schema exports (read-only for mobile)

## Technical Stack

### Mobile Framework

**Expo / React Native**
- **Expo SDK 54** - Managed workflow
- **React Native 0.81** - Native platform bridge
- **React 19** - UI framework

**Why Expo:**
- ✅ Over-the-air updates (JavaScript changes)
- ✅ EAS Build (cloud builds without Mac)
- ✅ Cross-platform (95%+ code sharing)
- ✅ Rich ecosystem (camera, location, notifications)
- ✅ Simplified app store submission

### API Layer

**tRPC + React Query**
- **@trpc/client 11.6** - Type-safe API calls
- **@trpc/react-query** - React hooks
- **@tanstack/react-query 5.90** - Data fetching/caching
- **superjson** - Rich type serialization

**Authentication:**
- Better Auth session token
- Stored in `expo-secure-store` (encrypted)
- Passed in tRPC HTTP headers

### Type Safety

**TypeScript 5**
- Strict mode enabled
- Shared types via workspace references
- End-to-end type safety (DB → API → Mobile)

**Validation:**
- Zod schemas (shared with web)
- React Hook Form integration
- Runtime type checking

## Data Flow

### 1. Authentication Flow

```
Mobile App
  ↓ Sign in (email/password)
  ↓
Better Auth API (/api/auth)
  ↓ Validate credentials
  ↓ Create session
  ↓
Return session token
  ↓
Mobile App stores token (expo-secure-store)
  ↓
Subsequent requests include token in headers
```

### 2. tRPC Query Flow

```typescript
// Mobile component
import { trpc } from "@practice-hub/api-client";

function ClientsList() {
  const { data: clients, isLoading } = trpc.clients.list.useQuery();

  return (
    <FlatList
      data={clients}
      renderItem={({ item }) => <ClientCard client={item} />}
    />
  );
}
```

**Flow:**
1. Component calls `trpc.clients.list.useQuery()`
2. tRPC client sends HTTP request to `/api/trpc/clients.list`
3. Server validates session (Better Auth middleware)
4. Server validates tenant context
5. tRPC router queries database (filtered by tenantId)
6. Response serialized with superjson
7. React Query caches result
8. Component re-renders with data

### 3. Multi-Tenant Isolation

**Employee Hub:**
- Session contains `tenantId` (from user's account)
- All queries automatically scoped to tenant
- Uses `getAuthContext()` helper

**Client Portal:**
- Session contains both `tenantId` AND `clientId`
- Dual isolation (firm level + client level)
- Uses `getClientPortalAuthContext()` helper

See [multi-tenancy.md](./multi-tenancy.md) for complete details.

## Build & Deployment

### Development

```bash
# Install all dependencies
pnpm install

# Start mobile dev server
cd apps/mobile-employee
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android
```

### Production Builds

#### EAS Build (Cloud)

```bash
# Install EAS CLI
pnpm install -g eas-cli

# Login to Expo
eas login

# Configure project (first time)
cd apps/mobile-employee
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production
```

**EAS Build Features:**
- ✅ Builds iOS apps without Mac
- ✅ Cloud-based (no local Xcode/Android Studio)
- ✅ Free tier available
- ✅ Automated app store submission

#### App Store Submission

**iOS (App Store Connect):**
```bash
eas submit --platform ios
```

**Android (Google Play Console):**
```bash
eas submit --platform android
```

### Over-the-Air (OTA) Updates

**JavaScript-only changes** (no native code):
```bash
cd apps/mobile-employee
eas update --branch production --message "Fix login bug"
```

**What can be updated OTA:**
- ✅ React components
- ✅ JavaScript/TypeScript code
- ✅ Assets (images, fonts)
- ❌ Native modules (requires new build)

## Security

### Authentication

- **Token Storage:** `expo-secure-store` (encrypted)
- **Session Management:** Better Auth (shared with web)
- **Token Refresh:** Automatic via Better Auth
- **Logout:** Clear token from secure store

### Data Isolation

- **Employee Hub:** Tenant-level isolation (`tenantId`)
- **Client Portal:** Dual isolation (`tenantId` + `clientId`)
- **Server Validation:** tRPC protected procedures
- **Type Safety:** Shared types prevent data leaks

### Network Security

- **HTTPS Only:** All API requests over HTTPS
- **Certificate Pinning:** (Planned) Pin API certificates
- **Request Signing:** (Planned) HMAC request signatures

## Performance

### Optimization Strategies

1. **Code Splitting**
   - Lazy load screens
   - Dynamic imports for large libraries

2. **Caching**
   - React Query automatic caching
   - Persistent cache (AsyncStorage)
   - Stale-while-revalidate pattern

3. **Bundle Size**
   - Tree shaking (Metro bundler)
   - Hermes JavaScript engine (Android)
   - Asset optimization (images, fonts)

4. **Offline Support** (Planned)
   - React Query offline cache
   - SQLite local database
   - Background sync

## Testing

### Unit Tests

```bash
# Test shared packages
cd packages/shared-types
pnpm test

# Test mobile app
cd apps/mobile-employee
pnpm test
```

### Integration Tests

- **Mock tRPC:** MSW (Mock Service Worker)
- **Component Testing:** React Testing Library
- **Navigation Testing:** React Navigation testing utilities

### E2E Tests

- **Detox:** End-to-end testing framework
- **Expo Go:** Test on physical devices
- **EAS Build:** TestFlight + Internal Testing tracks

## Future Enhancements

### Phase 1 (Q1 2025)
- [ ] Complete tRPC router integration
- [ ] Better Auth mobile SDK
- [ ] Push notifications (Expo Notifications)
- [ ] Biometric authentication (Face ID, Touch ID)

### Phase 2 (Q2 2025)
- [ ] Offline mode with SQLite
- [ ] Background sync
- [ ] Document viewer (PDF, Excel)
- [ ] Camera integration (document scanning)

### Phase 3 (Q3 2025)
- [ ] Voice/video calling
- [ ] Real-time messaging (WebSockets)
- [ ] Advanced analytics
- [ ] Widget support (iOS 17+, Android 12+)

## Development Workflow

### Adding New Features

1. **Define types** in `packages/shared-types`
2. **Add tRPC router** in web app
3. **Export AppRouter type** from `packages/db-schema`
4. **Use in mobile** via `trpc.*.useQuery()`
5. **Test** with mock data first
6. **Integrate** with real API

### Debugging

**Expo DevTools:**
- Element inspector
- Network requests
- JavaScript console
- React DevTools

**React Native Debugger:**
- Redux DevTools
- Network inspector
- Element inspector

**Flipper:**
- Network inspector
- Database viewer
- Layout inspector
- Crash reporter

## References

- [Mobile Development Guide](../../40-guides/mobile-development.md)
- [API Design](./api-design.md)
- [Authentication](./authentication.md)
- [Multi-Tenancy](./multi-tenancy.md)

## External Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [tRPC Documentation](https://trpc.io/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
