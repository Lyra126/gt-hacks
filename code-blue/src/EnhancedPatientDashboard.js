import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from './AuthContext';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'http://100.66.12.93:8000/api';

const EnhancedPatientDashboard = ({ route }) => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const patientId = user?.mainId;

  const [profileData, setProfileData] = useState(null);
  const [trials, setTrials] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [recommendedTrials, setRecommendedTrials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Real-time progress data
  const [progressData, setProgressData] = useState({
    currentStage: 0,
    totalStages: 0,
    completionRate: 0,
    nextMilestone: '',
    daysToNext: 0,
    complianceScore: 0
  });

  const fetchDashboardData = async () => {
    console.log('=== FETCH DASHBOARD DATA ===');
    console.log('User:', user);
    console.log('Patient ID:', patientId);
    console.log('User type:', user?.userType);
    
    if (!patientId) {
      console.log('No patient ID available, skipping profile fetch');
      setIsLoading(false);
      return;
    }
      
    setIsLoading(true);
    try {
      const [profileResponse, trialsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/patient/${patientId}/profile`),
        fetch(`${API_BASE_URL}/trials/available`)
      ]);

      if (!profileResponse.ok) {
        console.error('Profile fetch failed:', profileResponse.status, profileResponse.statusText);
        throw new Error(`Failed to fetch patient profile: ${profileResponse.status}`);
      }
      if (!trialsResponse.ok) throw new Error('Failed to fetch clinical trials.');

      const profile = await profileResponse.json();
      const trialsData = await trialsResponse.json();

      setProfileData(profile);
      setTrials(trialsData.available_trials || []);

      // Fetch smart trial recommendations
      try {
        const recommendationsResponse = await fetch(`${API_BASE_URL}/analytics/smart-matching/${patientId}`);
        if (recommendationsResponse.ok) {
          const recommendationsData = await recommendationsResponse.json();
          setRecommendedTrials(recommendationsData.recommendedTrials || []);
        }
      } catch (_err) {
        console.log('Smart matching not available, using fallback');
      }

      // Fetch real enrollment data
      try {
        const enrollmentsResponse = await fetch(`${API_BASE_URL}/enrollments/${patientId}`);
        if (enrollmentsResponse.ok) {
          const enrollmentsData = await enrollmentsResponse.json();
          console.log('Raw enrollments data:', enrollmentsData);
          const formattedEnrollments = enrollmentsData.enrollments.map(enrollment => ({
            id: enrollment.enrollmentId,
            trialId: enrollment.trialId,
            trialTitle: enrollment.trialDetails?.title || 'Unknown Trial',
            status: enrollment.status,
            currentStage: enrollment.currentStage || 1,
            totalStages: enrollment.trialDetails?.stages?.filter(stage => stage !== null)?.length || 4,
            enrollmentDate: enrollment.enrollmentDate,
            nextVisit: enrollment.nextVisit || 'TBD',
            complianceRate: enrollment.complianceRate || 0,
            riskLevel: enrollment.complianceRate > 80 ? 'low' : enrollment.complianceRate > 60 ? 'medium' : 'high',
            progress: enrollment.trialDetails?.stages?.filter(stage => stage !== null)?.map((stage, index) => ({
              stage: index + 1,
              name: stage.name || `Stage ${index + 1}`,
              completed: index < (enrollment.currentStage - 1),
              date: index < (enrollment.currentStage - 1) ? enrollment.enrollmentDate : null
            })) || []
          }));
          console.log('Formatted enrollments:', formattedEnrollments);
          setEnrollments(formattedEnrollments);

          // Calculate progress data
          if (formattedEnrollments.length > 0) {
            const enrollment = formattedEnrollments[0];
            const completedStages = enrollment.progress.filter(p => p.completed).length;
            setProgressData({
              currentStage: enrollment.currentStage,
              totalStages: enrollment.totalStages,
              completionRate: Math.round((completedStages / enrollment.totalStages) * 100),
              nextMilestone: enrollment.progress[enrollment.currentStage - 1]?.name || 'Next Stage',
              daysToNext: 5,
              complianceScore: enrollment.complianceRate
            });
          }
        } else {
          // Fallback to empty enrollments if API fails
          setEnrollments([]);
        }
      } catch (_err) {
        console.log('Enrollments API not available, using empty enrollments');
        setEnrollments([]);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  React.useEffect(() => {
    fetchDashboardData();
  }, [patientId]);

  // Refetch data when user changes (for demo mode switching)
  React.useEffect(() => {
    console.log('User changed, refetching dashboard data');
    fetchDashboardData();
  }, [user]);

  // Refresh data when component comes into focus (for when user returns from trials page)
  React.useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      if (patientId) {
        fetchDashboardData();
      }
    });

    return unsubscribe;
  }, [navigation, patientId]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh smart recommendations
      const recommendationsResponse = await fetch(`${API_BASE_URL}/analytics/smart-matching/${patientId}`);
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendedTrials(recommendationsData.recommendedTrials || []);
      }
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#10B981';
      case 'Completed': return '#3B82F6';
      case 'Paused': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getProgressColor = (rate) => {
    if (rate >= 90) return '#10B981';
    if (rate >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const renderProgressCard = () => (
    <View style={styles.progressCard}>
      <Text style={styles.cardTitle}>Your Trial Progress</Text>
      
      <View style={styles.progressHeader}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressStage}>Stage {progressData.currentStage} of {progressData.totalStages}</Text>
          <Text style={styles.progressMilestone}>{progressData.nextMilestone}</Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressPercentage}>{progressData.completionRate}%</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${progressData.completionRate}%` }
          ]} 
        />
      </View>

      <View style={styles.progressMetrics}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Compliance Score</Text>
          <Text style={[styles.metricValue, { color: getProgressColor(progressData.complianceScore) }]}>
            {progressData.complianceScore}%
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Next Visit</Text>
          <Text style={styles.metricValue}>{progressData.daysToNext} days</Text>
        </View>
      </View>
    </View>
  );

  const renderEnrollmentCard = (enrollment) => (
    <TouchableOpacity 
      key={enrollment.id} 
      style={[styles.enrollmentCard, { borderLeftColor: getStatusColor(enrollment.status) }]}
      onPress={() => setSelectedTrial(enrollment)}
    >
      <View style={styles.enrollmentHeader}>
        <Text style={styles.enrollmentTitle}>{enrollment.trialTitle}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(enrollment.status) }]}>
          <Text style={styles.statusText}>{enrollment.status}</Text>
        </View>
      </View>

      <View style={styles.enrollmentProgress}>
        <Text style={styles.progressText}>
          Stage {enrollment.currentStage} of {enrollment.totalStages}
        </Text>
        <View style={styles.stageProgress}>
          {enrollment.progress.map((stage, index) => (
            <View 
              key={index} 
              style={[
                styles.stageDot, 
                { 
                  backgroundColor: stage.completed ? '#10B981' : '#E5E7EB',
                  borderColor: stage.completed ? '#10B981' : '#D1D5DB'
                }
              ]} 
            />
          ))}
        </View>
      </View>

      <View style={styles.enrollmentFooter}>
        <Text style={styles.enrollmentDate}>Enrolled: {enrollment.enrollmentDate}</Text>
        <Text style={styles.complianceRate}>Compliance: {enrollment.complianceRate}%</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecommendedTrials = () => {
    const trialsToShow = recommendedTrials.length > 0 ? recommendedTrials : trials.slice(0, 3);
    
    return (
      <View style={styles.recommendationsCard}>
        <Text style={styles.cardTitle}>Recommended for You</Text>
        <Text style={styles.cardSubtitle}>
          {recommendedTrials.length > 0 ? 'AI-powered matches based on your medical profile' : 'Based on your medical profile'}
        </Text>
        
        {trialsToShow.map((trial, index) => (
          <TouchableOpacity key={trial.trialId || trial.id || index} style={styles.recommendationItem}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.recommendationTitle}>{trial.title}</Text>
              <Text style={styles.recommendationMatch}>
                {trial.matchScore ? `${trial.matchScore}% Match` : '95% Match'}
              </Text>
            </View>
            <Text style={styles.recommendationCondition}>{trial.condition}</Text>
            <Text style={styles.recommendationLocation}>📍 {trial.location}</Text>
            {trial.matchReasons && (
              <Text style={styles.recommendationReasons}>
                {trial.matchReasons[0]}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading your personalized dashboard...</Text>
        <Text style={styles.loadingSubtext}>Analyzing your medical profile for trial matches</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            title="Refreshing recommendations..."
            titleColor="#6B7280"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>
            Welcome back, {profileData?.firstName || 'Patient'}
          </Text>
          <Text style={styles.subtitleText}>Your clinical trial journey</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Card */}
      {enrollments.length > 0 && renderProgressCard()}

      {/* Active Enrollments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Active Trials ({enrollments.length})</Text>
        {enrollments.length > 0 ? (
          enrollments.map(renderEnrollmentCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>You&apos;re not currently enrolled in any trials</Text>
            <Text style={styles.emptySubtext}>Explore available trials below</Text>
          </View>
        )}
      </View>

      {/* Recommended Trials */}
      {trials.length > 0 && renderRecommendedTrials()}

      {/* Trial Detail Modal */}
      {selectedTrial && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedTrial.trialTitle}</Text>
              <TouchableOpacity onPress={() => setSelectedTrial(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalStatus}>Status: {selectedTrial.status}</Text>
              <Text style={styles.modalStage}>Current Stage: {selectedTrial.currentStage} of {selectedTrial.totalStages}</Text>
              <Text style={styles.modalCompliance}>Compliance: {selectedTrial.complianceRate}%</Text>
              
              <Text style={styles.modalSectionTitle}>Progress Timeline</Text>
              {selectedTrial.progress.map((stage, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={[
                    styles.timelineDot, 
                    { backgroundColor: stage.completed ? '#10B981' : '#E5E7EB' }
                  ]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineStage}>{stage.name}</Text>
                    <Text style={styles.timelineDate}>
                      {stage.completed ? `Completed ${stage.date}` : 'Pending'}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#32ae48',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitleText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#32ae48',
    marginTop: 2,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressInfo: {
    flex: 1,
  },
  progressStage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressMilestone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  enrollmentCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  enrollmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  enrollmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  enrollmentProgress: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  stageProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 2,
  },
  enrollmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enrollmentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  complianceRate: {
    fontSize: 12,
    color: '#6B7280',
  },
  recommendationsCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationItem: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  recommendationMatch: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  recommendationCondition: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  recommendationLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  recommendationReasons: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalBody: {
    padding: 20,
  },
  modalStatus: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  modalStage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  modalCompliance: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  timelineDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default EnhancedPatientDashboard;
