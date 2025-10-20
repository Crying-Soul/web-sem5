import { Book, ApiResponse, LibraryAppInterface } from './types.js';
import '../scss/main.scss';

export class LibraryApp implements LibraryAppInterface {
    private currentBookId: string | null = null;
    private isLoading: boolean = false;

    constructor() {
        this.initEventListeners();
        this.initSearch();
        this.setupModalHandlers();
        this.showFlashMessages();
    }

    private initEventListeners(): void {
        // Фильтрация книг
        const statusFilter = document.getElementById('statusFilter') as HTMLSelectElement | null;
        const overdueFilter = document.getElementById('overdueFilter') as HTMLInputElement | null;

        statusFilter?.addEventListener('change', () => this.filterBooks());
        overdueFilter?.addEventListener('change', () => this.filterBooks());

        // Обработка кнопок удаления
        const booksContainer = document.getElementById('booksContainer');
        booksContainer?.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            // Обработка удаления
            const deleteBtn = target.closest('.delete-btn') as HTMLElement | null;
            if (deleteBtn) {
                e.preventDefault();
                this.currentBookId = deleteBtn.dataset.bookId ?? null;
                const bookTitle = deleteBtn.dataset.bookTitle ?? '';
                this.showDeleteModal(this.currentBookId, bookTitle);
                return;
            }

            // Обработка взятия книги
            const borrowBtn = target.closest('.borrow-btn') as HTMLElement | null;
            if (borrowBtn) {
                e.preventDefault();
                const bookId = borrowBtn.dataset.bookId ?? '';
                const bookTitle = borrowBtn.dataset.bookTitle ?? '';
                this.openBorrowModal(bookId, bookTitle);
                return;
            }

            // Обработка возврата книги
            const returnBtn = target.closest('.return-btn') as HTMLElement | null;
            if (returnBtn) {
                e.preventDefault();
                const bookId = returnBtn.dataset.bookId ?? '';
                this.returnBook(bookId);
                return;
            }
        });
    }

    private initSearch(): void {
        const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
        if (!searchInput) return;

        let searchTimeout: number | undefined;

        searchInput.addEventListener('input', (e) => {
            const query = (e.target as HTMLInputElement).value.trim();

            if (searchTimeout !== undefined) {
                window.clearTimeout(searchTimeout);
            }

            searchTimeout = window.setTimeout(() => {
                if (query.length === 0 || query.length >= 2) {
                    this.searchBooks(query);
                }
                searchTimeout = undefined;
            }, 300);
        });

        // Обработка нажатия Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (searchTimeout !== undefined) {
                    window.clearTimeout(searchTimeout);
                }
                this.searchBooks(searchInput.value.trim());
            }
        });
    }

    private setupBorrowForm(): void {
        const borrowForm = document.getElementById('borrowForm') as HTMLFormElement | null;
        if (!borrowForm) return;

        borrowForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitBorrowForm();
        });
    }

    private async submitBorrowForm(): Promise<void> {
        const form = document.getElementById('borrowForm') as HTMLFormElement | null;
        if (!form || !this.currentBookId) return;

        const formData = new FormData(form);
        const borrowerName = (formData.get('borrowerName') as string)?.trim() ?? '';
        const days = parseInt((formData.get('days') as string) ?? '14', 10) || 14;

        // Валидация
        if (!borrowerName) {
            this.showNotification('Пожалуйста, введите ваше имя', 'error');
            return;
        }

        if (days < 1 || days > 365) {
            this.showNotification('Срок аренды должен быть от 1 до 365 дней', 'error');
            return;
        }

        const borrowData = {
            borrowerName,
            days
        };

        try {
            const response = await fetch(`/books/${encodeURIComponent(this.currentBookId)}/borrow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(borrowData)
            });

            if (response.ok) {
                this.showNotification('Книга успешно взята в аренду', 'success');
                this.closeModal('borrowModal');
                // Обновляем список книг
                await this.filterBooks();
                // Перезагружаем страницу для обновления данных
                setTimeout(() => window.location.reload(), 1000);
            } else {
                const result: ApiResponse = await response.json().catch(() => ({ success: false, error: 'Неизвестная ошибка' }));
                this.showNotification('Ошибка при взятии книги: ' + (result.error ?? 'Неизвестная ошибка'), 'error');
            }
        } catch (error) {
            console.error('Ошибка при взятии книги:', error);
            this.showNotification('Ошибка при взятии книги', 'error');
        }
    }

    private showFlashMessages(): void {
        const flashContainer = document.getElementById('flashMessages');
        if (!flashContainer) return;

        let messages: Record<string, string[]> = {};
        try {
            messages = JSON.parse(flashContainer.dataset.messages || '{}');
        } catch {
            return;
        }

        Object.entries(messages).forEach(([type, messageArray]) => {
            (messageArray as string[]).forEach(message => {
                this.showNotification(message, (type as 'success' | 'error') ?? 'success');
            });
        });
    }

    public async returnBook(bookId: string): Promise<void> {
        if (!confirm('Вы уверены, что хотите вернуть эту книгу?')) return;

        try {
            const response = await fetch(`/books/${encodeURIComponent(bookId)}/return`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                this.showNotification('Книга успешно возвращена', 'success');
                await this.filterBooks();
                // Перезагружаем для обновления данных
                setTimeout(() => window.location.reload(), 1000);
            } else {
                const result: ApiResponse = await response.json().catch(() => ({ success: false, error: 'Неизвестная ошибка' }));
                this.showNotification('Ошибка при возврате книги: ' + (result.error ?? 'Неизвестная ошибка'), 'error');
            }
        } catch (error) {
            console.error('Ошибка при возврате книги:', error);
            this.showNotification('Ошибка при возврате книги', 'error');
        }
    }

    private async filterBooks(): Promise<void> {
        if (this.isLoading) return;

        const status = (document.getElementById('statusFilter') as HTMLSelectElement | null)?.value ?? 'all';
        const showOverdue = (document.getElementById('overdueFilter') as HTMLInputElement | null)?.checked ?? false;
        const searchQuery = (document.getElementById('searchInput') as HTMLInputElement | null)?.value.trim() || '';

        this.setLoadingState(true);

        try {
            const params = new URLSearchParams();
            if (status !== 'all') params.append('status', status);
            if (showOverdue) params.append('showOverdue', 'true');
            if (searchQuery) params.append('q', searchQuery);

            const url = `/books${params.toString() ? `?${params.toString()}` : ''}`;

            const response = await fetch(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const result: ApiResponse<Book[]> = await response.json();
                if (result.success && result.data) {
                    this.updateBooksGrid(result.data);
                } else {
                    this.updateBooksGrid([]);
                    if (result.error) {
                        this.showNotification(result.error, 'error');
                    }
                }
            } else {
                const errorText = await response.text();
                let errorMessage = 'Ошибка загрузки книг';
                try {
                    const errorResult: ApiResponse = JSON.parse(errorText);
                    errorMessage = errorResult.error || errorMessage;
                } catch {
                    errorMessage = `HTTP ${response.status}: ${errorText}`;
                }
                this.showNotification(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Ошибка загрузки книг:', error);
            this.showNotification('Ошибка загрузки книг', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    private async searchBooks(query: string): Promise<void> {
        if (this.isLoading) return;

        this.setLoadingState(true);

        try {
            const response = await fetch(`/books/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const result: ApiResponse<Book[]> = await response.json();
                if (result.success && result.data) {
                    this.updateBooksGrid(result.data);
                } else {
                    this.updateBooksGrid([]);
                    if (result.error) {
                        this.showNotification(result.error, 'error');
                    }
                }
            } else {
                const errorResult: ApiResponse = await response.json().catch(() => ({ success: false, error: 'Network error' }));
                this.showNotification(errorResult.error || 'Ошибка поиска книг', 'error');
            }
        } catch (error) {
            console.error('Ошибка поиска книг:', error);
            this.showNotification('Ошибка поиска книг', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }



    private updateBooksGrid(books: Book[]): void {
        const booksContainer = document.getElementById('booksContainer');
        if (!booksContainer) return;

        if (books.length === 0) {
            booksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>Книги не найдены</h3>
                    <p>Попробуйте изменить параметры поиска или фильтры</p>
                </div>
            `;
            return;
        }

        booksContainer.innerHTML = books.map(book => `
            <div class="book-card">
                ${book.coverImage ?
                `<img src="${this.escapeHtml(book.coverImage)}" alt="${this.escapeHtml(book.title)}" class="book-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
                ''
            }
                <div class="book-cover-placeholder" ${book.coverImage ? 'style="display: none;"' : ''}>
                    <i class="fas fa-book"></i>
                </div>
                <div class="book-content">
                    <h3 class="book-title">${this.escapeHtml(book.title)}</h3>
                    <p class="book-author">автор: ${this.escapeHtml(book.author)}</p>
                    <p class="book-meta">Год издания: ${new Date(book.publicationDate).getFullYear()}</p>
                    <p class="book-meta">ISBN: ${this.escapeHtml(book.isbn)}</p>
                    
                    <div class="mb-2">
                        <span class="status-badge ${book.status}">
                            ${book.status === 'available' ? 'Доступна' : 'Взята'}
                        </span>
                        ${book.isOverdue ? '<span class="status-badge overdue">Просрочена</span>' : ''}
                    </div>

                    <div class="action-buttons">
                        <a href="/books/${this.escapeHtml(book.id)}" class="btn btn-primary btn-sm" title="Подробнее">
                            <i class="fas fa-eye"></i>
                        </a>
                        <a href="/books/${this.escapeHtml(book.id)}/edit" class="btn btn-outline btn-sm" title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </a>
                        <button class="btn btn-danger btn-sm delete-btn" 
                                data-book-id="${this.escapeHtml(book.id)}" 
                                data-book-title="${this.escapeHtml(book.title)}"
                                title="Удалить книгу">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    private showDeleteModal(bookId: string | null, bookTitle: string): void {
        const modal = document.getElementById('deleteModal');
        if (!modal) return;

        const modalContent = modal.querySelector('.modal-body') as HTMLElement | null;
        if (modalContent) {
            modalContent.innerHTML = `
                <div style="text-align: center; padding: 1rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e63946; margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 1rem;">Удалить книгу?</h3>
                    <p>Вы уверены, что хотите удалить "<strong>${this.escapeHtml(bookTitle)}</strong>"?</p>
                    <p style="color: #666; font-size: 0.9rem;">Это действие нельзя отменить.</p>
                </div>
            `;
        }

        modal.style.display = 'flex';

        const confirmButton = document.getElementById('confirmDelete') as HTMLButtonElement | null;
        if (confirmButton) {
            // Remove any existing listeners to prevent duplicates
            const newConfirmButton = confirmButton.cloneNode(true) as HTMLButtonElement;
            confirmButton.parentNode?.replaceChild(newConfirmButton, confirmButton);

            newConfirmButton.addEventListener('click', async () => {
                if (bookId) {
                    await this.deleteBook(bookId);
                }
                this.closeModal('deleteModal');
            });
        }
    }

    private setupModalHandlers(): void {
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => {
                if (target === modal) {
                    (modal as HTMLElement).style.display = 'none';
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal-overlay');
                modals.forEach(modal => {
                    (modal as HTMLElement).style.display = 'none';
                });
            }
        });
    }

    public closeModal(modalId: string): void {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    }

    private async deleteBook(bookId: string): Promise<void> {
        try {
            const response = await fetch(`/books/${encodeURIComponent(bookId)}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            const result: ApiResponse = await response.json();

            if (result.success) {
                this.showNotification(result.message || 'Книга успешно удалена', 'success');
                await this.filterBooks();
            } else {
                this.showNotification(result.error || 'Ошибка удаления книги', 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления книги:', error);
            this.showNotification('Ошибка удаления книги', 'error');
        }
    }
    private setLoadingState(loading: boolean): void {
        this.isLoading = loading;
        const booksContainer = document.getElementById('booksContainer');

        if (loading && booksContainer) {
            booksContainer.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                </div>
            `;
        }
    }

    private showNotification(message: string, type: 'success' | 'error'): void {
        this.createToast(message, type);
    }

    private createToast(message: string, type: 'success' | 'error'): void {
        // Remove existing toasts to prevent stacking
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
                <span>${this.escapeHtml(message)}</span>
            </div>
            <button class="toast-close" aria-label="Закрыть">&times;</button>
        `;

        document.body.appendChild(toast);

        const removeToast = () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        };

        setTimeout(removeToast, 5000);

        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', removeToast);
        }
    }

    private escapeHtml(unsafe: string): string {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    public openBorrowModal(bookId: string, bookTitle: string): void {
        const modal = document.getElementById('borrowModal');
        if (!modal) return;

        this.currentBookId = bookId;

        const titleElement = document.getElementById('borrowBookTitle');
        if (titleElement) titleElement.textContent = bookTitle;

        const form = modal.querySelector('form') as HTMLFormElement | null;
        if (form) {
            form.reset();
            const daysInput = form.querySelector('#days') as HTMLInputElement | null;
            if (daysInput) daysInput.value = '14';
        }

        modal.style.display = 'flex';

        // Focus on the first input
        const borrowerNameInput = modal.querySelector('#borrowerName') as HTMLInputElement | null;
        borrowerNameInput?.focus();
    }
}

// Safe initialization with error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new LibraryApp();

        // Make app available globally
        (window as any).returnBook = (bookId: string) => {
            app.returnBook(bookId);
        };

        (window as any).openBorrowModal = (bookId: string, bookTitle: string) => {
            app.openBorrowModal(bookId, bookTitle);
        };

        (window as any).closeModal = (modalId: string) => {
            app.closeModal(modalId);
        };

        // Новая функция для взятия книги
        (window as any).borrowBook = (bookId: string, bookTitle: string) => {
            app.openBorrowModal(bookId, bookTitle);
        };

        console.log('LibraryApp initialized successfully');
    } catch (error) {
        console.error('Error initializing LibraryApp:', error);
    }
});