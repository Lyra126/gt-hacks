import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import CrcDashboard from './src/crcDashboard';
import AIChat from './src/aiChat';

const Tab = createBottomTabNavigator();

export default function CrcTabs({route}) {
  const email = route.params?.email;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, 
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
          if (route.name === 'AI Chat') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#32ae48',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard">
        {props => <CrcDashboard {...props} email={email} />}
      </Tab.Screen>
      <Tab.Screen name="AI Chat">
        {props => <AIChat {...props} email={email} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
