#!/usr/bin/env python3
"""
Comprehensive Database Seeder Script

This script populates the Firebase Realtime Database with sample data for all entities:
- Users (patients and CRCs)
- EMR Records (patient medical data)
- Clinical Trials (with detailed stages and protocols)
- Enrollments (patient-trial relationships)
- Organizations (clinical research organizations)

Usage:
    python seed_database.py
"""

import sys
import os
import json
import time
from pathlib import Path
from datetime import datetime, timedelta
import bcrypt

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Import Firebase configuration
import firebase_config
from firebase_admin import db as realtime_db

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_users():
    """Seed the database with sample users (patients and CRCs)"""
    print("📝 Adding users data...")
    
    sample_users = [
        {
            'email': 'john.doe@email.com',
            'name': 'John Doe',
            'firstName': 'John',
            'lastName': 'Doe',
            'userType': 'patient',
            'password': hash_password('password123'),
            'isVerified': True,
            'createdAt': int(time.time()),
            'age': 45,
            'phone': '(555) 123-4567',
            'address': '123 Main St, Atlanta, GA 30309'
        },
        {
            'email': 'jane.smith@email.com',
            'name': 'Jane Smith',
            'firstName': 'Jane',
            'lastName': 'Smith',
            'userType': 'patient',
            'password': hash_password('password123'),
            'isVerified': True,
            'createdAt': int(time.time()),
            'age': 38,
            'phone': '(555) 234-5678',
            'address': '456 Oak Ave, Atlanta, GA 30308'
        },
        {
            'email': 'michael.johnson@email.com',
            'name': 'Michael Johnson',
            'firstName': 'Michael',
            'lastName': 'Johnson',
            'userType': 'patient',
            'password': hash_password('password123'),
            'isVerified': True,
            'createdAt': int(time.time()),
            'age': 62,
            'phone': '(555) 345-6789',
            'address': '789 Pine St, Atlanta, GA 30307'
        },
        {
            'email': 'sarah.wilson@email.com',
            'name': 'Sarah Wilson',
            'firstName': 'Sarah',
            'lastName': 'Wilson',
            'userType': 'patient',
            'password': hash_password('password123'),
            'isVerified': True,
            'createdAt': int(time.time()),
            'age': 29,
            'phone': '(555) 456-7890',
            'address': '321 Elm Dr, Atlanta, GA 30306'
        },
        {
            'email': 'dr.anderson@emory.edu',
            'name': 'Dr. Lisa Anderson',
            'firstName': 'Lisa',
            'lastName': 'Anderson',
            'userType': 'crc',
            'password': hash_password('password123'),
            'isVerified': True,
            'createdAt': int(time.time()),
            'title': 'Clinical Research Coordinator',
            'organization': 'Emory Healthcare',
            'phone': '(404) 555-0123'
        }
    ]
    
    try:
        users_ref = realtime_db.reference('users')
        users_ref.delete()  # Clear existing data
        
        user_ids = {}
        for i, user in enumerate(sample_users, 1):
            user_ref = users_ref.push(user)
            user_ids[user['email']] = user_ref.key
            print(f"   ✅ Added user {i}: {user['name']} (ID: {user_ref.key})")
        
        return user_ids
        
    except Exception as e:
        print(f"❌ Error seeding users: {e}")
        return {}

def seed_organizations():
    """Seed the database with sample organizations"""
    print("📝 Adding organizations data...")
    
    sample_organizations = [
        {
            'name': 'Emory Healthcare',
            'type': 'Hospital System',
            'address': '1364 Clifton Rd NE, Atlanta, GA 30322',
            'phone': '(404) 712-2000',
            'website': 'https://www.emoryhealthcare.org',
            'specialties': ['Cardiology', 'Oncology', 'Diabetes Care', 'Neurology'],
            'activeTrials': 12,
            'isActive': True
        },
        {
            'name': 'Piedmont Healthcare',
            'type': 'Healthcare Network',
            'address': '1968 Peachtree Rd NW, Atlanta, GA 30309',
            'phone': '(404) 605-5000',
            'website': 'https://www.piedmont.org',
            'specialties': ['Cardiovascular', 'Orthopedics', 'Women\'s Health'],
            'activeTrials': 8,
            'isActive': True
        },
        {
            'name': 'Children\'s Healthcare of Atlanta',
            'type': 'Pediatric Hospital',
            'address': '1405 Clifton Rd NE, Atlanta, GA 30322',
            'phone': '(404) 785-6000',
            'website': 'https://www.choa.org',
            'specialties': ['Pediatric Respiratory', 'Pediatric Cardiology', 'Pediatric Oncology'],
            'activeTrials': 15,
            'isActive': True
        }
    ]
    
    try:
        orgs_ref = realtime_db.reference('organizations')
        orgs_ref.delete()  # Clear existing data
        
        org_ids = {}
        for i, org in enumerate(sample_organizations, 1):
            org_ref = orgs_ref.push(org)
            org_ids[org['name']] = org_ref.key
            print(f"   ✅ Added organization {i}: {org['name']} (ID: {org_ref.key})")
        
        return org_ids
        
    except Exception as e:
        print(f"❌ Error seeding organizations: {e}")
        return {}

