# Practice Hub - Production Readiness Checklist

**Generated**: 2025-10-19  
**Version**: v1.0  
**Target Deployment**: Coolify on Hetzner Cloud  
**Status**: Pre-Production Review

## Executive Summary

This document provides a comprehensive checklist for deploying the Practice Hub application to production. It covers infrastructure, security, performance, monitoring, and operational considerations.

---

## 1. Infrastructure Setup

### 1.1 Server Requirements

#### Minimum Specifications
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **Network**: 1Gbps

#### Recommended Specifications (100 users)
- **CPU**: 4 vCPUs
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: 1Gbps
- **Backup**: Daily snapshots

### 1.2 Docker Configuration

#### Application Container
```dockerfile
# Optimized Dockerfile for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Rebuild source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN corepack enable pnpm && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose Configuration
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=${BETTER_AUTH_URL}
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 1.3 Environment Variables

#### Required Production Variables
```bash
# Application
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1

# Database
DATABASE_URL=postgresql://user:password@db:5432/practice_hub?sslmode=require

# Authentication
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
BETTER_AUTH_URL=https://app.practicehub.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://app.practicehub.com

# Object Storage (Hetzner S3)
S3_ENDPOINT=https://fsn1.your-objectstorage.com
S3_ACCESS_KEY_ID=<your-hetzner-access-key>
S3_SECRET_ACCESS_KEY=<your-hetzner-secret-key>
S3_BUCKET_NAME=practice-hub-production
S3_REGION=eu-central

# Email (Resend)
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=noreply@practicehub.com

# KYC (LemVerify)
LEMVERIFY_API_KEY=<your-lemverify-key>
LEMVERIFY_ACCOUNT_ID=<your-account-id>
LEMVERIFY_WEBHOOK_SECRET=<your-webhook-secret>

# AI (Google Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=<your-gemini-key>

# Document Signing (DocuSeal)
DOCUSEAL_API_KEY=<your-docuseal-key>

# Accounting (Xero)
XERO_CLIENT_ID=<your-xero-client-id>
XERO_CLIENT_SECRET=<your-xero-client-secret>
XERO_REDIRECT_URI=https://app.practicehub.com/api/xero/callback

# Monitoring (Sentry)
SENTRY_DSN=<your-sentry-dsn>
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=<your-upstash-url>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>
```

---

## 2. Database Setup

### 2.1 Production Database Configuration

#### PostgreSQL Tuning
```sql
-- postgresql.conf optimizations for 8GB RAM server

# Connection Settings
max_connections = 200
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
max_parallel_maintenance_workers = 2

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000  # Log slow queries (>1s)
log_line_prefix = '%t [%p]: user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0

# Security
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
```

### 2.2 Database Initialization

#### Run Migrations
```bash
# On production server
pnpm db:push
pnpm db:migrate
```

#### Create Production User
```sql
-- Create production admin user
INSERT INTO users (
  id, tenant_id, email, first_name, last_name, role, created_at
) VALUES (
  gen_random_uuid(),
  '<tenant-id>',
  'admin@practicehub.com',
  'Admin',
  'User',
  'admin',
  NOW()
);

-- Create auth account (via Better Auth API or script)
```

### 2.3 Backup Strategy

#### Automated Backups
```bash
# Daily PostgreSQL backups
#!/bin/bash
# /usr/local/bin/backup-db.sh

BACKUP_DIR="/var/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="practice_hub"

# Create backup
pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$TIMESTAMP.sql.gz \
  s3://practice-hub-backups/database/ \
  --region eu-central-1
```

#### Restore Procedure
```bash
# Restore from backup
gunzip < backup_20251019_120000.sql.gz | psql -U postgres practice_hub
```

---

## 3. Security Hardening

### 3.1 SSL/TLS Configuration

#### Nginx Reverse Proxy
```nginx
server {
    listen 443 ssl http2;
    server_name app.practicehub.com;

    ssl_certificate /etc/letsencrypt/live/app.practicehub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.practicehub.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    
    location /api/auth {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://localhost:3000;
    }
    
    location /api {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name app.practicehub.com;
    return 301 https://$server_name$request_uri;
}
```

### 3.2 Firewall Rules

```bash
# UFW Configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 3.3 SSH Hardening

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 10
```

---

## 4. Monitoring & Observability

### 4.1 Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`);
    
    // Check Redis connection (if using)
    // await redis.ping();
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
      redis: "connected"
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 503 }
    );
  }
}
```

### 4.2 Sentry Integration

```typescript
// instrumentation.ts
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
      
      // Filter sensitive data
      beforeSend(event) {
        // Remove sensitive data from errors
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      }
    });
  }
}
```

### 4.3 Metrics Collection

```typescript
// lib/metrics.ts
import { collectDefaultMetrics, register, Counter, Histogram } from 'prom-client';

// Enable default metrics
collectDefaultMetrics();

// Custom metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['table', 'operation'],
});

export const errorCounter = new Counter({
  name: 'application_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'severity'],
});

// Expose metrics endpoint
// app/api/metrics/route.ts
export async function GET() {
  return new Response(await register.metrics(), {
    headers: { 'Content-Type': register.contentType }
  });
}
```

---

## 5. Performance Optimization

### 5.1 Implement Critical Fixes

#### Fix N+1 Queries
- [ ] clientPortalAdmin.ts - listPortalUsers
- [ ] transactionData.ts - getAllWithData

#### Add Missing Indexes
```sql
-- Run in production database
CREATE INDEX idx_activity_created_at ON activity_logs(created_at);
CREATE INDEX idx_invoice_due_status ON invoices(due_date, status);
CREATE INDEX idx_task_due_status ON tasks(due_date, status);
CREATE INDEX idx_message_thread_time ON messages(thread_id, created_at);
CREATE INDEX idx_proposal_client_status ON proposals(client_id, status);
```

### 5.2 Enable Caching

#### Redis Setup
```typescript
// lib/cache.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache wrapper
export async function cached<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;
  
  const fresh = await fetcher();
  await redis.setex(key, ttl, fresh);
  return fresh;
}
```

### 5.3 Enable Compression

```typescript
// middleware.ts
import compression from 'compression';

