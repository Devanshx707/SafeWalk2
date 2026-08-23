const API_URL = "https://safewalk-backend-1lsc.onrender.com";

// ======================================================
// HEALTH CHECK
// ======================================================

export async function checkBackend() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
}

// ======================================================
// GEMINI CHAT
// ======================================================

export async function sendChatMessage(
  message,
  userContext = ""
) {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      message,
      user_context: userContext,
    }),
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Chat API error: ${response.status} ${text}`
    );
  }

  return await response.json();
}

// ======================================================
// GEOCODING
// ======================================================

export async function getDestinationCoordinates(
  destination
) {
  const response = await fetch(
    `${API_URL}/geocode?destination=${encodeURIComponent(
      destination
    )}`
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Geocoding error: ${response.status} ${text}`
    );
  }

  return await response.json();
}

// ======================================================
// WALKING ROUTE
// ======================================================

export async function getWalkingRoute(
  startLatitude,
  startLongitude,
  endLatitude,
  endLongitude
) {
  const response = await fetch(
    `${API_URL}/route?` +
      `start_lat=${encodeURIComponent(startLatitude)}` +
      `&start_lng=${encodeURIComponent(startLongitude)}` +
      `&end_lat=${encodeURIComponent(endLatitude)}` +
      `&end_lng=${encodeURIComponent(endLongitude)}`
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Routing error: ${response.status} ${text}`
    );
  }

  return await response.json();
}

// ======================================================
// NEARBY SAFE PLACES
// ======================================================

export async function getNearbyPlace(
  lat,
  lng,
  category
) {
  const response = await fetch(
    `${API_URL}/nearby?` +
      `lat=${encodeURIComponent(lat)}` +
      `&lng=${encodeURIComponent(lng)}` +
      `&category=${encodeURIComponent(category)}`
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Nearby place error: ${response.status} ${text}`
    );
  }

  return await response.json();
}