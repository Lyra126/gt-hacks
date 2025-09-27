import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import globalStyles from "./styles/globalStyles";

const API_BASE = "http://100.66.11.34:8000/api";

const VerifyEmail = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { email, isLogin } = route.params;

    const [code, setCode] = useState("");
    const [error, setError] = useState("");

    const handleVerify = async () => {
        if (!code) {
            setError("Please enter the verification code");
            return;
        }

        setError("");

        try {
            const endpoint = isLogin ? "/verify-2fa" : "/verify-email";
            console.log("Calling endpoint:", endpoint);
            console.log("With email:", email, "and code:", code);
            const res = await axios.post(`${API_BASE}${endpoint}`, {
                email,
                code,
            });

            console.log("Verification response:", res.data);

            if (res.data.success) {
                // Show alert first, navigate after user taps OK
                Alert.alert(
                    "Success",
                    "Your email has been verified!",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: "Login" }],
                                });
                            },
                        },
                    ],
                    { cancelable: false }
                );
            } else {
                setError(res.data.message || "Verification failed. Try again.");
            }
        } catch (err) {
            console.error("Verification error:", err.response?.data || err.message);
            setError(err.response?.data?.message || "An error occurred. Please try again.");
        }
    };


    return (
            
        <SafeAreaView style={[globalStyles.AndroidSafeArea, styles.container]}>
            <TouchableOpacity style={styles.backButton} onPress={() => {navigation.navigate('SignUp')}} > 
                <Text style={{fontSize: 37}}> ← </Text>
            </TouchableOpacity>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
                Enter the verification code sent to {email}
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Verification Code"
                placeholderTextColor="#888888"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.button} onPress={handleVerify}>
                <Text style={styles.buttonText}>Verify</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 40,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1765b3ff",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 10,
        color: "white",
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "white",
        marginBottom: 30,
        textAlign: "center",
    },
    input: {
        height: 50,
        backgroundColor: "white",
        borderRadius: 20,
        paddingHorizontal: 20,
        fontSize: 16,
        marginBottom: 20,
        width: "90%",
    },
    button: {
        height: 50,
        backgroundColor: "#32ae48ff",
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        width: "70%",
    },
    buttonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
    errorText: {
        color: "red",
        textAlign: "center",
        marginBottom: 10,
    },
    backButton: {
        position: 'absolute',
        top: 60, 
        left: 30,   
        zIndex: 10,   
    },
});

export default VerifyEmail;
