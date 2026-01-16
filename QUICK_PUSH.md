# Quick Push to GitHub

## Step 1: Create Repository on GitHub

1. Go to: https://github.com/new
2. Repository name: `budget-insights-platform`
3. Description: `Cloud-first personal finance platform with microservices, Kubernetes, and AWS`
4. Choose **Public** or **Private**
5. **DO NOT** check "Initialize with README"
6. Click **Create repository**

## Step 2: Push Your Code

After creating the repo, run:

```bash
cd /Users/oscarvalles/budget-insights-platform

# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/budget-insights-platform.git
git branch -M main
git push -u origin main
```

## Or Use the Helper Script

```bash
./push-to-github.sh YOUR_USERNAME
```
