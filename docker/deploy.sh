#!/bin/bash

# ============================================
# Quick Deploy Script for Supabase Stack
# ============================================
# This script helps deploy the Supabase services to your Docker server
# Usage: ./deploy.sh [server-address]
# Example: ./deploy.sh user@192.168.1.75
# ============================================

set -e  # Exit on error

# Configuration
SERVER="${1:-user@192.168.1.75}"
REMOTE_DIR="~/supabase"

echo "============================================"
echo "Supabase Docker Deployment"
echo "============================================"
echo ""
echo "Target server: $SERVER"
echo "Remote directory: $REMOTE_DIR"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "⚠️  No .env file found!"
  echo "Creating from .env.example..."
  cp .env.example .env
  echo ""
  echo "⚠️  IMPORTANT: Edit .env file with your values before deploying!"
  echo "   - Set POSTGRES_PASSWORD"
  echo "   - Generate JWT_SECRET with: openssl rand -base64 32"
  echo "   - Update API_EXTERNAL_URL if needed"
  echo ""
  read -p "Press Enter when ready to continue, or Ctrl+C to exit..."
fi

# Create remote directory
echo "Creating remote directory..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR"

# Copy files
echo "Copying files to server..."
scp docker-compose.yml "$SERVER:$REMOTE_DIR/"
scp kong.yml "$SERVER:$REMOTE_DIR/"
scp .env "$SERVER:$REMOTE_DIR/"
scp setup-db-users.sql "$SERVER:$REMOTE_DIR/"
scp README.md "$SERVER:$REMOTE_DIR/"

echo ""
echo "✓ Files copied to server"
echo ""

# Setup database users
echo "============================================"
echo "Step 1: Setup Database Users"
echo "============================================"
echo ""
echo "You need to run setup-db-users.sql as postgres superuser"
echo ""
read -p "Do you want to run it now via SSH? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Running setup-db-users.sql..."
  ssh "$SERVER" "psql -U postgres -d devdb -f $REMOTE_DIR/setup-db-users.sql"
  echo ""
  echo "✓ Database users created"
else
  echo ""
  echo "⚠️  Remember to run setup-db-users.sql manually:"
  echo "   ssh $SERVER"
  echo "   psql -U postgres -d devdb -f $REMOTE_DIR/setup-db-users.sql"
  echo ""
  read -p "Press Enter when database users are set up..."
fi

# Start Docker containers
echo ""
echo "============================================"
echo "Step 2: Start Docker Containers"
echo "============================================"
echo ""
read -p "Start Docker containers now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Starting containers..."
  ssh "$SERVER" "cd $REMOTE_DIR && docker-compose up -d"
  echo ""
  echo "✓ Containers started"
  echo ""

  # Wait a bit for services to start
  echo "Waiting for services to start (10 seconds)..."
  sleep 10

  # Show status
  echo ""
  echo "Container status:"
  ssh "$SERVER" "cd $REMOTE_DIR && docker-compose ps"
else
  echo ""
  echo "⚠️  Start containers manually:"
  echo "   ssh $SERVER"
  echo "   cd $REMOTE_DIR"
  echo "   docker-compose up -d"
fi

# Show next steps
echo ""
echo "============================================"
echo "Deployment Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Verify services are running:"
echo "   ssh $SERVER 'cd $REMOTE_DIR && docker-compose ps'"
echo ""
echo "2. Check logs:"
echo "   ssh $SERVER 'cd $REMOTE_DIR && docker-compose logs -f'"
echo ""
echo "3. Test API Gateway:"
echo "   curl http://192.168.1.75:8000/"
echo ""
echo "4. Update your frontend .env.local:"
echo "   NEXT_PUBLIC_SUPABASE_URL=http://192.168.1.75:8000"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=<copy-from-docker/.env>"
echo ""
echo "5. Access Supabase Studio:"
echo "   http://192.168.1.75:3001"
echo ""
echo "6. Start your frontend:"
echo "   npm run dev"
echo ""
echo "Troubleshooting:"
echo "   - View logs: ssh $SERVER 'cd $REMOTE_DIR && docker-compose logs -f'"
echo "   - Restart: ssh $SERVER 'cd $REMOTE_DIR && docker-compose restart'"
echo "   - Stop: ssh $SERVER 'cd $REMOTE_DIR && docker-compose down'"
echo ""
echo "Documentation: docker/README.md"
echo ""
