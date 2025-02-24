document.addEventListener('DOMContentLoaded', function() {
    // Initialize both chat interfaces
    initializeModalChat();
    initializeSymptomChat();
});

function initializeModalChat() {
    const modal = document.getElementById('virtualDoctorModal');
    if (!modal) return; // Skip if modal doesn't exist

    const openBtn = document.getElementById('openChatBtn');
    const closeBtn = modal.querySelector('.close-modal-btn');
    const messageContainer = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendMessage');

    // Modal controls
    openBtn?.addEventListener('click', () => {
        modal.classList.add('show');
        userInput?.focus();
        document.body.style.overflow = 'hidden';
    });

    closeBtn?.addEventListener('click', () => {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Chat controls
    if (sendButton && userInput && messageContainer) {
        setupChatHandlers(sendButton, userInput, messageContainer);
    }
}

function initializeSymptomChat() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Set up chat handlers if elements exist
    if (sendButton && userInput && chatMessages) {
        setupChatHandlers(sendButton, userInput, chatMessages);
    }
}

function setupChatHandlers(sendButton, userInput, messageContainer) {
    sendButton.addEventListener('click', () => handleMessage(userInput, messageContainer));
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleMessage(userInput, messageContainer);
        }
    });
}

async function handleMessage(userInput, messageContainer) {
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // Add user message to chat
    addMessageToChat(messageContainer, 'user', userMessage);
    userInput.value = '';

    // Show typing indicator
    showTypingIndicator(messageContainer);

    try {
        const response = await fetch('http://localhost:1234/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "mistral-7b-instruct-v0.2.Q4_K_M",
                messages: [
                    {
                        role: "system",
                        content: "You are an AI medical assistant. You help analyze symptoms and provide general medical information. Always remind users to consult healthcare professionals for specific medical advice. Be empathetic and thorough in your responses."
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                temperature: 0.7,
                max_tokens: 500,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        let partialResponse = '';
        removeTypingIndicator(messageContainer);

        // Create a new message element for the AI response
        const messageElement = createMessageElement(messageContainer, 'assistant', '');

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    if (line.includes('[DONE]')) continue;
                    
                    try {
                        const jsonData = JSON.parse(line.slice(5));
                        if (jsonData.choices[0].delta?.content) {
                            partialResponse += jsonData.choices[0].delta.content;
                            messageElement.textContent = partialResponse;
                            scrollToBottom(messageContainer);
                        }
                    } catch (e) {
                        console.error('Error parsing JSON:', e);
                    }
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator(messageContainer);
        addMessageToChat(messageContainer, 'system', 'Sorry, I encountered an error. Please try again.');
    }
}

function addMessageToChat(container, type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = content;
    container.appendChild(messageDiv);
    scrollToBottom(container);
}

function createMessageElement(container, type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = content;
    container.appendChild(messageDiv);
    scrollToBottom(container);
    return messageDiv;
}

function showTypingIndicator(container) {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant typing';
    typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    typingDiv.id = 'typingIndicator';
    container.appendChild(typingDiv);
    scrollToBottom(container);
}

function removeTypingIndicator(container) {
    const typingIndicator = container.querySelector('#typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
} 