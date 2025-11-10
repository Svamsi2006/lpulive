# 🚀 Deploy LPU Live to Vercel

## ✅ Pre-Deployment Checklist

Your project is now configured for Vercel deployment with:
- ✅ Serverless API in `/api` directory
- ✅ `vercel.json` configuration
- ✅ Environment-aware API configuration
- ✅ Combined frontend + backend in one deployment

## 📋 Deployment Steps

### Step 1: Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### Step 2: Commit Changes to GitHub
```bash
git add .
git commit -m "Configure project for Vercel deployment"
git push origin main
```

### Step 3: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with your GitHub account
3. **Click "New Project"**
4. **Import your repository**: `Svamsi2006/lpulive`
5. **Configure Project**:
   - Framework Preset: **Vite**
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run vercel-build` (or `vite build`)
   - Output Directory: `dist`
   - Install Command: `npm install`

6. **Add Environment Variables** (Optional):
   ```
   JWT_SECRET=lpu-live-secret-key-2025
   NODE_ENV=production
   ```

7. **Click "Deploy"**

#### Option B: Deploy via CLI
```bash
# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name? lpulive
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

## 🌐 After Deployment

### Your Live URL
After deployment, you'll get a URL like:
```
https://lpulive.vercel.app
```

### What Works:
- ✅ Frontend React app
- ✅ API endpoints at `/api/*`
- ✅ Login and authentication
- ✅ Chat messaging
- ✅ Group creation
- ✅ Admin features (PIN verification)
- ✅ University groups
- ✅ Announcements

### Important Notes for Vercel:

1. **File Storage**: Vercel serverless functions use `/tmp` for temporary storage. This means:
   - Data will be lost between deployments
   - For production, you should use a database (MongoDB, Supabase, etc.)
   
2. **Socket.IO Limitation**: 
   - Vercel doesn't support WebSocket connections for serverless functions
   - Real-time features will need polling or use a separate service
   - For WebSocket support, consider deploying backend to:
     - Railway.app
     - Render.com
     - Heroku
     - DigitalOcean

3. **CSV Data**:
   - CSV files in `/data` won't persist on Vercel
   - Consider migrating to a cloud database for production

## 🔧 Alternative: Hybrid Deployment

For full functionality (including WebSockets), use this setup:

### Option 1: Frontend on Vercel + Backend on Railway

1. **Deploy Frontend to Vercel** (as above)
2. **Deploy Backend to Railway**:
   - Go to https://railway.app
   - Connect your GitHub repo
   - Create new project from `server/server-simple.js`
   - Set environment variables
   - Get your Railway URL (e.g., `https://lpulive.up.railway.app`)

3. **Update API Config**:
   Edit `src/config/api.js`:
   ```javascript
   const API_BASE_URL = 'https://lpulive.up.railway.app';
   ```

4. **Redeploy to Vercel**

### Option 2: Full Deployment on Render/Railway

Deploy both frontend and backend together on:
- **Render.com**: Supports Node.js + static sites
- **Railway.app**: Supports full-stack apps
- **Fly.io**: Docker-based deployments

## 🐛 Troubleshooting

### Build Fails on Vercel
```bash
# Locally test the build
npm run vercel-build

# Check for errors
# Fix any import/export issues
```

### API Returns 404
- Check `vercel.json` routes configuration
- Ensure `api/index.js` exists
- Check Vercel function logs

### CORS Errors
Update `api/index.js` CORS config:
```javascript
app.use(cors({
  origin: ['https://lpulive.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

### Environment Variables Not Working
- Add them in Vercel Dashboard → Project Settings → Environment Variables
- Redeploy after adding variables

## 📊 Monitoring

- **Vercel Dashboard**: Monitor deployments, logs, and analytics
- **Function Logs**: View in Vercel → Project → Functions tab
- **Real-time Logs**: Use `vercel logs` command

## 🔒 Security for Production

Before going live:

1. **Change JWT_SECRET**:
   ```
   JWT_SECRET=your-super-secret-key-here
   ```

2. **Update Admin PIN** in `src/config/admin.js`

3. **Add Rate Limiting** to API endpoints

4. **Use HTTPS only**

5. **Migrate to Real Database** (MongoDB Atlas, Supabase, etc.)

## ✅ Verification Checklist

After deployment, test:
- [ ] Homepage loads
- [ ] Can login
- [ ] Can send messages
- [ ] Can create groups
- [ ] Admin login works
- [ ] API endpoints respond
- [ ] No console errors

## 🆘 Need Help?

If deployment fails:
1. Check Vercel deployment logs
2. Run `npm run build` locally to test
3. Check browser console for errors
4. Verify all files are committed to GitHub

## 🎉 Success!

Once deployed, share your live app:
```
https://lpulive.vercel.app
```

---

**Created**: November 11, 2025  
**Last Updated**: November 11, 2025
