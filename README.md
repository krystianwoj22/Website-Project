# Claude Creator Catalyst

## Deployment Guide (GitHub & Hostinger)

This guide takes you through the step-by-step process of taking this app from Google AI Studio, pushing it to GitHub, and deploying it on Hostinger.

### Prerequisites
1. A GitHub account.
2. A Hostinger account.
3. Node.js installed on your local computer (if you wish to test locally).

### Step 1: Export to GitHub
1. In the Google AI Studio menu (top right or top left, depending on interface), select **Export to GitHub** or **Download ZIP**. 
2. If you chose GitHub, authenticate and it will create a new repository for you.
3. If you downloaded a ZIP, extract it on your computer, initialize a git repository (`git init`), commit the files, and push them to a new repository on GitHub.

### Step 2: Set up Environment Variables
This application requires a Gemini API Key to work. 

1. Before deploying, you'll need the API Key from Google AI Studio. 
2. The project contains a `.env.example` file. When testing locally, copy it to `.env` and fill it in:
   ```env
   VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
*(Do NOT commit your actual `.env` file to your public GitHub repository)*

### Step 3: Local Testing (Optional)
If you want to run this on your local machine first:
1. Open up your terminal to the project folder.
2. Run `npm install` to install all dependencies.
3. Run `npm run dev` to start the local development server.
4. Visit the `localhost` URL provided in the terminal.

### Step 4: Deploying on Hostinger
If you are using Hostinger's standard Web Hosting (not a VPS):

**Option A: Automated Deployment via GitHub (Recommended)**
1. Log in to your Hostinger setup panel, go to your website, and find the **Advanced > GIT** section.
2. Provide your repository details to connect Hostinger directly to GitHub.
3. **IMPORTANT**: Because this is a Vite (React) app, Hostinger's standard static file servers need you to build it first. Go to your Hostinger web terminal or Auto Deployment script setup and configure it to run:
   ```bash
   npm install
   npm run build
   ```
4. Configure Hostinger to serve the `dist/` directory as the public root directory. (Or you can move the output of the `dist/` folder into your `public_html` folder).
5. Open your Hostinger File Manager, and navigate to the folder where the `dist` files are living. Check for `firebase-applet-config.json` inside the root as well.
6. Make sure to set your **Environment Variables** in Hostinger (Add `VITE_GEMINI_API_KEY` to your environment settings). *Alternatively, Hostinger allows you to create the `.env` file directly through the File Manager in the project's root folder.*

**Option B: Manual Build and Upload**
1. On your local computer, make sure you have the `.env` file prepared.
2. Open your terminal in the project folder and run:
   ```bash
   npm install
   npm run build
   ```
3. This creates a folder named `dist`. 
4. Zip the contents of the `dist` folder.
5. In your Hostinger dashboard, go to the **File Manager** and open the `public_html` folder for your domain.
6. Upload that Zip file and extract it directly into `public_html`.
7. **Note:** The included `public/.htaccess` will automatically be extracted into your live site to ensure that direct page refreshes properly route back to single-page application.

---

### Firebase Information
Your Firebase backend and authentication settings are linked via `firebase-applet-config.json`. This securely connects your frontend to the Google-hosted Firebase instance. This works over any hosted domain as long as the domain is whitelisted in Firebase Auth.

**Domain Whitelisting (Crucial Step):**
When you deploy to Hostinger, your app will have a custom domain (e.g., `www.yourdomain.com`). 
1. Log into your [Firebase Console](https://console.firebase.google.com).
2. Go to **Authentication** -> **Settings** -> **Authorized domains**.
3. Add your new Hostinger domain (e.g., `yourdomain.com`).
4. Without this, Google Login will fail with an "Unauthorized domain" error in production.
