import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from './AuthContext';

const API_BASE_URL = 'http://100.66.12.93:8000/api'; 

// Helper components
const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const InfoColumn = ({ label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.infoColumn}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.logValue}>{value}</Text>
    </View>
  );
};

const PatientDashboard = ({ route }) => {
  const { user, logout } = useAuth();
  const patientId = user?.mainId;

  const [profileData, setProfileData] = useState(null);
  const [trials, setTrials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Fetching logic remains the same...
      try {
        const [profileResponse, trialsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/patient/${patientId}/profile`),
          fetch(`${API_BASE_URL}/trials/available`)
        ]);

        if (!profileResponse.ok) throw new Error('Failed to fetch patient profile.');
        if (!trialsResponse.ok) throw new Error('Failed to fetch clinical trials.');

        const profile = await profileResponse.json();
        const trialsData = await trialsResponse.json();

        setProfileData(profile);
        setTrials(trialsData.available_trials || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [patientId]);

  const handleUploadEMR = async () => {
    // Upload logic remains the same...
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.canceled) return;
      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType });

      Alert.alert("Uploading...", "Your EMR is being processed.");
      const response = await fetch(`${API_BASE_URL}/emr/upload-pdf/${patientId}`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.detail || 'Upload failed');
      Alert.alert("Success!", `EMR processed. Summary: ${responseData.summary}`);
    } catch (err) {
      Alert.alert("Upload Error", err.message);
    }
  };

  const handleLogout = () => {
    // Logout logic remains the same...
    Alert.alert(
      "Logout", "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: async () => {
            try {
              await logout();
            } catch (_error) {
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
        }}
      ]
    );
  };

  if (isLoading) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#667eea" /></View>;
  }
  if (error) {
    return <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>;
  }

  const emrLogs = [
    { condition: "General", text: "Patient reported mild headache.", date: "2025-09-27T18:45:00Z" },
    { condition: "Hypertension", text: "Blood pressure reading 145/90 mmHg.", date: "2025-09-20T14:30:00Z" },
    { condition: "Diabetes", text: "Fasting blood glucose 130 mg/dL.", date: "2025-09-22T09:15:00Z" }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.wrapper}>
        {/* ===== MODIFICATION START ===== */}
        <View style={styles.headerContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Patient Dashboard</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.welcomeText}>Welcome back, {profileData?.firstName || 'Patient'}</Text>
        </View>
        {/* ===== MODIFICATION END ===== */}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadEMR}>
            <Text style={styles.buttonText}>Upload EMR File</Text>
          </TouchableOpacity>
        </View>
      
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Information</Text>
          <InfoRow label="Name" value={`${profileData?.firstName || ''} ${profileData?.lastName || ''}`} />
          <InfoColumn
            label="EMR Log"
            value={emrLogs.map(log => `${new Date(log.date).toLocaleDateString()} [${log.condition}]: ${log.text}`).join("\n\n")}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Clinical Trials</Text>
          {trials.length > 0 ? (
            trials.map((trial) => (
              <View key={trial.id} style={styles.trialItem}>
                <View style={styles.trialHeader}>
                  <Text style={styles.trialName}>{trial.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trial.status) }]}>
                    <Text style={styles.statusText}>{trial.status}</Text>
                  </View>
                </View>
                <Text style={styles.trialDescription}>{trial.description}</Text>
              </View>
            ))
          ) : (
            <Text style={{color: 'white'}}>No available trials found.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'recruiting': return '#28a745';
      case 'active': return '#007bff';
      default: return '#6c757d';
    }
};

const styles = StyleSheet.create({
  // Main Layout
  container: { flex: 1, padding: 20, backgroundColor: '#667eea' },
  wrapper: { flex: 1, backgroundColor: "white", borderRadius: 25, padding: 20, marginTop: 50, marginBottom: 20, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f8fb' },
  
  // ===== MODIFICATION START =====
  headerContainer: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { 
    fontSize: 28,
    fontWeight: 'bold', 
    color: '#2c3e50',
    flexShrink: 1,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    // Removed fixed height and alignSelf for perfect centering
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },
  // ===== MODIFICATION END =====

  welcomeText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: '500'
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16
  },
  card: { backgroundColor: "#667eea", padding: 24, borderRadius: 20, marginTop: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 8 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: 'white' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)' },
  infoColumn: { flexDirection: 'column', paddingTop: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)', paddingBottom: 10 },
  infoLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 5 },
  infoValue: { fontSize: 16, color: 'white', fontWeight: 'bold', flex: 0.6, textAlign: 'right' },
  logValue: { fontSize: 14, color: 'white', fontWeight: '400', lineHeight: 20, textAlign: 'left' },
  trialItem: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  trialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  trialName: { fontSize: 18, fontWeight: 'bold', color: 'white', flex: 1 },
  trialDescription: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginLeft: 10 },
  statusText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  uploadButton: { backgroundColor: '#4CAF50', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 25, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
});

export default PatientDashboard;