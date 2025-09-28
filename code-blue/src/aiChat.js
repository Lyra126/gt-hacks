import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Animated,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const { width } = Dimensions.get('window');

// Define the base URL directly in the file
const API_BASE_URL = 'http://100.66.12.93:8000/api';

const AIChat = ({ patientId = "test-patient", userType = "patient" }) => { 
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: userType === "crc" 
        ? "Hi! I'm your AI clinical trial management assistant. I can help you manage trials, analyze patient data, review protocols, and answer questions about clinical research. How can I help you today?"
        : "Hi! I'm your AI health assistant. I can help you understand your medical records, find clinical trials, and answer health-related questions. How can I help you today?",
      fromUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingAnimation] = useState(new Animated.Value(0));
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [uploading, setUploading] = useState(false);
  const [hasShownFirstResponse, setHasShownFirstResponse] = useState(false);
  const [detectedMedications, setDetectedMedications] = useState(new Set());

  // Medication keywords for detection
  const medicationKeywords = new Set([
    // Pain, Fever, and Anti-Inflammatory
    "acetaminophen", "tylenol",
    "ibuprofen", "advil", "motrin",
    "naproxen", "aleve",
    "aspirin", "bayer", "ecotrin",
    "celecoxib", "celebrex",
    "tramadol", "ultram",
    "hydrocodone", "vicodin", "norco",

    // Cardiovascular (Blood Pressure & Cholesterol)
    "atorvastatin", "lipitor",
    "simvastatin", "zocor",
    "rosuvastatin", "crestor",
    "lisinopril", "prinivil", "zestril",
    "amlodipine", "norvasc",
    "metoprolol", "lopressor", "toprol-xl",
    "losartan", "cozaar",
    "hydrochlorothiazide", "hctz", "microzide",

    // Blood Thinners
    "warfarin", "coumadin",
    "apixaban", "eliquis",
    "rivaroxaban", "xarelto",
    "clopidogrel", "plavix",

    // Diabetes
    "metformin", "glucophage", "fortamet",
    "insulin", "lantus", "humalog", "novolog",
    "glipizide", "glucotrol",
    "semaglutide", "ozempic", "rybelsus", "wegovy",
    "liraglutide", "victoza",
    "dulaglutide", "trulicity",

    // Mental Health
    "sertraline", "zoloft",
    "fluoxetine", "prozac",
    "escitalopram", "lexapro",
    "citalopram", "celexa",
    "trazodone", "desyrel",
    "alprazolam", "xanax",
    "lorazepam", "ativan",
    "amphetamine", "dextroamphetamine", "adderall",
    "methylphenidate", "ritalin", "concerta",

    // Antibiotics
    "amoxicillin", "amoxil",
    "azithromycin", "zithromax", "z-pak",
    "cephalexin", "keflex",
    "ciprofloxacin", "cipro",
    "doxycycline",

    // Allergy & Asthma
    "loratadine", "claritin",
    "cetirizine", "zyrtec",
    "fexofenadine", "allegra",
    "diphenhydramine", "benadryl",
    "albuterol", "ventolin", "proair",
    "fluticasone", "flovent", "flonase",
    "montelukast", "singulair",

    // Gastrointestinal & Acid Reflux
    "omeprazole", "prilosec",
    "esomeprazole", "nexium",
    "pantoprazole", "protonix",
    "famotidine", "pepcid",

    // Thyroid Conditions
    "levothyroxine", "synthroid", "levoxyl"
  ]);

  // Function to detect medications in user input
  const detectMedications = (text) => {
    const words = text.toLowerCase().split(/\s+/);
    const foundMedications = new Set();
    
    words.forEach(word => {
      // Remove punctuation and check if word matches any medication
      const cleanWord = word.replace(/[^\w]/g, '');
      if (medicationKeywords.has(cleanWord)) {
        foundMedications.add(cleanWord);
      }
    });
    
    return foundMedications;
  };

  // Function to generate updated EMR with detected medications
  const generateUpdatedEMR = (medications) => {
    const medicationList = Array.from(medications).join(', ');
    
    return `Hi John! I've accessed your Electronic Medical Record (EMR). Here's what I found:

Personal Information:
• Name: John Doe
• Age: 45 years old
• Gender: Male

Current Health Status:
• No active medical conditions currently on file
• Current medications: ${medicationList || 'None listed'}
• No recent lab results available

Recent Activity:
• Last profile update: September 2025
• No recent EMR entries

Would you like me to:
• Help you find relevant clinical trials in your area?
• Explain how to upload recent medical records?
• Show you upcoming trial opportunities?
• Connect you with trial coordinators?

Is there anything specific about your health records you'd like me to help clarify?`;
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnimation, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnimation.stopAnimation();
      typingAnimation.setValue(0);
    }
  }, [loading, typingAnimation]);

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setUploading(true);
        
        // Create a user message about the upload
        const uploadMessage = {
          id: Date.now().toString(),
          text: `📄 Uploaded: ${file.name}`,
          fromUser: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => [...prev, uploadMessage]);
        
        // Simulate file processing (in a real app, you'd upload to your backend)
        setTimeout(() => {
          const aiResponse = {
            id: (Date.now() + 1).toString(),
            text: `I've received your trial document "${file.name}". I can help you analyze this PDF, extract key information, or answer questions about the trial protocol. What would you like me to do with this document?`,
            fromUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          
          setMessages(prev => [...prev, aiResponse]);
          setUploading(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = { 
      id: Date.now().toString(), 
      text: input.trim(), 
      fromUser: true,
      timestamp 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Scroll to bottom after sending message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // For patient users, use hardcoded responses with sleep
    if (userType === "patient") {
      // Check if user is asking for EMR
      const isAskingForEMR = input.toLowerCase().includes('emr') || 
                            input.toLowerCase().includes('medical record') ||
                            input.toLowerCase().includes('show my record');
      
      // Detect medications in the user's input
      const newMedications = detectMedications(input.trim());
      
      // Update the detected medications set
      if (newMedications.size > 0) {
        setDetectedMedications(prev => new Set([...prev, ...newMedications]));
      }
      
      // If user is asking for EMR, show current EMR with all detected medications
      if (isAskingForEMR) {
        const allMedications = new Set([...detectedMedications, ...newMedications]);
        const emrResponse = {
          id: (Date.now() + 1).toString(),
          text: generateUpdatedEMR(allMedications),
          fromUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Add EMR response after 2 seconds
        setTimeout(() => {
          setMessages(prev => [...prev, emrResponse]);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
          setLoading(false);
        }, 2000);
        
        return;
      }
      
      if (!hasShownFirstResponse) {
        // First response with EMR information (with detected medications)
        const allMedications = new Set([...detectedMedications, ...newMedications]);
        const firstResponse = {
          id: (Date.now() + 1).toString(),
          text: generateUpdatedEMR(allMedications),
          fromUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Add first response after 8 seconds (longer message needs more time to read)
        setTimeout(() => {
          setMessages(prev => [...prev, firstResponse]);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
          setHasShownFirstResponse(true);
          setLoading(false);
        }, 8000);
        
        return;
      } else {
        // Second response - "Your EMR has been updated" (with detected medications)
        const allMedications = new Set([...detectedMedications, ...newMedications]);
        const medicationList = Array.from(allMedications).join(', ');
        
        const secondResponse = {
          id: (Date.now() + 1).toString(),
          text: `Your EMR has been updated.${medicationList ? ` I've added ${medicationList} to your medication list.` : ''}`,
          fromUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Add second response after 2 seconds
        setTimeout(() => {
          setMessages(prev => [...prev, secondResponse]);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
          setLoading(false);
        }, 2000);
        
        return;
      }
    }

    // For CRC users, use the original API call
    try {
      const response = await fetch(
        `${API_BASE_URL}/agent/invoke/${patientId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: input.trim() }),
        }
      );
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, I encountered an issue processing your request.',
        fromUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      // Simulate typing delay for more natural feel
      setTimeout(() => {
        setMessages(prev => [...prev, aiMessage]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 500);
      
    } catch (err) {
      console.error('API error:', err);
      const errorMessage = {
        id: (Date.now() + 2).toString(),
        text: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        fromUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTimeout(() => {
        setMessages(prev => [...prev, errorMessage]);
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const TypingIndicator = () => (
    <Animated.View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
      <View style={styles.typingContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.typingDot,
              {
                transform: [
                  {
                    translateY: typingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -8],
                    }),
                  },
                ],
                opacity: typingAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 1, 0.3],
                }),
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );

  const renderMessage = ({ item, index }) => (
    <Animated.View
      style={[
        styles.messageContainer,
        item.fromUser ? styles.userMessageContainer : styles.aiMessageContainer,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[
        styles.messageBubble,
        item.fromUser ? styles.userBubble : styles.aiBubble,
      ]}>
        <Text style={[
          styles.messageText,
          item.fromUser ? styles.userText : styles.aiText
        ]}>
          {item.text}
        </Text>
      </View>
      <Text style={[
        styles.timestamp,
        item.fromUser ? styles.userTimestamp : styles.aiTimestamp
      ]}>
        {item.timestamp}
      </Text>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.aiAvatar}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Health Assistant</Text>
          <Text style={styles.headerSubtitle}>
            {loading ? 'Typing...' : 'Online • Ready to help'}
          </Text>
        </View>
        <View style={styles.onlineIndicator} />
      </View>

      {/* Messages */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        
        {loading && <TypingIndicator />}
      </View>

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            {userType === "crc" && (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={handleFileUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#32ae48" />
                ) : (
                  <Text style={styles.uploadButtonText}>+</Text>
                )}
              </TouchableOpacity>
            )}
            <TextInput 
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder={userType === "crc" ? "Ask about trial management, protocols, or patient data..." : "Ask about your health, EMR, or trials..."}
              placeholderTextColor="#a0a0a0"
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                (input.trim() && !loading) ? styles.sendButtonActive : styles.sendButtonInactive
              ]}
              onPress={sendMessage} 
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>→</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {userType === "crc" ? (
              <>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => setInput("Show me patient enrollment status")}
                >
                  <Text style={styles.quickActionText}>Enrollment Status</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => setInput("Review trial protocol compliance")}
                >
                  <Text style={styles.quickActionText}>Protocol Review</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => setInput("Analyze trial data trends")}
                >
                  <Text style={styles.quickActionText}>Data Analysis</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => setInput("Show me my recent lab results")}
                >
                  <Text style={styles.quickActionText}>Lab Results</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => setInput("Find clinical trials for my condition")}
                >
                  <Text style={styles.quickActionText}>Find Trials</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionButton}
                  onPress={() => setInput("Explain my medications")}
                >
                  <Text style={styles.quickActionText}>Medications</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#667eea',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  aiAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ade80',
    borderWidth: 2,
    borderColor: '#fff',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messagesList: {
    paddingVertical: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    marginVertical: 8,
    maxWidth: width * 0.8,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userBubble: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 8,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  typingBubble: {
    alignSelf: 'flex-start',
    marginVertical: 8,
    paddingVertical: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
    fontWeight: '500',
  },
  aiText: {
    color: '#374151',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.6,
  },
  userTimestamp: {
    color: '#667eea',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#6b7280',
    textAlign: 'left',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9ca3af',
    marginHorizontal: 2,
  },
  inputArea: {
    backgroundColor: '#fff',
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  uploadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#32ae48',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  uploadButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#32ae48',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    backgroundColor: '#f9fafb',
    fontSize: 16,
    color: '#374151',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonActive: {
    backgroundColor: '#667eea',
  },
  sendButtonInactive: {
    backgroundColor: '#d1d5db',
  },
  sendButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default AIChat;