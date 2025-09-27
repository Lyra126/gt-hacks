import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import globalStyles from './styles/globalStyles';
import { useNavigation } from '@react-navigation/native';

const PromptLoginSignUp = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[globalStyles.AndroidSafeArea, styles.container]}>
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome to Code Blue!</Text>
        <Text style={styles.subText}>Please login or sign up to continue</Text>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: 'gray',
  },
  loginButton: {
    backgroundColor: '#1765b3ff',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  signUpButton: {
    borderWidth: 1,
    borderColor: '#1765b3ff',
    paddingVertical: 15,
    borderRadius: 12,
  },
  loginText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signUpText: {
    color: '#1765b3ff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PromptLoginSignUp;
