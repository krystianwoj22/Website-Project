# Deploying this app to Hostinger

This is a Vite + React + TypeScript app with an optional Express server
(`server.js`) for secure server-side Gemini calls. There are **two ways**
to deploy depending on your Hostinger plan:

| Plan type | What runs | Use this mode |
|---|---|---|
| Shared hosting (hPanel, no Node) | Static files only | **Mode A** |
| VPS / Cloud / Node app | Static + Express | **Mode B** |

If you're unsure, check your Hostinger plan. "Business Web Hosting" and
below are static-only → Mode A. "VPS" and "Cloud Hosting" → Mode B.

---

## 1. One-time setup on your computer

Make sure Node.js 18+ is installed, then in this folder run:

```bash
npm install
```

Open `.env.local` and replace the placeholder with your real Gemini API key:

```
GEMINI_API_KEY=your_real_gemini_api_key_here
VITE_GEMINI_API_KEY=your_real_gemini_api_key_here
```

> Security note: because Vite bundles env vars into the client, the key will
> be visible in the browser. For a public production app you should proxy
> Gemini calls through a backend.

---

## 2. Build the production bundle

```bash
npm run build
```

This produces a `dist/` folder. That folder is what you upload — nothing
else. `src/`, `node_modules/`, `package.json`, etc. do NOT go on the server.

The `.htaccess`, `robots.txt`, and `favicon.svg` inside the `public/`
folder are automatically copied into `dist/` during the build.

---

## 3a. Mode A — Upload to Hostinger (shared / static)

1. Log into Hostinger → hPanel → **File Manager** (or use FTP / SFTP).
2. Navigate into `public_html/`.
3. If there's an old app in there, delete its contents first (back up
   anything you care about — databases, uploaded user files, etc.).
4. Upload **the contents of `dist/`** (not the folder itself) into
   `public_html/`. You should end up with this structure on the server:

   ```
   public_html/
   ├── index.html
   ├── .htaccess
   ├── robots.txt
   ├── favicon.svg
   └── assets/
       ├── index-xxxxxxxx.js
       └── index-xxxxxxxx.css
   ```

5. In the File Manager, make sure "Show hidden files" is on so you can
   confirm `.htaccess` is actually uploaded — it's critical for routing.

> In Mode A, `server.js` is unused. The Gemini key ends up embedded in
> the browser bundle — fine for personal demos, not for public production.

---

## 3b. Mode B — Upload to Hostinger (VPS / Cloud / Node)

Use this if you want the Express server and the `/api/gemini` proxy
(keeps the key off the client).

1. SSH into your VPS, or use the Hostinger "Node.js app" panel.
2. Upload the whole project (everything except `node_modules/` and
   `dist/` if you'll rebuild on the server). FTP, `rsync`, or a git pull
   all work.
3. On the server:

   ```bash
   npm install
   npm run build     # produces /dist
   ```

4. Set environment variables on the server (hPanel → Node.js app →
   Environment Variables, or `~/.env` on a VPS):

   ```
   GEMINI_API_KEY=your_real_key
   PORT=3000
   ```

5. Start the server:

   ```bash
   npm start
   ```

   Or via a process manager so it stays up:

   ```bash
   npm install -g pm2
   pm2 start server.js --name creator-catalyst
   pm2 save
   pm2 startup
   ```

6. If you're on a VPS behind Nginx/Apache, point your domain at
   `http://localhost:3000`. If you're using Hostinger's Node.js app
   panel, the panel handles that routing for you.

7. In Mode B you should update the client to call `/api/gemini` instead
   of using the client-side key. The proxy is already wired up in
   `server.js`.

---

## 4. Configure Firebase for your domain

In the Firebase console:

- **Authentication → Settings → Authorized domains** → add your
  Hostinger domain (e.g. `yourdomain.com` and `www.yourdomain.com`).
  Without this, Google sign-in will fail in production.

---

## 5. Replacing the app later (or swapping a different app in)

**Mode A (static):** literally just file replacement.

1. Delete everything inside `public_html/`.
2. Upload the new `dist/` contents.
3. Done. No restart, no rebuild on the server.

**Mode B (Node):** replace files, then rebuild and restart.

1. Replace source files on the server (or `git pull`).
2. `npm install && npm run build`
3. `pm2 restart creator-catalyst` (or the equivalent in hPanel).

If the previous app used a database, back it up separately; this static
build doesn't touch any database on the Hostinger side (all data lives
in Firebase / Firestore).

---

## Checklist before you ship

- [ ] `.env.local` has a real Gemini API key
- [ ] `npm run build` completed without errors
- [ ] `dist/` contains `index.html`, `assets/`, `.htaccess`, `favicon.svg`
- [ ] Firebase authorized domains include your Hostinger domain
- [ ] You can load the site in an incognito window and sign in
