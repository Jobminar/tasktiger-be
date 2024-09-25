import admin, {
  initializeApp,
  credential as _credential,
} from "firebase-admin";

// Load your Firebase service account key JSON file
import serviceAccount from "./service-account-file.json";

// Initialize Firebase Admin SDK
initializeApp({
  credential: _credential.cert(serviceAccount),
  databaseURL:
    "https://coolie-9cc38-default-rtdb.asia-southeast1.firebasedatabase.app",
});

export default admin;
