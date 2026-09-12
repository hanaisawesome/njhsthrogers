# T.H. Rogers NJHS — Chapter Website

A React site with a public chapter page and a passcode-gated admin panel
(tasks, announcements, events, service hours, event sign-ups), backed by
Firebase Firestore so data is live and shared for everyone.

## One-time setup (about 20 minutes)

### 1. Change the passcodes
There are two: the admin passcode (opens the admin panel) and a second
passcode (unlocks the Site text tab, which can edit all website text and
change both passcodes). Defaults are in `src/App.jsx` (`ADMIN_PASSCODE`,
`OWNER_PASSCODE`) — change them there, or later from inside the site:
Admin → Site text → Change passcodes. Once changed in-app, the in-app
values win over the ones in the code.

### 2. Create the Firebase project (free)
1. Go to https://console.firebase.google.com and sign in with a Google account.
2. "Create a project" → name it anything (e.g. `njhs-throgers`) → Analytics off is fine.
3. In the project: click the **</>** (Web) icon to register a web app → name it → Register.
4. Firebase shows a `firebaseConfig` code block. Copy those six values into
   `src/firebase.js` where it says `PASTE_YOURS_HERE`.
5. In the left menu: **Build → Firestore Database → Create database** →
   choose a US location → **Start in production mode**.
6. Go to the **Rules** tab, replace the rules with the block below, and Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /njhs/{docId} {
      allow read, write: if true;
    }
  }
}
```

> Heads-up: these rules let anyone read/write the chapter data (the public
> sign-up form needs write access, and the admin passcode lives in the app,
> not in Firebase). That's fine for a club site with no sensitive info —
> which is why the site tells people to use first name + last initial only.
> If the chapter ever wants real locked-down admin accounts, that's a
> Firebase Authentication upgrade later.

### 3. Test locally (optional)
Requires Node.js (https://nodejs.org):

```
npm install
npm run dev
```

Open the printed localhost URL.

### 4. Deploy to Vercel (free)
1. Put this folder in a GitHub repository (github.com → New repository →
   upload these files, or use `git`).
2. Go to https://vercel.com → sign up with GitHub → **Add New → Project** →
   import the repo.
3. Vercel auto-detects Vite. Click **Deploy**. Done — you get a URL like
   `njhs-throgers.vercel.app` you can share or put on a QR code.

Any time you edit the code and push to GitHub, Vercel redeploys automatically.

## Day-to-day use
Officers click **Admin** on the site, enter the passcode, and manage
everything from the panel — no code edits needed.
