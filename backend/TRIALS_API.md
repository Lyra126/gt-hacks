# Clinical Trials API Documentation

This document describes the Clinical Trials API endpoints that have been integrated with the backend database.

## Base URL
All endpoints are prefixed with `/api`

## Endpoints

### 1. Get All Clinical Trials
**GET** `/api/trials`

**Query Parameters:**
- `search` (optional): Search query for trials (searches title, condition, location, sponsor, description)
- `status` (optional): Filter by status (`All`, `Recruiting`, `Active`, `Completed`). Default: `All`

**Response:**
```json
[
  {
    "id": "trial_id_123",
    "title": "DIABETES-CARE-2025",
    "status": "Recruiting",
    "distance": "2.3 miles",
    "location": "Emory University Hospital, Atlanta, GA",
    "description": "A phase III trial evaluating...",
    "sponsor": "Emory Healthcare",
    "insurance": "Most Major Insurance Accepted",
    "condition": "Diabetes"
  }
]
```

### 2. Get Specific Clinical Trial
**GET** `/api/trials/{trial_id}`

**Response:**
```json
{
  "id": "trial_id_123",
  "title": "DIABETES-CARE-2025",
  "status": "Recruiting",
  "distance": "2.3 miles",
  "location": "Emory University Hospital, Atlanta, GA",
  "description": "A phase III trial evaluating...",
  "sponsor": "Emory Healthcare",
  "insurance": "Most Major Insurance Accepted",
  "condition": "Diabetes"
}
```

### 3. Create Clinical Trial
**POST** `/api/trials`

**Request Body:**
```json
{
  "title": "NEW-TRIAL-2025",
  "status": "Recruiting",
  "distance": "1.5 miles",
  "location": "Hospital Name, City, State",
  "description": "Trial description...",
  "sponsor": "Sponsor Name",
  "insurance": "Insurance Information",
  "condition": "Medical Condition"
}
```

**Response:**
```json
{
  "id": "new_trial_id",
  "message": "Clinical trial created successfully"
}
```

### 4. Update Clinical Trial
**PUT** `/api/trials/{trial_id}`

**Request Body:** (All fields are optional)
```json
{
  "title": "Updated Title",
  "status": "Active",
  "description": "Updated description..."
}
```

**Response:**
```json
{
  "message": "Clinical trial updated successfully"
}
```

### 5. Delete Clinical Trial
**DELETE** `/api/trials/{trial_id}`

**Response:**
```json
{
  "message": "Clinical trial deleted successfully"
}
```

### 6. Request Doctor Review
**POST** `/api/trials/{trial_id}/request-review`

**Query Parameters:**
- `patient_id` (optional): ID of the patient requesting the review

**Response:**
```json
{
  "message": "Doctor review requested for trial: TRIAL-NAME",
  "trial_id": "trial_id_123",
  "patient_id": "patient_id_456",
  "status": "pending_review"
}
```

### 7. Initialize Sample Data
**POST** `/api/trials/initialize-sample-data`

This endpoint initializes the database with sample clinical trials data. Useful for development and testing.

**Response:**
```json
{
  "message": "Sample data initialized successfully"
}
```

## Integration with Frontend

### Updating the React Component

To integrate the React component (`clinicalTrials.js`) with the backend API, you'll need to:

1. **Replace hardcoded data** with API calls:
```javascript
// Instead of hardcoded allTrials array, fetch from API
const [allTrials, setAllTrials] = useState([]);

useEffect(() => {
  fetchTrials();
}, []);

const fetchTrials = async () => {
  try {
    const response = await fetch('/api/trials');
    const trials = await response.json();
    setAllTrials(trials);
  } catch (error) {
    console.error('Error fetching trials:', error);
  }
};
```

2. **Update search functionality** to use backend filtering:
```javascript
const handleSearch = async (query, filter) => {
  try {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (filter !== 'All') params.append('status', filter);
    
    const response = await fetch(`/api/trials?${params}`);
    const trials = await response.json();
    setAllTrials(trials);
  } catch (error) {
    console.error('Error searching trials:', error);
  }
};
```

3. **Update the doctor review request**:
```javascript
const handleRequestReview = async (trialId) => {
  try {
    const response = await fetch(`/api/trials/${trialId}/request-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ patient_id: currentPatientId }) // if available
    });
    
    const result = await response.json();
    console.log('Review requested:', result.message);
    // Show success message to user
  } catch (error) {
    console.error('Error requesting review:', error);
  }
};
```

## Database Structure

The clinical trials are stored in Firebase Realtime Database under the path:
```
trials/
  ├── trial_id_1/
  │   ├── title: "DIABETES-CARE-2025"
  │   ├── status: "Recruiting"
  │   ├── distance: "2.3 miles"
  │   ├── location: "Emory University Hospital, Atlanta, GA"
  │   ├── description: "..."
  │   ├── sponsor: "Emory Healthcare"
  │   ├── insurance: "Most Major Insurance Accepted"
  │   └── condition: "Diabetes"
  └── trial_id_2/
      └── ...
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `404`: Resource not found
- `400`: Bad request (invalid data)
- `500`: Internal server error

Error responses include a `detail` field with the error message:
```json
{
  "detail": "Clinical trial not found"
}
```
