#!/bin/bash

# MinIO Setup Script
# Creates the practice-hub-proposals and practice-hub-sops buckets

set -e

echo "🪣 Setting up MinIO buckets for Practice Hub..."

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
sleep 5

# Configure MinIO client
echo "🔧 Configuring MinIO client..."
docker exec practice-hub-minio mc alias set local http://localhost:9000 minioadmin minioadmin

# Create proposals bucket (public read for generated PDFs)
echo "📦 Creating practice-hub-proposals bucket..."
docker exec practice-hub-minio mc mb local/practice-hub-proposals --ignore-existing

# Set public download policy for proposals
echo "🔓 Setting public read policy for proposals..."
docker exec practice-hub-minio mc anonymous set download local/practice-hub-proposals

# Create SOPs bucket (private, internal-only)
echo "📦 Creating practice-hub-sops bucket..."
docker exec practice-hub-minio mc mb local/practice-hub-sops --ignore-existing

# Enable versioning on SOPs bucket (required for compliance)
echo "🔄 Enabling versioning on practice-hub-sops..."
docker exec practice-hub-minio mc version enable local/practice-hub-sops

# SOPs bucket remains private (no anonymous access policy)
echo "🔒 practice-hub-sops bucket is private (authenticated access only)"

# Verify setup
echo "✅ Verifying setup..."
docker exec practice-hub-minio mc ls local/

echo ""
echo "✨ MinIO setup complete!"
echo ""
echo "📊 MinIO Console: http://localhost:9001"
echo "   Username: minioadmin"
echo "   Password: minioadmin"
echo ""
echo "🔌 S3 API Endpoint: http://localhost:9000"
echo "📂 Buckets:"
echo "   - practice-hub-proposals (public read)"
echo "   - practice-hub-sops (private, versioned)"
echo ""
