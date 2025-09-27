import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const ClinicalTrials = () => {
  const trials = [
    { title: 'Trial A', status: 'Open', description: 'Testing new diabetes treatment' },
    { title: 'Trial B', status: 'Recruiting', description: 'Study on hypertension' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Clinical Trials</Text>
      {trials.map((trial, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.cardTitle}>{trial.title}</Text>
          <Text>Status: {trial.status}</Text>
          <Text>{trial.description}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f4f4f4' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
});

export default ClinicalTrials;
