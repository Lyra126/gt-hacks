import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DoctorDashboard from './src/doctorDashboard';
import AIChat from './src/aiChat';
import ClinicalTrials from './src/clinicalTrials';
import Timeline from './src/timeline';

const Tab = createBottomTabNavigator();

export default function DoctorTabs() {
  // const email = route.params?.email;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Doctor') iconName = focused ? 'medkit' : 'medkit-outline';
          if (route.name === 'AI Chat') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          if (route.name === 'Trials') iconName = focused ? 'clipboard' : 'clipboard-outline';
          if (route.name === 'Timeline') iconName = focused ? 'clipboard' : 'time-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#32ae48',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      {/* initialParams={{ email }} */}
      <Tab.Screen name="Doctor" component={DoctorDashboard} />
      <Tab.Screen name="AI Chat" component={AIChat} />
      <Tab.Screen name="Trials" component={ClinicalTrials} />
      <Tab.Screen name="Timeline (temp)" component={Timeline} />
    </Tab.Navigator>
  );
}
