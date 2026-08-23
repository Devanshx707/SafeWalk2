// services/SafeWalkService.js

export const loginUser = async (credentials) => { console.log("User logged in"); };
export const registerUser = async (data) => { console.log("User registered"); };

export const getCurrentLocation = async () => { 
  return { lat: 21.1458, lng: 79.0882 }; // Example: Nagpur coordinates
};

export const updateLocation = async (coords) => { console.log("Location updated:", coords); };

export const getRoute = async (start, destination, preference = 'safer') => {
  console.log(`Calculating ${preference} route...`);
  return { routeId: 123, riskLevel: preference === 'safer' ? 'low' : 'moderate' };
};

export const findSafeHavens = async (currentLocation) => {
  console.log("Locating nearest Hospital, Police Station, or 24/7 Shop...");
  return [{ name: "City Hospital", distance: "400m" }];
};

export const triggerEmergency = async (location, isOffline = false) => {
  if (isOffline) {
    console.log("OFFLINE MODE: Sending emergency SMS to contacts with last known GPS...");
  } else {
    console.log("ONLINE MODE: Alerting response team and sharing live tracking link.");
  }
};

export const cancelEmergency = async () => { console.log("Emergency cancelled. User is safe."); };

export const getEmergencyContacts = async () => {
  return [{ name: "Mom", phone: "555-0101" }, { name: "Roommate", phone: "555-0102" }];
};

export const addEmergencyContact = async (contact) => { console.log("Added contact:", contact); };

export const sendCheckIn = async (status) => { console.log("Check-in status:", status); };
export const showNotification = (title, message) => { console.log(`NOTIFICATION: ${title} - ${message}`); };