import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

// The base URL of your local FastAPI server.
// Use 'http://10.0.2.2:8000' for the Android emulator.
// Use 'http://localhost:8000' for the iOS simulator.
const API_BASE_URL = 'http://10.0.2.2:8000';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // IMPORTANT: Replace 'org-abc' with the actual ID of the logged-in organization
    const orgId = 'org-abc';

    // The fetch logic is now directly inside the component's effect
    fetch(`${API_BASE_URL}/api/org/${orgId}/active-patients`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setPatients(data.active_patients || []);
      })
      .catch(err => {
        console.error("Failed to fetch active patients:", err);
        setError("Failed to load patient data.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []); // The empty array [] ensures this effect runs only once

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading Patients...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Doctor Dashboard</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Patients ({patients.length})</Text>
        {patients.length > 0 ? (
          patients.map((patient) => (
            <View key={patient.patientId} style={styles.patientRow}>
              <Text style={styles.patientName}>{patient.firstName} {patient.lastName}</Text>
              <Text style={styles.patientInfo}>Trial: {patient.trialId} - Stage: {patient.currentStage}</Text>
            </View>
          ))
        ) : (
          <Text>No active patients found for this organization.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Stats</Text>
        <Text>... other dashboard information ...</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f4f4f4' },
  center: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  patientRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
  },
  patientInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#3498db',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
  }
});

export default DoctorDashboard;