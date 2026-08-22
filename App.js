import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert, TextInput, FlatList, Modal } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { triggerEmergency, cancelEmergency, loginUser, registerUser } from './services/SafeWalkService';

// --- DARK MAP THEME ---
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
];

const safePlaceCategories = [
  { id: '1', title: 'Hospital', icon: '🏥', dummyDistance: '1.2 km (5 mins walk)' },
  { id: '2', title: 'Police station', icon: '👮', dummyDistance: '0.8 km (3 mins walk)' },
  { id: '3', title: 'Open shop', icon: '🏪', dummyDistance: '0.2 km (1 min walk)' },
  { id: '4', title: 'Bank/ATM', icon: '🏦', dummyDistance: '0.5 km (2 mins walk)' },
  { id: '5', title: 'College/security desk', icon: '🏫', dummyDistance: '2.1 km (10 mins walk)' },
  { id: '6', title: 'Railway station', icon: '🚉', dummyDistance: '3.5 km (15 mins walk)' },
  { id: '7', title: 'Petrol pump', icon: '⛽', dummyDistance: '1.5 km (6 mins walk)' },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Login');
  const [location, setLocation] = useState(null);
  
  // Freed up Destination State
  const [destination, setDestination] = useState('');
  const [destCoords, setDestCoords] = useState(null);

  const [contacts, setContacts] = useState([{ id: '1', name: "Mom", phone: "555-0101" }]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showAIAlert, setShowAIAlert] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showSafePlaceMenu, setShowSafePlaceMenu] = useState(false);

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
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (showAIAlert && countdown === 0) {
      setShowAIAlert(false); setCountdown(10);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerEmergency(location, false); setCurrentScreen('Emergency');
    }
    return () => clearInterval(timer);
  }, [showAIAlert, countdown]);

  const handleStartSafeWalk = () => {
    if (!destination.trim()) {
      return Alert.alert("Wait!", "Please enter a destination first.");
    }
    
    // Automatically generate dummy coordinates so the map UI still looks great!
    if (location) {
      setDestCoords({
        lat: location.lat + 0.006,
        lng: location.lng + 0.003
      });
    }
    setCurrentScreen('SafeWalk');
  };

  // --- 0. LOGIN SCREEN ---
  if (currentScreen === 'Login') {
    const handleAuth = async () => {
      isLoginMode ? await loginUser({ email, password }) : await registerUser({ email, password });
      setEmail(''); setPassword(''); setCurrentScreen('Home');
    };
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}><Text style={styles.title}>SafeWalk</Text><Text style={styles.subtitle}>Smart Personal Safety</Text></View>
        <Text style={styles.authHeader}>{isLoginMode ? 'Welcome Back' : 'Create Account'}</Text>
        <TextInput style={styles.inputField} placeholder="Email" placeholderTextColor="#888" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={styles.inputField} placeholder="Password" placeholderTextColor="#888" secureTextEntry={true} value={password} onChangeText={setPassword} />
        <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}><Text style={styles.primaryButtonText}>{isLoginMode ? 'SIGN IN' : 'REGISTER'}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)}><Text style={styles.toggleAuthText}>{isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- 1. HOME SCREEN ---
  if (currentScreen === 'Home') {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.logoutButton} onPress={() => setCurrentScreen('Login')}><Text style={styles.logoutText}>Log Out</Text></TouchableOpacity>
        <View style={styles.header}><Text style={styles.title}>SafeWalk</Text><Text style={styles.subtitle}>Where are you heading?</Text></View>
        <View style={styles.menu}>
          {/* Free-typing text input restored! */}
          <TextInput 
            style={styles.inputField} 
            placeholder="Type any address or location..." 
            placeholderTextColor="#888" 
            value={destination} 
            onChangeText={setDestination} 
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleStartSafeWalk}><Text style={styles.primaryButtonText}>START SAFEWALK</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentScreen('Contacts')}><Text style={styles.secondaryButtonText}>Manage Emergency Contacts</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- 2. CONTACTS SCREEN ---
  if (currentScreen === 'Contacts') {
    const handleAddContact = () => {
      setContacts([...contacts, { id: Date.now().toString(), name: newContactName, phone: newContactPhone }]);
      setNewContactName(''); setNewContactPhone('');
    };
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('Home')}><Text style={styles.backButtonText}>← Back to Home</Text></TouchableOpacity>
        <Text style={styles.sectionTitle}>Trusted Contacts</Text>
        <FlatList data={contacts} keyExtractor={item => item.id} renderItem={({ item }) => (
            <View style={styles.contactCard}><Text style={styles.contactName}>{item.name}</Text><Text style={styles.contactPhone}>{item.phone}</Text></View>
        )} style={{ flexGrow: 0, marginBottom: 20 }} />
        <Text style={styles.sectionTitle}>Add New Contact</Text>
        <TextInput style={styles.inputField} placeholder="Contact Name" placeholderTextColor="#888" value={newContactName} onChangeText={setNewContactName} />
        <TextInput style={styles.inputField} placeholder="Phone Number" placeholderTextColor="#888" keyboardType="phone-pad" value={newContactPhone} onChangeText={setNewContactPhone} />
        <TouchableOpacity style={styles.addButton} onPress={handleAddContact}><Text style={styles.addButtonText}>+ ADD CONTACT</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- 3. SAFEWALK SCREEN ---
  if (currentScreen === 'SafeWalk') {
    const dynamicRoute = (location && destCoords) ? [
      { latitude: location.lat, longitude: location.lng }, 
      { latitude: (location.lat + destCoords.lat) / 2, longitude: location.lng }, 
      { latitude: destCoords.lat, longitude: destCoords.lng }
    ] : [];

    return (
      <View style={styles.mapContainer}>
        <SafeAreaView pointerEvents="box-none" style={styles.floatingHeaderContainer}>
          <View style={styles.floatingHeader}>
            <Text style={styles.activeText}>🟢 SafeWalk Active</Text>
            <Text style={styles.destinationText}>To: {destination}</Text>
          </View>
        </SafeAreaView>

        <MapView style={StyleSheet.absoluteFillObject} customMapStyle={darkMapStyle} showsUserLocation={true} initialRegion={{ latitude: location ? location.lat : 18.5204, longitude: location ? location.lng : 73.8567, latitudeDelta: 0.03, longitudeDelta: 0.03 }}>
          {dynamicRoute.length > 0 && <Polyline coordinates={dynamicRoute} strokeColor="#4CAF50" strokeWidth={5} lineDashPattern={[5, 5]} />}
          {destCoords && <Marker coordinate={{ latitude: destCoords.lat, longitude: destCoords.lng }} title={destination} pinColor="#1E88E5" />}
        </MapView>

        {/* SAFE PLACE MENU MODAL */}
        <Modal transparent={true} visible={showSafePlaceMenu} animationType="slide">
          <View style={styles.bottomSheetOverlay}>
            <View style={styles.safePlaceMenu}>
              <Text style={styles.safePlaceMenuTitle}>Where do you want to go?</Text>
              <Text style={styles.safePlaceMenuSub}>Select the nearest safe location type:</Text>
              <FlatList data={safePlaceCategories} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false} renderItem={({ item }) => (
                  <TouchableOpacity style={styles.safePlaceItem} onPress={() => {
                      setShowSafePlaceMenu(false); Alert.alert(`Nearest ${item.title} Found`, `The closest one is ${item.dummyDistance} from your location. Rerouting now!`);
                  }}>
                    <Text style={styles.safePlaceIcon}>{item.icon}</Text>
                    <Text style={styles.safePlaceItemText}>{item.title}</Text>
                  </TouchableOpacity>
              )} />
              <TouchableOpacity style={styles.cancelMenuButton} onPress={() => setShowSafePlaceMenu(false)}><Text style={styles.cancelMenuText}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* AI Modal */}
        <Modal transparent={true} visible={showAIAlert} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalWarning}>⚠️ AI SENSOR ALERT</Text>
              <Text style={styles.modalSubText}>Sudden impact or running detected.</Text>
              <Text style={styles.timerText}>{countdown}</Text>
              <Text style={styles.modalSubText}>Auto-alerting in {countdown}s...</Text>
              <TouchableOpacity style={[styles.modalSafeButton, { backgroundColor: '#D32F2F', marginBottom: 15 }]} onPress={() => {
                  setShowAIAlert(false); setCountdown(10); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setCurrentScreen('Emergency');
              }}><Text style={styles.modalSafeText}>🆘 I'M IN DANGER</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSafeButton} onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setShowAIAlert(false); setCountdown(10);
              }}><Text style={styles.modalSafeText}>✅ I'M SAFE</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={styles.bottomSheet}>
          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity style={styles.smallActionButton} onPress={() => setShowSafePlaceMenu(true)}><Text style={styles.smallActionText}>🏥 Safe Place</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.smallActionButton, {backgroundColor: '#FF9800'}]} onPress={() => setShowAIAlert(true)}><Text style={styles.smallActionText}>🤖 Test AI</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.giantDangerButton} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setCurrentScreen('Emergency');
          }}><Text style={styles.giantDangerText}>I FEEL UNSAFE</Text></TouchableOpacity>
          <TouchableOpacity style={styles.endTripButton} onPress={() => setCurrentScreen('Home')}><Text style={styles.endTripText}>End Trip</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- 4. EMERGENCY SCREEN ---
  if (currentScreen === 'Emergency') {
    return (
      <SafeAreaView style={[styles.container, styles.emergencyBg]}>
        <Text style={styles.emergencyTitle}>Are you in danger?</Text>
        <View style={styles.emergencyActions}>
          <TouchableOpacity style={styles.sosButton} onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); triggerEmergency(location, false); Alert.alert("ALERT SENT", "Your location is being shared.");
          }}><Text style={styles.sosButtonText}>🆘 YES{'\n'}SEND ALERT</Text></TouchableOpacity>
          <TouchableOpacity style={styles.safeButton} onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); cancelEmergency(); setCurrentScreen('SafeWalk');
          }}><Text style={styles.safeButtonText}>✅ I'M SAFE{'\n'}CANCEL</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20, justifyContent: 'center' },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 48, fontWeight: '900', color: '#ffffff', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#888888', marginTop: 5 },
  
  inputField: { backgroundColor: '#1E1E1E', color: '#ffffff', padding: 20, borderRadius: 16, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#333' },

  primaryButton: { backgroundColor: '#4CAF50', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  primaryButtonText: { color: 'white', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  secondaryButton: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 15 },
  secondaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },

  mapContainer: { flex: 1, backgroundColor: '#121212' },
  floatingHeaderContainer: { position: 'absolute', top: 50, width: '100%', alignItems: 'center', zIndex: 10 },
  floatingHeader: { backgroundColor: 'rgba(30, 30, 30, 0.9)', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  activeText: { color: '#4CAF50', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  destinationText: { color: '#ffffff', fontSize: 12, marginTop: 2, textAlign: 'center' },
  
  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#1E1E1E', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 20, zIndex: 5 },
  secondaryActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  smallActionButton: { flex: 1, backgroundColor: '#2A2A2A', padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
  smallActionText: { color: 'white', fontSize: 14, fontWeight: '700' },
  giantDangerButton: { backgroundColor: '#D32F2F', paddingVertical: 25, borderRadius: 20, alignItems: 'center', shadowColor: '#D32F2F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
  giantDangerText: { color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: 1.5 },
  endTripButton: { marginTop: 20, alignItems: 'center', padding: 10 },
  endTripText: { color: '#888888', fontSize: 16, fontWeight: '600' },

  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  safePlaceMenu: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '70%' },
  safePlaceMenuTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginBottom: 5 },
  safePlaceMenuSub: { color: '#888', fontSize: 14, marginBottom: 20 },
  safePlaceItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A2A2A', padding: 18, borderRadius: 16, marginBottom: 12 },
  safePlaceIcon: { fontSize: 24, marginRight: 15 },
  safePlaceItemText: { color: 'white', fontSize: 18, fontWeight: '700' },
  cancelMenuButton: { marginTop: 10, padding: 15, alignItems: 'center' },
  cancelMenuText: { color: '#D32F2F', fontSize: 18, fontWeight: '700' },

  emergencyBg: { backgroundColor: '#8B0000', justifyContent: 'center' },
  emergencyTitle: { color: 'white', fontSize: 36, fontWeight: '900', textAlign: 'center', marginBottom: 50 },
  emergencyActions: { width: '100%', gap: 20 },
  sosButton: { backgroundColor: '#FF0000', padding: 40, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 15 },
  sosButtonText: { color: 'white', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  safeButton: { backgroundColor: '#2E7D32', padding: 25, borderRadius: 24, alignItems: 'center' },
  safeButtonText: { color: 'white', fontSize: 20, fontWeight: '800', textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#1E1E1E', padding: 30, borderRadius: 24, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  modalWarning: { color: '#FF9800', fontSize: 20, fontWeight: '900', marginBottom: 5 },
  timerText: { color: '#D32F2F', fontSize: 90, fontWeight: '900', marginVertical: 10 },
  modalSubText: { color: '#888888', fontSize: 15, marginBottom: 25, textAlign: 'center' },
  modalSafeButton: { padding: 20, borderRadius: 16, width: '100%', alignItems: 'center', backgroundColor: '#2A2A2A' },
  modalSafeText: { color: 'white', fontSize: 20, fontWeight: '800' },
  
  authHeader: { color: '#ffffff', fontSize: 28, fontWeight: '800', marginBottom: 25, textAlign: 'center' },
  toggleAuthText: { color: '#4CAF50', fontSize: 16, textAlign: 'center', marginTop: 25, fontWeight: '600' },
  logoutButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  logoutText: { color: '#888', fontSize: 16, fontWeight: '700' },
  backButton: { marginBottom: 20, padding: 10, alignSelf: 'flex-start' },
  backButtonText: { color: '#4CAF50', fontSize: 18, fontWeight: '700' },
  sectionTitle: { color: '#888888', fontSize: 14, marginBottom: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  contactCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  contactName: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  contactPhone: { color: '#888888', fontSize: 14, marginTop: 5, fontWeight: '500' },
  addButton: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#333' },
  addButtonText: { color: '#4CAF50', fontSize: 16, fontWeight: '800' },
});