def seed_emr_records(user_ids):
    """Seed the database with sample EMR records"""
    print("📝 Adding EMR records data...")
    
    # Get patient user IDs
    patient_emails = ['john.doe@email.com', 'jane.smith@email.com', 'michael.johnson@email.com', 'sarah.wilson@email.com']
    patient_ids = [user_ids.get(email) for email in patient_emails if user_ids.get(email)]
    
    sample_emr_records = [
        {
            'patientId': patient_ids[0] if len(patient_ids) > 0 else 'patient-1',
            'log': [
                {
                    'date': '2024-01-15',
                    'type': 'diagnosis',
                    'description': 'Type 2 Diabetes Mellitus diagnosed',
                    'provider': 'Dr. Smith, Endocrinology'
                },
                {
                    'date': '2024-02-20',
                    'type': 'medication',
                    'description': 'Started Metformin 500mg twice daily',
                    'provider': 'Dr. Smith, Endocrinology'
                },
                {
                    'date': '2024-03-10',
                    'type': 'lab_result',
                    'description': 'HbA1c: 8.2% (elevated)',
                    'provider': 'Atlanta Lab Services'
                }
            ],
            'allergies': ['Penicillin', 'Shellfish'],
            'currentMedications': ['Metformin 500mg BID', 'Lisinopril 10mg daily'],
            'vitalSigns': {
                'lastUpdated': '2024-03-10',
                'bloodPressure': '140/90',
                'weight': '185 lbs',
                'height': '5\'10"',
                'bmi': 26.5
            }
        },
        {
            'patientId': patient_ids[1] if len(patient_ids) > 1 else 'patient-2',
            'log': [
                {
                    'date': '2024-01-08',
                    'type': 'diagnosis',
                    'description': 'Hypertension, Stage 1',
                    'provider': 'Dr. Johnson, Cardiology'
                },
                {
                    'date': '2024-01-08',
                    'type': 'medication',
                    'description': 'Started Amlodipine 5mg daily',
                    'provider': 'Dr. Johnson, Cardiology'
                },
                {
                    'date': '2024-02-15',
                    'type': 'follow_up',
                    'description': 'Blood pressure improved, continue current regimen',
                    'provider': 'Dr. Johnson, Cardiology'
                }
            ],
            'allergies': ['Sulfa drugs'],
            'currentMedications': ['Amlodipine 5mg daily', 'Aspirin 81mg daily'],
            'vitalSigns': {
                'lastUpdated': '2024-02-15',
                'bloodPressure': '128/82',
                'weight': '142 lbs',
                'height': '5\'6"',
                'bmi': 22.9
            }
        },
        {
            'patientId': patient_ids[2] if len(patient_ids) > 2 else 'patient-3',
            'log': [
                {
                    'date': '2024-01-20',
                    'type': 'diagnosis',
                    'description': 'Early-stage Alzheimer\'s Disease',
                    'provider': 'Dr. Williams, Neurology'
                },
                {
                    'date': '2024-01-20',
                    'type': 'medication',
                    'description': 'Started Donepezil 5mg daily',
                    'provider': 'Dr. Williams, Neurology'
                },
                {
                    'date': '2024-03-01',
                    'type': 'assessment',
                    'description': 'Cognitive assessment - mild decline noted',
                    'provider': 'Dr. Williams, Neurology'
                }
            ],
            'allergies': ['None known'],
            'currentMedications': ['Donepezil 5mg daily', 'Vitamin D 1000 IU daily'],
            'vitalSigns': {
                'lastUpdated': '2024-03-01',
                'bloodPressure': '135/85',
                'weight': '170 lbs',
                'height': '5\'8"',
                'bmi': 25.8
            }
        },
        {
            'patientId': patient_ids[3] if len(patient_ids) > 3 else 'patient-4',
            'log': [
                {
                    'date': '2024-02-10',
                    'type': 'diagnosis',
                    'description': 'Moderate persistent asthma',
                    'provider': 'Dr. Davis, Pulmonology'
                },
                {
                    'date': '2024-02-10',
                    'type': 'medication',
                    'description': 'Started Fluticasone/Salmeterol inhaler',
                    'provider': 'Dr. Davis, Pulmonology'
                },
                {
                    'date': '2024-03-05',
                    'type': 'follow_up',
                    'description': 'Symptoms well controlled, continue current treatment',
                    'provider': 'Dr. Davis, Pulmonology'
                }
            ],
            'allergies': ['Dust mites', 'Pollen'],
            'currentMedications': ['Fluticasone/Salmeterol inhaler BID', 'Albuterol inhaler PRN'],
            'vitalSigns': {
                'lastUpdated': '2024-03-05',
                'bloodPressure': '118/75',
                'weight': '125 lbs',
                'height': '5\'4"',
                'bmi': 21.5
            }
        }
    ]
    
    try:
        emr_ref = realtime_db.reference('emr_records')
        emr_ref.delete()  # Clear existing data
        
        for i, emr in enumerate(sample_emr_records, 1):
            patient_id = emr['patientId']
            emr_patient_ref = emr_ref.child(patient_id)
            emr_patient_ref.set(emr)
            print(f"   ✅ Added EMR record {i} for patient ID: {patient_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error seeding EMR records: {e}")
        return False

