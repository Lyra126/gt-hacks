import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
// import { FloatingCedarChat } from '@/chatComponents/FloatingCedarChat';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input) return;
    setMessages(prev => [...prev, {id: Date.now().toString(), text: input, fromUser: true}]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, {id: Date.now().toString(), text: 'AI response from Cedar (mock)', fromUser: false}]);
    }, 1000);
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
        {/* <FloatingCedarChat
        side='right'
        title='Assistant'
        collapsedLabel='How can I help you today?'
        dimensions={{
            width: 400,
            height: 600,
            minWidth: 350,
            minHeight: 400,
        }}
        resizable={true}
			/> */}
    </View>
  );
};

export default AIChat;
