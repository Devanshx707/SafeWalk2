import { database, auth } from "../firebaseConfig";
import {
  ref,
  set,
  push,
  get,
  update,
} from "firebase/database";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

// ======================================================
// PRODUCTION FASTAPI BACKEND
// ======================================================

const API_URL = "https://safewalk-backend-1lsc.onrender.com";

// ======================================================
// REGISTER
// ======================================================

export const registerUser = async ({ email, password }) => {
  try {
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const userId = userCredential.user.uid;

    await set(ref(database, `users/${userId}`), {
      email,
      createdAt: new Date().toISOString(),
      emergencyContacts: [],
      safeWalks: [],
    });

    console.log(
      "✅ User registered successfully:",
      userId
    );

    return {
      success: true,
      userId,
    };

  } catch (error) {
    console.error(
      "❌ Registration error:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

// ======================================================
// LOGIN
// ======================================================

export const loginUser = async ({ email, password }) => {
  try {
    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    console.log(
      "✅ User logged in:",
      userCredential.user.uid
    );

    return {
      success: true,
      userId: userCredential.user.uid,
    };

  } catch (error) {
    console.error(
      "❌ Login error:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

// ======================================================
// LOGOUT
// ======================================================

export const logoutUser = async () => {
  try {
    await signOut(auth);

    console.log("✅ User logged out");

    return {
      success: true,
    };

  } catch (error) {
    console.error(
      "❌ Logout error:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

// ======================================================
// FASTAPI HEALTH CHECK
// ======================================================

export const checkBackendHealth = async () => {
  try {
    const response = await fetch(
      `${API_URL}/health`
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data = await response.json();

    console.log(
      "🔥 FASTAPI CONNECTED:",
      data
    );

    return {
      success: true,
      data,
    };

  } catch (error) {
    console.error(
      "❌ FASTAPI NOT CONNECTED:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

// ======================================================
// CURRENT LOCATION
// ======================================================

export const getCurrentLocation = async () => {
  return {
    lat: 21.1458,
    lng: 79.0882,
  };
};

// ======================================================
// UPDATE LOCATION
// ======================================================

export const updateLocation = async (
  userId,
  coords
) => {
  try {
    if (!auth.currentUser) {
      console.log(
        "❌ No authenticated user"
      );

      return {
        success: false,
      };
    }

    const locationRef = ref(
      database,
      `users/${userId}/currentLocation`
    );

    await set(locationRef, {
      lat: coords.lat,
      lng: coords.lng,
      timestamp: new Date().toISOString(),
    });

    console.log(
      "📍 Location updated:",
      coords
    );

    return {
      success: true,
    };

  } catch (error) {
    console.error(
      "❌ Location update error:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

// ======================================================
// GEOCODE DESTINATION
// ======================================================

export const geocodeDestination = async (
  destination
) => {
  try {
    const response = await fetch(
      `${API_URL}/geocode?destination=${encodeURIComponent(
        destination
      )}`
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        `Geocode error: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    console.log(
      "📍 DESTINATION:",
      data
    );

    return data;

  } catch (error) {
    console.error(
      "❌ Geocode error:",
      error.message
    );

    throw error;
  }
};

// ======================================================
// WALKING ROUTE
// ======================================================

export const getRoute = async (
  start,
  destination
) => {
  try {
    const url =
      `${API_URL}/route?` +
      `start_lat=${encodeURIComponent(start.lat)}` +
      `&start_lng=${encodeURIComponent(start.lng)}` +
      `&end_lat=${encodeURIComponent(destination.latitude ?? destination.lat)}` +
      `&end_lng=${encodeURIComponent(destination.longitude ?? destination.lng)}`;

    console.log(
      "🗺️ REQUESTING ROUTE..."
    );

    const response = await fetch(url);

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        `Routing error: ${response.status} ${errorText}`
      );
    }

    const route =
      await response.json();

    console.log(
      "✅ ROUTE RECEIVED:",
      route.length,
      "points"
    );

    return route;

  } catch (error) {
    console.error(
      "❌ Route error:",
      error.message
    );

    throw error;
  }
};

// ======================================================
// NEARBY SAFE PLACES
// ======================================================

export const findSafeHavens = async (
  currentLocation,
  category = "police"
) => {
  try {
    const url =
      `${API_URL}/nearby?` +
      `lat=${encodeURIComponent(currentLocation.lat)}` +
      `&lng=${encodeURIComponent(currentLocation.lng)}` +
      `&category=${encodeURIComponent(category)}`;

    console.log(
      "🛡️ FINDING NEARBY:",
      category
    );

    const response = await fetch(url);

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        `Nearby place error: ${response.status} ${errorText}`
      );
    }

    const place =
      await response.json();

    console.log(
      "✅ SAFE PLACE:",
      place
    );

    return place;

  } catch (error) {
    console.error(
      "❌ Safe place error:",
      error.message
    );

    throw error;
  }
};

// ======================================================
// TRIGGER EMERGENCY
// ======================================================

export const triggerEmergency = async (
  location,
  isOffline = false
) => {
  try {
    if (!auth.currentUser) {
      console.log(
        "❌ No authenticated user"
      );

      return {
        success: false,
      };
    }

    const userId =
      auth.currentUser.uid;

    const userEmail =
      auth.currentUser.email;

    // --------------------------------------------------
    // GET EMERGENCY CONTACTS
    // --------------------------------------------------

    const contactsRef = ref(
      database,
      `users/${userId}/emergencyContacts`
    );

    const contactsSnapshot =
      await get(contactsRef);

    const contacts =
      contactsSnapshot.exists()
        ? contactsSnapshot.val()
        : [];

    console.log(
      "🚨 ALL CONTACTS:",
      contacts
    );

    // --------------------------------------------------
    // SAVE EMERGENCY TO FIREBASE
    // --------------------------------------------------

    const emergenciesRef =
      ref(database, "emergencies");

    const newEmergencyRef =
      push(emergenciesRef);

    const timestamp =
      new Date().toISOString();

    await set(newEmergencyRef, {
      userId,
      location,
      timestamp,
      status: "active",
      isOffline,
      emergencyContacts: contacts,
    });

    console.log(
      "🚨 Emergency triggered"
    );

    console.log(
      "🚨 SOS LOCATION:",
      location
    );

    // --------------------------------------------------
    // EMAIL CONTACTS
    // --------------------------------------------------

    let emailContacts =
      Array.isArray(contacts)
        ? contacts.filter(
            (contact) =>
              contact.email &&
              contact.email.trim() !== ""
          )
        : [];

    // Temporary fallback for testing
    if (
      emailContacts.length === 0 &&
      userEmail
    ) {
      emailContacts = [
        {
          name: "SafeWalk User",
          email: userEmail,
          phone: null,
        },
      ];

      console.log(
        "📧 No emergency contacts."
      );

      console.log(
        "📧 Using logged-in email:",
        userEmail
      );
    }

    console.log(
      "🚨 EMAIL CONTACTS:",
      emailContacts
    );

    // --------------------------------------------------
    // SEND EMERGENCY EMAIL
    // --------------------------------------------------

    if (
      emailContacts.length > 0 &&
      location
    ) {
      console.log(
        "📧 Calling production emergency-alert..."
      );

      const response =
        await fetch(
          `${API_URL}/emergency-alert`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              contacts:
                emailContacts.map(
                  (contact) => ({
                    name:
                      contact.name ||
                      "Emergency Contact",

                    email:
                      contact.email,

                    phone:
                      contact.phone ||
                      null,
                  })
                ),

              latitude: location.lat,

              longitude:
                location.lng,

              timestamp,
            }),
          }
        );

      console.log(
        "📧 Emergency API status:",
        response.status
      );

      const result =
        await response.json();

      if (!response.ok) {
        console.error(
          "❌ Emergency API error:",
          result
        );
      } else {
        console.log(
          "✅ Emergency email response:",
          result
        );
      }
    } else {
      console.log(
        "⚠️ Emergency email NOT sent"
      );
    }

    return {
      success: true,
      emergencyId:
        newEmergencyRef.key,
      contacts,
    };

  } catch (error) {
    console.error(
      "❌ Emergency trigger error:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

// ======================================================
// CANCEL EMERGENCY
// ======================================================

export const cancelEmergency = async (
  emergencyId
) => {
  try {
    if (!emergencyId) {
      console.log(
        "⚠️ No emergency ID"
      );

      return {
        success: false,
      };
    }

    const emergencyRef = ref(
      database,
      `emergencies/${emergencyId}`
    );

    await update(emergencyRef, {
      status: "cancelled",
      cancelledAt:
        new Date().toISOString(),
    });

    console.log(
      "✅ Emergency cancelled. User is safe."
    );

    return {
      success: true,
    };

  } catch (error) {
    console.error(
      "❌ Cancel emergency error:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

// ======================================================
// GET EMERGENCY CONTACTS
// ======================================================

export const getEmergencyContacts = async (
  userId
) => {
  try {
    const contactsRef = ref(
      database,
      `users/${userId}/emergencyContacts`
    );

    const snapshot =
      await get(contactsRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }

    return [];

  } catch (error) {
    console.error(
      "❌ Get contacts error:",
      error.message
    );

    return [];
  }
};

// ======================================================
// ADD EMERGENCY CONTACT
// ======================================================

export const addEmergencyContact = async (
  userId,
  contact
) => {
  try {
    const contactsRef = ref(
      database,
      `users/${userId}/emergencyContacts`
    );

    const snapshot =
      await get(contactsRef);

    let contacts =
      snapshot.exists()
        ? snapshot.val()
        : [];

    if (!Array.isArray(contacts)) {
      contacts = [];
    }

    const newContact = {
      id: Date.now().toString(),

      name:
        contact.name || "",

      email:
        contact.email || "",

      phone:
        contact.phone || "",

      addedAt:
        new Date().toISOString(),
    };

    contacts.push(newContact);

    await set(
      contactsRef,
      contacts
    );

    console.log(
      "✅ Added emergency contact:",
      newContact
    );

    return {
      success: true,
      contact: newContact,
    };

  } catch (error) {
    console.error(
      "❌ Add contact error:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

// ======================================================
// REMOVE EMERGENCY CONTACT
// ======================================================

export const removeEmergencyContact = async (
  userId,
  contactId
) => {
  try {
    const contactsRef = ref(
      database,
      `users/${userId}/emergencyContacts`
    );

    const snapshot =
      await get(contactsRef);

    if (!snapshot.exists()) {
      return {
        success: false,
      };
    }

    let contacts =
      snapshot.val();

    if (!Array.isArray(contacts)) {
      contacts = [];
    }

    contacts =
      contacts.filter(
        (contact) =>
          contact.id !== contactId
      );

    await set(
      contactsRef,
      contacts
    );

    console.log(
      "✅ Removed contact:",
      contactId
    );

    return {
      success: true,
    };

  } catch (error) {
    console.error(
      "❌ Remove contact error:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

// ======================================================
// CHECK-IN
// ======================================================

export const sendCheckIn = async (
  userId,
  status
) => {
  try {
    const checkInRef =
      push(
        ref(
          database,
          `users/${userId}/checkIns`
        )
      );

    await set(checkInRef, {
      status,
      timestamp:
        new Date().toISOString(),
    });

    console.log(
      "✅ Check-in status:",
      status
    );

    return {
      success: true,
    };

  } catch (error) {
    console.error(
      "❌ Check-in error:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

// ======================================================
// LOCAL NOTIFICATION PLACEHOLDER
// ======================================================

export const showNotification = (
  title,
  message
) => {
  console.log(
    `NOTIFICATION: ${title} - ${message}`
  );
};