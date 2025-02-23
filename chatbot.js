class AIDoctor {
    constructor() {
        this.modal = document.getElementById('virtualDoctorModal');
        this.openBtn = document.getElementById('openChatBtn');
        this.closeBtn = document.querySelector('.close-modal-btn');
        this.messageContainer = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendMessage');
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Modal controls
        this.openBtn.addEventListener('click', () => this.openModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Chat controls
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    openModal() {
        this.modal.classList.add('show');
        this.userInput.focus();
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    closeModal() {
        this.modal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
    }

    async sendMessage() {
        const userMessage = this.userInput.value.trim();
        if (!userMessage) return;

        // Add user message to chat
        this.addMessageToChat('user', userMessage);
        this.userInput.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await fetch('http://localhost:1234/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "mistral-7b-instruct-v0.2.Q4_K_M", // or your specific model
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

            // Create a new message element for the AI response
            const messageElement = this.createMessageElement('assistant', '');
            this.removeTypingIndicator();

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;

                // Convert the chunk to text
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
                                this.scrollToBottom();
                            }
                        } catch (e) {
                            console.error('Error parsing JSON:', e);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error:', error);
            this.removeTypingIndicator();
            this.addMessageToChat('system', 'Sorry, I encountered an error. Please try again.');
        }
    }

    createMessageElement(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = content;
        this.messageContainer.appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv;
    }

    addMessageToChat(type, content) {
        this.createMessageElement(type, content);
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing';
        typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        typingDiv.id = 'typingIndicator';
        this.messageContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }
}

// Initialize the AI Doctor when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIDoctor();
}); 