import React, { useEffect, useRef } from 'react';
import './MessageList.css';

const MessageList = ({ messages, loading }) => {
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    return (
        <div className="message-list">
            {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}>
                    {msg.content.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            <br />
                        </React.Fragment>
                    ))}
                </div>
            ))}
            {loading && (
                <div className='spinner-container'>
                    <div className="spinner"></div>
                    <span style={{ marginLeft: 8, color: '#888' }}>El asistente está escribiendo...</span>
                </div>
            )}
            <div ref={endRef} />
        </div>
    );
};

export default MessageList;