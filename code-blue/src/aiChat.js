import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';

// Define the base URL directly in the file
// Use 'http://100.66.12.93:8000' for Android, 'http://localhost:8000' for iOS
const API_BASE_URL = 'http://100.66.12.93:8000';

const AIChat = ({ patientId }) => { 
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input || !patientId) return;
    const userMessage = { id: Date.now().toString(), text: input, fromUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/agent/invoke/${patientId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: input }),
        }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, I encountered an issue.',
        fromUser: false,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('API error:', err);
      const errorMessage = {
        id: (Date.now() + 2).toString(),
        text: 'Error: Failed to get AI response.',
        fromUser: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... JSX remains the same
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Text style={styles.chatTitle}>AI Assistant</Text>
        <FlatList
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
            <View style={[ styles.messageBubble, item.fromUser ? styles.userBubble : styles.aiBubble ]}>
                <Text style={item.fromUser ? styles.userText : styles.aiText}>{item.text}</Text>
            </View>
            )}
            contentContainerStyle={{ padding: 10 }}
        />
        <View style={styles.inputContainer}>
            <TextInput style={styles.textInput} value={input} onChangeText={setInput} placeholder="Ask about your EMR or trial..."/>
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading}>
            <Text style={styles.sendButtonText}>{loading ? '...' : 'Send'}</Text>
            </TouchableOpacity>
        </View>
    </KeyboardAvoidingView>
  );
};

// --- Styles remain the same ---
const styles = StyleSheet.create({
  chatTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  messageBubble: { padding: 12, borderRadius: 18, marginVertical: 5, maxWidth: '80%' },
  userBubble: { backgroundColor: '#007bff', alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: '#e5e5ea', alignSelf: 'flex-start' },
  userText: { color: '#fff' },
  aiText: { color: '#000' },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#ccc', alignItems: 'center', backgroundColor: '#fff' },
  textInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, backgroundColor: '#f0f0f0' },
  sendButton: { backgroundColor: '#007bff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default AIChat;