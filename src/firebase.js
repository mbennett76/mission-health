// Firebase connection.
// These keys are meant to be public; the database is protected by firestore.rules, not by hiding them.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyCVRCGxpLsabhsh-ji9bqMjT7tYx368Hds',
  authDomain: 'mission-health-app.firebaseapp.com',
  projectId: 'mission-health-app',
  storageBucket: 'mission-health-app.firebasestorage.app',
  messagingSenderId: '787497786547',
  appId: '1:787497786547:web:ae5ac145f8ea7cade2a4c6',
};

export const ADMIN_EMAIL = 'marc@bennettdental.com';

// Until the config is pasted in, the app runs in "preview mode" with a seed file loaded from your computer.
export const PREVIEW = firebaseConfig.apiKey.startsWith('PASTE');

export const app = PREVIEW ? null : initializeApp(firebaseConfig);
export const auth = PREVIEW ? null : getAuth(app);
// Offline cache: the app keeps working with no signal and syncs edits when back online.
export const db = PREVIEW ? null : initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
