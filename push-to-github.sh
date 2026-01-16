#!/bin/bash

# Script to push Budget Insights Platform to GitHub
# Usage: ./push-to-github.sh YOUR_GITHUB_USERNAME [REPO_NAME]

set -e

GITHUB_USERNAME=$1
REPO_NAME=${2:-"budget-insights-platform"}

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Error: GitHub username required"
    echo ""
    echo "Usage: ./push-to-github.sh YOUR_GITHUB_USERNAME [REPO_NAME]"
    echo ""
    echo "Example:"
    echo "  ./push-to-github.sh oscarvalles"
    echo "  ./push-to-github.sh oscarvalles my-budget-app"
    exit 1
fi

echo "🚀 Pushing Budget Insights Platform to GitHub..."
echo ""
echo "GitHub Username: $GITHUB_USERNAME"
echo "Repository Name: $REPO_NAME"
echo ""

# Check if remote already exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "⚠️  Remote 'origin' already exists:"
    git remote get-url origin
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    else
        echo "Keeping existing remote. Exiting."
        exit 0
    fi
else
    echo "➕ Adding remote origin..."
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

# Ensure we're on main branch
git branch -M main 2>/dev/null || true

echo ""
echo "📤 Pushing to GitHub..."
echo ""

# Check if repository exists on GitHub
if git ls-remote --exit-code --heads origin main >/dev/null 2>&1; then
    echo "✅ Repository exists on GitHub"
    echo "📤 Pushing to existing repository..."
    git push -u origin main
else
    echo "⚠️  Repository doesn't exist on GitHub yet!"
    echo ""
    echo "Please create the repository first:"
    echo "  1. Go to: https://github.com/new"
    echo "  2. Repository name: $REPO_NAME"
    echo "  3. Description: Cloud-first personal finance platform with microservices, Kubernetes, and AWS"
    echo "  4. Choose Public or Private"
    echo "  5. DO NOT initialize with README, .gitignore, or license"
    echo "  6. Click 'Create repository'"
    echo ""
    read -p "Press Enter after you've created the repository, or Ctrl+C to cancel..."
    echo ""
    echo "📤 Pushing to GitHub..."
    git push -u origin main
fi

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "📍 Your repository:"
echo "   https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
