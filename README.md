# React + Firebase

## Firebase setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Register a web app and copy its Firebase configuration values.
3. Create a `.env.local` file in the project root using `.env.example` as a template, then fill in the values.
4. Create a Cloud Firestore database in the Firebase Console. The app uses the project's default database.
5. In Firestore's Rules tab, configure rules appropriate for your app before allowing client access. Do not use open read/write rules in production.

The Firestore client is initialized by `getDb()` in `src/firebase.js` when first needed. Player documents in the `players` collection contain `firstName`, `lastName`, and optional `gender` (`Male` or `Female`); Firestore auto-generates each document ID, which the app uses as the player's reference. Players can be edited from the roster, and gender icons are shown alongside names when gender is set. Team documents in `teams` contain a name (optional when creating a team), the two player document IDs in `playerIds`, an optional color selected from the common-color palette (Light gray is the default for new teams), and a creation timestamp. The Teams tab switch controls whether already-assigned players can be selected again; it defaults to on for the current browser session. A match can only be created when its two teams contain four distinct players. Team names can be changed later; their first names appear alongside team names throughout the interface. Match documents in `matches` reference two teams by `team1Id` and `team2Id`, keep their scores in `team1Score` and `team2Score`, use `status` values `queue`, `in progress`, or `final`, and may have a `matchType` of `unspecified`, `friendly`, `round-robin`, `play-off`, `pre-final`, or `final`. The match type defaults to `unspecified` and can be edited along with the score and status. The Results tab displays matches marked final.

```js
import { collection, getDocs } from 'firebase/firestore'
import { getDb } from './firebase'

const snapshot = await getDocs(collection(getDb(), 'players'))
const documents = snapshot.docs.map((document) => ({
  id: document.id,
  ...document.data(),
}))
```

Firebase web configuration is included in client-side code; secure your data with Firestore Security Rules. Never put service-account credentials in this app. Match roster validation happens in the client and is not a security boundary for direct database writes.

After changing `.env.local`, restart the Vite dev server for the new configuration to load.

## Development

```sh
npm install
npm run dev
```
