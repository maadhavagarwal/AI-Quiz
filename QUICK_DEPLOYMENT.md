# 🚀 Quick Deployment Checklist (Render + Vercel)

## ✅ Your Code is Already on GitHub!
Exit code was 0, so your git push succeeded! ✅

---

## Step 1️⃣: Set Up MongoDB Database (10 minutes)

### On MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Create free account"
3. Create organization → Create project
4. Click "Create Deployment" → Select FREE tier (M0)
5. Click "Create" and wait 2 minutes for cluster

### Add Database User
1. Left sidebar → "Database Access"
2. Click "Add Database User"
3. **Username**: `mcqmaker`
4. **Password**: Generate auto or create strong one (copy it!)
5. Set permissions: "Read and write to any database"
6. Click "Add User"

### Whitelist IP
1. Left sidebar → "Network Access"  
2. Click "Add IP Address"
3. Select "Allow access from anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Get Connection String
1. Click "Databases" → Your cluster → "Connect"
2. Select "Drivers" → "Node.js"
3. Copy connection string
4. Replace `<password>` with your DB user password
5. Replace `myFirstDatabase` with `mcqmaker`
6. **Save this URL** - you'll need it for Render

**Example**: 
```
mongodb+srv://mcqmaker:YOUR_PASSWORD@cluster0.abc123.mongodb.net/mcqmaker?retryWrites=true&w=majority
```

---

## Step 2️⃣: Deploy Frontend on Vercel (15 minutes)

### Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Vercel to access your repositories

### Import Your Project
1. Click "New Project"
2. Find and select `ai-mcq-maker` repository
3. Click "Import"

### Configure Project
1. **Project Name**: `ai-mcq-maker`
2. **Framework**: Next.js (should auto-detect)
3. **Root Directory**: `frontend` (important!)
4. Click "Continue"

### Add Environment Variables
1. Scroll to "Environment Variables" section
2. Add these variables:

```
NEXT_PUBLIC_API_URL                (leave empty for now, update after Render deployment)
NEXT_PUBLIC_FIREBASE_API_KEY       (from your Firebase console)
NEXT_PUBLIC_FIREBASE_PROJECT_ID    (from your Firebase console)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN   (from your Firebase console)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET (from your Firebase console)
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID (from your Firebase console)
NEXT_PUBLIC_FIREBASE_APP_ID        (from your Firebase console)
```

3. Click "Deploy"
4. **Wait 3-5 minutes** for deployment to complete
5. **Copy your Vercel URL** - looks like `https://ai-mcq-maker.vercel.app`

✅ **Frontend is live!**

---

## Step 3️⃣: Deploy Backend on Render (20 minutes)

### Create Render Account
1. Go to https://render.com
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Render

### Create Web Service
1. Click "New +"
2. Select "Web Service"
3. **Connect repository**: Select `ai-mcq-maker`
4. Click "Connect"

### Configure Service
1. **Name**: `api-mcq-maker`
2. **Environment**: `Node`
3. **Build Command**: `cd backend && npm install`
4. **Start Command**: `cd backend && npm start`
5. **Plan**: Free (750 free compute hours/month)
6. Click "Create Web Service"

**Render will start building** - wait 5-10 minutes

### Add Environment Variables
While deployment is building, go to "Environment" tab:

1. Click "Add Environment Variable" for each:

```
NODE_ENV                production
MONGODB_URI             mongodb+srv://mcqmaker:PASSWORD@cluster.mongodb.net/mcqmaker?retryWrites=true&w=majority
JWT_SECRET              (run in terminal: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
FRONTEND_URL            https://your-vercel-url.vercel.app (from Step 2)
GROQ_API_KEY            your_groq_key_here
GEMINI_API_KEY          your_gemini_key_here
OLLAMA_URL              http://localhost:11434
PORT                    3000
```

**Most Critical**:
- `MONGODB_URI` (from MongoDB Atlas)
- `FRONTEND_URL` (from Vercel)

2. Click "Save" after adding each variable

### Wait for Deployment
- Check "Logs" in Render dashboard
- Wait for green ✅ "Deploy successful"
- **Copy your Render URL** - looks like `https://api-mcq-maker.onrender.com`

✅ **Backend is live!**

---

## Step 4️⃣: Link Frontend & Backend (5 minutes)

### Update Vercel with Backend URL