def seed_trials():
    """Seed the database with detailed clinical trials including stages"""
    print("📝 Adding clinical trials data...")
    
    sample_trials = [
        {
            'title': 'DIABETES-CARE-2025',
            'status': 'Recruiting',
            'distance': '2.3 miles',
            'location': 'Emory University Hospital, Atlanta, GA',
            'description': 'A phase III trial evaluating a new glucose monitoring system for Type 2 diabetes patients with improved accuracy and continuous tracking capabilities.',
            'sponsor': 'Emory Healthcare',
            'insurance': 'Most Major Insurance Accepted',
            'condition': 'Diabetes',
            'phases': 'Phase III',
            'estimatedDuration': '12 months',
            'maxParticipants': 200,
            'currentParticipants': 45,
            'stages': {
                '1': {
                    'name': 'Pre-Trial Preparation',
                    'duration': '1 week',
                    'summary': 'Critical eligibility maintenance and preparation tasks',
                    'checklist': [
                        'Complete informed consent',
                        'Confirm no hallucinogen use in past 6 months',
                        'Avoid all recreational drugs (marijuana, cocaine, etc.)',
                        'Confirm no history of kidney disease or dialysis',
                        'Maintain stable blood sugar (avoid extreme highs/lows)',
                        'Complete 2-hour CGM training session'
                    ]
                },
                '2': {
                    'name': 'Active Monitoring Phase',
                    'duration': '12 weeks',
                    'summary': 'Daily compliance tracking to maintain trial eligibility',
                    'checklist': [
                        'Wear CGM device 24/7 (minimum 14 days/month)',
                        'Log glucose readings 4x daily (before meals, bedtime)',
                        'Avoid alcohol completely (maintains liver function)',
                        'Get 7-9 hours sleep nightly (affects glucose metabolism)',
                        'No smoking or vaping (impacts cardiovascular health)',
                        'Attend monthly visits (±3 days)'
                    ]
                },
                '3': {
                    'name': 'Final Assessment',
                    'duration': '2 weeks',
                    'summary': 'Eligibility verification and study completion',
                    'checklist': [
                        'Fasting 12 hours before final blood tests',
                        'Confirm continued drug-free status',
                        'Complete quality of life questionnaires',
                        'Return CGM device and charger',
                        'Exit interview (30 minutes)'
                    ]
                }
            }
        },
        {
            'title': 'HYPERTENSION-NOVA Study',
            'status': 'Active',
            'distance': '5.7 miles',
            'location': 'Piedmont Atlanta Hospital, Atlanta, GA',
            'description': 'Study comparing effectiveness of combination therapy versus traditional treatment approaches for managing hypertension in adults aged 30-65.',
            'sponsor': 'Piedmont Healthcare',
            'insurance': 'Medicare, Medicaid, Private',
            'condition': 'Hypertension',
            'phases': 'Phase II/III',
            'estimatedDuration': '18 months',
            'maxParticipants': 150,
            'currentParticipants': 89,
            'stages': {
                '1': {
                    'name': 'Pre-Trial Preparation',
                    'duration': '1 week',
                    'summary': 'Critical eligibility maintenance and preparation tasks',
                    'checklist': [
                        'Informed consent signing',
                        'Confirm no recent heart attack (within 6 months)',
                        'Avoid all recreational drugs and hallucinogens',
                        'Confirm no history of kidney disease or dialysis',
                        'Stop current blood pressure medications (7 days washout)',
                        'Complete cardiovascular screening tests'
                    ]
                },
                '2': {
                    'name': 'Active Treatment Phase',
                    'duration': '16 weeks',
                    'summary': 'Daily compliance tracking to maintain trial eligibility',
                    'checklist': [
                        'Take study medication daily (8 AM ±2 hours)',
                        'Home BP monitoring: 2x daily (7 AM, 7 PM)',
                        'Avoid alcohol completely (affects blood pressure)',
                        'Get 7-9 hours sleep nightly (affects cardiovascular health)',
                        'No smoking or vaping (impacts heart function)',
                        'Monthly clinic visits (±5 days)'
                    ]
                },
                '3': {
                    'name': 'Final Assessment',
                    'duration': '4 weeks',
                    'summary': 'Eligibility verification and study completion',
                    'checklist': [
                        'Fasting 8 hours before final blood tests',
                        'Confirm continued drug-free status',
                        'Complete quality of life questionnaires',
                        'Return unused study medication',
                        'Exit interview (45 minutes)'
                    ]
                }
            }
        },
        {
            'title': 'RESPIRATORY-WELLNESS Initiative',
            'status': 'Recruiting',
            'distance': '8.2 miles',
            'location': 'Children\'s Healthcare of Atlanta, Atlanta, GA',
            'description': 'Research on personalized asthma management using AI-powered inhaler technology and environmental monitoring for better outcomes.',
            'sponsor': 'Children\'s Healthcare of Atlanta',
            'insurance': 'All Insurance Plans Accepted',
            'condition': 'Asthma',
            'phases': 'Phase II',
            'estimatedDuration': '9 months',
            'maxParticipants': 100,
            'currentParticipants': 23,
            'stages': {
                '1': {
                    'name': 'Pre-Trial Preparation',
                    'duration': '1 week',
                    'summary': 'Critical eligibility maintenance and preparation tasks',
                    'checklist': [
                        'Complete consent process',
                        'Confirm no hallucinogen use in past 6 months',
                        'Avoid all recreational drugs (affects lung function)',
                        'Confirm no history of kidney disease or dialysis',
                        'Complete 90-minute smart inhaler training',
                        'Mobile app setup (iOS 14+/Android 8+)'
                    ]
                },
                '2': {
                    'name': 'Active Monitoring Phase',
                    'duration': '12 weeks',
                    'summary': 'Daily compliance tracking to maintain trial eligibility',
                    'checklist': [
                        'Use smart inhaler 2x daily (morning, evening)',
                        'Respond to app notifications within 2 hours',
                        'Avoid smoking, vaping, secondhand smoke completely',
                        'Get 7-9 hours sleep nightly (affects respiratory function)',
                        'No alcohol consumption (affects lung function)',
                        'Monthly clinic visits (±3 days)'
                    ]
                },
                '3': {
                    'name': 'Final Assessment',
                    'duration': '2 weeks',
                    'summary': 'Eligibility verification and study completion',
                    'checklist': [
                        'Fasting 4 hours before final spirometry tests',
                        'Confirm continued drug-free status',
                        'Complete quality of life assessment (AQLQ)',
                        'Return smart inhaler and sensors',
                        'Exit interview (30 minutes)'
                    ]
                }
            }
        },
        {
            'title': 'CARDIO-PROTECT Trial',
            'status': 'Active',
            'distance': '12.1 miles',
            'location': 'Northside Hospital, Atlanta, GA',
            'description': 'Phase II study investigating novel cardiac protection strategies for patients undergoing major cardiovascular procedures.',
            'sponsor': 'Northside Hospital',
            'insurance': 'Private Insurance Only',
            'condition': 'Cardiovascular',
            'stages': {
                '1': {
                    'name': 'Pre-Trial Preparation',
                    'duration': '2 weeks',
                    'summary': 'Critical eligibility maintenance and preparation tasks',
                    'checklist': [
                        'Confirm no recent stroke (within 3 months)',
                        'Avoid all recreational drugs and hallucinogens',
                        'Confirm no history of kidney disease or dialysis',
                        'Stop anticoagulants 5 days before procedure',
                        'Fasting 12 hours before procedure',
                        'Complete 60-minute patient education session'
                    ]
                },
                '2': {
                    'name': 'Active Treatment Phase',
                    'duration': '8 weeks',
                    'summary': 'Daily compliance tracking to maintain trial eligibility',
                    'checklist': [
                        'Surgical/procedural intervention (2-4 hours)',
                        'Administer investigational treatment (IV infusion)',
                        'Daily vitals: BP, HR, temp, O2 sat (4x daily)',
                        'Avoid alcohol completely (affects heart function)',
                        'Get 8-10 hours sleep nightly (critical for recovery)',
                        'Weekly follow-up visits (±2 days)'
                    ]
                },
                '3': {
                    'name': 'Final Assessment',
                    'duration': '2 weeks',
                    'summary': 'Eligibility verification and study completion',
                    'checklist': [
                        'Fasting 8 hours before final tests',
                        'Confirm continued drug-free status',
                        'Complete quality of life questionnaire (SF-36)',
                        'Final cardiology consultation (30 minutes)',
                        'Exit interview (30 minutes)'
                    ]
                }
            }
        },
        {
            'title': 'ALZHEIMER-PREVENTION Study',
            'status': 'Recruiting',
            'distance': '15.4 miles',
            'location': 'Georgia Institute of Technology, Atlanta, GA',
            'description': 'Longitudinal study examining early intervention strategies for cognitive decline prevention in at-risk populations aged 55+.',
            'sponsor': 'Georgia Tech Research Institute',
            'insurance': 'Medicare, Private Insurance',
            'condition': 'Alzheimer\'s',
            'stages': {
                '1': {
                    'name': 'Pre-Trial Preparation',
                    'duration': '2 weeks',
                    'summary': 'Critical eligibility maintenance and preparation tasks',
                    'checklist': [
                        'Complete consent process and enrollment (90 minutes)',
                        'Confirm no hallucinogen use in past 6 months',
                        'Avoid all recreational drugs (affects cognitive function)',
                        'Confirm no history of kidney disease or dialysis',
                        'Avoid caffeine 4 hours before cognitive tests',
                        'Complete baseline cognitive assessments'
                    ]
                },
                '2': {
                    'name': 'Active Intervention Phase',
                    'duration': '24 weeks',
                    'summary': 'Daily compliance tracking to maintain trial eligibility',
                    'checklist': [
                        'Cognitive training: 30 min/day, 5 days/week',
                        'Mediterranean diet: 5+ servings fruits/vegetables daily',
                        'Physical exercise: 150 min/week moderate intensity',
                        'Avoid alcohol completely (affects brain function)',
                        'Get 7-9 hours sleep nightly (critical for memory)',
                        'Monthly assessments (±5 days)'
                    ]
                },
                '3': {
                    'name': 'Final Assessment',
                    'duration': '2 weeks',
                    'summary': 'Eligibility verification and study completion',
                    'checklist': [
                        'Fasting 4 hours before final cognitive tests',
                        'Confirm continued drug-free status',
                        'Complete quality of life questionnaires (ADL, IADL)',
                        'Exit consultation (45 minutes)',
                        'Exit interview (30 minutes)'
                    ]
                }
            }
        },
        {
            'title': 'CANCER-IMMUNOTHERAPY Trial',
            'status': 'Active',
            'distance': '3.8 miles',
            'location': 'Winship Cancer Institute, Atlanta, GA',
            'description': 'Phase I/II trial testing combination immunotherapy approaches for advanced solid tumors with promising early results.',
            'sponsor': 'Winship Cancer Institute',
            'insurance': 'All Major Insurance Plans',
            'condition': 'Cancer',
            'stages': {
                '1': {
                    'name': 'Pre-Trial Preparation',
                    'duration': '2 weeks',
                    'summary': 'Critical eligibility maintenance and preparation tasks',
                    'checklist': [
                        'Complete consent process (120 minutes)',
                        'Confirm no hallucinogen use in past 6 months',
                        'Avoid all recreational drugs (affects immune system)',
                        'Confirm no history of kidney disease or dialysis',
                        'Avoid live vaccines 4 weeks prior',
                        'Complete baseline tumor profiling'
                    ]
                },
                '2': {
                    'name': 'Active Treatment Phase',
                    'duration': '12 weeks',
                    'summary': 'Daily compliance tracking to maintain trial eligibility',
                    'checklist': [
                        'Immunotherapy infusions: weekly x4, then q2weeks',
                        'Weekly labs: CBC, CMP, LFTs, thyroid function',
                        'Avoid alcohol completely (affects immune function)',
                        'Get 8-10 hours sleep nightly (critical for immune system)',
                        'No smoking or vaping (impacts treatment effectiveness)',
                        'Report any symptoms within 24 hours'
                    ]
                },
                '3': {
                    'name': 'Final Assessment',
                    'duration': '4 weeks',
                    'summary': 'Eligibility verification and study completion',
                    'checklist': [
                        'Fasting 8 hours before final imaging scans',
                        'Confirm continued drug-free status',
                        'Complete quality of life assessment (FACT-G)',
                        'Exit consultation (60 minutes)',
                        'Exit interview (30 minutes)'
                    ]
                }
            }
        },
        {
            'title': 'MENTAL-HEALTH Digital Study',
            'status': 'Recruiting',
            'distance': '6.9 miles',
            'location': 'Grady Health System, Atlanta, GA',
            'description': 'Evaluating effectiveness of digital therapeutic interventions for anxiety and depression management in primary care settings.',
            'sponsor': 'Grady Health System',
            'insurance': 'Medicaid, Sliding Scale',
            'condition': 'Mental Health',
             'stages': {
                '1': {
                    'name': 'Pre-Trial Preparation',
                    'duration': '1 week',
                    'summary': 'Critical eligibility maintenance and preparation tasks',
                    'checklist': [
                        'Complete consent process',
                        'Confirm no hallucinogen use in past 6 months',
                        'Avoid all recreational drugs (affects mental health)',
                        'Confirm no history of kidney disease or dialysis',
                        'Complete digital app onboarding (45 minutes)',
                        'Initial therapist consultation (60 minutes)'
                    ]
                },
                '2': {
                    'name': 'Active Treatment Phase',
                    'duration': '8 weeks',
                    'summary': 'Daily compliance tracking to maintain trial eligibility',
                    'checklist': [
                        'Daily app exercises: 15 min/day, 5 days/week',
                        'Weekly symptom tracking (PHQ-9, GAD-7)',
                        'Avoid alcohol completely (affects mental health)',
                        'Get 7-9 hours sleep nightly (critical for mood)',
                        'No smoking or vaping (impacts mental health)',
                        'Bi-weekly therapist check-ins (30 minutes)'
                    ]
                },
                '3': {
                    'name': 'Final Assessment',
                    'duration': '1 week',
                    'summary': 'Eligibility verification and study completion',
                    'checklist': [
                        'Fasting 4 hours before final assessments',
                        'Confirm continued drug-free status',
                        'Complete patient satisfaction questionnaire',
                        'Exit interview (45 minutes)',
                        'Exit consultation (30 minutes)'
                    ]
                }
            }
        },
        {
            'title': 'ARTHRITIS-RELIEF Protocol',
            'status': 'Completed',
            'distance': '9.7 miles',
            'location': 'Atlanta Medical Center, Atlanta, GA',
            'description': 'Recently completed study on non-pharmaceutical pain management techniques for rheumatoid arthritis patients.',
            'sponsor': 'Atlanta Medical Center',
            'insurance': 'Results Available to All',
            'condition': 'Arthritis',
            'stages': {
                '1': {
                    'name': 'Pre-Trial Preparation',
                    'duration': '1 week',
                    'summary': 'Critical eligibility maintenance and preparation tasks',
                    'checklist': [
                        'Complete consent process',
                        'Confirm no hallucinogen use in past 6 months',
                        'Avoid all recreational drugs (affects pain perception)',
                        'Confirm no history of kidney disease or dialysis',
                        'Complete physical therapy assessment (30 minutes)',
                        'Baseline pain scale (0-10 VAS)'
                    ]
                },
                '2': {
                    'name': 'Active Treatment Phase',
                    'duration': '6 weeks',
                    'summary': 'Daily compliance tracking to maintain trial eligibility',
                    'checklist': [
                        'Daily PT exercises: 20 min/day, 6 days/week',
                        'Pain diary: 3x daily (morning, afternoon, evening)',
                        'Avoid alcohol completely (affects pain management)',
                        'Get 8-10 hours sleep nightly (critical for healing)',
                        'No smoking or vaping (impacts circulation)',
                        'Weekly coordinator check-ins (15 minutes)'
                    ]
                },
                '3': {
                    'name': 'Final Assessment',
                    'duration': '1 week',
                    'summary': 'Eligibility verification and study completion',
                    'checklist': [
                        'Fasting 4 hours before final assessments',
                        'Confirm continued drug-free status',
                        'Complete patient satisfaction survey (0-10 scale)',
                        'Exit interview (30 minutes)',
                        'Exit consultation (30 minutes)'
                    ]
                }
            }
        }
    ]
    
    try:
        trials_ref = realtime_db.reference('trials')
        trials_ref.delete()  # Clear existing data
        
        trial_ids = {}
        for i, trial in enumerate(sample_trials, 1):
            trial_ref = trials_ref.push(trial)
            trial_ids[trial['title']] = trial_ref.key
            print(f"   ✅ Added clinical trial {i}: {trial['title']} (ID: {trial_ref.key})")
        
        return trial_ids
        
    except Exception as e:
        print(f"❌ Error seeding clinical trials: {e}")
        return {}

