import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import PromptLoginSignUp from './src/promptLoginSignUp';
import SignUp from './src/signUp';
import Login from './src/login';
import Timeline from './src/timeline';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="PromptLoginSignUp">
        <Stack.Screen name="PromptLoginSignUp" component={PromptLoginSignUp} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Timeline" component={Timeline} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
