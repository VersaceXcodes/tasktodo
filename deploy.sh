#!/bin/bash

echo "🚀 Deploying TaskTodo to Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if logged in to Fly.io
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io. Please run: flyctl auth login"
    exit 1
fi

# Deploy the application
echo "🏗️  Building and deploying..."
flyctl deploy --remote-only

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your app should be available at: https://tasktodo-demo-app.fly.dev"
    echo "🔍 Check health: https://tasktodo-demo-app.fly.dev/api/health"
else
    echo "❌ Deployment failed!"
    exit 1
fi 