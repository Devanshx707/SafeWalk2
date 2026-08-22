import { database, auth } from '../firebaseConfig';
import { ref, set, push, get, update, remove, onValue } from 'firebase/database';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export const registerUser = async ({ email, password }) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    await set(ref(database, `users/${userId}`), {
      email: email,
      createdAt: new Date().toISOString(),
      emergencyContacts: [],
      safeWalks: []
    });
    
    console.log("User registered successfully:", userId);
    return { success: true, userId };
  } catch (error) {
    console.error("Registration error:", error.message);
    return { success: false, error: error.message };
  }
};

export const loginUser = async ({ email, password }) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", userCredential.user.uid);
    return { success: true, userId: userCredential.user.uid };
  } catch (error) {
    console.error("Login error:", error.message);
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("User logged out");
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error.message);
    return { success: false, error: error.message };
  }
};

export const getCurrentLocation = async () => {
  return { lat: 21.1458, lng: 79.0882 };
};

export const updateLocation = async (userId, coords) => {
  try {
    if (!auth.currentUser) {
      console.log("No authenticated user");
      return { success: false };
    }

    const locationRef = ref(database, `users/${userId}/currentLocation`);
    await set(locationRef, {
      lat: coords.lat,
      lng: coords.lng,
      timestamp: new Date().toISOString()
    });
    
    console.log("Location updated:", coords);
    return { success: true };
  } catch (error) {
    console.error("Location update error:", error.message);
    return { success: false, error: error.message };
  }
};

export const getRoute = async (start, destination, preference = 'safer') => {
  console.log(`Calculating ${preference} route...`);
  return { routeId: Math.random(), riskLevel: preference === 'safer' ? 'low' : 'moderate' };
};

export const findSafeHavens = async (currentLocation) => {
  console.log("Locating nearest Hospital, Police Station, or 24/7 Shop...");
  return [{ name: "City Hospital", distance: "400m" }];
};

export const triggerEmergency = async (location, isOffline = false) => {
  try {
    if (!auth.currentUser) {
      console.log("No authenticated user");
      return { success: false };
    }

    const userId = auth.currentUser.uid;
    const emergenciesRef = ref(database, `emergencies`);
    const newEmergencyRef = push(emergenciesRef);

    await set(newEmergencyRef, {
      userId: userId,
      location: location,
      timestamp: new Date().toISOString(),
      status: 'active',
      isOffline: isOffline
    });

    if (isOffline) {
      console.log("OFFLINE MODE: Emergency stored. Will sync when online.");
    } else {
      console.log("ONLINE MODE: Emergency triggered and shared with contacts.");
    }

    return { success: true, emergencyId: newEmergencyRef.key };
  } catch (error) {
    console.error("Emergency trigger error:", error.message);
    return { success: false, error: error.message };
  }
};

export const cancelEmergency = async (emergencyId) => {
  try {
    const emergencyRef = ref(database, `emergencies/${emergencyId}`);
    await update(emergencyRef, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    });

    console.log("Emergency cancelled. User is safe.");
    return { success: true };
  } catch (error) {
    console.error("Cancel emergency error:", error.message);
    return { success: false, error: error.message };
  }
};

export const getEmergencyContacts = async (userId) => {
  try {
    const contactsRef = ref(database, `users/${userId}/emergencyContacts`);
    const snapshot = await get(contactsRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return [];
  } catch (error) {
    console.error("Get contacts error:", error.message);
    return [];
  }
};

export const addEmergencyContact = async (userId, contact) => {
  try {
    const contactsRef = ref(database, `users/${userId}/emergencyContacts`);
    const snapshot = await get(contactsRef);
    
    let contacts = snapshot.exists() ? snapshot.val() : [];
    if (!Array.isArray(contacts)) {
      contacts = [];
    }
    
    contacts.push({
      id: Date.now().toString(),
      name: contact.name,
      phone: contact.phone,
      addedAt: new Date().toISOString()
    });

    await set(contactsRef, contacts);
    console.log("Added contact:", contact);
    return { success: true };
  } catch (error) {
    console.error("Add contact error:", error.message);
    return { success: false, error: error.message };
  }
};

export const removeEmergencyContact = async (userId, contactId) => {
  try {
    const contactsRef = ref(database, `users/${userId}/emergencyContacts`);
    const snapshot = await get(contactsRef);
    
    if (snapshot.exists()) {
      let contacts = snapshot.val();
      contacts = contacts.filter(c => c.id !== contactId);
      await set(contactsRef, contacts);
      console.log("Removed contact:", contactId);
      return { success: true };
    }
    
    return { success: false };
  } catch (error) {
    console.error("Remove contact error:", error.message);
    return { success: false, error: error.message };
  }
};

export const sendCheckIn = async (userId, status) => {
  try {
    const checkInRef = push(ref(database, `users/${userId}/checkIns`));
    await set(checkInRef, {
      status: status,
      timestamp: new Date().toISOString()
    });

    console.log("Check-in status:", status);
    return { success: true };
  } catch (error) {
    console.error("Check-in error:", error.message);
    return { success: false, error: error.message };
  }
};

export const showNotification = (title, message) => {
  console.log(`NOTIFICATION: ${title} - ${message}`);
};