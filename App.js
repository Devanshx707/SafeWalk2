import React, { useState, useEffect } from 'react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

import {
  checkBackend,
  sendChatMessage,
  getDestinationCoordinates,
  getWalkingRoute,
  getNearbyPlace,
} from './services/api';

import {
  triggerEmergency,
  cancelEmergency,
  loginUser,
  registerUser,
  addEmergencyContact,
  getEmergencyContavt
} from './services/SafeWalkService';


// --- DARK MAP THEME ---
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
];

// --- SAFE PLACE CATEGORIES ---
const safePlaceCategories = [
  { id: '1', title: 'Hospital', icon: '🏥', category: 'hospital' },
  { id: '2', title: 'Police station', icon: '👮', category: 'police' },
  { id: '3', title: 'Open shop', icon: '🏪', category: 'shop' },
  { id: '4', title: 'Bank/ATM', icon: '🏦', category: 'bank' },
  { id: '5', title: 'College/security desk', icon: '🏫', category: 'school' },
  { id: '6', title: 'Railway station', icon: '🚉', category: 'railway' },
  { id: '7', title: 'Petrol pump', icon: '⛽', category: 'petrol' },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Login');
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState('');
  const [destCoords, setDestCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Contact management state
  const [contacts, setContacts] = useState([]);
  const [newContactEmail, setNewContactEmail] = useState('');
  const [currentUser, setCurrentUser] = useState(null); 
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showAIAlert, setShowAIAlert] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showSafePlaceMenu, setShowSafePlaceMenu] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const testBackend = async () => {
    try {
      const result = await checkBackend();
      console.log('🔥 FASTAPI CONNECTED:', result);
    } catch (error) {
      console.log('❌ FASTAPI NOT CONNECTED:', error.message);
    }
  };

  const handleSafePlace = async (place) => {
    if (!location) {
      Alert.alert('Location unavailable', 'Please wait for your location.');
      return;
    }

    try {
      setShowSafePlaceMenu(false);

      const placeInfo = await getNearbyPlace(
        location.lat,
        location.lng,
        place.category
      );

      const targetLat = placeInfo.latitude || placeInfo.lat;
      const targetLng = placeInfo.longitude || placeInfo.lng;

      if (!targetLat || !targetLng) {
        throw new Error('Could not retrieve safe place coordinates.');
      }

      const route = await getWalkingRoute(
        location.lat,
        location.lng,
        targetLat,
        targetLng
      );

      setDestination(placeInfo.name);

      setDestCoords({
        latitude: targetLat,
        longitude: targetLng,
      });

      setRouteCoords(route);
      setCurrentScreen('SafeWalk');
    } catch (error) {
      console.log('❌ Safe place error:', error);
      Alert.alert(
        "Couldn't find place",
        error.message || 'Please try again.'
      );
    }
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim() || chatLoading) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setChatLoading(true);

    try {
      const result = await sendChatMessage(
        userMessage,
        `SafeWalk session is active. Destination: ${destination || 'Not specified'}. Location: ${
          location ? `${location.lat}, ${location.lng}` : 'Not available'
        }`
      );

      setChatMessages((prev) => [...prev, { role: 'assistant', text: result.response }]);
    } catch (error) {
      console.log('❌ Chat error:', error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "Sorry, I couldn't connect to SafeWalk Assistant right now. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };
useEffect(() => {
  testBackend();
}, []);

useEffect(() => {                         
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setCurrentUser(user);
    if (user) {
      getEmergencyContacts(user.uid).then((c) =>
        setContacts(Array.isArray(c) ? c : [])
      );
    }
  });
  return unsubscribe;
}, []);

