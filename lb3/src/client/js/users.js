class UserManager {
    constructor() {
        this.users = [];
        this.userCardTemplate = document.getElementById('userCardTemplate');
        this.editModal = new bootstrap.Modal(document.getElementById('editUserModal'));
        this.currentEditingUser = null;
        this.init();
    }

    async init() {
        await this.loadUsers();
        this.renderUsers();
        this.setupEventListeners();
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users');
            this.users = await response.json();
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    renderUsers() {
        const container = document.getElementById('usersContainer');
        container.innerHTML = ''; // Очищаем контейнер

        this.users.forEach(user => {
            const userCard = this.createUserCard(user);
            container.appendChild(userCard);
        });
    }

    createUserCard(user) {
        // Клонируем шаблон
        const template = this.userCardTemplate.content.cloneNode(true);
        const userCard = template.querySelector('.col-md-6');

        // Заполняем данные
        userCard.querySelector('.user-name').textContent = `${user.firstName} ${user.lastName}`;
        userCard.querySelector('.user-email').textContent = user.email;
        userCard.querySelector('.user-birthDate').textContent = user.birthDate;
        userCard.querySelector('.user-role').textContent = user.role === 'admin' ? 'Администратор' : 'Пользователь';
        userCard.querySelector('.user-status').textContent = this.getStatusText(user.status);

        // Настраиваем статус
        const statusBadge = userCard.querySelector('.status-badge');
        statusBadge.textContent = this.getStatusText(user.status);
        statusBadge.classList.add(user.status);

        // Настраиваем кнопки
        const editBtn = userCard.querySelector('.user-edit-btn');
        const friendsBtn = userCard.querySelector('.user-friends-btn');
        const messagesBtn=userCard.querySelector('.user-messages-btn');

        editBtn.addEventListener('click', () => this.openEditModal(user));
        friendsBtn.addEventListener('click', () => this.viewFriends(user.id));
        messagesBtn.addEventListener('click', ()=> this.viewMessages(user.id));
        return userCard;
    }

    openEditModal(user) {
        this.currentEditingUser = user;

        // Заполняем форму данными пользователя
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserName').value = `${user.firstName} ${user.lastName}`;
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserbirthDate').value = user.birthDate;
        document.getElementById('editUserRole').value = user.role;
        document.getElementById('editUserStatus').value = user.status;


        // Показываем модальное окно
        this.editModal.show();
    }

    getStatusText(status) {
        const statusMap = {
            'active': 'Активный',
            'blocked': 'Заблокирован',
            'unconfirmed': 'Не подтверждён'
        };
        return statusMap[status] || status;
    }

    trimModalFields() {
        const inputs = document.querySelectorAll('#editUserModal input, #editUserModal textarea');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length > 25) {
                    e.target.value = e.target.value.substring(0, 25);
                }
            });
        });
    }
    async saveUserChanges() {
        if (!this.currentEditingUser) return;

        const userId = this.currentEditingUser.id;
        const newName=document.getElementById('editUserName').value;
        let nameParts=newName.split(" ");
        let mName=nameParts[0];
        let mSurname=nameParts[1];
        const newEmail=document.getElementById('editUserEmail').value;
        const newbirthDate=document.getElementById('editUserbirthDate').value;
        const newRole = document.getElementById('editUserRole').value;
        const newStatus = document.getElementById('editUserStatus').value;

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName:mName,
                    lastName:mSurname,
                    email:newEmail,
                    role: newRole,
                    status: newStatus,
                    birthDate:newbirthDate
                })
            });

            if (response.ok) {
                this.editModal.hide();
                this.currentEditingUser.firstName=mName;
                this.currentEditingUser.lastName=mSurname;
                this.currentEditingUser.email=newEmail;
                this.currentEditingUser.role=newRole;
                this.currentEditingUser.status=newStatus;
                this.currentEditingUser.birthDate=newbirthDate;

                this.renderUsers();

                this.currentEditingUser = null;
            }
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    }

    viewFriends(userId) {
        window.location.href = `/friends.html?userId=${userId}`;
    }
    viewMessages(userId){
        window.location.href=`/messages.html?userId=${userId}`;
    }

    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadUsers().then(() => this.renderUsers());
        });

        document.getElementById('saveUserChanges').addEventListener('click', () => {
            this.saveUserChanges();
        });

        // Очищаем текущего пользователя при закрытии модального окна
        document.getElementById('editUserModal').addEventListener('hidden.bs.modal', () => {
            this.currentEditingUser = null;
        });
        this.trimModalFields();
    }
}

const userManager = new UserManager();