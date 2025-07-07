import React, { useState } from 'react';

const ChatInput = ({ onSendMessage, disabled }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim() && !disabled) {
            onSendMessage(inputValue);
            setInputValue('');
        }
    };
    
    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', marginTop: '20px' }}>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe tu pregunta..."
                style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            <button type="submit" style={{ padding: '10px', marginLeft: '10px', borderRadius: '5px', backgroundColor: '#007bff', color: '#fff' }} disabled={disabled}>
                Enviar
            </button>
        </form>
    );
};

export default ChatInput;