import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const API_BASE_URL = 'http://100.66.12.93:8000'; 

// Helper component to keep the UI clean
const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const PatientDashboard = ({ route }) => {
  // In a real app, this would come from your auth context
  const patientId = "patient-xyz-123";

  const [profileData, setProfileData] = useState(null);
  const [emrData, setEmrData] = useState(null);
  const [trials, setTrials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileResponse, emrResponse, trialsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/patient/${patientId}/profile`),
          fetch(`${API_BASE_URL}/api/patient/${patientId}/emr`),
          fetch(`${API_BASE_URL}/api/trials/available`)
        ]);

        if (!profileResponse.ok) throw new Error('Failed to fetch patient profile.');
        if (!emrResponse.ok) throw new Error('Failed to fetch patient EMR.');
        if (!trialsResponse.ok) throw new Error('Failed to fetch clinical trials.');

        const profile = await profileResponse.json();
        const emr = await emrResponse.json();
        const trialsData = await trialsResponse.json();

        setProfileData(profile);
        setEmrData(emr);
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
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.canceled) return;

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType });

      Alert.alert("Uploading...", "Your EMR is being processed.");
      const response = await fetch(`${API_BASE_URL}/api/emr/upload-pdf/${patientId}`, {
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

  if (isLoading) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#667eea" /></View>;
  }

  if (error) {
    return <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Patient Dashboard</Text>
        <Text style={styles.welcomeText}>Welcome back, {profileData?.firstName || 'Patient'}</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadEMR}>
            <Text style={styles.buttonText}>Upload EMR File</Text>
          </TouchableOpacity>
        </View>
      
        {/* EMR Information Card - Now fully dynamic */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Information</Text>
          <InfoRow label="Name" value={`${profileData?.firstName || ''} ${profileData?.lastName || ''}`} />
          <InfoRow label="EMR Log" value={emrData?.log?.join(', ')} />
        </View>

        {/* Available Clinical Trials Card - Now fully dynamic */}
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
            <Text style={{color: 'white'}}>No available trials found at this time.</Text>
          )}
        </View>

        {/* Health Tracker Card (Still static as a placeholder) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Health Tracker - Glucose Level</Text>
          {/* ... static health tracker UI ... */}
        </View>
      </View>
    </ScrollView>
  );
};

// Helper function for status colors (can be placed inside or outside the component)
const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'recruiting': return '#28a745';
      case 'active': return '#007bff';
      default: return '#6c757d';
    }
};

const styles = StyleSheet.create({
  // Main Layout Styles
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#667eea',
  },
  wrapper: { 
    flex: 1,
    backgroundColor: "white",
    borderRadius: 25,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    paddingBottom: 40
  },
  centerContainer: { // For loading and error states
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f4f8fb'
  },
  
  // Typography
  title: { 
    marginTop: 50,
    fontSize: 32, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: '#2c3e50'
  },
  welcomeText: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 25,
    fontWeight: '500'
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16
  },

  // Card Styles
  card: { 
    backgroundColor:  "#667eea",
    padding: 24, 
    borderRadius: 20, 
    marginTop: 10,
    marginBottom: 10, 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowRadius: 12,
    elevation: 8
  },
  cardTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 16,
    color: 'white'
  },
  
  // EMR Info Row Styles
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)'
  },
  infoLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    flex: 0.4
  },
  infoValue: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    flex: 0.6,
    textAlign: 'right'
  },
  prescriptionsContainer: { // For the list of prescriptions
    flex: 0.6, 
    alignItems: 'flex-end'
  },
  
  // Clinical Trial Item Styles
  trialItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  trialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  trialName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1
  },
  trialDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 10
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  
  // Button Styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },
});

export default PatientDashboard;