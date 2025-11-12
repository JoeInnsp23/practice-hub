/**
 * Shared database schema types and tRPC router types
 * This package exports type definitions that can be used by both web and mobile apps
 */

// Re-export your tRPC AppRouter type here
// This will be imported from your actual tRPC router once we restructure

/**
 * Placeholder for AppRouter type
 * TODO: Export this from your actual tRPC router in apps/web
 */
export type AppRouter = any; // Replace with actual AppRouter type

// You can also export your database schema types here
export * from "./schemas";