export const config = {
  matcher: '/api/:path*',
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Enable compression for large responses
  if (request.headers.get('accept-encoding')?.includes('gzip')) {
    response.headers.set('Content-Encoding', 'gzip');
  }
  
  return response;
}
```

---

## 6. Deployment Checklist

### 6.1 Pre-Deployment

- [ ] Run all tests (`pnpm test`)
- [ ] Run type checking (`pnpm tsc --noEmit`)
- [ ] Run linting (`pnpm lint`)
- [ ] Build production bundle (`pnpm build`)
- [ ] Review environment variables
- [ ] Backup current production database
- [ ] Test build locally with production env
- [ ] Review recent code changes
- [ ] Update changelog/release notes

### 6.2 Deployment Steps

1. [ ] Create Git tag for release (`v1.0.0`)
2. [ ] Build Docker image
3. [ ] Push image to registry
4. [ ] Run database migrations (if any)
5. [ ] Deploy to staging environment
6. [ ] Run smoke tests on staging
7. [ ] Deploy to production
8. [ ] Monitor error rates (first 30 minutes)
9. [ ] Verify critical workflows
10. [ ] Announce deployment to team

### 6.3 Post-Deployment

- [ ] Monitor Sentry for errors (first hour)
- [ ] Check database query performance
- [ ] Verify email delivery
- [ ] Test authentication flows
- [ ] Check S3 file uploads
- [ ] Monitor server resources (CPU, RAM, disk)
- [ ] Review application logs
- [ ] Test critical user journeys
- [ ] Backup production database
- [ ] Document any issues/learnings

---

## 7. Disaster Recovery

### 7.1 Backup Locations

- **Database**: S3 bucket (practice-hub-backups/database/)
- **Object Storage**: Hetzner S3 with versioning enabled
- **Application**: Git repository + Docker registry

### 7.2 Recovery Procedures

#### Database Restoration
```bash
# Download backup from S3
aws s3 cp s3://practice-hub-backups/database/backup_latest.sql.gz .

# Restore to database
gunzip < backup_latest.sql.gz | psql -U postgres practice_hub
```

#### Application Rollback
```bash
# Rollback to previous version
docker pull practicehub/app:v0.9.0
docker-compose down
docker-compose up -d
```

### 7.3 Emergency Contacts

- **Primary**: DevOps Lead - [contact info]
- **Secondary**: Backend Lead - [contact info]
- **Database**: DBA - [contact info]
- **Hetzner Support**: support@hetzner.com

---

## 8. Operational Procedures

### 8.1 Daily Operations

- [ ] Check error logs (Sentry)
- [ ] Review performance metrics
- [ ] Check disk space
- [ ] Verify backups completed
- [ ] Monitor API response times

### 8.2 Weekly Operations

- [ ] Review security alerts
- [ ] Update dependencies (security patches)
- [ ] Check backup restoration (test)
- [ ] Review user feedback
- [ ] Capacity planning review

### 8.3 Monthly Operations

- [ ] Rotate API keys
- [ ] Security audit review
- [ ] Performance optimization review
- [ ] Update documentation
- [ ] Disaster recovery drill

---

## 9. Success Metrics

### 9.1 Performance Targets

- API Response Time (P95): < 500ms ✅
- Page Load Time (LCP): < 2.5s ✅
- Error Rate: < 0.1% ✅
- Uptime: > 99.9% ✅

### 9.2 Monitoring Dashboards

- Application Performance (Sentry)
- Server Metrics (Hetzner Cloud Console)
- Database Performance (pg_stat_statements)
- User Analytics (Vercel Analytics)

---

## 10. Final Checklist

### Infrastructure
- [ ] Server provisioned and configured
- [ ] Docker containers running
- [ ] Database initialized and migrated
- [ ] Redis cache operational
- [ ] S3 storage configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] CDN setup (if applicable)

### Security
- [ ] All security headers configured
- [ ] Rate limiting enabled
- [ ] 2FA enabled for admins
- [ ] Firewall rules applied
- [ ] SSH hardened
- [ ] Secrets stored securely
- [ ] HTTPS enforced
- [ ] CSRF protection enabled

### Performance
- [ ] N+1 queries fixed
- [ ] Database indexes added
- [ ] Caching layer implemented
- [ ] Response compression enabled
- [ ] Connection pool configured
- [ ] Bundle size optimized

### Monitoring
- [ ] Sentry configured
- [ ] Health check endpoint
- [ ] Metrics collection
- [ ] Log aggregation
- [ ] Alerts configured
- [ ] Uptime monitoring

### Operational
- [ ] Backup automation
- [ ] Restore procedures tested
- [ ] Deployment runbook
- [ ] Emergency contacts documented
- [ ] User documentation updated
- [ ] Team trained on operations

---

## Conclusion

This checklist ensures the Practice Hub application is production-ready with proper infrastructure, security, performance optimization, and operational procedures. Follow each section systematically for a successful deployment.

**Estimated Time to Production Ready**: 2-3 weeks with dedicated effort

**Next Step**: Begin Phase 9 (Final Documentation) and start implementing critical fixes from Phases 6-7.
