# Deploying this app to Hostinger

This is a Vite + React + TypeScript app. Hostinger's shared hosting only
serves static files, so you must **build locally first** and then upload
the compiled output.

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

## 3. Upload to Hostinger

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

---

## 4. Configure Firebase for your domain

In the Firebase console:

- **Authentication → Settings → Authorized domains** → add your
  Hostinger domain (e.g. `yourdomain.com` and `www.yourdomain.com`).
  Without this, Google sign-in will fail in production.

---

## 5. Replacing the app later (or swapping a different app in)

Yes — this is literally just file replacement.

1. Delete everything inside `public_html/`.
2. Upload the new `dist/` contents.
3. Done. No restart, no rebuild on the server.

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
