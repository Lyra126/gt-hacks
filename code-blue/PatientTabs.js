import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import PatientDashboard from './src/patientDashboard';
import AIChat from './src/aiChat';
import ClinicalTrials from './src/clinicalTrials';

const Tab = createBottomTabNavigator();

export default function PatientTabs({route}) {
  const email = route.params?.email;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, 
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Patient') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'AI Chat') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          if (route.name === 'Trials') iconName = focused ? 'clipboard' : 'clipboard-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#32ae48',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Patient">
        {props => <PatientDashboard {...props} email={email} />}
      </Tab.Screen>
      <Tab.Screen name="AI Chat">
        {props => <AIChat {...props} email={email} />}
      </Tab.Screen>
      <Tab.Screen name="Trials">
        {props => <ClinicalTrials {...props} email={email} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
