import React, { useState } from 'react';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import axios from 'axios';

const App = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSendMessage = async (question) => {
        const userMessage = { role: 'user', content: question };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:3001/api/chat', { mensaje: question });
            const botMessage = { role: 'bot', content: response.data.respuesta.data?.result || response.data.respuesta };
            setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (error) {
            setMessages((prevMessages) => [
                ...prevMessages,
                { role: 'bot', content: 'Error al comunicarse con el servidor.' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <MessageList messages={messages} loading={loading} />
            <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
        </div>
    );
};

export default App;