def seed_enrollments(user_ids, trial_ids, org_ids):
    """Seed the database with sample enrollments"""
    print("📝 Adding enrollments data...")
    
    # Get patient user IDs
    patient_emails = ['john.doe@email.com', 'jane.smith@email.com', 'michael.johnson@email.com']
    patient_ids = [user_ids.get(email) for email in patient_emails if user_ids.get(email)]
    
    # Get trial IDs
    diabetes_trial_id = trial_ids.get('DIABETES-CARE-2025')
    hypertension_trial_id = trial_ids.get('HYPERTENSION-NOVA Study')
    asthma_trial_id = trial_ids.get('RESPIRATORY-WELLNESS Initiative')
    
    # Get org ID
    emory_org_id = org_ids.get('Emory Healthcare')
    
    sample_enrollments = [
        {
            'patientId': patient_ids[0] if len(patient_ids) > 0 else 'patient-1',
            'trialId': diabetes_trial_id or 'trial-1',
            'orgId': emory_org_id or 'org-1',
            'enrollmentDate': '2024-02-15',
            'currentStage': 2,
            'isActive': True,
            'status': 'Active',
            'checklistProgress': {
                'stage1': {
                    'Complete informed consent': True,
                    'Medical history review': True,
                    'Physical examination': True,
                    'Laboratory tests (HbA1c, glucose, lipid panel)': True,
                    'Vital signs measurement': True,
                    'Eligibility confirmation': True
                },
                'stage2': {
                    'Use current glucose meter for 4 weeks': True,
                    'Log all readings in study diary': True,
                    'Maintain usual diet and exercise': True,
                    'Weekly check-in calls': False,
                    'Complete baseline quality of life questionnaire': False
                }
            },
            'notes': 'Patient showing good compliance with baseline monitoring'
        },
        {
            'patientId': patient_ids[1] if len(patient_ids) > 1 else 'patient-2',
            'trialId': hypertension_trial_id or 'trial-2',
            'orgId': org_ids.get('Piedmont Healthcare') or 'org-2',
            'enrollmentDate': '2024-01-20',
            'currentStage': 3,
            'isActive': True,
            'status': 'Active',
            'checklistProgress': {
                'stage1': {
                    'Informed consent signing': True,
                    'Complete medical history': True,
                    'Blood pressure measurements (multiple readings)': True,
                    'ECG and echocardiogram': True,
                    'Blood work (comprehensive metabolic panel)': True,
                    'Medication washout period if needed': True
                },
                'stage2': {
                    'Confirm eligibility criteria met': True,
                    'Random assignment to treatment arm': True,
                    'Receive study medication': True,
                    'Medication counseling session': True,
                    'Schedule first follow-up visit': True
                },
                'stage3': {
                    'Take study medication as prescribed': True,
                    'Monthly blood pressure monitoring': True,
                    'Quarterly laboratory assessments': False,
                    'Report any side effects': True,
                    'Attend all scheduled visits': True,
                    'Complete medication compliance logs': True
                }
            },
            'notes': 'Excellent response to treatment, BP well controlled'
        },
        {
            'patientId': patient_ids[2] if len(patient_ids) > 2 else 'patient-3',
            'trialId': asthma_trial_id or 'trial-3',
            'orgId': org_ids.get('Children\'s Healthcare of Atlanta') or 'org-3',
            'enrollmentDate': '2024-03-01',
            'currentStage': 1,
            'isActive': True,
            'status': 'Active',
            'checklistProgress': {
                'stage1': {
                    'Complete consent process': True,
                    'Asthma control assessment': True,
                    'Spirometry testing': True,
                    'Smart inhaler device training': False,
                    'Mobile app setup and training': False,
                    'Environmental sensor installation': False
                }
            },
            'notes': 'Recently enrolled, completing initial training phase'
        }
    ]
    
    try:
        enrollments_ref = realtime_db.reference('enrollments')
        enrollments_ref.delete()  # Clear existing data
        
        for i, enrollment in enumerate(sample_enrollments, 1):
            enrollment_ref = enrollments_ref.push(enrollment)
            print(f"   ✅ Added enrollment {i}: Patient {enrollment['patientId'][:8]}... in trial {enrollment['trialId'][:8]}... (ID: {enrollment_ref.key})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error seeding enrollments: {e}")
        return False

