# AI MCQ Maker - Deployment Guide (Render + Vercel)

## 🚀 Deployment Architecture

### Frontend: Vercel (Recommended)
- **Free tier**: 100GB bandwidth/month
- **Automatic deployments** from GitHub
- **Built for Next.js** (perfect for your app)
- **Global CDN** for fast load times
- **Preview deployments** for testing
- URL: https://vercel.com

### Backend: Render (Recommended)
- **Free tier available** with 750 compute hours/month  
- **Auto-deploy from GitHub** - automatic redeployment on push
- **Persistent storage** for uploads and data
- **Easy environment variables** management
- **Good uptime and performance**
- **Spins down after 15 mins of inactivity** (free tier - no cost)
- URL: https://render.com

### Database: MongoDB Atlas (Free Tier)
- **512MB storage** - sufficient for testing
- **Auto-scaling** when needed
- **Global backups**
- **Free forever tier available**
- URL: https://www.mongodb.com/cloud/atlas

---

## 📋 Pre-Deployment Checklist

### Backend (.env or environment variables)
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Frontend URL (for CORS & links)
FRONTEND_URL=https://your-app.vercel.app

# AI Services (Keep existing)
GROQ_API_KEY=your_key
GEMINI_API_KEY=your_key
OLLAMA_URL=http://localhost:11434

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_secret_key_here

# Port (Render will set this automatically)
PORT=3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 🔧 Deployment Steps

### 1. Prepare Git Repository

Your code is already pushed to GitHub! ✅

Verify:
```bash
git log --oneline
```

Should show your commits.

### 2. Deploy Frontend on Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Select your GitHub repository
4. **Framework**: Next.js (auto-detected)
5. **Root Directory**: `frontend`
6. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
   - Add all `NEXT_PUBLIC_*` variables
7. Click "Deploy"

**Result**: Your app will be at `https://your-project.vercel.app`

### 3. Deploy Backend on Render

1. Go to https://render.com
2. Click "New +"
3. Select "Web Service"
4. **Connect Repository**: Select your `ai-mcq-maker` repository
5. **Settings**:
   - **Name**: `api-mcq-maker`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (okay for testing)
6. **Environment Variables**:
   - Add all variables from the Pre-Deployment checklist above
   - Most important:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `FRONTEND_URL` (your Vercel URL)
     - `GROQ_API_KEY`
     - `GEMINI_API_KEY`
7. Click "Create Web Service"

**Wait 5-10 minutes for deployment**

**Result**: Render generates a URL like `https://api-mcq-maker.onrender.com`

### 4. Update Environment Variables

**On Vercel** (Frontend):
- Project Settings → Environment Variables
- Update `NEXT_PUBLIC_API_URL` with your Render backend URL

**Save the Render URL** in the format: `https://your-service-name.onrender.com`

### 5. Set Up Database

#### MongoDB Atlas Setup
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create free cluster (M0 - Shared)
4. Create database user with strong password
5. Whitelist IP: Allow access from anywhere (0.0.0.0/0)
6. Get connection string: `mongodb+srv://user:password@cluster.mongodb.net/db`
7. Add as `MONGODB_URI` on Render

---

## 🎯 Testing Deployment

### Test Frontend
```bash
# Visit: https://your-app.vercel.app
# Test: Login, create quiz, share link, take test
```

### Test Backend
```bash
# Check API status
curl https://your-backend.onrender.com/debug/ai-providers

# Generate test link (need valid token)
curl -X POST https://your-backend.onrender.com/tests/generate-link \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"quizId":"..."}'
```

---

## 🐛 Troubleshooting

### "Service Not Available" on Render
- **Normal**: Render free tier spins down after 15 mins of inactivity
- **Solution**: First request takes 30 seconds to spin up
- **Workaround**: Set a monitor to ping the service every 10 mins (see below)

### "CORS Error" when accessing from frontend
- Check `FRONTEND_URL` matches exactly on Render
- Ensure CORS is configured in `server.js`

### "Cannot connect to MongoDB"
- Verify `MONGODB_URI` format is correct
- Check MongoDB IP whitelist includes 0.0.0.0/0
- Test connection locally first with same URI

### "Test link expired" errors after 24hrs
- This is working as designed! Links now expire after 24 hours
- Teachers can generate new links anytime

### Application won't start on Render
- Check "Logs" tab on Render dashboard
- Verify all environment variables are set
- Check `npm start` runs correctly locally: `cd backend && npm start`

---

## 📊 Keeping Services Alive (Optional)

To prevent free tier spindown on Render, create a monitor:

### UptimeRobot (Free)
1. Go to https://uptimerobot.com
2. Create free account  
3. Add HTTP monitor
4. URL: `https://your-backend.onrender.com/debug/ai-providers`
5. Check interval: Every 5 minutes
6. Get alerts if service goes down

This will ping your service every 5 minutes, keeping it awake.

---

## 📈 Feature Summary

After deployment, your app will have:

✅ **Student Features**
- Take unlimited tests with 24-hour link validity
- View detailed results with explanations
- Track time spent and answers

✅ **Teacher Features**  
- Create and publish quizzes
- Generate student test links
- View all student submissions per quiz
- See detailed results for each student
- Export results to CSV/JSON
- Track student engagement metrics

✅ **Security**
- JWT authentication
- Password hashing
- Link expiration
- Quiz ownership verification

---

## 🚀 Next Steps

1. **Monitor Performance**: Use UptimeRobot to keep services alive
2. **Enable Analytics**: Add Google Analytics to Vercel
3. **Set Up Backups**: Configure MongoDB Atlas automated backups
4. **Custom Domain**: Add domain on Vercel ($10/year)
5. **Email Notifications**: Configure transactional emails for test completion

---

## 📞 Support Resources

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Next.js: https://nextjs.org/docs
- Node.js Best Practices: https://nodejs.org/en/docs/

---

## 💰 Cost Estimate

- **Vercel Frontend**: Free ($0/month)
- **Render Backend**: Free ($0/month with 750 hrs/month)
- **MongoDB Database**: Free ($0/month for 512MB)
- **Total**: **$0/month** ✅

*Note: Render free tier has spindown behavior - upgrade to paid ($7/month) if you want always-on service.*
