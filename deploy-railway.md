# Railway Deployment Guide for Schema Validator

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Account**: Your code should be in a GitHub repository
3. **Railway CLI** (optional): `npm install -g @railway/cli`

## Deployment Steps

### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Connect GitHub Repository**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your Schema Validator repository

2. **Configure Environment**:
   - Railway will automatically detect the Python project
   - It will use the `nixpacks.toml` for deployment (no Docker required)

3. **Add PostgreSQL Database**:
   - In your Railway project dashboard
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically provide environment variables

4. **Set Environment Variables**:
   Railway will automatically set these from the PostgreSQL service:
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGHOST`
   - `PGPORT`

5. **Deploy**:
   - Railway will automatically build and deploy your application
   - You'll get a URL like: `https://your-app-name.railway.app`

### Option 2: Deploy via Railway CLI

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize Railway Project**:
   ```bash
   railway init
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

## Configuration Files

The following files are configured for Railway deployment:

- `nixpacks.toml`: Build configuration (no Docker required)
- `railway.toml`: Railway-specific configuration
- `Procfile`: Alternative deployment method
- `requirements.txt`: Python dependencies
- `runtime.txt`: Python version specification
- `.railwayignore`: Files to exclude from deployment

## Environment Variables

Railway will automatically provide these PostgreSQL environment variables:
- `PGDATABASE`: Database name
- `PGUSER`: Database username
- `PGPASSWORD`: Database password
- `PGHOST`: Database host
- `PGPORT`: Database port

## Health Check

The application includes a health check endpoint at `/docs` which Railway will use to verify the deployment.

## Troubleshooting

1. **Build Failures**: Check the Railway build logs
2. **Database Connection**: Verify environment variables are set
3. **Port Issues**: Railway automatically sets the `$PORT` environment variable

## Post-Deployment

1. **Test the API**: Visit `https://your-app-name.railway.app/docs`
2. **Test Database**: Try creating a configuration via the API
3. **Monitor Logs**: Use Railway dashboard to monitor application logs

## Frontend Deployment

For the React frontend, you can:
1. Deploy to Vercel, Netlify, or Railway separately
2. Update the API base URL in the frontend to point to your Railway backend
3. Configure CORS if needed 