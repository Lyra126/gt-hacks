import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import ClinicalTrialTimeline from './timeline'; // Make sure this path is correct

const API_BASE_URL = 'http://100.66.12.93:8000/api';

const ClinicalTrials = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedTrial, setSelectedTrial] = useState(null); // State to manage the modal
  const [allTrials, setAllTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineProgress, setTimelineProgress] = useState({}); // Store progress for each trial
  const [enrollingTrial, setEnrollingTrial] = useState(null); // Track which trial is being enrolled in
  const [syncingProgress, setSyncingProgress] = useState({}); // Track which trials are syncing progress

  // Load timeline progress from storage
  useEffect(() => {
    loadTimelineProgress();
  }, []);

  // Fetch trials from API
  useEffect(() => {
    fetchTrials();
  }, []);

  const loadTimelineProgress = async () => {
    try {
      const savedProgress = await AsyncStorage.getItem('timelineProgress');
      if (savedProgress) {
        setTimelineProgress(JSON.parse(savedProgress));
      }
    } catch (error) {
      console.error('Error loading timeline progress:', error);
    }
  };

  const saveTimelineProgress = async (trialId, progress) => {
    try {
      const updatedProgress = { ...timelineProgress, [trialId]: progress };
      setTimelineProgress(updatedProgress);
      await AsyncStorage.setItem('timelineProgress', JSON.stringify(updatedProgress));
      
      // Sync progress with backend if user is enrolled in this trial
      if (user?.mainId) {
        setSyncingProgress(prev => ({ ...prev, [trialId]: true }));
        try {
          // Find enrollment for this trial
          const enrollmentsResponse = await fetch(`${API_BASE_URL}/enrollments/${user.mainId}`);
          if (enrollmentsResponse.ok) {
            const enrollmentsData = await enrollmentsResponse.json();
            const enrollment = enrollmentsData.enrollments.find(e => e.trialId === trialId);
            
            if (enrollment) {
              // Update enrollment progress in backend
              await fetch(`${API_BASE_URL}/enrollments/${enrollment.enrollmentId}/progress`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(progress)
              });
              console.log('Progress synced with backend for trial:', trialId);
            }
          }
        } catch (error) {
          console.error('Error syncing progress with backend:', error);
        } finally {
          setSyncingProgress(prev => ({ ...prev, [trialId]: false }));
        }
      }
    } catch (error) {
      console.error('Error saving timeline progress:', error);
    }
  };

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

  const getTrialProgress = (trialId) => {
    const progress = timelineProgress[trialId];
    if (!progress || !progress.taskStatus) return 0;
    
    const totalTasks = progress.taskStatus.flat().length;
    const completedTasks = progress.taskStatus.flat().filter(Boolean).length;
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const handleRequestReview = (trialTitle) => {
    // Handle doctor review request
    console.log(`Requesting doctor review for: ${trialTitle}`);
  };

  const handleEnrollInTrial = async (trial) => {
    if (!user?.mainId) {
      Alert.alert('Error', 'Please log in to enroll in trials.');
      return;
    }

    console.log('Attempting to enroll in trial:', trial.id, trial.title);
    console.log('Patient ID:', user.mainId);
    
    setEnrollingTrial(trial.id);
    
    try {
      const response = await fetch(`${API_BASE_URL}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: user.mainId,
          trialId: trial.id
        })
      });

      if (response.ok) {
        Alert.alert(
          'Success!', 
          `You have been enrolled in ${trial.title}. You can now track your progress in the Patient dashboard.`,
          [{ text: 'OK' }]
        );
      } else {
        const errorData = await response.json();
        console.log('Enrollment error:', errorData);
        Alert.alert('Enrollment Failed', errorData.detail || 'Failed to enroll in trial. Please try again.');
      }
    } catch (error) {
      console.error('Error enrolling in trial:', error);
      Alert.alert('Error', 'Failed to enroll in trial. Please check your connection and try again.');
    } finally {
      setEnrollingTrial(null);
    }
  };

  // Function to transform stages data to timeline format
  const transformStagesToTimeline = (stages) => {
    if (!stages) return [];
    
    return Object.keys(stages).map((stageKey, index) => {
      const stage = stages[stageKey];
      return {
        date: `Week ${index + 1}`,
        title: stage.name,
        subtitle: stage.summary,
        tasks: stage.checklist?.map(task => ({
          title: task,
          description: `Complete: ${task}`
        })) || []
      };
    });
  };

  // Function to fetch trial stages
  const fetchTrialStages = async (trialId) => {
    console.log('=== FETCH TRIAL STAGES CALLED ===', trialId);
    try {
      console.log('Fetching stages for trial:', trialId);
      setTimelineLoading(true);
      const response = await fetch(`${API_BASE_URL}/trials/${trialId}/stages`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received stages data:', data);
      console.log('Data.stages type:', typeof data.stages);
      console.log('Data.stages keys:', Object.keys(data.stages || {}));
      const transformedData = transformStagesToTimeline(data.stages);
      console.log('Transformed timeline data:', transformedData);
      console.log('Transformed data length:', transformedData.length);
      setTimelineData(transformedData);
    } catch (err) {
      console.error('Error fetching trial stages:', err);
      setTimelineData([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  // --- Handlers for opening and closing the timeline modal ---
  const handleOpenTimeline = async (trial) => {
    console.log('Opening timeline for trial:', trial.title, trial.id);
    setSelectedTrial(trial);
    setTimelineData(null); // Reset timeline data
    await fetchTrialStages(trial.id);
  };

  const handleCloseTimeline = () => {
    setSelectedTrial(null);
    setTimelineData(null);
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

                  {/* Progress Indicator */}
                  {getTrialProgress(trial.id) > 0 && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${getTrialProgress(trial.id)}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {getTrialProgress(trial.id)}% Complete
                      </Text>
                    </View>
                  )}

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
                  
                  <View style={styles.buttonRow}>
                    <TouchableOpacity 
                      style={styles.enrollButton}
                      onPress={(e) => {
                        e.stopPropagation(); // Prevent opening timeline
                        handleEnrollInTrial(trial);
                      }}
                      disabled={enrollingTrial === trial.id}
                    >
                      {enrollingTrial === trial.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.enrollButtonText}>Enroll</Text>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.reviewButton}
                      onPress={(e) => {
                        e.stopPropagation(); // Prevent opening timeline
                        handleRequestReview(trial.title);
                      }}
                    >
                      <Text style={styles.reviewButtonText}>Request Doctor Review</Text>
                    </TouchableOpacity>
                  </View>
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
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Timeline</Text>
            <TouchableOpacity onPress={handleCloseTimeline} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {timelineLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading timeline...</Text>
              </View>
            ) : timelineData && timelineData.length > 0 ? (
              <ClinicalTrialTimeline
                timelineData={timelineData}
                savedProgress={timelineProgress[selectedTrial?.id]}
                onProgressChange={(progress) => saveTimelineProgress(selectedTrial?.id, progress)}
              />
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No timeline data available for this trial.</Text>
              </View>
            )}
          </View>
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
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
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
  },
  
  // Timeline Loading Styles
  timelineLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  timelineLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d'
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginBottom: 10,
  },
  syncText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  enrollButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  enrollButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
});

export default ClinicalTrials;
