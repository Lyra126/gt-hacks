import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const API_BASE_URL = 'http://10.0.2.2:8000';

const InfoRow = ({ label, value }) => {
  if (!value || value.length === 0) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const PatientDashboard = ({ route }) => {
  const patientId = "patient-xyz-123";

  const [profileData, setProfileData] = useState(null);
  const [emrData, setEmrData] = useState(null);
  const [trials, setTrials] = useState([]); // <-- ADDED State for trials
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch profile, EMR, and available trials all at once
        const [profileResponse, emrResponse, trialsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/patient/${patientId}/profile`),
          fetch(`${API_BASE_URL}/api/patient/${patientId}/emr`),
          fetch(`${API_BASE_URL}/api/trials/available`) // <-- ADDED fetch call
        ]);

        if (!profileResponse.ok) throw new Error('Failed to fetch patient profile.');
        if (!emrResponse.ok) throw new Error('Failed to fetch patient EMR.');
        if (!trialsResponse.ok) throw new Error('Failed to fetch clinical trials.');

        const profile = await profileResponse.json();
        const emr = await emrResponse.json();
        const trialsData = await trialsResponse.json();

        setProfileData(profile);
        setEmrData(emr);
        setTrials(trialsData.available_trials || []); // <-- ADDED state update

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [patientId]);

  const handleUploadEMR = async () => {
    console.log("Upload EMR information");
    try {
      setErrorMessage("");
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf],
      });

      console.log("Selected file:", res);

      const fileBase64 = await RNFS.readFile(res.uri, 'base64');
      const response = await axios.post(`${API_BASE}/extract_text_from_pdf`, {
        email,  
        name,  
        fileData: fileBase64,
        fileName: res.name
      });

      console.log("Upload EMR response:", response.data);

    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log("User cancelled file picker");
      } else {
        console.error("Upload error:", err.response?.data || err.message);
      }
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
        
        <TouchableOpacity style={styles.uploadButton} onPress={handleUploadEMR}>
          <Text style={styles.buttonText}>Upload New EMR File</Text>
        </TouchableOpacity>
      
        {/* EMR Information Card */}
        <View style={styles.card}>
            {/* ... (your existing EMR card) */}
        </View>

        {/* --- UPDATED Clinical Trials Card --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Clinical Trials</Text>
          {trials.length > 0 ? (
            trials.map((trial) => (
              <View key={trial.id} style={styles.trialItem}>
                <View style={styles.trialHeader}>
                  <Text style={styles.trialName}>{trial.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: '#28a745' }]}>
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

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    // Using padding and margin to create space around the content
    paddingBottom: 40
  },
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
  cardHover: {
    // Note: React Native doesn't support CSS hover states directly
    // This would typically be handled with state management for touch interactions
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  },
  cardTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 16,
    color: 'white'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)'
  },
  infoLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500'
  },
  infoValue: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right'
  },
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
  trialDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  matchPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ade80'
  },
  distance: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)'
  },
  trialDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20
  },
  glucoseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  glucoseReading: {
    alignItems: 'center',
    marginRight: 24
  },
  glucoseValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white'
  },
  glucoseUnit: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: -8
  },
  glucoseInfo: {
    flex: 1
  },
  glucoseStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4
  },
  glucoseTarget: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2
  },
  lastReading: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)'
  },
  glucoseChart: {
    marginTop: 16
  },
  chartLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80
  },
  chartBar: {
    alignItems: 'center'
  },
  chartPoint: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8
  },
  timeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)'
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
    margin:7
  },
  updateButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    margin:7
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },
});

export default PatientDashboard;