1. Go to your Vercel project
2. Settings → "Environment Variables"
3. Find `NEXT_PUBLIC_API_URL`
4. Update value to your Render backend URL: `https://api-mcq-maker.onrender.com`
5. Click "Save"
6. **Vercel will auto-redeploy** (1-2 minutes)

✅ **Frontend and backend are now connected!**

---

## 🎉 Testing Your Deployment

### Test Frontend
1. Open: `https://your-app.vercel.app` (your Vercel URL)
2. Create teacher account and login
3. Create a quiz with some questions
4. Publish the quiz
5. Click "Share Test" and copy the test link

### Test Test Link (as Student)
1. Open test link in **private/incognito window**
2. Enter student name and email
3. Take the test (answer all questions)
4. Click "Submit Test"
5. **Verify results display correctly** ✅

### Test Teacher Dashboard
1. Go back to teacher login
2. Click "Dashboard"
3. Should see your submissions
4. Click on a submission to view detailed results ✅

### Verify API Connectivity
```powershell
Invoke-WebRequest -Uri "https://your-backend-url.onrender.com/debug/ai-providers"
```

Should return status without errors.

---

## 📝 Important URLs to Save

```
Frontend:   https://_____.vercel.app
Backend:    https://_____.onrender.com  
MongoDB:    mongodb+srv://mcqmaker:PASSWORD@...
GitHub:     https://github.com/maadhavagarwal/AI-Quiz
```

---

## ℹ️ Render Free Tier Important Notes

**Spindown Behavior**:
- Free tier spins down after 15 min of inactivity
- **First request after spindown takes 30 seconds** (normal)
- No cost for spindown time

**Workaround** (Optional - Keep Always On):
Use UptimeRobot (free) to ping your backend every 5 minutes:
1. Go to https://uptimerobot.com
2. Create account
3. Add monitor: `https://your-backend.onrender.com/debug/ai-providers`
4. Check interval: Every 5 minutes

This keeps your backend always responsive at no cost.

---

## 🆘 Common Issues & Fixes

### "Connection refused" from frontend
- ✅ Check `NEXT_PUBLIC_API_URL` is set correctly on Vercel
- ✅ Verify Render deployment succeeded (check Logs)
- ✅ Wait 30 seconds if Render service was spun down

### "Service unavailable" on Render
- **Normal** if first request in 15+ minutes
- Wait 30 seconds for service to spin up
- Try again

### "MongoDB connection failed"
- ✅ Check `MONGODB_URI` format is correct
- ✅ Verify MongoDB IP whitelist is set to 0.0.0.0/0
- ✅ Check password is URL-encoded (special chars)

### "Test link expired" after 24 hours
- ✅ **This is working correctly!** - Links expire after 24 hours for security
- Teachers can generate new links anytime

### "Firebase not loading"
- ✅ Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set
- ✅ Check values match your Firebase project
- ✅ Clear browser cache

---

## ✅ Deployment Checklist

- [ ] GitHub repository pushed (`ai-mcq-maker`)
- [ ] MongoDB cluster created on Atlas
- [ ] MongoDB database user created (mcqmaker)
- [ ] MongoDB IP whitelist set to 0.0.0.0/0
- [ ] MongoDB connection string copied
- [ ] Vercel frontend deployed successfully
- [ ] Vercel URL copied
- [ ] Render backend deployed successfully
- [ ] Render URL copied
- [ ] All environment variables set correctly
- [ ] Vercel `NEXT_PUBLIC_API_URL` updated with Render URL
- [ ] Frontend tested (create quiz, take test)
- [ ] Student results display correctly
- [ ] Teacher dashboard shows submissions
- [ ] 24-hour test link expiration working

---

## 🚀 What's Next?

1. **Share with Users**: Give test links to students
2. **Monitor**: Set up UptimeRobot to keep backend alive
3. **Analytics**: Enable Google Analytics on Vercel
4. **Backups**: Configure MongoDB automated backups
5. **Upgrade (Optional)**: If paying users, upgrade Render to $7/month for always-on

---

## 📞 Help Resources

- Render Issues: https://render.com/docs
- Vercel Issues: https://vercel.com/docs  
- MongoDB Issues: https://www.mongodb.com/docs/atlas/
- GitHub Issues: https://docs.github.com

---

**🎓 You now have a production-ready AI MCQ application deployed on the cloud!** 🎉

For more detailed information, see `DEPLOYMENT_GUIDE.md`
