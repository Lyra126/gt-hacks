import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, SafeAreaView, Alert } from 'react-native';

const CrcDashboard = ({ route, email: propEmail }) => {
  // Get email from either route params or props
  const email = route?.params?.email || propEmail || "dr.anderson@emory.edu";
  const crcId = "ARC-12345";
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);

  // CRC's managed trials with patient data
  const [managedTrials, setManagedTrials] = useState([
    {
      id: 1,
      title: "Immunotherapy Study for Advanced Lung Cancer",
      status: "Recruiting",
      sponsors: ["National Cancer Institute", "UF Health"],
      location: "Gainesville, FL",
      insurance: "Accepts",
      distance: "10 miles",
      description: "This clinical trial investigates the effectiveness of a new immunotherapy drug for patients with advanced lung cancer.",
      condition: "Lung Cancer",
      patient_ids: ["12345", "88888", "67891"],
      enrollmentTarget: 50,
      currentEnrollment: 3,
      startDate: "2024-01-15",
      endDate: "2025-12-31"
    },
    {
      id: 2,
      title: "Diabetes Management with AI Monitoring",
      status: "Active, not recruiting",
      sponsors: ["Johnson & Johnson", "UF College of Medicine"],
      location: "Jacksonville, FL",
      insurance: "Not required",
      distance: "50 miles",
      description: "A study testing an AI-based glucose monitoring device for patients with Type 2 Diabetes.",
      condition: "Type 2 Diabetes",
      patient_ids: ["12345", "67891"],
      enrollmentTarget: 30,
      currentEnrollment: 2,
      startDate: "2023-08-01",
      endDate: "2024-08-01"
    },
    {
      id: 3,
      title: "Post-Surgical Recovery Optimization",
      status: "Completed",
      sponsors: ["Mayo Clinic"],
      location: "Rochester, MN",
      insurance: "Accepts",
      distance: "Out of state",
      description: "This trial explored physical therapy protocols to enhance recovery times after knee surgery.",
      condition: "Orthopedic Recovery",
      patient_ids: [],
      enrollmentTarget: 25,
      currentEnrollment: 25,
      startDate: "2023-03-01",
      endDate: "2024-02-28"
    }
  ]);

  // Mock patient data
  const patientData = {
    "12345": { name: "John Smith", age: 45, email: "john.smith@email.com", phone: "(555) 123-4567" },
    "88888": { name: "Sarah Johnson", age: 62, email: "sarah.j@email.com", phone: "(555) 234-5678" },
    "67891": { name: "Michael Davis", age: 38, email: "m.davis@email.com", phone: "(555) 345-6789" }
  };

  const filterOptions = ['All', 'Recruiting', 'Active, not recruiting', 'Completed'];

  const filteredTrials = managedTrials.filter(trial => {
    const matchesSearch = trial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trial.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trial.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'All' || trial.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'recruiting': return '#28a745';
      case 'active, not recruiting': return '#007bff';
      case 'completed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getEnrollmentColor = (current, target) => {
    const percentage = (current / target) * 100;
    if (percentage < 50) return '#dc3545';
    if (percentage < 80) return '#ffc107';
    return '#28a745';
  };

  const handleStatusUpdate = (trialId, newStatus) => {
    Alert.alert(
      "Update Trial Status",
      `Change status to "${newStatus}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            setManagedTrials(prev => prev.map(trial => 
              trial.id === trialId ? { ...trial, status: newStatus } : trial
            ));
          }
        }
      ]
    );
  };

  const handleAddPatient = (trialId) => {
    Alert.prompt(
      "Add Patient",
      "Enter Patient ID:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: (patientId) => {
            if (patientId) {
              setManagedTrials(prev => prev.map(trial => 
                trial.id === trialId 
                  ? { 
                      ...trial, 
                      patient_ids: [...trial.patient_ids, patientId],
                      currentEnrollment: trial.currentEnrollment + 1
                    } 
                  : trial
              ));
            }
          }
        }
      ]
    );
  };

  const handleRemovePatient = (trialId, patientId) => {
    Alert.alert(
      "Remove Patient",
      "Remove this patient from the trial?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setManagedTrials(prev => prev.map(trial => 
              trial.id === trialId 
                ? { 
                    ...trial, 
                    patient_ids: trial.patient_ids.filter(id => id !== patientId),
                    currentEnrollment: trial.currentEnrollment - 1
                  } 
                : trial
            ));
          }
        }
      ]
    );
  };

  const handleViewPatients = (trial) => {
    setSelectedTrial(trial);
    setShowPatientModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.wrapper}>
          <Text style={styles.title}>Clinical Trial Management</Text>
          <Text style={styles.subtitle}>Managing {managedTrials.length} clinical trials</Text>
          <Text style={styles.crcInfo}>CRC ID: {crcId} • {email}</Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search trials by title, condition, or location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterContainer}>
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterButton, selectedFilter === filter && styles.activeFilterButton]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={[styles.filterButtonText, selectedFilter === filter && styles.activeFilterButtonText]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.resultsCount}>
            {filteredTrials.length} trial{filteredTrials.length !== 1 ? 's' : ''} found
          </Text>

          {filteredTrials.map((trial) => (
            <View key={trial.id} style={styles.card}>
              <TouchableOpacity 
                  style={[styles.statusBadge, { backgroundColor: getStatusColor(trial.status) }]}
                  onPress={() => {
                    const statusOptions = ['Recruiting', 'Active, not recruiting', 'Completed'];
                    Alert.alert(
                      "Change Status",
                      "Select new status:",
                      statusOptions.map(status => ({
                        text: status,
                        onPress: () => handleStatusUpdate(trial.id, status)
                      })).concat([{ text: "Cancel", style: "cancel" }])
                    );
                  }}
                >
                  <Text style={styles.statusText}>{trial.status}</Text>
                </TouchableOpacity>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{trial.title}</Text>
                
              </View>

              {/* Enrollment Progress */}
              <View style={styles.enrollmentContainer}>
                <View style={styles.enrollmentHeader}>
                  <Text style={styles.enrollmentText}>
                    Enrollment: {trial.currentEnrollment}/{trial.enrollmentTarget}
                  </Text>
                  <Text style={[styles.enrollmentPercentage, { color: getEnrollmentColor(trial.currentEnrollment, trial.enrollmentTarget) }]}>
                    {Math.round((trial.currentEnrollment / trial.enrollmentTarget) * 100)}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${(trial.currentEnrollment / trial.enrollmentTarget) * 100}%`,
                        backgroundColor: getEnrollmentColor(trial.currentEnrollment, trial.enrollmentTarget)
                      }
                    ]} 
                  />
                </View>
              </View>

              {/* Trial Details */}
              <View style={styles.trialDetails}>
                <Text style={styles.condition}>{trial.condition}</Text>
                <Text style={styles.location}>📍 {trial.location}</Text>
                <Text style={styles.dateRange}>
                  📅 {formatDate(trial.startDate)} - {formatDate(trial.endDate)}
                </Text>
              </View>

              <Text style={styles.description}>{trial.description}</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sponsors:</Text>
                <Text style={styles.infoValue}>{trial.sponsors.join(', ')}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Insurance:</Text>
                <Text style={styles.infoValue}>{trial.insurance}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.viewPatientsButton}
                  onPress={() => handleViewPatients(trial)}
                >
                  <Text style={styles.actionButtonText}>
                    View Patients ({trial.patient_ids.length})
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.addPatientButton}
                  onPress={() => handleAddPatient(trial.id)}
                  disabled={trial.status === 'Completed'}
                >
                  <Text style={styles.actionButtonText}>+ Add Patient</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {filteredTrials.length === 0 && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No trials found.</Text>
              <Text style={styles.noResultsSubtext}>Try adjusting your search or filter.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Patient Management Modal */}
      <Modal
        visible={showPatientModal}
        animationType="slide"
        onRequestClose={() => setShowPatientModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Patients in {selectedTrial?.title}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowPatientModal(false)} 
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedTrial?.patient_ids.length === 0 ? (
              <View style={styles.noPatients}>
                <Text style={styles.noPatientsText}>No patients enrolled yet</Text>
              </View>
            ) : (
              selectedTrial?.patient_ids.map((patientId, index) => (
                <View key={index} style={styles.patientCard}>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>
                      {patientData[patientId]?.name || `Patient ${patientId}`}
                    </Text>
                    <Text style={styles.patientDetails}>
                      ID: {patientId}
                    </Text>
                    {patientData[patientId] && (
                      <>
                        <Text style={styles.patientDetails}>
                          Age: {patientData[patientId].age}
                        </Text>
                        <Text style={styles.patientDetails}>
                          Email: {patientData[patientId].email}
                        </Text>
                        <Text style={styles.patientDetails}>
                          Phone: {patientData[patientId].phone}
                        </Text>
                      </>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.removePatientButton}
                    onPress={() => handleRemovePatient(selectedTrial.id, patientId)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
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
    marginTop: 60,
    marginBottom: 20,
    paddingBottom: 40
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: '#2c3e50'
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 4
  },
  crcInfo: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 20,
    fontWeight: '500'
  },
  searchContainer: {
    marginBottom: 20
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 25,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10
  },
  filterButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6'
  },
  activeFilterButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff'
  },
  filterButtonText: {
    color: '#6c757d',
    fontSize: 12,
    fontWeight: '500'
  },
  activeFilterButtonText: {
    color: 'white'
  },
  resultsCount: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
    fontWeight: '500'
  },
  card: { 
    backgroundColor: "#667eea",
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 20, 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowRadius: 12,
    elevation: 8
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  cardTitle: { 
    fontSize: 20, 
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    marginRight: 12,
    marginTop: 20
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  enrollmentContainer: {
    marginBottom: 16
  },
  enrollmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  enrollmentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white'
  },
  enrollmentPercentage: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  trialDetails: {
    marginBottom: 16
  },
  condition: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8
  },
  location: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4
  },
  dateRange: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 22,
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)'
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    flex: 0.3
  },
  infoValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    flex: 0.7,
    textAlign: 'right'
  },
  actionButtons: {
    gap: 12,
    marginTop: 16
  },
  viewPatientsButton: {
    backgroundColor: '#17a2b8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    flex: 1,
    alignItems: 'center'
  },
  addPatientButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    flex: 1,
    alignItems: 'center'
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },
  noResults: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginTop: 20
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 8
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#adb5bd'
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1
  },
  closeButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },
  modalContent: {
    flex: 1,
    padding: 20
  },
  noPatients: {
    alignItems: 'center',
    padding: 40
  },
  noPatientsText: {
    fontSize: 16,
    color: '#6c757d',
    fontStyle: 'italic'
  },
  patientCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2
  },
  patientInfo: {
    flex: 1
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4
  },
  patientDetails: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2
  },
  removePatientButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12
  }
});

export default CrcDashboard;