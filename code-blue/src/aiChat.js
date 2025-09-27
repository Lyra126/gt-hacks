import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, FlatList } from 'react-native';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input) return;
    setMessages([...messages, { id: Date.now().toString(), text: input, fromUser: true }]);
    setInput('');

    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: 'AI: This is a response', fromUser: false }]);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.message, item.fromUser ? styles.userMsg : styles.aiMsg]}>
            <Text>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Type a message..." />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={{ color: 'white' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  message: { marginVertical: 5, padding: 10, borderRadius: 10, maxWidth: '70%' },
  userMsg: { backgroundColor: '#32ae48', alignSelf: 'flex-end', color: 'white' },
  aiMsg: { backgroundColor: '#e0e0e0', alignSelf: 'flex-start' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#ddd' },
  input: { flex: 1, backgroundColor: '#eee', borderRadius: 20, paddingHorizontal: 15 },
  sendBtn: { marginLeft: 10, backgroundColor: '#32ae48', borderRadius: 20, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
});

export default AIChat;
