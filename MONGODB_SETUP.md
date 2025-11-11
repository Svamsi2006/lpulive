# 🗄️ MongoDB Atlas Setup Guide - LPU Live

## Step 1: Create MongoDB Atlas Account

1. **Go to:** https://www.mongodb.com/cloud/atlas/register
2. **Sign up** with Google or email (FREE forever)
3. **Choose:** FREE M0 tier (512MB storage)
4. **Select:** AWS as provider
5. **Choose closest region:** Mumbai (ap-south-1) or Singapore

## Step 2: Create Database User

1. In MongoDB Atlas dashboard, click **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. **Authentication Method:** Password
4. **Username:** `lpulive_admin`
5. **Password:** Click "Autogenerate Secure Password" → **COPY THIS PASSWORD!**
   - Save it somewhere safe, you'll need it
6. **Database User Privileges:** Read and write to any database
7. Click **"Add User"**

## Step 3: Allow Network Access

1. Click **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access From Anywhere"** (for Vercel to connect)
4. Click **"Confirm"**

## Step 4: Get Your Connection String

1. Click **"Database"** (left sidebar)
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. **Driver:** Node.js
5. **Version:** 4.1 or later
6. **Copy the connection string** - it looks like:
   ```
   mongodb+srv://lpulive_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. **Replace `<password>`** with the password you copied in Step 2

## Step 5: Configure Vercel Environment Variable

1. Go to: https://vercel.com/dashboard
2. Click on your **lpulive** project
3. Click **"Settings"** tab
4. Click **"Environment Variables"**
5. Add new variable:
   - **Name:** `MONGODB_URI`
   - **Value:** Your connection string (with password replaced)
   - **Environments:** Check all: Production, Preview, Development
6. Click **"Save"**

## Step 6: Tell Me When Ready!

Once you've completed these steps, tell me:
- ✅ "MongoDB is set up"
- ✅ "I have the connection string"
- ✅ "I added it to Vercel"

Then I'll update the code to use MongoDB and redeploy!

---

## 🆘 Need Help?

If you get stuck on any step, just tell me which step number and I'll help you!

**Current Status:** Waiting for MongoDB setup...