useEffect(() => {
  (async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    ...
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  useEffect(() => {
    let timer;
    if (showAIAlert && countdown > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (showAIAlert && countdown === 0) {
      setShowAIAlert(false);
      setCountdown(10);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerEmergency(location, false);
      setCurrentScreen('Emergency');
    }
    return () => clearInterval(timer);
  }, [showAIAlert, countdown]);

  const handleStartSafeWalk = async () => {
    if (!destination.trim()) {
      return Alert.alert('Wait!', 'Please enter a destination first.');
    }

    if (!location) {
      return Alert.alert(
        'Location Error',
        'Unable to retrieve your current location. Please check permissions.'
      );
    }

    setIsLoadingRoute(true);

    try {
      const dest = await getDestinationCoordinates(destination);
      setDestCoords(dest);

      console.log('START LOCATION:', location);
      console.log('DESTINATION:', dest);

      const route = await getWalkingRoute(
        location.lat,
        location.lng,
        dest.latitude,
        dest.longitude
      );
      setRouteCoords(route);

      setCurrentScreen('SafeWalk');
    } catch (error) {
      console.log('❌ Route error:', error.message);
      Alert.alert('Routing Error', error.message || 'Could not calculate walking route.');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // --- LOGIN SCREEN ---
  if (currentScreen === 'Login') {
    const handleAuth = async () => {
      try {
        if (isLoginMode) {
          await loginUser({ email, password });
        } else {
          await registerUser({ email, password });
        }
        setEmail('');
        setPassword('');
        setCurrentScreen('Home');
      } catch (error) {
        Alert.alert('Authentication Error', error.message || 'Something went wrong.');
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>SafeWalk</Text>
          <Text style={styles.subtitle}>Smart Personal Safety</Text>
        </View>
        <Text style={styles.authHeader}>{isLoginMode ? 'Welcome Back' : 'Create Account'}</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Email"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.inputField}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
          <Text style={styles.primaryButtonText}>{isLoginMode ? 'SIGN IN' : 'REGISTER'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)}>
          <Text style={styles.toggleAuthText}>
            {isLoginMode ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- HOME SCREEN ---
  if (currentScreen === 'Home') {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.logoutButton} onPress={() => setCurrentScreen('Login')}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.title}>SafeWalk</Text>
          <Text style={styles.subtitle}>Where are you heading?</Text>
        </View>
        <View style={styles.menu}>
          <TextInput
            style={styles.inputField}
            placeholder="Type any address or location..."
            placeholderTextColor="#888"
            value={destination}
            onChangeText={setDestination}
          />
          <TouchableOpacity
            style={[styles.primaryButton, isLoadingRoute && styles.disabledButton]}
            onPress={handleStartSafeWalk}
            disabled={isLoadingRoute}
          >
            <Text style={styles.primaryButtonText}>
              {isLoadingRoute ? 'FETCHING ROUTE...' : 'START SAFEWALK'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setCurrentScreen('Contacts')}
          >
            <Text style={styles.secondaryButtonText}>Manage Emergency Contacts</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- CONTACTS SCREEN ---
  if (currentScreen === 'Contacts') {
    const handleAddContact = async () => {
      if (!newContactName.trim() || !newContactPhone.trim() || !newContactEmail.trim()) {
        return Alert.alert('Missing Information', 'Please fill in name, phone, and email.');
      }

      const newContact = {
        id: Date.now().toString(),
        name: newContactName,
        phone: newContactPhone,
        email: newContactEmail,
      };

      setContacts([...contacts, newContact]);

      setNewContactName('');
      setNewContactPhone('');
      setNewContactEmail('');
    };

    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('Home')}>
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
        <Text style={[styles.sectionTitle, { marginTop: 60 }]}>Trusted Contacts</Text>
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.contactCard}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactPhone}>{item.phone}</Text>
              {item.email ? <Text style={styles.contactEmail}>{item.email}</Text> : null}
            </View>
          )}
          style={{ flexGrow: 0, marginBottom: 20 }}
        />
        <Text style={styles.sectionTitle}>Add New Contact</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Contact Name"
          placeholderTextColor="#888"
          value={newContactName}
          onChangeText={setNewContactName}
        />
        <TextInput
          style={styles.inputField}
          placeholder="Phone Number"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
          value={newContactPhone}
          onChangeText={setNewContactPhone}
        />
        <TextInput
          style={styles.inputField}
          placeholder="Email"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={newContactEmail}
          onChangeText={setNewContactEmail}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
          <Text style={styles.addButtonText}>+ ADD CONTACT</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- EMERGENCY SCREEN ---
  if (currentScreen === 'Emergency') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#B71C1C' }]}>
        <Text style={styles.emergencyTitle}>🚨 EMERGENCY SOS 🚨</Text>
        <Text style={styles.emergencySubtitle}>
          Alert sent to your trusted contacts and emergency services!
        </Text>
        <TouchableOpacity
          style={styles.cancelEmergencyButton}
          onPress={() => {
            cancelEmergency();
            setCurrentScreen('Home');
          }}
        >
          <Text style={styles.cancelEmergencyText}>CANCEL EMERGENCY</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- SAFE WALK SCREEN ---
  if (currentScreen === 'SafeWalk') {
    return (
      <View style={styles.mapContainer}>
        {/* FLOATING HEADER */}
        <SafeAreaView pointerEvents="box-none" style={styles.floatingHeaderContainer}>
          <View style={styles.floatingHeader}>
            <Text style={styles.activeText}>🟢 SafeWalk Active</Text>
            <Text style={styles.destinationText}>To: {destination}</Text>
          </View>
        </SafeAreaView>

        {/* MAP */}
        <MapView
          style={StyleSheet.absoluteFillObject}
          customMapStyle={darkMapStyle}
          showsUserLocation={!!location}
          initialRegion={{
            latitude: location ? location.lat : 18.5204,
            longitude: location ? location.lng : 73.8567,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
        >
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#4CAF50"
              strokeWidth={5}
            />
          )}

          {destCoords && (
            <Marker
              coordinate={{
                latitude: destCoords.latitude,
                longitude: destCoords.longitude,
              }}
              title={destination}
              pinColor="#1E88E5"
            />
          )}
        </MapView>

        {/* BOTTOM FLOATING CONTROLS */}
        <SafeAreaView pointerEvents="box-none" style={styles.floatingControlsContainer}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowSafePlaceMenu(true)}
            >
              <Text style={styles.actionButtonIcon}>🛡️</Text>
              <Text style={styles.actionButtonText}>Safe Places</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => setShowChat(true)}>
              <Text style={styles.actionButtonIcon}>🤖</Text>
              <Text style={styles.actionButtonText}>Assistant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.sosButton]}
              onPress={() => {
                triggerEmergency(location, true);
                setCurrentScreen('Emergency');
              }}
            >
              <Text style={styles.sosButtonText}>SOS</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* SAFE PLACE MODAL */}
        <Modal
          transparent={true}
          visible={showSafePlaceMenu}
          animationType="slide"
          onRequestClose={() => setShowSafePlaceMenu(false)}
        >
          <View style={styles.bottomSheetOverlay}>
            <View style={styles.safePlaceMenu}>
              <Text style={styles.safePlaceMenuTitle}>Where do you want to go?</Text>
              <Text style={styles.safePlaceMenuSub}>Select the nearest safe location type:</Text>

              <FlatList
                data={safePlaceCategories}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.safePlaceItem}
                    onPress={() => handleSafePlace(item)}
                  >
                    <Text style={styles.safePlaceIcon}>{item.icon}</Text>
                    <Text style={styles.safePlaceItemText}>{item.title}</Text>
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity
                style={styles.cancelMenuButton}
                onPress={() => setShowSafePlaceMenu(false)}
              >
                <Text style={styles.cancelMenuText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* AI ALERT SENSOR MODAL */}
        <Modal
          transparent={true}
          visible={showAIAlert}
          animationType="slide"
          onRequestClose={() => {
            setShowAIAlert(false);
            setCountdown(10);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalWarning}>⚠️ AI SENSOR ALERT</Text>
              <Text style={styles.modalSubText}>Sudden impact or running detected.</Text>
              <Text style={styles.timerText}>{countdown}</Text>
              <Text style={styles.modalSubText}>Auto-alerting in {countdown}s...</Text>

              <TouchableOpacity
                style={[styles.modalSafeButton, { backgroundColor: '#D32F2F', marginBottom: 15 }]}
                onPress={() => {
                  setShowAIAlert(false);
                  setCountdown(10);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  setCurrentScreen('Emergency');
                }}
              >
                <Text style={styles.modalSafeText}>🆘 I'M IN DANGER</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSafeButton}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowAIAlert(false);
                  setCountdown(10);
                }}
              >
                <Text style={styles.modalSafeText}>✅ I'M SAFE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* GEMINI CHAT MODAL */}
        <Modal
          transparent={true}
          visible={showChat}
          animationType="slide"
          onRequestClose={() => setShowChat(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.chatOverlay}
          >
            <View style={styles.chatBox}>
              <View style={styles.chatHeader}>
                <View>
                  <Text style={styles.chatTitle}>🤖 SafeWalk Assistant</Text>
                  <Text style={styles.chatSubtitle}>Personal safety assistant</Text>
                </View>
                <TouchableOpacity
                  style={styles.chatCloseButton}
                  onPress={() => setShowChat(false)}
                >
                  <Text style={styles.chatClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={chatMessages}
                keyExtractor={(_, index) => index.toString()}
                style={styles.chatList}
                contentContainerStyle={styles.chatListContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.chatBubble,
                      item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chatText,
                        item.role === 'user' ? styles.userText : styles.assistantText,
                      ]}
                    >
                      {item.text}
                    </Text>
                  </View>
                )}
                ListFooterComponent={
                  chatLoading ? (
                    <View style={[styles.chatBubble, styles.assistantBubble, styles.thinkingBubble]}>
                      <Text style={styles.thinkingText}>🤖 AI is thinking...</Text>
                    </View>
                  ) : null
                }
              />

              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  placeholder={chatLoading ? 'AI is typing...' : 'Ask Assistant anything...'}
                  placeholderTextColor="#888"
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  editable={!chatLoading}
                />
                <TouchableOpacity
                  style={[styles.chatSendButton, chatLoading && styles.disabledButton]}
                  onPress={handleSendChat}
                  disabled={chatLoading}
                >
                  <Text style={styles.chatSendText}>{chatLoading ? '...' : 'Send'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  return null;
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 20 },
  header: { marginTop: 40, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#4CAF50' },
  subtitle: { fontSize: 16, color: '#AAA', marginTop: 5 },
  authHeader: { fontSize: 22, fontWeight: '600', color: '#FFF', marginVertical: 20, textAlign: 'center' },
  inputField: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  primaryButton: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 8, alignItems: 'center', marginVertical: 10 },
  primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { padding: 15, alignItems: 'center' },
  secondaryButtonText: { color: '#4CAF50', fontSize: 15 },
  toggleAuthText: { color: '#888', textAlign: 'center', marginTop: 15 },
  logoutButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 100,
    padding: 12,
  },
  logoutText: { color: '#E53935', fontWeight: 'bold', fontSize: 16 },
  menu: { marginTop: 30 },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 100,
    padding: 12,
  },
  backButtonText: { color: '#4CAF50', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  contactCard: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 8, marginBottom: 10 },
  contactName: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  contactPhone: { color: '#AAA', marginTop: 2 },
  contactEmail: { color: '#4CAF50', marginTop: 2, fontSize: 14 },
  addButton: { backgroundColor: '#333', padding: 15, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#FFF', fontWeight: 'bold' },
  emergencyTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginTop: 100 },
  emergencySubtitle: { fontSize: 16, color: '#FFCDD2', textAlign: 'center', margin: 20 },
  cancelEmergencyButton: { backgroundColor: '#FFF', padding: 20, borderRadius: 8, marginTop: 40, alignSelf: 'center' },
  cancelEmergencyText: { color: '#B71C1C', fontWeight: 'bold', fontSize: 18 },
  mapContainer: { flex: 1, backgroundColor: '#000' },
  floatingHeaderContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  floatingHeader: { backgroundColor: 'rgba(30,30,30,0.9)', padding: 15, borderRadius: 10 },
  activeText: { color: '#4CAF50', fontWeight: 'bold' },
  destinationText: { color: '#FFF', marginTop: 2 },
  floatingControlsContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, zIndex: 10 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { backgroundColor: '#1E1E1E', padding: 12, borderRadius: 10, alignItems: 'center', width: '30%' },
  actionButtonIcon: { fontSize: 20 },
  actionButtonText: { color: '#FFF', fontSize: 12, marginTop: 4 },
  sosButton: { backgroundColor: '#D32F2F', justifyContent: 'center' },
  sosButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  bottomSheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  safePlaceMenu: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  safePlaceMenuTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  safePlaceMenuSub: { color: '#AAA', marginVertical: 8 },
  safePlaceItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  safePlaceIcon: { fontSize: 20, marginRight: 15 },
  safePlaceItemText: { color: '#FFF', fontSize: 16 },
  cancelMenuButton: { marginTop: 15, padding: 12, alignItems: 'center' },
  cancelMenuText: { color: '#E53935', fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalBox: { backgroundColor: '#1E1E1E', padding: 25, borderRadius: 15, alignItems: 'center', width: '80%' },
  modalWarning: { color: '#FFB300', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalSubText: { color: '#AAA', textAlign: 'center', marginVertical: 5 },
  timerText: { color: '#FFF', fontSize: 48, fontWeight: 'bold', marginVertical: 10 },
  modalSafeButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
  modalSafeText: { color: '#FFF', fontWeight: 'bold' },
  chatOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  chatBox: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '70%', padding: 15 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chatTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  chatSubtitle: { color: '#AAA', fontSize: 12 },
  chatCloseButton: { padding: 5 },
  chatClose: { color: '#AAA', fontSize: 20 },
  chatList: { flex: 1 },
  chatListContent: { paddingVertical: 10 },
  chatBubble: { padding: 12, borderRadius: 12, marginBottom: 10, maxWidth: '80%' },
  userBubble: { backgroundColor: '#4CAF50', alignSelf: 'flex-end' },
  assistantBubble: { backgroundColor: '#333', alignSelf: 'flex-start' },
  thinkingBubble: { opacity: 0.8, borderWidth: 1, borderColor: '#4CAF50' },
  thinkingText: { color: '#4CAF50', fontStyle: 'italic', fontSize: 14 },
  disabledButton: { backgroundColor: '#555' },
  chatText: { fontSize: 15 },
  userText: { color: '#FFF' },
  assistantText: { color: '#DDD' },
  chatInputRow: { flexDirection: 'row', marginTop: 10 },
  chatInput: { flex: 1, backgroundColor: '#2C2C2C', color: '#FFF', padding: 12, borderRadius: 8, marginRight: 10 },
  chatSendButton: { backgroundColor: '#4CAF50', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8 },
  chatSendText: { color: '#FFF', fontWeight: 'bold' },
});
