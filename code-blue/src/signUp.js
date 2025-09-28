import React, { useRef, useEffect, useState } from "react";
import {View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, Modal, Alert, ImageBackground, TextInput, Pressable} from "react-native";
import { GestureHandlerRootView, Gesture, GestureDetector,} from "react-native-gesture-handler";
import globalStyles from './styles/globalStyles.js';
import { useNavigation } from "@react-navigation/native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Fontisto from "react-native-vector-icons/Fontisto";
import AntDesign from "react-native-vector-icons/AntDesign";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from 'axios';

const API_BASE_URL = "http://100.66.12.93:8000/api"; 
const SignUp = ({ onLogin, ...props }) => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [userType, setUserType] = useState('patient'); // 'patient' or 'crc' 

    const handleSubmit = async () => {
    if (!name || !email || !password) {
        setErrorMessage("All fields are required.");
        return;
    }
    
    try {
        setErrorMessage("");
        await axios.post(`${API_BASE_URL}/signup`, {
            email,
            password,
            name,
            userType,
        });

        // On success, alert the user and navigate them to the Login screen
        Alert.alert(
            "Account Created",
            "Your account has been created successfully. Please log in to continue."
        );
        navigation.navigate("Login");

    } catch (err) {
        console.error("Signup error:", err.response?.data || err.message);
        setErrorMessage(err.response?.data?.detail || "An unknown error occurred during sign-up.");
    }
    };

    return (
        <SafeAreaView  style={[globalStyles.AndroidSafeArea, styles.container]}>
            <TouchableOpacity style={styles.backButton} onPress={() => {navigation.navigate('PromptLoginSignUp')}}>
                <Text style={{fontSize: 37}}> ← </Text>
            </TouchableOpacity>
            <View style = {styles.loginInformation}>
                <Text style={styles.welcomeBack}>Let's get started!</Text>
                <Text style = {styles.welcomeText}>Just a few more steps until you join our family!</Text>
                <View style={styles.inputView}>
                    <View style={styles.toggleContainer}>
                    <View style={styles.toggleButtons}>
                        <TouchableOpacity 
                            style={[
                                styles.toggleButton, 
                                userType === 'patient' ? styles.activeToggle : styles.inactiveToggle
                            ]}
                            onPress={() => setUserType('patient')}
                        >
                            <Text style={[
                                styles.toggleText,
                                userType === 'patient' ? styles.activeToggleText : styles.inactiveToggleText
                            ]}>
                                Patient
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[
                                styles.toggleButton, 
                                userType === 'organizer' ? styles.activeToggle : styles.inactiveToggle
                            ]}
                            onPress={() => setUserType('organizer')}
                        >
                            <Text style={[
                                styles.toggleText,
                                userType === 'organizer' ? styles.activeToggleText : styles.inactiveToggleText
                            ]}>
                                CRC
                            </Text>
                        </TouchableOpacity>
                    </View>
                    </View>
                    <View style={styles.inputSection}>
                        <Ionicons name="person" size={20} color="#000" />
                        <TextInput
                            style={styles.input}
                            placeholder='Name'
                            placeholderTextColor='#888888'
                            value={name}
                            onChangeText={setName}
                            autoCorrect={false}
                            autoCapitalize='none'
                        />
                    </View>
                    <View style={styles.inputSection}>
                        <FontAwesome name="envelope" size={20} color="#000" />
                        <TextInput
                            style={styles.input}
                            placeholder='Email'
                            placeholderTextColor='#888888'
                            value={email}
                            onChangeText={setEmail}
                            autoCorrect={false}
                            autoCapitalize='none'
                        />
                    </View>

                    <View style={styles.inputSection}>
                        <Fontisto name="locked" size={22} color="#000" />
                        <TextInput
                            style={styles.input}
                            placeholder='Password'
                            placeholderTextColor='#888888'
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            autoCorrect={false}
                            autoCapitalize='none'
                        />
                    </View>
                </View>

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                        <Text style={styles.buttonText}>Sign Up</Text>
                    </TouchableOpacity>
                <View style={styles.buttonView}>
                    <View style={styles.optionsText}>
                        <View style={{backgroundColor: 'lightgrey', height: 1, flex: 1, alignSelf: 'center'}} />
                        <Text style={{alignSelf:'center', paddingHorizontal:5, fontSize: 15, color: '#A9A9A9'}}>OR</Text>
                        <View style={{backgroundColor: 'lightgrey', height: 1, flex: 1, alignSelf: 'center'}} />
                    </View>
                </View>

                <View style={styles.mediaIcons}>
                    <View style={[styles.icons, {backgroundColor: '#e5e5e5'}]}>
                        <Image
                            source={{uri: 'https://img.icons8.com/?size=100&id=17949&format=png&color=000000'}}
                            style={{width: 40, height: 40}}
                        />
                    </View>
                    <View style={[styles.icons, {backgroundColor: '#e5e5e5'}]}>
                        <AntDesign name="apple" size={35} color="black" />
                    </View>
                </View>
                <View style={styles.footerView}>
                    <Text style={styles.footerText}>Already have an Account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={[styles.signup,{marginLeft: 3}]}> Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1765b3ff',
        padding: 40,
    },
    backButton: {
        marginLeft: 20,
    },
    loginInformation: {
        backgroundColor: 'white',
        height: '100%',
        borderRadius: 30,
        paddingTop: 50,
        marginTop: 30,
        paddingHorizontal: 26
    },
    welcomeBack: {

        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    welcomeText: {
        fontSize: 16,

    },
    image : {
        height : 160,
        width : 170
    },
    inputView : {
        marginTop: 20,
        gap : 18,
        width : "100%",
        marginBottom: 20
    },
    inputSection: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#eaeaea',
        borderRadius: 20,
        paddingHorizontal: 20,
    },
    input: {
        height : 50,
        width : "80%",
        paddingHorizontal : 20,
        backgroundColor: "#eaeaea",
        borderRadius: 20
    },
    button : {
        backgroundColor : "#1765b3ff",
        height : 45,
        width : "100%",
        borderRadius : 20,
        alignItems : "center",
        justifyContent : "center",
    },
    buttonText : {
        color : "white"  ,
        fontSize: 18,
        fontWeight : "bold"
    },
    buttonView :{
        width :"100%",
    },
    optionsText : {
        textAlign : "center",
        color : "gray",
        fontSize : 13,
        marginVertical: 30,
        flexDirection: 'row'
    },
    mediaIcons : {
        flexDirection : "row",
        gap : 22,
        alignItems: "center",
        justifyContent : "center",
        marginBottom : 23,
    },
    icons : {
        width : 55,
        height: 55,
        borderRadius : 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerView : {
        flexDirection : "row",
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 20,
    },
    footerText : {
        textAlign: "center",
        color : "gray",
    },
    signup : {
        color : "#1765b3ff",
        textAlign: "center",
        fontWeight : "bold",

    },
    title: {
        fontSize: 15,
        marginBottom: 10,
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginBottom: 10,
        textAlign: 'center',
    },
    toggleContainer: {
        marginBottom: 20,
    },
    toggleButtons: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
        padding: 4,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    activeToggle: {
        backgroundColor: '#2e83d8ff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    inactiveToggle: {
        backgroundColor: 'transparent',
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    activeToggleText: {
        color: 'white',
    },
    inactiveToggleText: {
        color: '#666',
    },
});

export default SignUp;