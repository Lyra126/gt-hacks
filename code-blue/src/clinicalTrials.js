import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';

const ClinicalTrials = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const allTrials = [
    {
      id: 1,
      title: 'DIABETES-CARE-2025',
      status: 'Recruiting',
      distance: '2.3 miles',
      location: 'Emory University Hospital, Atlanta, GA',
      description: 'A phase III trial evaluating a new glucose monitoring system for Type 2 diabetes patients with improved accuracy and continuous tracking capabilities.',
      sponsor: 'Emory Healthcare',
      insurance: 'Most Major Insurance Accepted',
      condition: 'Diabetes'
    },
    {
      id: 2,
      title: 'HYPERTENSION-NOVA Study',
      status: 'Active',
      distance: '5.7 miles',
      location: 'Piedmont Atlanta Hospital, Atlanta, GA',
      description: 'Study comparing effectiveness of combination therapy versus traditional treatment approaches for managing hypertension in adults aged 30-65.',
      sponsor: 'Piedmont Healthcare',
      insurance: 'Medicare, Medicaid, Private',
      condition: 'Hypertension'
    },
    {
      id: 3,
      title: 'RESPIRATORY-WELLNESS Initiative',
      status: 'Recruiting',
      distance: '8.2 miles',
      location: 'Children\'s Healthcare of Atlanta, Atlanta, GA',
      description: 'Research on personalized asthma management using AI-powered inhaler technology and environmental monitoring for better outcomes.',
      sponsor: 'Children\'s Healthcare of Atlanta',
      insurance: 'All Insurance Plans Accepted',
      condition: 'Asthma'
    },
    {
      id: 4,
      title: 'CARDIO-PROTECT Trial',
      status: 'Active',
      distance: '12.1 miles',
      location: 'Northside Hospital, Atlanta, GA',
      description: 'Phase II study investigating novel cardiac protection strategies for patients undergoing major cardiovascular procedures.',
      sponsor: 'Northside Hospital',
      insurance: 'Private Insurance Only',
      condition: 'Cardiovascular'
    },
    {
      id: 5,
      title: 'ALZHEIMER-PREVENTION Study',
      status: 'Recruiting',
      distance: '15.4 miles',
      location: 'Georgia Institute of Technology, Atlanta, GA',
      description: 'Longitudinal study examining early intervention strategies for cognitive decline prevention in at-risk populations aged 55+.',
      sponsor: 'Georgia Tech Research Institute',
      insurance: 'Medicare, Private Insurance',
      condition: 'Alzheimer\'s'
    },
    {
      id: 6,
      title: 'CANCER-IMMUNOTHERAPY Trial',
      status: 'Active',
      distance: '3.8 miles',
      location: 'Winship Cancer Institute, Atlanta, GA',
      description: 'Phase I/II trial testing combination immunotherapy approaches for advanced solid tumors with promising early results.',
      sponsor: 'Winship Cancer Institute',
      insurance: 'All Major Insurance Plans',
      condition: 'Cancer'
    },
    {
      id: 7,
      title: 'MENTAL-HEALTH Digital Study',
      status: 'Recruiting',
      distance: '6.9 miles',
      location: 'Grady Health System, Atlanta, GA',
      description: 'Evaluating effectiveness of digital therapeutic interventions for anxiety and depression management in primary care settings.',
      sponsor: 'Grady Health System',
      insurance: 'Medicaid, Sliding Scale',
      condition: 'Mental Health'
    },
    {
      id: 8,
      title: 'ARTHRITIS-RELIEF Protocol',
      status: 'Completed',
      distance: '9.7 miles',
      location: 'Atlanta Medical Center, Atlanta, GA',
      description: 'Recently completed study on non-pharmaceutical pain management techniques for rheumatoid arthritis patients.',
      sponsor: 'Atlanta Medical Center',
      insurance: 'Results Available to All',
      condition: 'Arthritis'
    }
  ];

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

  const handleViewDetails = (trialTitle) => {
    // Handle view details
    console.log(`Viewing details for: ${trialTitle}`);
  };

  return (
    <ScrollView style={styles.container}>
        <View style={styles.wrapper}>
        <Text style={styles.title}>Clinical Trials</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
            <TextInput
            style={styles.searchInput}
            placeholder="Search by condition, location, or sponsor..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
            {filterOptions.map((filter) => (
            <TouchableOpacity
                key={filter}
                style={[
                styles.filterButton,
                selectedFilter === filter && styles.activeFilterButton
                ]}
                onPress={() => setSelectedFilter(filter)}
            >
                <Text style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.activeFilterButtonText
                ]}>
                {filter}
                </Text>
            </TouchableOpacity>
            ))}
        </View>

        {/* Results Count */}
        <Text style={styles.resultsCount}>
            {filteredTrials.length} trial{filteredTrials.length !== 1 ? 's' : ''} found
        </Text>

        {/* Clinical Trials Cards */}
        {filteredTrials.map((trial) => (
            <View key={trial.id} style={styles.card}>
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
                
                <TouchableOpacity 
                style={styles.detailsButton}
                onPress={() => handleViewDetails(trial.title)}
                >
                <Text style={styles.detailsButtonText}>View Details</Text>
                </TouchableOpacity>

            </View>
        ))}

        {filteredTrials.length === 0 && (
            <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No clinical trials found matching your criteria.</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your search or filter options.</Text>
            </View>
        )}
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
    marginTop: 50,
    marginBottom: 20,
    // Using padding and margin to create space around the content
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
    elevation: 2,
    fontSize: 14
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
    flex: 1,
    alignItems: 'center',
    margin: 7
  },
  detailsButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    margin: 7
  },
  reviewButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },
  detailsButtonText: {
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
  }
});

export default ClinicalTrials;