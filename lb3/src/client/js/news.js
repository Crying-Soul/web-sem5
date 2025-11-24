class NewsManager {
    constructor() {
        this.userId = new URLSearchParams(window.location.search).get('userId');
        this.news = [];
        this.newsCardTemplate = document.getElementById('newsCardTemplate');
        this.init();
    }

    async init() {
        if (!this.userId) {
            window.location.href = '/users.html';
            return;
        }

        await this.loadNews();
        this.renderNews();
        this.setupEventListeners();
    }

    async loadNews() {
        try {
            const response = await fetch(`/api/news/${this.userId}`);
            this.news = await response.json();
        } catch (error) {
            console.error('Failed to load news:', error);
        }
    }

    renderNews() {
        const container = document.getElementById('newsContainer');
        container.innerHTML = ''; // Очищаем контейнер

        if (this.news.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'col-12';
            emptyMessage.innerHTML = '<p class="text-center">Нет новостей</p>';
            container.appendChild(emptyMessage);
            return;
        }

        this.news.forEach(item => {
            const newsCard = this.createNewsCard(item);
            container.appendChild(newsCard);
        });
    }

    createNewsCard(newsItem) {
        // Клонируем шаблон
        const template = this.newsCardTemplate.content.cloneNode(true);
        const newsCard = template.querySelector('.col-12');

        // Заполняем основные данные
        newsCard.querySelector('.news-author-name').textContent = newsItem.authorName;
        newsCard.querySelector('.news-date').textContent = newsItem.date;
        newsCard.querySelector('.news-content').textContent = newsItem.content;

        return newsCard;
    }

    setupEventListeners() {
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = `friends.html?userId=${this.userId}`;
        });
    }
}

const newsManager = new NewsManager();