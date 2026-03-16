# Eiderjamatkoi Full Setup Guide

This guide walks you through setting up all the required external services (Supabase & Firebase) and configuring your environment variables correctly.

## Prerequisites
- A Google Account (for Firebase)
- A GitHub Account (for Supabase & Vercel)
- Node.js 18+ installed
- Git installed

---

## 1. Supabase Setup (Database & Storage)

### Step 1: Create a Project
1. Go to [Supabase](https://supabase.com) and log in.
2. Click **New Project** and select your organization.
3. Choose a name (e.g., `eiderjamatkoi`) and a strong database password.
4. Select a region close to your users (e.g., Singapore or Mumbai) for lower latency.
5. Click **Create new project**.

### Step 2: Get Environment Variables
Once the project is ready to use, navigate to **Project Settings** (the gear icon on the bottom left).

1. **Database URL:** Go to **Database**. Under "Connection string", select `URI`. Copy the URI.
   - *Important:* Replace `[YOUR-PASSWORD]` in the string with the password you chose earlier.
   - Set this as your `DATABASE_URL` in `.env`.
   - Also set `DIRECT_URL` to this same string if you are using Supabase pooling, otherwise just use `DATABASE_URL` for both.
2. **API Keys:** Go to **API**.
   - Copy the `Project URL` -> Set as `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy the `anon` `public` key -> Set as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Copy the `service_role` `secret` key -> Set as `SUPABASE_SERVICE_ROLE_KEY`.

### Step 3: Setup Storage (Mosque Photos)
1. In the Supabase dashboard, click **Storage** (the bucket icon) on the left sidebar.
2. Click **New Bucket**.
3. Name it **`mosque-photos`**.
4. **Important:** Check the box saying **"Public bucket"** so photos can be viewed without logging in. Click Save.

---

## 2. Firebase Setup (Phone Auth)

### Step 1: Create a Project
1. Go to the [Firebase Console](https://console.firebase.google.com).
2. Click **Add project**.
3. Name it (e.g., `eiderjamatkoi`) and follow the steps. (Google Analytics is optional).

### Step 2: Enable Phone Authentication
1. In the left sidebar, click **Authentication**, then click **Get Started**.
2. Go to the **Sign-in method** tab.
3. Click on **Phone** under Native providers.
4. Toggle **Enable**.
5. Save your changes.
6. *(Optional but Recommended)* Add your own phone number to the **"Phone numbers for testing"** section to test without sending real SMS messages.

### Step 3: Get Client Environment Variables
1. Go to **Project Overview** (the home icon top left) and click the **Web icon (</>)** to add a web app.
2. Register the app (name it `eiderjamatkoi-web`).
3. You will see a `firebaseConfig` object with your keys. Add them to your `.env.local`:
   - `apiKey` -> `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` -> `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` -> `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` -> `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` -> `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` -> `NEXT_PUBLIC_FIREBASE_APP_ID`

### Step 4: Get Server-side Admin Keys
1. Click the **Gear icon** next to Project Overview -> **Project settings**.
2. Go to the **Service accounts** tab.
3. Click **Generate new private key** and download the JSON file.
4. Open the JSON file and extract the following for your `.env.local`:
   - `project_id` -> `FIREBASE_PROJECT_ID`
   - `client_email` -> `FIREBASE_CLIENT_EMAIL` 
   - `private_key` -> `FIREBASE_PRIVATE_KEY`
     - *Note on `.env` formatting:* Make sure to wrap the private key in quotes and preserve the `\n` characters, like this: `"-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"`

---

## 3. Local Project Setup

### Step 1: Prepare `.env.local`
Create a `.env.local` file in the root of your project directory and fill it with all the keys you gathered above using the format in `.env.example`.

### Step 2: Install Dependencies
Open your terminal in the project folder and run:
```bash
npm install
```

### Step 3: Initialize Database (Prisma)
Run the following commands to create your database tables based on your `schema.prisma` file:
```bash
# Generate the Prisma Client
npx prisma generate

# Push the schema to your Supabase database
npx prisma db push
```

### Step 4: Run the App
Start the Next.js development server:
```bash
npm run dev
```

The application is now running at `http://localhost:3000`. 
Open it in your browser, allow location access when prompted, and you can begin testing functionality!
