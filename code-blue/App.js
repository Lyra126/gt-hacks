// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './src/AuthContext';

import PromptLoginSignUp from './src/promptLoginSignUp';
import SignUp from './src/signUp';
import Login from './src/login';
import PatientTabs from './PatientTabs'; // Assuming this is your tab navigator
import CrcTabs from './CrcTabs'; // Assuming this is your tab navigator for CRCs
const Stack = createStackNavigator();

// This component decides which screens to show based on auth state
const AppNavigator = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user data is stored in AsyncStorage on app start
    const checkLoginState = async () => {
      try {
        // TEMPORARY: Clear stored user data to force login screen
        await AsyncStorage.removeItem('userData');
        
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          setUser(JSON.parse(userDataString));
        }
      } catch (e) {
        console.error("Failed to load user data from storage", e);
      } finally {
        setLoading(false);
      }
    };
    checkLoginState();
  }, []);

  if (loading) {
    return null; // Or a splash screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
         <>
          <Stack.Screen name="PatientTabs" component={PatientTabs} />
          <Stack.Screen name="CrcTabs" component={CrcTabs} />
        </>
      ) : (
        // If not logged in, show the auth flow screens
        <>
          <Stack.Screen name="PromptLoginSignUp" component={PromptLoginSignUp} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}