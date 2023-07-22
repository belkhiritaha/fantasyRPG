import React, { useState, useRef, useEffect } from 'react';
import { ForwardRefRenderFunction } from 'react';

export interface ChatMessage {
    content: string;
    sender: string;
}

interface ChatBoxProps {
    playerName: string;
}

export interface ChatBoxRef {
    addMessage: (message: ChatMessage) => void;
}

const ChatBox: React.ForwardRefRenderFunction<ChatBoxRef, ChatBoxProps> = ({ playerName }, ref) => {
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => ({
        addMessage(message: ChatMessage) {
            console.log("Adding message:", message);
            setChatHistory([...chatHistory, message]);
        }
    }));

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(event.target.value);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (message.trim() !== '') {
            const newMessage: ChatMessage = {
                content: message.trim(),
                sender: playerName,
            };

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
        event.preventDefault();
        console.log(ref);
    };

    useEffect(() => {
        fetch(import.meta.env.VITE_ENV === "dev" ? import.meta.env.VITE_DEV_API_URL + '/messages' : import.meta.env.VITE_PROD_API_URL + '/messages')
            .then((res) => res.json())
            .then((data) => {
                data.map((message: { sender: string; content: string; }) => {
                    const newMessage: ChatMessage = {
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

    // useEffect(() => {
    //     if (inputRef.current) {
    //         inputRef.current.focus();
    //     }
    // }, [isTyping]);

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
                    opacity: 1,
                }}
            >
                <div className="chat-history">
                    {chatHistory.map((message) => (
                        <div key={chatHistory.indexOf(message)} className='chat-message' style={{ padding: '5px' }}>
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
                    id="message-input"
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

export default React.forwardRef(ChatBox);
