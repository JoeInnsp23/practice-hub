#!/bin/bash

# MinIO Setup Script
# Creates the practice-hub-proposals bucket and sets public read policy

set -e

echo "🪣 Setting up MinIO bucket for Practice Hub..."

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
sleep 5

# Configure MinIO client
echo "🔧 Configuring MinIO client..."
docker exec practice-hub-minio mc alias set local http://localhost:9000 minioadmin minioadmin

# Create bucket
echo "📦 Creating practice-hub-proposals bucket..."
docker exec practice-hub-minio mc mb local/practice-hub-proposals --ignore-existing

# Set public download policy for PDFs
echo "🔓 Setting public read policy..."
docker exec practice-hub-minio mc anonymous set download local/practice-hub-proposals

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
echo "📂 Bucket: practice-hub-proposals"
echo ""
