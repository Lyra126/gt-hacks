import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import axios from 'axios';
import { useState, useEffect } from 'react';
// import DocumentPicker from 'react-native-document-picker';
// import RNFS from 'react-native-fs'; 

const PatientDashboard = ({route}) => {
  // const { email } = route.params;
  const email = ""
  const name = "John Doe"
  const API_BASE = "http://100.66.11.34:8000/api";
  const [error, setErrorMessage] = useState("");
  
  const emrData = {
    patientId: "PT-2024-7891",
    age: 34,
    bloodType: "A+",
    conditions: ["Type 2 Diabetes", "Hypertension", "Asthma"],
    insurance: "BlueCross BlueShield Premium"
  };

  const clinicalTrials = [
    {
      name: "DIABETES-CARE-2025",
      status: "Recruiting",
      matchPercentage: 94,
      distance: "2.3 miles",
      description: "A phase III trial evaluating a new glucose monitoring system for Type 2 diabetes patients with improved accuracy and continuous tracking capabilities."
    },
    {
      name: "HYPERTENSION-NOVA",
      status: "Active",
      matchPercentage: 87,
      distance: "5.7 miles", 
      description: "Study comparing effectiveness of combination therapy versus traditional treatment approaches for managing hypertension in adults."
    },
    {
      name: "RESPIRATORY-WELLNESS",
      status: "Enrolling",
      matchPercentage: 78,
      distance: "8.2 miles",
      description: "Research on personalized asthma management using AI-powered inhaler technology and environmental monitoring."
    }
  ];

  const healthData = {
    glucoseLevel: 126,
    status: "Slightly Elevated",
    target: "80-120 mg/dL",
    lastReading: "2 hours ago"
  };

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'recruiting': return '#28a745';
      case 'active': return '#007bff';
      case 'enrolling': return '#fd7e14';
      case 'completed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getGlucoseStatusColor = (level) => {
    if (level < 80) return '#dc3545';
    if (level > 120) return '#fd7e14';
    return '#28a745';
  };

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.wrapper}>
      <Text style={styles.title}>Patient Dashboard</Text>
      <Text style={styles.welcomeText}>Welcome back, {name}</Text>
       <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadEMR}>
            <Text style={styles.buttonText}>Upload EMR Files</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.updateButton}>
            <Text style={styles.buttonText}>Update Info</Text>
          </TouchableOpacity> */}
        </View>
      
      {/* EMR Information Card */}
      <View style={[styles.card, styles.cardHover]}>
        <Text style={styles.cardTitle}>EMR Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Patient ID:</Text>
          <Text style={styles.infoValue}>{emrData.patientId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Age:</Text>
          <Text style={styles.infoValue}>{emrData.age} years</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Blood Type:</Text>
          <Text style={styles.infoValue}>{emrData.bloodType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Conditions:</Text>
          <Text style={styles.infoValue}>{emrData.conditions.join(', ')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Insurance:</Text>
          <Text style={styles.infoValue}>{emrData.insurance}</Text>
        </View>
      </View>

      {/* Clinical Trials Card */}
      <View style={[styles.card, styles.cardHover]}>
        <Text style={styles.cardTitle}>Matched Clinical Trials</Text>
        {clinicalTrials.map((trial, index) => (
          <View key={index} style={styles.trialItem}>
            <View style={styles.trialHeader}>
              <Text style={styles.trialName}>{trial.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trial.status) }]}>
                <Text style={styles.statusText}>{trial.status}</Text>
              </View>
            </View>
            <View style={styles.trialDetails}>
              <Text style={styles.matchPercentage}>{trial.matchPercentage}% Match</Text>
              <Text style={styles.distance}>{trial.distance} away</Text>
            </View>
            <Text style={styles.trialDescription}>{trial.description}</Text>
          </View>
        ))}
      </View>

      {/* Health Tracker Card */}
      <View style={[styles.card, styles.cardHover]}>
        <Text style={styles.cardTitle}>Health Tracker - Glucose Level</Text>
        <View style={styles.glucoseContainer}>
          <View style={styles.glucoseReading}>
            <Text style={styles.glucoseValue}>{healthData.glucoseLevel}</Text>
            <Text style={styles.glucoseUnit}>mg/dL</Text>
          </View>
          <View style={styles.glucoseInfo}>
            <Text style={[styles.glucoseStatus, { color: getGlucoseStatusColor(healthData.glucoseLevel) }]}>
              {healthData.status}
            </Text>
            <Text style={styles.glucoseTarget}>Target: {healthData.target}</Text>
            <Text style={styles.lastReading}>Last reading: {healthData.lastReading}</Text>
          </View>
        </View>
        <View style={styles.glucoseChart}>
          <Text style={styles.chartLabel}>Today's Trend</Text>
          <View style={styles.chartContainer}>
            {/* Simple visual representation of glucose levels throughout the day */}
            <View style={styles.chartBar}>
              <View style={[styles.chartPoint, { height: 40, backgroundColor: '#28a745' }]} />
              <Text style={styles.timeLabel}>6AM</Text>
            </View>
            <View style={styles.chartBar}>
              <View style={[styles.chartPoint, { height: 60, backgroundColor: '#fd7e14' }]} />
              <Text style={styles.timeLabel}>12PM</Text>
            </View>
            <View style={styles.chartBar}>
              <View style={[styles.chartPoint, { height: 55, backgroundColor: '#fd7e14' }]} />
              <Text style={styles.timeLabel}>6PM</Text>
            </View>
            <View style={styles.chartBar}>
              <View style={[styles.chartPoint, { height: 45, backgroundColor: '#28a745' }]} />
              <Text style={styles.timeLabel}>Now</Text>
            </View>
          </View>
        </View>
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