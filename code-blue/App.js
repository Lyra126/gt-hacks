import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import PromptLoginSignUp from './src/promptLoginSignUp';
import SignUp from './src/signUp';
import Login from './src/login';
import VerifyEmail from './src/verifyEmail';
import Timeline from './src/timeline';
import PatientTabs from './PatientTabs';
import DoctorTabs from './DoctorTabs';

const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn && (
          <>
            <Stack.Screen name="PromptLoginSignUp" component={PromptLoginSignUp} />
            <Stack.Screen name="Login">
              {props => <Login {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmail} />
            <Stack.Screen name="Timeline" component={Timeline} />
          </>
        )}
        <Stack.Screen name="PatientTabs" component={PatientTabs} />
        <Stack.Screen name="DoctorTabs" component={DoctorTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
