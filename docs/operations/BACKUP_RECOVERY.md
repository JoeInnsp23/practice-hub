# Backup & Disaster Recovery Plan

This document outlines backup procedures, recovery processes, and disaster recovery strategies for Practice Hub.

---

## Table of Contents

1. [Backup Strategy](#backup-strategy)
2. [Recovery Procedures](#recovery-procedures)
3. [Disaster Recovery](#disaster-recovery)
4. [Testing & Validation](#testing--validation)

---

## Backup Strategy

### Recovery Objectives

- **RTO (Recovery Time Objective)**: 4 hours
  - Maximum acceptable downtime after disaster
- **RPO (Recovery Point Objective)**: 1 hour
  - Maximum acceptable data loss
- **Data Retention**: 30 days rolling backups

### What to Back Up

#### 1. Database (Critical - Daily)

**PostgreSQL Database**:
- All tables including: users, clients, kyc_verifications, onboarding_sessions, activity_logs
- Database schema and indexes
- User roles and permissions

**Backup Method**: Automated daily dumps

```bash
# Automated backup script (run via cron)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
DB_NAME="practice_hub"

# Create backup directory if doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup (pg_dump)
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -F c \
  -b \
  -v \
  -f "$BACKUP_DIR/practice_hub_$DATE.dump" \
  $DB_NAME

# Compress backup
gzip "$BACKUP_DIR/practice_hub_$DATE.dump"

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.dump.gz" -mtime +30 -delete

# Upload to S3 for offsite backup
aws s3 cp "$BACKUP_DIR/practice_hub_$DATE.dump.gz" \
  s3://practice-hub-backups/database/ \
  --endpoint-url $S3_ENDPOINT
```

**Schedule**: Daily at 2:00 AM UTC

#### 2. S3/Object Storage (Critical - Continuous)

**Document Storage**:
- Client identity documents
- Uploaded files during onboarding
- Generated PDFs (proposals, reports)

**Backup Method**: S3 versioning + cross-region replication (if available)

```bash
# Enable versioning on bucket
aws s3api put-bucket-versioning \
  --bucket practice-hub-onboarding \
  --versioning-configuration Status=Enabled \
  --endpoint-url $S3_ENDPOINT

# List versions of object
aws s3api list-object-versions \
  --bucket practice-hub-onboarding \
  --prefix onboarding/ \
  --endpoint-url $S3_ENDPOINT
```

**Alternative**: Periodic sync to secondary bucket

```bash
# Sync to backup bucket (run daily)
aws s3 sync s3://practice-hub-onboarding s3://practice-hub-backups-secondary \
  --endpoint-url $S3_ENDPOINT
```

#### 3. Application Configuration (Important - On Change)

**Environment Variables & Secrets**:
- Store encrypted copy in secure vault (1Password, Vault, etc.)
- Document all environment variables in `.env.production.example`

**Application Code**:
- Git repository is primary backup
- Ensure all changes committed and pushed to remote

#### 4. Activity Logs (Compliance - Long-term)

**Audit Trail**:
- `activity_logs` table contains compliance-required data
- Retention: 7 years (accounting requirements)

**Backup Method**: Annual archive to cold storage

```bash
# Export activity logs older than 1 year
psql $DATABASE_URL -c "COPY (
  SELECT * FROM activity_logs
  WHERE created_at < NOW() - INTERVAL '1 year'
) TO STDOUT WITH CSV HEADER" | gzip > activity_logs_$(date +%Y).csv.gz

# Upload to archive storage
aws s3 cp activity_logs_$(date +%Y).csv.gz \
  s3://practice-hub-archives/activity-logs/ \
  --storage-class GLACIER
```

---

### Backup Schedule

| Data Type | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| Database (full) | Daily 2:00 AM | 30 days | S3 + Local |
| Database (WAL/incremental) | Continuous | 7 days | S3 |
| S3 Documents | Continuous (versioning) | 90 days | Same bucket (versions) |
| Environment Config | On change | Indefinite | 1Password/Vault |
| Activity Logs Archive | Annually | 7 years | S3 Glacier |
| Application Code | Every commit | Indefinite | Git (GitHub/GitLab) |

---

### Backup Monitoring

**Automated Checks**:
1. **Backup Success Verification**
   ```bash
   # Check if today's backup exists
   BACKUP_FILE=$(find /backups/database -name "practice_hub_$(date +%Y%m%d)*.dump.gz" -mtime 0)
   if [ -z "$BACKUP_FILE" ]; then
     echo "ALERT: Database backup failed for $(date +%Y-%m-%d)"
     # Send alert to team
   fi
   ```

2. **Backup File Integrity**
   ```bash
   # Test backup file can be read
   gzip -t $BACKUP_FILE
   if [ $? -ne 0 ]; then
     echo "ALERT: Backup file corrupted: $BACKUP_FILE"
   fi
   ```

3. **S3 Upload Verification**
   ```bash
   # Verify backup uploaded to S3
   aws s3 ls s3://practice-hub-backups/database/practice_hub_$(date +%Y%m%d) \
     --endpoint-url $S3_ENDPOINT
   ```

**Manual Checks** (Weekly):
- Verify backup files exist for last 7 days
- Check backup file sizes are reasonable (not 0 bytes)
- Review backup logs for errors

---

## Recovery Procedures

### Database Recovery

#### Scenario 1: Recent Data Loss (< 24 hours)

**Use Case**: Accidental deletion, corrupted transaction

**Steps**:
1. **Identify Last Good Backup**
   ```bash
   ls -lh /backups/database/ | head -10
   # or
   aws s3 ls s3://practice-hub-backups/database/ --endpoint-url $S3_ENDPOINT
   ```

2. **Stop Application** (prevents new writes)
   ```bash
   # Via hosting platform or:
   docker compose stop app
   ```

3. **Backup Current State** (in case recovery goes wrong)
   ```bash
   pg_dump $DATABASE_URL > /backups/emergency_$(date +%Y%m%d_%H%M%S).sql
   ```

4. **Restore from Backup**
   ```bash
   # Download backup from S3 if needed
   aws s3 cp s3://practice-hub-backups/database/practice_hub_20251010.dump.gz . \
     --endpoint-url $S3_ENDPOINT

   # Decompress
   gunzip practice_hub_20251010.dump.gz

   # Drop existing database (CAREFUL!)
   dropdb practice_hub

   # Create fresh database
   createdb practice_hub

   # Restore from backup
   pg_restore -d practice_hub -v practice_hub_20251010.dump
   ```

5. **Verify Data Integrity**
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM clients;
   SELECT COUNT(*) FROM kyc_verifications;
   SELECT MAX(created_at) FROM activity_logs;
   ```

6. **Restart Application**
   ```bash
   docker compose start app
   ```

7. **Test Critical Functions**
   - Login
   - View clients
   - Check KYC verifications

**Expected Recovery Time**: 30-60 minutes

---

#### Scenario 2: Complete Database Loss

**Use Case**: Hardware failure, database server crash, corruption

**Steps** (similar to above but more comprehensive):
1. **Provision New Database Server** (if hardware failed)
2. **Restore Latest Backup** (follow steps above)
3. **Restore Incremental Backups** (if using WAL archiving)
4. **Verify All Data**
5. **Update Application Connection String** (if new server)
6. **Restart Application**

**Expected Recovery Time**: 2-4 hours

---

### S3/Document Storage Recovery

#### Scenario 1: Accidental File Deletion

**Use Case**: User or admin deletes files by mistake

**Steps**:
1. **Identify Deleted File**
   ```bash
   # List object versions (if versioning enabled)
   aws s3api list-object-versions \
     --bucket practice-hub-onboarding \
     --prefix onboarding/session123/passport.pdf \
     --endpoint-url $S3_ENDPOINT
   ```

2. **Restore Previous Version**
   ```bash
   # Copy deleted version back
   aws s3api copy-object \
     --copy-source practice-hub-onboarding/onboarding/session123/passport.pdf?versionId=VERSION_ID \
     --bucket practice-hub-onboarding \
     --key onboarding/session123/passport.pdf \
     --endpoint-url $S3_ENDPOINT
   ```

**Expected Recovery Time**: 5-10 minutes

---

#### Scenario 2: Bucket Data Loss

**Use Case**: Bucket accidentally deleted or corrupted

**Steps**:
1. **Recreate Bucket**
   ```bash
   aws s3 mb s3://practice-hub-onboarding --endpoint-url $S3_ENDPOINT
   ```

2. **Restore from Secondary Bucket**
   ```bash
   aws s3 sync s3://practice-hub-backups-secondary s3://practice-hub-onboarding \
     --endpoint-url $S3_ENDPOINT
   ```

3. **Reconfigure Bucket Permissions**
   ```bash
   # Re-apply CORS, bucket policies, versioning
   ```

**Expected Recovery Time**: 1-2 hours (depending on data size)

---

### Application Recovery

#### Scenario: Application Code Issues

**Use Case**: Bad deployment, bugs introduced

**Steps**:
1. **Identify Last Working Version**
   ```bash
   git log --oneline -10
   ```

2. **Rollback to Previous Version**
   ```bash
   git revert HEAD
   # or
   git reset --hard <previous-commit-hash>
   ```

3. **Redeploy**
   ```bash
   git push origin main --force  # If reset used
   # Or trigger deployment via platform
   ```

**Expected Recovery Time**: 10-30 minutes

---

## Disaster Recovery

### Disaster Scenarios

1. **Complete Hosting Provider Outage** (Hetzner down)
2. **Regional Failure** (entire datacenter unavailable)
3. **Data Center Disaster** (fire, flood, etc.)
4. **Catastrophic Data Loss** (all backups corrupted)
5. **Security Breach** (ransomware, data exfiltration)

### DR Strategy: Hot Standby (Recommended for Production)

**Architecture**:
- Primary: Hetzner (Frankfurt)
- Secondary: AWS or another provider (different region)
- Database: Continuous replication primary → secondary
- S3: Cross-region replication
- Application: Pre-deployed standby instance

**Failover Process**:
1. Detect primary failure (monitoring alerts)
2. Verify secondary database is current (check replication lag)
3. Update DNS to point to secondary site
4. Activate secondary application instance
5. Verify functionality
6. Notify users (if downtime occurred)

**Expected Recovery Time**: 15-30 minutes

**Cost**: ~2x infrastructure costs (worth it for critical production)

---

### DR Strategy: Backup & Restore (Budget-Friendly)

**Architecture**:
- Primary: Hetzner (Frankfurt)
- Backups: S3 (offsite) + local
- Secondary: None (provision on-demand)

**Failover Process**:
1. Detect disaster
2. Provision new infrastructure (Hetzner different region or AWS)
3. Restore database from latest backup
4. Restore S3 files from backup bucket
5. Deploy application
6. Update DNS
7. Verify functionality

**Expected Recovery Time**: 2-4 hours

**Cost**: Minimal (only backup storage)

---

### DR Runbook: Complete Site Failure

**Assume**: Hetzner Frankfurt is completely unavailable

**Steps**:
1. **Confirm Disaster** (< 5 minutes)
   - Check Hetzner status page
   - Confirm cannot reach any services
   - Activate DR plan

2. **Notify Stakeholders** (< 10 minutes)
   - Send status update: "Service unavailable, activating DR"
   - Estimate recovery time: 4 hours
   - Set up status page

3. **Provision New Infrastructure** (30-60 minutes)
   - Sign up for AWS/other provider (if not pre-configured)
   - Create VPC, database instance, application servers
   - Configure security groups, networking

4. **Restore Database** (30-60 minutes)
   - Download latest backup from S3
   - Create new PostgreSQL instance
   - Restore backup
   - Verify data integrity

5. **Restore S3 Files** (30-60 minutes)
   - Create new S3 bucket
   - Copy files from backup bucket
   - Configure permissions

6. **Deploy Application** (30-60 minutes)
   - Clone git repository
   - Configure environment variables
   - Build and deploy application
   - Test locally

7. **Update DNS** (5-15 minutes + propagation time)
   - Update A records to point to new IP
   - Wait for DNS propagation (up to 1 hour)

8. **Verify & Monitor** (30 minutes)
   - Test login, core features
   - Monitor error logs
   - Check metrics

9. **Post-Recovery** (ongoing)
   - Send update: "Service restored"
   - Monitor for issues
   - Document lessons learned

**Total Expected Time**: 3-4 hours (+ DNS propagation)

---

## Testing & Validation

### Backup Testing

**Monthly**: Restore backup to test environment

```bash
# 1. Download backup
aws s3 cp s3://practice-hub-backups/database/latest.dump.gz /tmp/

# 2. Restore to test database
gunzip /tmp/latest.dump.gz
dropdb practice_hub_test
createdb practice_hub_test
pg_restore -d practice_hub_test /tmp/latest.dump

# 3. Run validation queries
psql practice_hub_test -c "SELECT COUNT(*) FROM users;"
psql practice_hub_test -c "SELECT COUNT(*) FROM kyc_verifications;"

# 4. Verify application can connect and work
# (Point test app instance to practice_hub_test)
```

**Quarterly**: Full DR drill

1. Simulate complete site failure
2. Execute DR runbook
3. Measure actual recovery time
4. Document issues encountered
5. Update runbook based on learnings

---

### Backup Validation Checklist

- [ ] Backups created successfully (last 7 days)
- [ ] Backup files not corrupted (gzip test passes)
- [ ] Backup files uploaded to S3
- [ ] Backup file sizes reasonable (not too small/large)
- [ ] S3 versioning enabled
- [ ] Test restore completes successfully
- [ ] Restored data integrity verified
- [ ] Environment secrets backed up securely
- [ ] DR runbook up to date
- [ ] Team trained on DR procedures

---

## Recovery Checklist

After any recovery procedure:

- [ ] Document what happened (incident report)
- [ ] Document what was restored (data, timestamp)
- [ ] Verify data integrity (run validation queries)
- [ ] Test critical application features
- [ ] Check for data loss (compare timestamps)
- [ ] Notify affected users (if applicable)
- [ ] Review and update backup procedures if needed
- [ ] Schedule post-mortem meeting

---

## Contact Information

### Escalation for DR Scenarios

1. **On-Call Engineer**: [Phone number]
2. **CTO/Technical Lead**: [Phone number]
3. **Hosting Provider Support**:
   - Hetzner: https://console.hetzner.cloud/support
   - AWS: https://console.aws.amazon.com/support

### External Support

- **Database Experts**: (if complex recovery needed)
- **Security Team**: (if breach suspected)
- **Legal/Compliance**: (if PII involved)

---

## Compliance & Regulations

### Data Retention Requirements

- **Client Records**: 6 years (UK accounting regulations)
- **Activity Logs**: 7 years (Companies Act 2006)
- **KYC/AML Records**: 5 years (Money Laundering Regulations 2017)

### Backup Security

- **Encryption**: All backups encrypted at rest and in transit
- **Access Control**: Only authorized personnel can access backups
- **Audit Trail**: All backup access logged
- **Geographic Restrictions**: Backups stored within UK/EU (GDPR)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**Maintained By**: Development Team

**Next Review**: 2026-01-10 (Quarterly)

**Feedback**: If you identify gaps in this DR plan, please update this document or contact dev@innspiredaccountancy.com
