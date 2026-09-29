# Security notes

## Excluded from Git source

- Real `firebase-config.js`
- Passwords
- Firebase service-account JSON/private keys
- Admin SDK credentials
- Customer exports/data

The deployment workflow reads Firebase Web App values from GitHub Actions repository secrets and creates the runtime configuration during the Pages build.

## Firebase browser API key

The Firebase Web API key is used by browser SDKs and will still be visible to visitors after deployment. Do not treat hiding it as access control.

## Firestore authorization

The included `firestore.rules` implements these permissions:

- `admin`: read/create/update/delete customer records.
- `delivery`: read customer records and modify only `delivered` and `deliveredAt`.
- users without one of those staff roles: no customer access.
- browser clients cannot write staff role documents.

## Production hardening checklist

- Use strong, unique passwords for every staff account.
- Disable Firebase Authentication accounts when staff leave.
- Keep the published Firestore rules in sync with this repository.
- Restrict the Firebase browser API key to required APIs in Google Cloud Console where appropriate.
- Enable Firebase App Check for the deployed web app.
- Configure billing budgets/alerts if billing is enabled.
- Never commit service-account keys or server-side secrets.
