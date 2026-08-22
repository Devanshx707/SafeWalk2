# Firebase Setup Guide for SafeWalk2

This guide will help you integrate Firebase into your **SafeWalk2 Expo/React Native mobile app**.

## Step 1: Install Firebase Dependency

Run this command in your project root directory:

```bash
npm install firebase
```

If you're using yarn:

```bash
yarn add firebase
```

## Step 2: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a new project" or select an existing one
3. Name it "SafeWalk2" (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 3: Add App to Firebase (Mobile - Expo)

Since SafeWalk2 is a React Native/Expo app (not a web app), you have two options:

### Option A: Add Android App (Recommended for Testing)
1. In Firebase Console, click the **Android icon** (🤖)
2. Fill in:
   - Android Package Name: `com.safewalk2.app`
   - App nickname: "SafeWalk2 Android" (optional)
   - SHA-1 Certificate Fingerprint: (Optional for development)
3. Download `google-services.json` (save in your project, but we won't use it directly with Expo)
4. Click "Register app"

### Option B: Add iOS App
1. In Firebase Console, click the **iOS icon** (🍎)
2. Fill in:
   - iOS Bundle ID: `com.safewalk2.app`
   - App Store ID: (leave empty for now)
3. Download `GoogleService-Info.plist` (not needed for Expo)

### For Expo Apps (Use Web Config)
Even though it's a mobile app, Expo uses the **Web Firebase configuration**. So:

1. In Firebase Console, click the **Web icon** (</>)
2. Register app with nickname "SafeWalk2 Expo"
3. You'll see a config object like:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 4: Configure Firebase Config File

1. Copy the config values from Step 3
2. Open `firebaseConfig.js` in your project root
3. Replace the placeholder values with your actual Firebase credentials
4. Add your Realtime Database URL:
   - Go to Firebase Console → Realtime Database
   - Copy the database URL (looks like: `https://YOUR_PROJECT.firebaseio.com`)

```javascript
// firebaseConfig.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com"  // ← Add this!
};
```

## Step 5: Enable Firebase Services

### Authentication
1. Go to Firebase Console → Build → Authentication
2. Click "Get Started"
3. Enable "Email/Password" provider
4. Click "Enable" and Save

### Realtime Database
1. Go to Firebase Console → Build → Realtime Database
2. Click "Create Database"
3. Choose your region
4. Select **"Test Mode"** for development (allows reads/writes without auth rules)
5. Click "Enable"

## Step 6: Set Database Security Rules (Test Mode)

In Firebase Console → Realtime Database → Rules tab, use:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ **IMPORTANT:** This is for testing only. Before production, implement proper security rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "emergencies": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

## Step 7: Update App.js (Optional but Recommended)

The current `App.js` uses dummy auth. To integrate Firebase properly:

```javascript
import { useState, useEffect } from 'react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Login');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setCurrentScreen('Home');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Update loginUser call in your login handler:
  const handleAuth = async () => {
    if (isLoginMode) {
      const result = await loginUser({ email, password });
      if (result.success) {
        // Navigation handled by onAuthStateChanged
      } else {
        Alert.alert("Error", result.error);
      }
    } else {
      const result = await registerUser({ email, password });
      if (result.success) {
        // Navigation handled by onAuthStateChanged
      } else {
        Alert.alert("Error", result.error);
      }
    }
  };

  // Add this to logout:
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setCurrentScreen('Login');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Rest of App.js...
}
```

## Step 8: Database Structure

Your Firebase Realtime Database will have this structure:

```
safewalk2-project
├── users/
│   └── {userId}/
│       ├── email: "user@example.com"
│       ├── createdAt: "2024-01-20T10:30:00.000Z"
│       ├── currentLocation/
│       │   ├── lat: 21.1458
│       │   ├── lng: 79.0882
│       │   └── timestamp: "2024-01-20T10:30:00.000Z"
│       ├── emergencyContacts/
│       │   ├── 0/
│       │   │   ├── id: "1234567890"
│       │   │   ├── name: "Mom"
│       │   │   ├── phone: "555-0101"
│       │   │   └── addedAt: "2024-01-20T10:30:00.000Z"
│       │   └── 1/
│       │       ├── id: "1234567891"
│       │       ├── name: "Friend"
│       │       └── phone: "555-0102"
│       ├── checkIns/
│       │   └── {checkInId}/
│       │       ├── status: "safe" | "unsafe"
│       │       └── timestamp: "2024-01-20T10:30:00.000Z"
│       └── safeWalks/
│           └── {walkId}/
│               ├── destination: "Market Street"
│               ├── startTime: "2024-01-20T10:30:00.000Z"
│               └── endTime: "2024-01-20T11:30:00.000Z"
└── emergencies/
    └── {emergencyId}/
        ├── userId: "uid123"
        ├── location: { lat: 21.1458, lng: 79.0882 }
        ├── timestamp: "2024-01-20T10:30:00.000Z"
        ├── status: "active" | "cancelled"
        └── isOffline: false
```

## Step 9: Update Contacts Functionality

In your Contacts screen, update to load from Firebase:

```javascript
useEffect(() => {
  if (currentUser) {
    getEmergencyContacts(currentUser.uid).then(contacts => {
      setContacts(Array.isArray(contacts) ? contacts : []);
    });
  }
}, [currentUser]);

const handleAddContact = async () => {
  if (currentUser) {
    await addEmergencyContact(currentUser.uid, { 
      name: newContactName, 
      phone: newContactPhone 
    });
    // Reload contacts
    const updated = await getEmergencyContacts(currentUser.uid);
    setContacts(Array.isArray(updated) ? updated : []);
    setNewContactName('');
    setNewContactPhone('');
  }
};
```

## Step 10: Environment Variables (Optional)

Create a `.env` file for sensitive data:

```
FIREBASE_API_KEY=YOUR_API_KEY
FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
FIREBASE_APP_ID=YOUR_APP_ID
FIREBASE_DATABASE_URL=https://YOUR_PROJECT.firebaseio.com
```

Then install `expo-constants` and update `firebaseConfig.js`:

```javascript
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  // ... etc
};
```

## Files Changed

✅ **Created:**
- `firebaseConfig.js` - Firebase initialization
- `FIREBASE_SETUP.md` - This setup guide

✅ **Updated:**
- `package.json` - Added firebase dependency
- `services/SafeWalkService.js` - Replaced with real Firebase functions

## Troubleshooting

### "FIREBASE_DATABASE_URL is required"
- Make sure you added the `databaseURL` field to your firebaseConfig
- Get it from Firebase Console → Realtime Database → Copy URL

### "Permission denied" errors
- Check your Firebase Rules are set to test mode
- Or ensure your security rules allow the operation

### "User not authenticated"
- Make sure user is logged in before calling functions that need auth
- Check `auth.currentUser` is not null

### App won't compile
- Run `npm install` again to ensure all dependencies are installed
- Clear npm cache: `npm cache clean --force`

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure `firebaseConfig.js` with your credentials
3. ✅ Enable Firebase services (Auth, Realtime Database)
4. ✅ Test login/registration flow
5. ✅ Test emergency trigger and contact management
6. ✅ Update security rules before production

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo + Firebase Guide](https://docs.expo.dev/guides/using-firebase/)
- [Firebase Realtime Database Guide](https://firebase.google.com/docs/database)
- [Firebase Auth Guide](https://firebase.google.com/docs/auth)
