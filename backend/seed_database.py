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
                    'name': 'Screening and Enrollment',
                    'duration': '2 weeks',
                    'summary': 'Initial screening, consent process, and baseline measurements',
                    'checklist': [
                        'Complete informed consent',
                        'Medical history review',
                        'Physical examination',
                        'Laboratory tests (HbA1c, glucose, lipid panel)',
                        'Vital signs measurement',
                        'Eligibility confirmation'
                    ]
                },
                '2': {
                    'name': 'Baseline Period',
                    'duration': '4 weeks',
                    'summary': 'Establish baseline glucose patterns using current monitoring method',
                    'checklist': [
                        'Use current glucose meter for 4 weeks',
                        'Log all readings in study diary',
                        'Maintain usual diet and exercise',
                        'Weekly check-in calls',
                        'Complete baseline quality of life questionnaire'
                    ]
                },
                '3': {
                    'name': 'Intervention Period',
                    'duration': '24 weeks',
                    'summary': 'Use new continuous glucose monitoring system',
                    'checklist': [
                        'Receive training on new CGM device',
                        'Wear CGM device continuously',
                        'Calibrate device as instructed',
                        'Attend bi-weekly study visits',
                        'Report any device issues immediately',
                        'Complete monthly questionnaires'
                    ]
                },
                '4': {
                    'name': 'Follow-up Period',
                    'duration': '12 weeks',
                    'summary': 'Monitor outcomes after intervention completion',
                    'checklist': [
                        'Return to standard glucose monitoring',
                        'Attend follow-up visits at weeks 4, 8, and 12',
                        'Complete final laboratory tests',
                        'Final quality of life assessment',
                        'Exit interview'
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
                    'name': 'Screening',
                    'duration': '2 weeks',
                    'summary': 'Comprehensive cardiovascular assessment and eligibility determination',
                    'checklist': [
                        'Informed consent signing',
                        'Complete medical history',
                        'Blood pressure measurements (multiple readings)',
                        'ECG and echocardiogram',
                        'Blood work (comprehensive metabolic panel)',
                        'Medication washout period if needed'
                    ]
                },
                '2': {
                    'name': 'Randomization',
                    'duration': '1 week',
                    'summary': 'Random assignment to treatment group',
                    'checklist': [
                        'Confirm eligibility criteria met',
                        'Random assignment to treatment arm',
                        'Receive study medication',
                        'Medication counseling session',
                        'Schedule first follow-up visit'
                    ]
                },
                '3': {
                    'name': 'Treatment Phase',
                    'duration': '52 weeks',
                    'summary': 'Active treatment with assigned medication regimen',
                    'checklist': [
                        'Take study medication as prescribed',
                        'Monthly blood pressure monitoring',
                        'Quarterly laboratory assessments',
                        'Report any side effects',
                        'Attend all scheduled visits',
                        'Complete medication compliance logs'
                    ]
                },
                '4': {
                    'name': 'Safety Follow-up',
                    'duration': '12 weeks',
                    'summary': 'Monitor for delayed effects after treatment completion',
                    'checklist': [
                        'Final safety assessments',
                        'Transition to standard care',
                        'Complete final questionnaires',
                        'Return unused study medication',
                        'Schedule post-study care'
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
                    'name': 'Enrollment and Training',
                    'duration': '2 weeks',
                    'summary': 'Patient enrollment and smart inhaler training',
                    'checklist': [
                        'Complete consent process',
                        'Asthma control assessment',
                        'Spirometry testing',
                        'Smart inhaler device training',
                        'Mobile app setup and training',
                        'Environmental sensor installation'
                    ]
                },
                '2': {
                    'name': 'Monitoring Phase',
                    'duration': '24 weeks',
                    'summary': 'Continuous monitoring with AI-powered feedback',
                    'checklist': [
                        'Use smart inhaler daily',
                        'Respond to app notifications',
                        'Weekly symptom reporting',
                        'Monthly clinic visits',
                        'Environmental data review',
                        'Medication adherence tracking'
                    ]
                },
                '3': {
                    'name': 'Assessment Period',
                    'duration': '4 weeks',
                    'summary': 'Final assessments and outcome evaluation',
                    'checklist': [
                        'Final spirometry testing',
                        'Asthma control questionnaire',
                        'Quality of life assessment',
                        'Device data download',
                        'Exit interview',
                        'Return study devices'
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
            'condition': 'Cardiovascular'
        },
        {
            'title': 'ALZHEIMER-PREVENTION Study',
            'status': 'Recruiting',
            'distance': '15.4 miles',
            'location': 'Georgia Institute of Technology, Atlanta, GA',
            'description': 'Longitudinal study examining early intervention strategies for cognitive decline prevention in at-risk populations aged 55+.',
            'sponsor': 'Georgia Tech Research Institute',
            'insurance': 'Medicare, Private Insurance',
            'condition': 'Alzheimer\'s'
        },
        {
            'title': 'CANCER-IMMUNOTHERAPY Trial',
            'status': 'Active',
            'distance': '3.8 miles',
            'location': 'Winship Cancer Institute, Atlanta, GA',
            'description': 'Phase I/II trial testing combination immunotherapy approaches for advanced solid tumors with promising early results.',
            'sponsor': 'Winship Cancer Institute',
            'insurance': 'All Major Insurance Plans',
            'condition': 'Cancer'
        },
        {
            'title': 'MENTAL-HEALTH Digital Study',
            'status': 'Recruiting',
            'distance': '6.9 miles',
            'location': 'Grady Health System, Atlanta, GA',
            'description': 'Evaluating effectiveness of digital therapeutic interventions for anxiety and depression management in primary care settings.',
            'sponsor': 'Grady Health System',
            'insurance': 'Medicaid, Sliding Scale',
            'condition': 'Mental Health'
        },
        {
            'title': 'ARTHRITIS-RELIEF Protocol',
            'status': 'Completed',
            'distance': '9.7 miles',
            'location': 'Atlanta Medical Center, Atlanta, GA',
            'description': 'Recently completed study on non-pharmaceutical pain management techniques for rheumatoid arthritis patients.',
            'sponsor': 'Atlanta Medical Center',
            'insurance': 'Results Available to All',
            'condition': 'Arthritis'
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
