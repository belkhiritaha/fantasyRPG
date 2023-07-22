import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
    id: number;
    content: string;
    sender: string;
}

interface ChatBoxProps {
    isTyping: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ isTyping }) => {
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(event.target.value);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (message.trim() !== '') {
            const newMessage: ChatMessage = {
                id: Date.now(),
                content: message.trim(),
                sender: "Player"
            };

            setChatHistory([...chatHistory, newMessage]);
            setMessage('');

            fetch(import.meta.env.VITE_ENV === "dev" ? import.meta.env.VITE_DEV_API_URL + '/messages' : import.meta.env.VITE_PROD_API_URL + '/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMessage),
            })
                .then((res) => res.json())
                .then((data) => {
                    console.log(data);
                });
        }
    };

    useEffect(() => {
        fetch(import.meta.env.VITE_ENV === "dev" ? import.meta.env.VITE_DEV_API_URL + '/messages' : import.meta.env.VITE_PROD_API_URL + '/messages')
            .then((res) => res.json())
            .then((data) => {
                data.map((message: { sender: string; content: string; }) => {
                    const newMessage: ChatMessage = {
                        id: data.indexOf(message),
                        content: message.content,
                        sender: message.sender,
                    };
                    setChatHistory([...chatHistory, newMessage]);
                });
                setChatHistory(data);
            });
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            console.log(chatContainerRef.current.scrollHeight);
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight - chatContainerRef.current.clientHeight;
        }
    }, [chatHistory]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [isTyping]);

    return (
        <>
            <div
                className="chat-container"
                ref={chatContainerRef}
                style={{
                    position: 'absolute',
                    bottom: '20%',
                    left: 0,
                    maxHeight: '70%',
                    width: '20%',
                    overflowY: 'scroll',
                    wordWrap: 'break-word',
                    scrollbarWidth: 'thin',
                    opacity: isTyping ? 0.5 : 1,
                }}
            >
                <div className="chat-history">
                    {chatHistory.map((message) => (
                        <div key={message.id} className='chat-message' style={{ padding: '5px' }}>
                            <strong>{message.sender}: </strong>
                            <span>{message.content}</span>
                        </div>
                    ))}
                </div>
            </div>
            <form
                onSubmit={handleSubmit}
                style={{ position: 'absolute', bottom: '15%', left: 0, width: '100%' }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    style={{ flex: 1, padding: '8px', marginRight: '10px', borderRadius: '8px', border: 'none', background: '#fff', width: '15%' }}
                />
                <button type="submit" style={{ width: '5%', padding: '8px', borderRadius: '8px', background: '#c0c0c0', border: 'none', color: '#291e40', fontWeight: 'bold' }}>
                    Send
                </button>
            </form>
        </>
    );
};

export default ChatBox;
