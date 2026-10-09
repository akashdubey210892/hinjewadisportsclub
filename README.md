# GullyScore

Mobile-first local cricket match dashboard and scorer.

## Local setup

1. Install Node.js 20.19+ or 22.12+.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill in the Firebase web app config from Firebase Console → Project settings → General → Your apps.
4. In Firebase Console → Authentication → Sign-in method, enable **Email/Password**.
5. In Authentication → Users, create the admin user with email `admin@hclub.com` and choose a strong password. Do not commit passwords to the repository.
6. Create a Cloud Firestore database.
7. Publish the rules from `firestore.rules` in Firebase Console → Firestore Database → Rules. The rule email must match `VITE_ADMIN_EMAIL` in `.env`.
8. Add `localhost` to Authentication → Settings → Authorized domains if it is not already present.
9. Run `npm run dev`.

### Admin login

The login form accepts username `admin`; the app maps it to the configured `VITE_ADMIN_EMAIL` and uses Firebase Email/Password Authentication. The password is never hardcoded in the client.

### Implemented

- Firebase admin login/logout and persistent auth session.
- Public home match list with live Firestore score summary subscriptions.
- Protected Draft, Toss, Scoring, and Player Management routes.
- Firestore-backed player create/edit/delete/search.
- Firestore-persisted scorer summary and undo-last-delivery action.
- Firestore security rules: public read for live score summaries; admin-only player data and score writes.

### Notes

- Firebase web config is intended to be exposed to the browser; Firestore rules are the security boundary. Never put service-account credentials in the frontend.
- The current draft and toss flows remain UI prototypes; their picks/toss result are not yet persisted to Firestore.
- The score controls are a first integration pass. Wide/no-ball controls currently record the standard one-run extra only; wicket/dismissal and batter/bowler scorecard details need extending before using for official match scoring.
- The existing match catalogue and several match-centre scorecard/commentary values are still sample data.
