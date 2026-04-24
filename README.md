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

### Step 4: Deploying on Hostinger (Node.js Environment)
You can deploy your app easily via Hostinger's Node.js application hosting (or a VPS). 

We have prepared the repository in your exact requested structure!
The application uses a full-stack **Express + Vite Node server pattern.**

1. Your repository will contain:
   - `server.js` (The Express entry point that runs the app and serves files).
   - `package.json` (Describes your dependencies).
   - `vite.config.ts` (Configured to securely output the production build into a `public` folder).

**Deployment Steps via GitHub to Hostinger (Node.js)**
1. On your Hostinger Node.js panel, connect your GitHub repository.
2. In the setup, tell Hostinger your startup file is `server.js`.
3. Set your Hostinger environment variable for `NODE_ENV` to `production`.
4. Set your Hostinger environment variable for `VITE_GEMINI_API_KEY` to your Gemini API Key.
5. In the build/startup script inside Hostinger, simply run:
   ```bash
   npm install
   npm run build
   npm run start
   ```
   *(Running `npm run build` generates the `public/` directory full of your static React files, and `npm run start` launches the express server!).*

And that's it! Hostinger will automatically run `server.js`, which then perfectly serves the `public/` directory back out as a single-page app.

---

### Firebase Information
Your Firebase backend and authentication settings are linked via `firebase-applet-config.json`. This securely connects your frontend to the Google-hosted Firebase instance. This works over any hosted domain as long as the domain is whitelisted in Firebase Auth.

**Domain Whitelisting (Crucial Step):**
When you deploy to Hostinger, your app will have a custom domain (e.g., `www.yourdomain.com`). 
1. Log into your [Firebase Console](https://console.firebase.google.com).
2. Go to **Authentication** -> **Settings** -> **Authorized domains**.
3. Add your new Hostinger domain (e.g., `yourdomain.com`).
4. Without this, Google Login will fail with an "Unauthorized domain" error in production.