def verify_all_data():
    """Verify that all data was seeded correctly"""
    print("\n🔍 Verifying seeded data...")
    
    collections = ['users', 'organizations', 'emr_records', 'trials', 'enrollments']
    verification_results = {}
    
    try:
        for collection in collections:
            ref = realtime_db.reference(collection)
            data = ref.get()
            
            if data:
                count = len(data)
                verification_results[collection] = count
                print(f"   ✅ {collection}: {count} records found")
            else:
                verification_results[collection] = 0
                print(f"   ❌ {collection}: No data found")
        
        total_records = sum(verification_results.values())
        print(f"\n📊 Total records seeded: {total_records}")
        
        if total_records > 0:
            print("✅ Database verification successful!")
            return True
        else:
            print("❌ Database verification failed - no data found")
            return False
            
    except Exception as e:
        print(f"❌ Error verifying data: {e}")
        return False

def main():
    """Main function to run the comprehensive seeder"""
    print("🌱 Comprehensive Database Seeder")
    print("=" * 50)
    
    # Check Firebase connection
    try:
        test_ref = realtime_db.reference('test')
        test_ref.set({'timestamp': int(time.time())})
        test_ref.delete()
        print("✅ Firebase connection successful")
    except Exception as e:
        print(f"❌ Firebase connection failed: {e}")
        print("💡 Make sure your Firebase configuration is correct and you have internet access.")
        sys.exit(1)
    
    print("\n🚀 Starting comprehensive database seeding...")
    
    # Seed all data in order
    user_ids = seed_users()
    if not user_ids:
        print("❌ Failed to seed users. Aborting.")
        sys.exit(1)
    
    org_ids = seed_organizations()
    if not org_ids:
        print("❌ Failed to seed organizations. Aborting.")
        sys.exit(1)
    
    if not seed_emr_records(user_ids):
        print("❌ Failed to seed EMR records. Aborting.")
        sys.exit(1)
    
    trial_ids = seed_trials()
    if not trial_ids:
        print("❌ Failed to seed clinical trials. Aborting.")
        sys.exit(1)
    
    if not seed_enrollments(user_ids, trial_ids, org_ids):
        print("❌ Failed to seed enrollments. Aborting.")
        sys.exit(1)
    
    # Verify all data
    if verify_all_data():
        print("\n🎉 Comprehensive database seeding completed successfully!")
        print("💡 Your application now has complete sample data for:")
        print("   • User accounts (patients and CRCs)")
        print("   • Patient medical records (EMR)")
        print("   • Clinical trials with detailed protocols")
        print("   • Patient enrollments in trials")
        print("   • Clinical research organizations")
        print("\n🚀 You can now run your application and test all features!")
    else:
        print("\n⚠️  Seeding completed but verification failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
