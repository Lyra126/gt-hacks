import React from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
} from "react-native";
import globalStyles from './styles/globalStyles.js';
import { useNavigation } from '@react-navigation/native';


const PromptLoginSignUp = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={[globalStyles.AndroidSafeArea, styles.container]}>
            <Text style={styles.welcometext}>Welcome to reWastify!</Text>
            <Text style={styles.text}>Please login or sign up to continue</Text>
            <TouchableOpacity style={styles.loginButton} onPress={() => {navigation.navigate('Login')}}>
                <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signUpButton} onPress={() => {navigation.navigate('SignUp')}}>
                <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 40,
    },
    image: {
        width: '100%', // Use percentage to make the image responsive
        height: '30%', // Adjust as needed
        marginTop: '38%',
    },
    welcometext: {
        fontSize: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    text:{
        fontSize: 16,
        color: 'grey',
        textAlign: 'center',
        marginVertical: 20,
    },
    loginButton: {
        backgroundColor: '#6fbb58',
        padding: 15,
        borderRadius: 15,
        marginVertical: 10,
        marginHorizontal: 40,
    },
    signUpButton: {
        borderWidth: 1,
        borderColor: 'black',
        padding: 15,
        borderRadius: 15,
        marginVertical: 10,
        marginHorizontal: 40,
    },

    loginText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    signUpText:{
        color: 'black',
        textAlign: 'center',
        fontWeight: 'bold',
    }
});

export default PromptLoginSignUp;