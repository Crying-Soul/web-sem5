class FriendsManager {
    constructor() {
        this.userId = new URLSearchParams(window.location.search).get('userId');
        this.friends = [];
        this.friendCardTemplate = document.getElementById('friendCardTemplate');
        this.init();
    }

    async init() {
        if (!this.userId) {
            window.location.href = '/users.html';
            return;
        }

        await this.loadFriends();
        this.renderFriends();
        this.setupEventListeners();
    }

    async loadFriends() {
        try {
            const response = await fetch(`/api/friends/${this.userId}`);
            this.friends = await response.json();
        } catch (error) {
            console.error('Failed to load friends:', error);
        }
    }

    renderFriends() {
        const container = document.getElementById('friendsContainer');
        container.innerHTML = ''; // Очищаем контейнер

        if (this.friends.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'col-12';
            emptyMessage.innerHTML = '<p class="text-center">Нет друзей</p>';
            container.appendChild(emptyMessage);
            return;
        }

        this.friends.forEach(friend => {
            const friendCard = this.createFriendCard(friend);
            container.appendChild(friendCard);
        });
    }

    createFriendCard(friend) {
        // Клонируем шаблон
        const template = this.friendCardTemplate.content.cloneNode(true);
        const friendCard = template.querySelector('.col-md-6');

        // Заполняем данные
        friendCard.querySelector('.friend-name').textContent = `${friend.firstName} ${friend.lastName}`;
        friendCard.querySelector('.friend-email').textContent = friend.email;
        friendCard.querySelector('.friendship-date').textContent = friend.friendshipDate;


        return friendCard;
    }


    viewNews(friendId) {
        window.location.href = `/news.html?userId=${this.userId}`;
    }

    setupEventListeners() {
        document.getElementById('newsBtn').addEventListener('click',()=>this.viewNews(this.userId));
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = `/users.html`;
        });
    }
}

const friendsManager = new FriendsManager();