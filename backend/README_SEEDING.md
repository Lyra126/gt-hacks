# Database Seeding Instructions

## Comprehensive Database Seeding

This guide explains how to populate your Firebase Realtime Database with complete sample data for development and testing, including users, medical records, clinical trials, enrollments, and organizations.

## Prerequisites

- Firebase project configured with Realtime Database
- Firebase credentials properly set up in your backend
- Python environment with required dependencies installed
- bcrypt library installed (`pip install bcrypt`)

## Quick Start

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Run the comprehensive seed script:**
   ```bash
   python seed_database.py
   ```


### What the Comprehensive Script Does

1. **Connects to Firebase** - Verifies your Firebase configuration
2. **Clears existing data** - Removes any existing data from all collections
3. **Seeds complete dataset** - Adds sample data for all entities:

#### Data Seeded:
- **👥 Users (5 records)**: 4 patients + 1 CRC with hashed passwords
- **🏥 Organizations (3 records)**: Emory Healthcare, Piedmont Healthcare, Children's Healthcare
- **📋 EMR Records (4 records)**: Complete medical histories for each patient
- **🧪 Clinical Trials (3 records)**: Detailed trials with multi-stage protocols
- **📝 Enrollments (3 records)**: Patient-trial relationships with progress tracking
4. **Verifies the data** - Confirms the data was added successfully

### Expected Output

```
🌱 Comprehensive Database Seeder
==================================================
✅ Firebase connection successful

🚀 Starting comprehensive database seeding...
📝 Adding users data...
   ✅ Added user 1: John Doe (ID: -ABC123...)
   ✅ Added user 2: Jane Smith (ID: -DEF456...)
   ...
📝 Adding organizations data...
   ✅ Added organization 1: Emory Healthcare (ID: -GHI789...)
   ...
📝 Adding EMR records data...
   ✅ Added EMR record 1 for patient ID: -ABC123...
   ...
📝 Adding clinical trials data...
   ✅ Added clinical trial 1: DIABETES-CARE-2025 (ID: -JKL012...)
   ...
📝 Adding enrollments data...
   ✅ Added enrollment 1: Patient ABC123... in trial JKL012...
   ...

🔍 Verifying seeded data...
   ✅ users: 5 records found
   ✅ organizations: 3 records found
   ✅ emr_records: 4 records found
   ✅ trials: 3 records found
   ✅ enrollments: 3 records found

📊 Total records seeded: 18
✅ Database verification successful!

🎉 Comprehensive database seeding completed successfully!
💡 Your application now has complete sample data for:
   • User accounts (patients and CRCs)
   • Patient medical records (EMR)
   • Clinical trials with detailed protocols
   • Patient enrollments in trials
   • Clinical research organizations

🚀 You can now run your application and test all features!
```

## Sample Data Details

### Sample Users
- **John Doe** (john.doe@email.com) - Type 2 Diabetes patient
- **Jane Smith** (jane.smith@email.com) - Hypertension patient  
- **Michael Johnson** (michael.johnson@email.com) - Early Alzheimer's patient
- **Sarah Wilson** (sarah.wilson@email.com) - Asthma patient
- **Dr. Lisa Anderson** (dr.anderson@emory.edu) - Clinical Research Coordinator

All users have password: `password123`

### Sample Clinical Trials
1. **DIABETES-CARE-2025** - 4-stage glucose monitoring trial
2. **HYPERTENSION-NOVA Study** - 4-stage combination therapy trial  
3. **RESPIRATORY-WELLNESS Initiative** - 3-stage AI-powered asthma management

### Database Structure
```
Firebase Realtime Database:
├── users/
│   ├── {user_id}/
│   │   ├── email, name, firstName, lastName
│   │   ├── userType, password (hashed)
│   │   └── patient-specific fields...
├── organizations/
│   ├── {org_id}/
│   │   ├── name, type, address
│   │   └── specialties, activeTrials...
├── emr_records/
│   ├── {patient_id}/
│   │   ├── log[] (medical history)
│   │   ├── allergies[], currentMedications[]
│   │   └── vitalSigns{}
├── trials/
│   ├── {trial_id}/
│   │   ├── title, status, description
│   │   ├── location, sponsor, condition
│   │   └── stages/{stage_number}/
│   │       ├── name, duration, summary
│   │       └── checklist[]
└── enrollments/
    ├── {enrollment_id}/
    │   ├── patientId, trialId, orgId
    │   ├── currentStage, isActive
    │   └── checklistProgress/
```

## Troubleshooting

### Common Issues

1. **Firebase connection failed**
   - Verify your Firebase credentials are correctly configured
   - Check your internet connection
   - Ensure Firebase Realtime Database is enabled

2. **bcrypt import error**
   ```bash
   pip install bcrypt
   ```

3. **Permission denied**
   - Check Firebase Realtime Database rules
   - Ensure your service account has write permissions

### Clearing Data

To clear all data and start fresh:
```bash
python -c "
import firebase_config
from firebase_admin import db
db.reference().delete()
print('All data cleared!')
"
