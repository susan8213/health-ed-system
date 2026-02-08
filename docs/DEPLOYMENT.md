# 部署指南

> 📌 **相關文檔：** [專案首頁](../README.md) | [作品集展示](./PORTFOLIO.md) | [Web App](./WEB_APP.md) | [LINE BOT](./LINEBOT.md) | [API 參考](./API.md)

## 🚀 Quick Deployment Guide

### Prerequisites
- GitHub/GitLab repository with your code
- Render.com account (free tier available)
- Cloud MongoDB instance (MongoDB Atlas recommended)

## 📋 Step-by-Step Deployment

### 1. Prepare Your Repository
```bash
# Ensure all files are committed
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Setup Cloud Database (if not done)
#### MongoDB Atlas (Recommended)
1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Create database user with read/write permissions
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/tcm-clinic`
5. Whitelist Render.com IPs: `0.0.0.0/0` (or specific IPs)

### 3. Deploy to Render

#### Option A: Using render.yaml (Recommended)
1. **Connect Repository**
   - Go to https://dashboard.render.com
   - Click "New" → "Blueprint"
   - Connect your GitHub/GitLab repository
   - Render will automatically detect `render.yaml`

2. **Configure Environment Variables**
   - Set `MONGODB_URI` to your cloud MongoDB connection string
   - Optionally set LINE API credentials
   - Other variables are pre-configured in render.yaml

#### Option B: Manual Setup
1. **Create Web Service**
   - Go to https://dashboard.render.com
   - Click "New" → "Web Service"
   - Connect your repository

2. **Configure Build Settings**
   ```
   Name: tcm-clinic
   Environment: Node
   Region: Choose closest to your users
   Branch: main
   Root Directory: (leave empty)
   Build Command: npm ci && npm run build
   Start Command: npm start
   ```

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tcm-clinic
   MONGODB_DB=tcm-clinic
   LINE_CHANNEL_ACCESS_TOKEN=(optional)
   LINE_CHANNEL_SECRET=(optional)
   ```

4. **Configure Advanced Settings**
   ```
   Health Check Path: /api/health
   Auto-Deploy: Yes
   ```

### 4. Initialize Database
After deployment, initialize your database:

#### Option A: Using Render Shell
1. Go to your service dashboard
2. Click "Shell" tab
3. Run: `node scripts/setup-database.js`

#### Option B: Local Setup
```bash
# Set environment variable locally
export MONGODB_URI="your-mongodb-connection-string"

# Run setup script
node scripts/setup-database.js
```

### 5. Access Your Application
- Your app will be available at: `https://your-app-name.onrender.com`
- Health check: `https://your-app-name.onrender.com/api/health`

### 6. Seed Sample Data
1. Visit your deployed application
2. Click "Seed Sample Data" button
3. Start using the TCM clinic!

## 🔧 Configuration Details

### Render.yaml Explanation
```yaml
services:
  - type: web                    # Web service type
    name: tcm-clinic            # Service name
    env: node                   # Node.js environment
    plan: starter               # Free tier (can upgrade)
    buildCommand: npm ci && npm run build  # Build process
    startCommand: npm start     # Start command
    healthCheckPath: /api/health # Health monitoring
    autoDeploy: true           # Auto-deploy on git push
```

### Environment Variables
- **MONGODB_URI**: Your cloud MongoDB connection string
- **MONGODB_DB**: Database name (default: tcm-clinic)
- **NODE_ENV**: Set to production
- **LINE_CHANNEL_ACCESS_TOKEN**: Optional LINE API token
- **LINE_CHANNEL_SECRET**: Optional LINE API secret

## 🎯 Render.com Plans

### Free Tier (Starter)
- **Resources**: 512MB RAM, 0.1 CPU
- **Bandwidth**: 100GB/month
- **Sleep**: Apps sleep after 15 minutes of inactivity
- **Custom Domain**: Not included
- **SSL**: Free Let's Encrypt certificates

### Paid Plans
- **Starter**: $7/month - No sleep, custom domains
- **Standard**: $25/month - More resources, faster builds
- **Pro**: $85/month - High performance, priority support

## 🔍 Monitoring & Maintenance

### Health Checks
Render automatically monitors your app using `/api/health`:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

### Logs
- Access logs via Render dashboard
- Real-time log streaming available
- Error tracking and alerts

### Scaling
- **Horizontal**: Add more instances (paid plans)
- **Vertical**: Upgrade to higher resource plans
- **Auto-scaling**: Available on higher tiers

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs in Render dashboard
# Common fixes:
- Ensure package.json has correct dependencies
- Check Node.js version compatibility
- Verify build command syntax
```

#### Database Connection Issues
```bash
# Check environment variables
# Verify MongoDB URI format
# Ensure IP whitelist includes 0.0.0.0/0
# Test connection locally first
```

#### App Won't Start
```bash
# Check start command: npm start
# Verify Next.js build completed successfully
# Check for missing environment variables
# Review application logs
```

### Performance Optimization
1. **Enable Compression**: Automatic on Render
2. **CDN**: Use Render's global CDN
3. **Caching**: Implement proper cache headers
4. **Database**: Optimize MongoDB queries and indexes

## 🔐 Security Best Practices

### Environment Variables
- Never commit secrets to git
- Use Render's environment variable encryption
- Rotate credentials regularly

### Database Security
- Use strong passwords
- Enable IP whitelisting
- Use SSL/TLS connections
- Monitor access logs

### Application Security
- Keep dependencies updated
- Use HTTPS (automatic on Render)
- Implement proper error handling
- Monitor for security vulnerabilities

## 📊 Cost Estimation

### Free Tier Usage
- **Development/Testing**: Perfect for free tier
- **Low Traffic**: Up to ~1000 visits/month
- **Sleep Mode**: App sleeps after 15 minutes

### Production Usage
- **Small Clinic**: Starter plan ($7/month)
- **Medium Clinic**: Standard plan ($25/month)
- **Large Clinic**: Pro plan ($85/month)

### Additional Costs
- **Database**: MongoDB Atlas free tier (512MB)
- **Domain**: Custom domain ($10-15/year)
- **Monitoring**: Built-in with Render

## 🎉 Success Checklist

- [ ] Repository connected to Render
- [ ] MongoDB Atlas cluster created
- [ ] Environment variables configured
- [ ] Application deployed successfully
- [ ] Database initialized
- [ ] Health check endpoint responding
- [ ] Sample data seeded
- [ ] LINE integration tested (if applicable)

## 🔗 相關資源

- [專案總覽](../README.md)
- [作品集展示](./PORTFOLIO.md)
- [Web App 開發指南](./WEB_APP.md)
- [LINE BOT 技術文檔](./LINEBOT.md)
- [API 參考文檔](./API.md)

---

**Need Help?**
- Render Documentation: https://render.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- GitHub Issues: Open an issue in the repository
- [ ] Environment variables configured
- [ ] Database initialized with indexes
- [ ] Health check endpoint responding
- [ ] Sample data seeded
- [ ] Application accessible via HTTPS
- [ ] All features working correctly
- [ ] Monitoring and alerts configured

Your TCM clinic is now live on Render.com! 🏥🌐