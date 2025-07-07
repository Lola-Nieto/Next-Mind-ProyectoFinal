import React from 'react';
import './MessageList.css';


const MessageList = ({ messages, loading }) => {
    return (
        <div className="message-list">
            {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}>
                <p>{msg.content}</p>
            </div>
            ))}
             {loading && (
                <div className='spinner-container'>
                    <div className="spinner"></div>
                    <span style={{ marginLeft: 8, color: '#888' }}>El asistente está escribiendo...</span>
                </div>
            )}
        </div>
    );
};

export default MessageList;