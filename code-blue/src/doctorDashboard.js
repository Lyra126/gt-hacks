import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const DoctorDashboard = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Patient Dashboard</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upcoming Appointments</Text>
        <Text>Dr. Smith - 10/01/2025</Text>
        <Text>Dr. Lee - 10/15/2025</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Lab Results</Text>
        <Text>Blood Test - Normal</Text>
        <Text>Cholesterol - High</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f4f4f4' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
});

export default DoctorDashboard;
