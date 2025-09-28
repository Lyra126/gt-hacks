import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  SafeAreaView, 
  Dimensions,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useAuth } from './AuthContext';

const { width } = Dimensions.get('window');

const EnhancedCrcDashboard = ({ route }) => {
  const { logout } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    activeTrials: 0,
    totalPatients: 0,
    complianceRate: 0,
    alertsCount: 0,
    enrollmentRate: 0
  });
  const [alerts, setAlerts] = useState([]);
  const [managedPatients, setManagedPatients] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  // Load real-time data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // First, seed demo data if needed
        await fetch('http://100.66.12.93:8000/api/crc/seed-demo-data', { method: 'POST' });
        
        // Get CRC dashboard data
        const response = await fetch('http://100.66.12.93:8000/api/crc/CRC-12345/dashboard-data');
        const data = await response.json();
        
        if (response.ok) {
          setRealTimeMetrics({
            activeTrials: data.metrics.activeEnrollments,
            totalPatients: data.metrics.totalPatients,
            complianceRate: data.metrics.averageCompliance,
            alertsCount: data.metrics.highRiskPatients,
            enrollmentRate: data.metrics.activeEnrollments
          });
          setAlerts(data.alerts || []);
          setManagedPatients(data.managedPatients || []);
          setRecentActivity(data.recentActivity || []);
        } else {
          // Fallback to simulated data
          setRealTimeMetrics({
            activeTrials: 8,
            totalPatients: 24,
            complianceRate: 94,
            alertsCount: 3,
            enrollmentRate: 78
          });
          setAlerts([
            {
              id: 1,
              type: 'warning',
              title: 'Protocol Violation',
              message: 'Patient John Doe missed scheduled visit',
              time: '2 hours ago',
              trial: 'Immunotherapy Study'
            },
            {
              id: 2,
              type: 'info',
              title: 'Enrollment Milestone',
              message: 'Diabetes trial reached 75% enrollment target',
              time: '4 hours ago',
              trial: 'Diabetes Management'
            },
            {
              id: 3,
              type: 'success',
              title: 'Data Quality',
              message: 'All EMR data validated successfully',
              time: '6 hours ago',
              trial: 'All Trials'
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback to simulated data
        setRealTimeMetrics({
          activeTrials: 8,
          totalPatients: 24,
          complianceRate: 94,
          alertsCount: 3,
          enrollmentRate: 78
        });
        setAlerts([]);
      }

      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('http://100.66.12.93:8000/api/analytics/dashboard-metrics');
      const data = await response.json();
      
      if (response.ok) {
        setRealTimeMetrics(data.metrics);
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };


  // CRC's managed trials with enhanced data
  const [managedTrials] = useState([
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
      currentEnrollment: 38,
      startDate: "2024-01-15",
      endDate: "2025-12-31",
      complianceRate: 96,
      riskLevel: 'low',
      nextMilestone: 'Phase 2 Complete',
      daysToMilestone: 15
    },
    {
      id: 2,
      title: "Diabetes Management with AI Monitoring",
      status: "Active",
      sponsors: ["Johnson & Johnson", "UF College of Medicine"],
      location: "Jacksonville, FL",
      insurance: "Not required",
      distance: "50 miles",
      description: "A study testing an AI-based glucose monitoring device for patients with Type 2 Diabetes.",
      condition: "Type 2 Diabetes",
      patient_ids: ["12345", "67891"],
      enrollmentTarget: 30,
      currentEnrollment: 22,
      startDate: "2023-08-01",
      endDate: "2024-08-01",
      complianceRate: 89,
      riskLevel: 'medium',
      nextMilestone: 'Data Collection Complete',
      daysToMilestone: 45
    },
    {
      id: 3,
      title: "Cardiovascular Health Monitoring",
      status: "Recruiting",
      sponsors: ["Mayo Clinic", "American Heart Association"],
      location: "Rochester, MN",
      insurance: "Accepts",
      distance: "200 miles",
      description: "Advanced cardiovascular monitoring using wearable devices and AI analysis.",
      condition: "Cardiovascular Disease",
      patient_ids: ["88888"],
      enrollmentTarget: 100,
      currentEnrollment: 67,
      startDate: "2024-03-01",
      endDate: "2026-03-01",
      complianceRate: 92,
      riskLevel: 'low',
      nextMilestone: 'Phase 1 Complete',
      daysToMilestone: 8
    }
  ]);

  const filterOptions = ['All', 'Recruiting', 'Active', 'Completed'];
  
  const filteredTrials = managedTrials.filter(trial => {
    const matchesSearch = trial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trial.condition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || trial.status.includes(selectedFilter);
    return matchesSearch && matchesFilter;
  });

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      default: return '📋';
    }
  };

  const renderMetricCard = (title, value, subtitle, color = '#6B7280') => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>
        {Math.round(value)}
      </Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderTrialCard = (trial, index) => (
    <TouchableOpacity 
      key={trial.id || index} 
      style={[styles.trialCard, { borderLeftColor: getRiskColor(trial.riskLevel) }]}
      onPress={() => setSelectedTrial(trial)}
    >
      <View style={styles.trialHeader}>
        <Text style={styles.trialTitle}>{trial.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getRiskColor(trial.riskLevel) }]}>
          <Text style={styles.statusText}>{trial.status}</Text>
        </View>
      </View>
      
      <Text style={styles.trialCondition}>{trial.condition}</Text>
      
      <View style={styles.trialMetrics}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Enrollment:</Text>
          <Text style={styles.trialMetricValue}>{trial.currentEnrollment}/{trial.enrollmentTarget}</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(trial.currentEnrollment / trial.enrollmentTarget) * 100}%` }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Compliance:</Text>
          <Text style={[styles.trialMetricValue, { color: getRiskColor(trial.riskLevel) }]}>
            {trial.complianceRate}%
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Next Milestone:</Text>
          <Text style={styles.trialMetricValue}>{trial.nextMilestone} ({trial.daysToMilestone} days)</Text>
        </View>
      </View>
      
      <View style={styles.trialFooter}>
        <Text style={styles.trialLocation}>📍 {trial.location}</Text>
        <Text style={styles.trialPatients}>👥 {trial.patient_ids.length} patients</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#32ae48" />
          <Text style={styles.loadingText}>Loading Clinical Dashboard...</Text>
          <Text style={styles.loadingSubtext}>Fetching real-time trial metrics and patient data</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#32ae48"
            title="Refreshing data..."
            titleColor="#6B7280"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back, Dr. Anderson</Text>
          <Text style={styles.subtitleText}>Clinical Research Coordinator</Text>
        </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Real-time Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Real-time Metrics</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Active Trials', 
              realTimeMetrics.activeTrials, 
              'Currently running',
              '#6B7280'
            )}
            {renderMetricCard(
              'Total Patients', 
              realTimeMetrics.totalPatients, 
              'Enrolled across all trials',
              '#6B7280'
            )}
            {renderMetricCard(
              'Compliance Rate', 
              realTimeMetrics.complianceRate, 
              'Protocol adherence',
              '#6B7280'
            )}
            {renderMetricCard(
              'Enrollment Rate', 
              realTimeMetrics.enrollmentRate, 
              'Target achievement',
              '#6B7280'
            )}
          </View>
        </View>

        {/* Alerts */}
        {alerts.length > 0 && (
          <View style={styles.alertsContainer}>
            <Text style={styles.sectionTitle}>Recent Alerts ({alerts.length})</Text>
            {alerts.map(alert => (
              <View key={alert.id} style={[styles.alertCard, { borderLeftColor: getRiskColor(alert.type === 'warning' ? 'high' : 'low') }]}>
                <Text style={styles.alertIcon}>{getAlertIcon(alert.type)}</Text>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <Text style={styles.alertTime}>{alert.time} • {alert.trial}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search trials, conditions, or patients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
            {filterOptions.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.filterButton,
                  selectedFilter === option && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter(option)}
              >
                <Text style={[
                  styles.filterText,
                  selectedFilter === option && styles.filterTextActive
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Managed Patients */}
        {managedPatients.length > 0 && (
          <View style={styles.patientsContainer}>
            <Text style={styles.sectionTitle}>Managed Patients ({managedPatients.length})</Text>
            {managedPatients.map(patient => (
              <View key={patient.patientId} style={styles.patientCard}>
                <View style={styles.patientHeader}>
                  <Text style={styles.patientName}>{patient.firstName} {patient.lastName}</Text>
                  <Text style={styles.patientStatus}>{patient.status}</Text>
                </View>
                <Text style={styles.patientEmail}>{patient.email}</Text>
                <View style={styles.patientMetrics}>
                  <Text style={styles.patientMetric}>Enrollments: {patient.totalEnrollments}</Text>
                  <Text style={styles.patientMetric}>Assigned: {new Date(patient.assignedDate).toLocaleDateString()}</Text>
                </View>
                {patient.enrollments.map((enrollment, index) => (
                  <View key={enrollment.enrollmentId || enrollment.trialId || index} style={styles.enrollmentItem}>
                    <Text style={styles.enrollmentTitle}>{enrollment.trialDetails?.title || 'Unknown Trial'}</Text>
                    <Text style={styles.enrollmentStatus}>Stage {enrollment.currentStage} • {enrollment.complianceRate}% compliance</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View style={styles.activityContainer}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentActivity.slice(0, 5).map((activity, index) => (
              <View key={`${activity.patientName}-${activity.trialTitle}-${activity.lastUpdated}-${index}`} style={styles.activityItem}>
                <Text style={styles.activityText}>
                  <Text style={styles.activityPatient}>{activity.patientName}</Text> updated {activity.trialTitle}
                </Text>
                <Text style={styles.activityTime}>{new Date(activity.lastUpdated).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Trials List */}
        <View style={styles.trialsContainer}>
          <Text style={styles.sectionTitle}>Managed Trials ({filteredTrials.length})</Text>
          {filteredTrials.map((trial, index) => renderTrialCard(trial, index))}
        </View>
      </ScrollView>

      {/* Trial Detail Modal */}
      <Modal
        visible={!!selectedTrial}
        animationType="slide"
        onRequestClose={() => setSelectedTrial(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedTrial?.title}</Text>
            <TouchableOpacity onPress={() => setSelectedTrial(null)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>{selectedTrial?.description}</Text>
            
            <View style={styles.modalDetails}>
              <Text style={styles.detailLabel}>Status: {selectedTrial?.status}</Text>
              <Text style={styles.detailLabel}>Condition: {selectedTrial?.condition}</Text>
              <Text style={styles.detailLabel}>Location: {selectedTrial?.location}</Text>
              <Text style={styles.detailLabel}>Enrollment: {selectedTrial?.currentEnrollment}/{selectedTrial?.enrollmentTarget}</Text>
              <Text style={styles.detailLabel}>Compliance: {selectedTrial?.complianceRate}%</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#32ae48',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
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
  metricsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    width: (width - 60) / 2,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  alertsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  searchContainer: {
    padding: 20,
    paddingTop: 0,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  trialsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  trialCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  trialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  trialCondition: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  trialMetrics: {
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 100,
  },
  trialMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginLeft: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  trialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trialLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  trialPatients: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalDetails: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
  },
  patientsContainer: {
    padding: 20,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  patientStatus: {
    fontSize: 12,
    color: '#10B981',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  patientEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  patientMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  patientMetric: {
    fontSize: 12,
    color: '#6B7280',
  },
  enrollmentItem: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  enrollmentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  enrollmentStatus: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  activityContainer: {
    padding: 20,
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  activityPatient: {
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default EnhancedCrcDashboard;
