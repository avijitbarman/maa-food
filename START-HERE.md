# Start here — GitHub-safe production version

This repository intentionally does **not** contain `firebase-config.js` with your real Firebase project values.

## 1. Firebase roles

Keep the Firestore rules in `firestore.rules` published in Firebase. Every staff member must first exist in Firebase Authentication, then have a Firestore document at:

`staff/{FIREBASE_AUTH_UID}`

with one field:

- Admin: `role` = `admin`
- Delivery person: `role` = `delivery`

The document ID must be the Firebase Authentication **UID**, not the email address.

## 2. GitHub repository secrets

In GitHub go to:

**Repository → Settings → Secrets and variables → Actions → New repository secret**

Create these six secrets using Firebase Console → Project settings → Your apps → Web app:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

Do not put passwords, customer data, service-account JSON/private keys, Admin SDK credentials, or other server-side secrets in this repository.

## 3. Publish with GitHub Pages

Push the files to the `main` branch. In GitHub open:

**Repository → Settings → Pages → Source → GitHub Actions**

The included workflow creates `firebase-config.js` only while building the deployment artifact and publishes only the runtime web files.

## 4. Local testing

For local testing only, copy:

`firebase-config.example.js` → `firebase-config.js`

and fill in your Firebase Web App configuration. `firebase-config.js` is ignored by Git.

## Important

Firebase Web App configuration must reach the browser and is therefore observable after deployment. It is not an authorization secret. The actual protection is Firebase Authentication + Firestore Security Rules. App Check and API restrictions add abuse resistance.
