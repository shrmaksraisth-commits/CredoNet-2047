import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Safe Analytics setup
let analytics = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    console.warn("Analytics initialization failed or is running in an environment without standard support:", err);
  }
}
export { analytics };

export const googleAuthProvider = new GoogleAuthProvider();

export const gmailAuthProvider = new GoogleAuthProvider();
gmailAuthProvider.addScope("https://mail.google.com/");
gmailAuthProvider.addScope("https://www.googleapis.com/auth/gmail.readonly");
gmailAuthProvider.addScope("https://www.googleapis.com/auth/gmail.modify");
gmailAuthProvider.addScope("https://www.googleapis.com/auth/gmail.compose");
gmailAuthProvider.addScope("https://www.googleapis.com/auth/gmail.send");

