# ⚽ Football Tournament Manager — Setup Guide

React + Vite + Tailwind CSS + Firebase (Firestore + Auth)

## What's Included

- 16 teams, 4 groups (A–D), round-robin group stage
- 4 knockout segments: Cup · Plate · Shield · Bowl
- Real-time score updates via Firestore
- Admin login (Firebase Email/Password Auth)
- Public viewer mode (anyone can see fixtures)
- Per-match reset + global reset buttons

### Knockout Seeding
```
1st, 2nd per group  → CUP Quarter Finals
Cup QF losers       → Plate Semi Finals
Plate SF losers     → Shield Semi Finals
3rd per group       → Shield / Bowl
4th per group       → Bowl
Shield SF losers    → Bowl
```

---

## Setup Steps

### 1. Create Firebase Project
Go to https://console.firebase.google.com → Add project

### 2. Enable Firestore
Firestore Database → Create database → Production mode

### 3. Enable Authentication
Authentication → Get started → Email/Password → Enable
Then go to Users tab → Add user (this is your admin account)

### 4. Get Firebase Config
Project Settings → General → Your apps → Web → Register app → copy firebaseConfig

### 5. Add Config to Project
Open `src/lib/firebase.js` and replace the placeholder values with your config.

### 6. Deploy Firestore Security Rules
```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```
Or paste firestore.rules contents into Firestore > Rules in the Firebase console.

### 7. Run the App
```bash
npm install
npm run dev
```

### 8. Generate Fixtures
1. Click "Admin Login" top right
2. Log in with the admin account from step 3
3. Click "Generate Fixtures"

---

## Customizing Teams

Edit the TEAMS array in `src/lib/tournament.js`.
Keep IDs as A1-A4, B1-B4, C1-C4, D1-D4 for seeding to work.

## Build & Deploy
```bash
npm run build
firebase deploy --only hosting
```

## Project Structure
```
src/
  lib/firebase.js          ← Add your Firebase config here
  lib/tournament.js        ← Teams, schedule, knockout template
  hooks/useTournament.js   ← All Firestore operations
  contexts/AuthContext.jsx ← Auth
  components/
    MatchCard.jsx
    StandingsTable.jsx
    KnockoutBracket.jsx
    LoginPage.jsx
  App.jsx
  main.jsx
```

## Tournament Settings
- Date: 6 June 2025, 8:00 AM onwards
- Match duration: 16 minutes
- 24 group matches + knockout bracket
