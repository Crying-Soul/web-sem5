class MessagesManager {
    constructor() {
        this.userId = new URLSearchParams(window.location.search).get('userId');
        this.messages = [];
        this.messageCardTemplate = document.getElementById('messageCardTemplate');
        this.init();
    }

    async init() {
        if (!this.userId) {
            window.location.href = '/users.html';
            return;
        }

        this.setupEventListeners();
        await this.loadMessages();
        this.renderMessages();
    }

    async loadMessages() {
        try {
            const response = await fetch(`/api/messages/${this.userId}`);
            this.messages = await response.json();
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    renderMessages() {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = ''; // Очищаем контейнер

        if (this.messages.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'col-12';
            emptyMessage.innerHTML = '<p class="text-center">Нет сообщений</p>';
            container.appendChild(emptyMessage);
            return;
        }

        this.messages.forEach(item => {
            const messageCard = this.createMessageCard(item);
            container.appendChild(messageCard);
        });
    }

    createMessageCard(messageItem) {
        // Клонируем шаблон
        const template = this.messageCardTemplate.content.cloneNode(true);
        const messageCard = template.querySelector('.col-12');
        // Заполняем данные
        messageCard.querySelector('.message-user-name').textContent = `${messageItem.senderName}`;
        messageCard.querySelector('.message-receiver-name').textContent = `${messageItem.receiverName}`;
        messageCard.querySelector('.message-content').textContent = messageItem.content;
        messageCard.querySelector('.message-date').textContent = this.formatDate(messageItem.date);

        return messageCard;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    setupEventListeners() {
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = `/users.html`;
        });
    }
}

const messagesManager = new MessagesManager();