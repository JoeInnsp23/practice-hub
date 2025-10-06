# Gemini Code Assistant Context

This document provides context for the Gemini AI assistant to understand the `practice-hub` project.

## Project Overview

`practice-hub` is a multi-tenant business management application for UK accountancy firms. The project is a full-stack Next.js application built with TypeScript, React, and Node.js. It uses a PostgreSQL database with Drizzle ORM, tRPC for API communication, and Better Auth for user authentication. The application is designed to be deployed with Docker.

The application provides a comprehensive suite of features, including:

-   **Multi-tenancy**: The application supports multiple tenants, each with its own isolated data.
-   **User Management**: Users can be invited to a tenant and assigned different roles.
-   **Client Management**: A complete CRM for managing client information, contacts, and services.
-   **Task Management**: A task management system with features for assigning tasks, tracking progress, and setting due dates.
-   **Time Tracking**: Users can track their time spent on different tasks and projects.
-   **Invoicing**: The application can generate and manage invoices for clients.
-   **Document Management**: A system for uploading, storing, and sharing documents.
-   **Workflow Automation**: The application supports custom workflows to automate business processes.
-   **Compliance Management**: A dedicated module for tracking compliance-related tasks and deadlines.
-   **Activity Logging**: The application logs all user activities for auditing and monitoring purposes.

## Building and Running

The project uses `npm` for package management and `docker-compose` for running the database in a development environment.

**Key commands:**

-   `npm install`: Install all dependencies.
-   `npm run dev`: Start the development server.
-   `npm run build`: Build the application for production.
-   `npm run start`: Start the production server.
-   `npm run lint`: Lint the codebase using Biome.
-   `npm run format`: Format the codebase using Biome.
-   `npm run db:up`: Start the PostgreSQL database with Docker Compose.
-   `npm run db:down`: Stop the PostgreSQL database.
-   `npm run db:push:dev`: Push schema changes to the development database.
-   `npm run db:generate`: Generate database migration files.
-   `npm run db:migrate`: Apply database migrations.
-   `npm run db:studio`: Open the Drizzle Studio to view and manage the database.
-   `npm run db:seed`: Seed the database with initial data.

## Development Conventions

-   **Technology Stack**:
    -   **Framework**: Next.js
    -   **Language**: TypeScript
    -   **UI**: React, Radix UI, Tailwind CSS, shadcn/ui
    -   **State Management**: React Query (TanStack Query)
    -   **API**: tRPC
    -   **Database**: PostgreSQL
    -   **ORM**: Drizzle ORM
    -   **Authentication**: Better Auth
    -   **Containerization**: Docker
-   **Code Style**: The project uses Biome for code linting and formatting. Configuration can be found in the `biome.json` file.
-   **Database Schema**: The database schema is defined in `lib/db/schema.ts` using Drizzle ORM.
-   **API Routes**: tRPC routers are defined in the `app/server/routers` directory.
-   **Components**: Reusable React components are located in the `components` directory.
-   **Multi-tenancy**: The application uses a multi-tenant architecture, with each tenant's data isolated by a `tenantId` in the database.

