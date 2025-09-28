import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { useAuth } from './AuthContext';

const DemoModeToggle = ({ onRoleSwitch }) => {
  const [showModal, setShowModal] = useState(false);
  const { user, setUser } = useAuth();

  const switchToRole = (role) => {
    const demoUsers = {
      patient: {
        mainId: "-OaDtjio4inz8EbIDWg3",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@email.com",
        userType: "patient"
      },
      crc: {
        mainId: "CRC-12345",
        firstName: "Dr. Sarah",
        lastName: "Anderson",
        email: "dr.anderson@emory.edu",
        userType: "crc"
      }
    };

    setUser(demoUsers[role]);
    setShowModal(false);
    onRoleSwitch && onRoleSwitch(role);
    
    Alert.alert(
      "Demo Mode", 
      `Switched to ${role === 'patient' ? 'Patient' : 'CRC'} view`,
      [{ text: "OK" }]
    );
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.toggleText}>🎭 Demo Mode</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Demo Mode - Switch Role</Text>
            <Text style={styles.modalSubtitle}>
              Current: {user?.userType === 'patient' ? 'Patient View' : 'CRC View'}
            </Text>
            
            <TouchableOpacity 
              style={[styles.roleButton, { backgroundColor: '#3B82F6' }]}
              onPress={() => switchToRole('patient')}
            >
              <Text style={styles.roleButtonText}>👤 Patient View</Text>
              <Text style={styles.roleButtonSubtext}>See trial progress & recommendations</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.roleButton, { backgroundColor: '#10B981' }]}
              onPress={() => switchToRole('crc')}
            >
              <Text style={styles.roleButtonText}>👩‍⚕️ CRC View</Text>
              <Text style={styles.roleButtonSubtext}>Monitor trials & manage patients</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  roleButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  roleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  roleButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default DemoModeToggle;
