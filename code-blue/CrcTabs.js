import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import crcDashboard from './src/crcDashboard';
import AIChat from './src/aiChat';
import ClinicalTrialsCRC from './src/clinicalTrialsCRC';
import Timeline from './src/timeline';

const Tab = createBottomTabNavigator();

export default function CrcTabs({route}) {
  const email = route.params?.email;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Doctor') iconName = focused ? 'medkit' : 'medkit-outline';
          // if (route.name === 'AI Chat') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          if (route.name === 'Trials') iconName = focused ? 'clipboard' : 'clipboard-outline';
          // if (route.name === 'Timeline') iconName = focused ? 'clipboard' : 'time-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#32ae48',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Doctor">
        {props => <crcDashboard {...props} email={email} />}
      </Tab.Screen>
      <Tab.Screen name="Trials">
        {props => <ClinicalTrialsCRC {...props} email={email} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
