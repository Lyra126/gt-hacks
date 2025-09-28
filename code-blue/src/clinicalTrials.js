import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, SafeAreaView, ActivityIndicator } from 'react-native';
import ClinicalTrialTimeline from './timeline'; // Make sure this path is correct

const API_BASE_URL = 'http://100.66.12.93:8000/api';

const ClinicalTrials = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedTrial, setSelectedTrial] = useState(null); // State to manage the modal
  const [allTrials, setAllTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch trials from API
  useEffect(() => {
    fetchTrials();
  }, []);

  const fetchTrials = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/trials/available`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAllTrials(data.available_trials || []);
    } catch (err) {
      console.error('Error fetching clinical trials:', err);
      setError('Failed to load clinical trials. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = ['All', 'Recruiting', 'Active', 'Completed'];

  const filteredTrials = allTrials.filter(trial => {
    const matchesSearch = trial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trial.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trial.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trial.sponsor.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'All' || trial.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'recruiting': return '#28a745';
      case 'active': return '#007bff';
      case 'completed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const handleRequestReview = (trialTitle) => {
    // Handle doctor review request
    console.log(`Requesting doctor review for: ${trialTitle}`);
  };

  // --- Handlers for opening and closing the timeline modal ---
  const handleOpenTimeline = (trial) => {
    setSelectedTrial(trial);
  };

  const handleCloseTimeline = () => {
    setSelectedTrial(null);
  };

  return (
    <>
      <ScrollView style={styles.container}>
          <View style={styles.wrapper}>
          <Text style={styles.title}>Clinical Trials</Text>
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Loading clinical trials...</Text>
            </View>
          )}
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchTrials}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {!loading && (
          <>
          <View style={styles.searchContainer}>
              <TextInput
              style={styles.searchInput}
              placeholder="Search by condition, location, or sponsor..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              />
          </View>

          <View style={styles.filterContainer}>
              {filterOptions.map((filter) => (
              <TouchableOpacity
                  key={filter}
                  style={[ styles.filterButton, selectedFilter === filter && styles.activeFilterButton ]}
                  onPress={() => setSelectedFilter(filter)}
              >
                  <Text style={[ styles.filterButtonText, selectedFilter === filter && styles.activeFilterButtonText ]}>
                  {filter}
                  </Text>
              </TouchableOpacity>
              ))}
          </View>

          <Text style={styles.resultsCount}>
              {filteredTrials.length} trial{filteredTrials.length !== 1 ? 's' : ''} found
          </Text>

          {filteredTrials.map((trial) => (
              // Card is now pressable to open the timeline
              <TouchableOpacity key={trial.id} onPress={() => handleOpenTimeline(trial)} activeOpacity={0.8}>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{trial.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trial.status) }]}>
                      <Text style={styles.statusText}>{trial.status}</Text>
                      </View>
                  </View>

                  <View style={styles.distanceLocationRow}>
                      <Text style={styles.distance}>📍 {trial.distance}</Text>
                      <Text style={styles.condition}>{trial.condition}</Text>
                  </View>

                  <Text style={styles.location}>🏥 {trial.location}</Text>
                  <Text style={styles.description}>{trial.description}</Text>

                  <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Sponsor:</Text>
                      <Text style={styles.infoValue}>{trial.sponsor}</Text>
                  </View>

                  <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Insurance:</Text>
                      <Text style={styles.infoValue}>{trial.insurance}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.reviewButton}
                    onPress={() => handleRequestReview(trial.title)}
                  >
                    <Text style={styles.reviewButtonText}>Request Doctor Review</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
          ))}

          {filteredTrials.length === 0 && (
              <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No clinical trials found.</Text>
              <Text style={styles.noResultsSubtext}>Try adjusting your search or filter.</Text>
              </View>
          )}
          </>
          )}
          </View>
      </ScrollView>

      {/* --- Timeline Modal --- */}
      <Modal
        visible={!!selectedTrial}
        animationType="slide"
        onRequestClose={handleCloseTimeline}
      >
        <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedTrial?.title}</Text>
                <TouchableOpacity onPress={handleCloseTimeline} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>Exit</Text>
                </TouchableOpacity>
            </View>
            <ClinicalTrialTimeline trialTitle={selectedTrial?.title}/>
        </SafeAreaView>
      </Modal>
    </>
  );
};


// --- Add these new styles to your existing StyleSheet.create call ---
const styles = StyleSheet.create({
  // --- (all your existing styles are here) ---
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
    marginTop: 50,
    marginBottom: 20,
    paddingBottom: 40
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    marginBottom: 20,
    color: '#2c3e50'
  },
  searchContainer: {
    marginBottom: 20
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 25,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10
  },
  filterButton: {
    backgroundColor: 'white',
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
    fontSize: 10,
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
    marginBottom: 12
  },
  cardTitle: { 
    fontSize: 20, 
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    marginRight: 12
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  distanceLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  distance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ade80'
  },
  condition: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  location: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    lineHeight: 18
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
  reviewButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10
  },
  reviewButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },
  noResults: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
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

  // NEW STYLES FOR MODAL
  modalContainer: {
    flex: 1,
    backgroundColor: '#f4f8fb'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#f4f8fb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Loading and Error States
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    marginTop: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d'
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8d7da',
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#f5c6cb'
  },
  errorText: {
    fontSize: 16,
    color: '#721c24',
    textAlign: 'center',
    marginBottom: 15
  },
  retryButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  }
});

export default ClinicalTrials;
