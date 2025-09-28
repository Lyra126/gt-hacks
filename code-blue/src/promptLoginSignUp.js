import React, { useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Dimensions,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const PromptLoginSignUp = () => {
  const navigation = useNavigation();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const buttonScale1 = useRef(new Animated.Value(0.9)).current;
  const buttonScale2 = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Content fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Buttons scale in
      Animated.stagger(200, [
        Animated.timing(buttonScale1, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale2, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous pulse animation for logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    
    setTimeout(() => {
      pulseAnimation.start();
    }, 1500);

    return () => pulseAnimation.stop();
  }, []);

  const handleLoginPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale1, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale1, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Login');
    });
  };

  const handleSignUpPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale2, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale2, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('SignUp');
    });
  };

  // Medical Logo Component
  const MedicalLogo = () => (
    <Animated.View 
      style={[
        styles.logoContainer,
        {
          transform: [
            { scale: Animated.multiply(logoScale, pulseAnim) },
            {
              rotate: logoRotate.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.logoBackground}>
        <View style={styles.logoInner}>
          {/* Medical Cross */}
          <View style={styles.crossVertical} />
          <View style={styles.crossHorizontal} />
          
          {/* Heart beat line */}
          <View style={styles.heartBeatContainer}>
            <View style={styles.heartBeatLine} />
          </View>
        </View>
        
        {/* Outer ring */}
        <View style={styles.outerRing} />
        
        {/* Pulse rings */}
        <Animated.View 
          style={[
            styles.pulseRing1,
            {
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.05],
                outputRange: [0.6, 0],
              }),
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [1, 1.05],
                    outputRange: [1, 1.4],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.pulseRing2,
            {
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.05],
                outputRange: [0.4, 0],
              }),
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [1, 1.05],
                    outputRange: [1.2, 1.8],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1765b3ff" />
      
      {/* Background Gradient Circles */}
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />
      <View style={styles.backgroundCircle3} />

      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <MedicalLogo />
          
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.appName}>Code Blue</Text>
            <Text style={styles.tagline}>Your AI-Powered Health Companion</Text>
          </Animated.View>
        </View>

        {/* Subtitle */}
        <Animated.View
          style={[
            styles.subtitleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.subText}>
            Connect with clinical trials, manage your health records, and get AI-powered insights
          </Text>
        </Animated.View>

        {/* Buttons Section */}
        <Animated.View
          style={[
            styles.buttonsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: buttonScale1 }] }}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLoginPress}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.loginText}>Login</Text>
                <View style={styles.buttonIcon}>
                  <Text style={styles.iconText}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScale2 }] }}>
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUpPress}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.signUpText}>Create Account</Text>
                <View style={styles.buttonIconOutline}>
                  <Text style={styles.iconTextOutline}>+</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1765b3ff',
  },
  backgroundCircle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -width * 0.3,
    right: -width * 0.2,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -width * 0.2,
    left: -width * 0.1,
  },
  backgroundCircle3: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    top: height * 0.3,
    right: -width * 0.1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoInner: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossVertical: {
    position: 'absolute',
    width: 8,
    height: 40,
    backgroundColor: '#1765b3ff',
    borderRadius: 4,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 40,
    height: 8,
    backgroundColor: '#1765b3ff',
    borderRadius: 4,
  },
  heartBeatContainer: {
    position: 'absolute',
    bottom: 5,
    width: 30,
    height: 3,
  },
  heartBeatLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#ff6b6b',
    borderRadius: 1.5,
  },
  outerRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  pulseRing1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#1765b3ff',
  },
  pulseRing2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#1765b3ff',
  },
  welcomeText: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 5,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  subtitleContainer: {
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  subText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
  buttonsContainer: {
    paddingBottom: 20,
  },
  loginButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 25,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signUpButton: {
    borderWidth: 2,
    borderColor: '#fff',
    paddingVertical: 16,
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#1765b3ff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 10,
  },
  signUpText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 10,
  },
  buttonIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1765b3ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIconOutline: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconTextOutline: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 20,
    fontSize: 14,
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  featureText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default PromptLoginSignUp;