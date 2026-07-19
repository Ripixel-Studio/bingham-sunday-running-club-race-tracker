// Firebase configuration
// These should match your existing Firebase project for the -website
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// OAuth endpoint from the existing -website Firebase function
export const OAUTH_AUTH_URL = import.meta.env.VITE_OAUTH_AUTH_URL || 'https://binghamsundayrunningclub.co.uk/api/auth';

// GitHub repository details for the -website repo that results are written to.
// These are env-configurable so that moving/renaming the repo is a config change,
// not a code change. GitHub 301-redirects reads (GET) to a moved repo, but writes
// (the Git Data API used to save results) are not redirected and fail — so these
// MUST point at the repo's current owner/name for saving to work.
export const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'ripixel-studio';
export const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'bingham-sunday-running-club-website';
export const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'main';
