class UserManager {
  constructor() {
    this.users = [];
    this.userCardTemplate = document.getElementById("userCardTemplate");
    this.editModal = new bootstrap.Modal(
      document.getElementById("editUserModal")
    );
    this.currentEditingUser = null;
    this.init();
  }

  async init() {
    await this.loadUsers();
    this.updateStats(); // Добавляем обновление статистики
    this.renderUsers();
    this.setupEventListeners();
  }

  async loadUsers() {
    try {
      const response = await fetch("/api/users");
      this.users = await response.json();
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }

  renderUsers() {
    const container = document.getElementById("usersContainer");
    container.innerHTML = ""; // Очищаем контейнер

    this.users.forEach((user) => {
      const userCard = this.createUserCard(user);
      container.appendChild(userCard);
    });

    this.updateStats(); // Обновляем статистику после рендеринга
  }

  updateStats() {
    const totalUsers = this.users.length;
    const activeUsers = this.users.filter(
      (user) => user.status === "active"
    ).length;
    const adminUsers = this.users.filter(
      (user) => user.role === "admin"
    ).length;

    document.getElementById("totalUsers").textContent = totalUsers;
    document.getElementById("activeUsers").textContent = activeUsers;
    document.getElementById("adminUsers").textContent = adminUsers;
  }

  createUserCard(user) {
    // Клонируем шаблон
    const template = this.userCardTemplate.content.cloneNode(true);
    const userCard = template.querySelector(".col-md-6");

    // Заполняем данные
    userCard.querySelector(
      ".user-name"
    ).textContent = `${user.firstName} ${user.lastName}`;
    userCard.querySelector(".user-email").textContent = user.email;
    userCard.querySelector(".user-birthDate").textContent = this.formatDate(
      user.birthDate
    );
    userCard.querySelector(".user-role").textContent =
      user.role === "admin" ? "Администратор" : "Пользователь";
    userCard.querySelector(".user-status").textContent = this.getStatusText(
      user.status
    );

    // Настраиваем статус
    const statusBadge = userCard.querySelector(".status-badge");
    statusBadge.textContent = this.getStatusText(user.status);
    statusBadge.classList.add(user.status);

    // Настраиваем кнопки
    const editBtn = userCard.querySelector(".user-edit-btn");
    const friendsBtn = userCard.querySelector(".user-friends-btn");
    const messagesBtn = userCard.querySelector(".user-messages-btn");

    editBtn.addEventListener("click", () => this.openEditModal(user));
    friendsBtn.addEventListener("click", () => this.viewFriends(user.id));
    messagesBtn.addEventListener("click", () => this.viewMessages(user.id));

    return userCard;
  }

  formatDate(dateString) {
    if (!dateString) return "Не указана";
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  openEditModal(user) {
    this.currentEditingUser = user;

    // Заполняем форму данными пользователя
    document.getElementById("editUserId").value = user.id;
    document.getElementById("editUserFirstName").value = user.firstName;
    document.getElementById("editUserLastName").value = user.lastName;
    document.getElementById("editUserEmail").value = user.email;
    document.getElementById("editUserbirthDate").value = user.birthDate;
    document.getElementById("editUserRole").value = user.role;
    document.getElementById("editUserStatus").value = user.status;

    // Показываем модальное окно
    this.editModal.show();
  }

  getStatusText(status) {
    const statusMap = {
      active: "Активный",
      blocked: "Заблокирован",
      unconfirmed: "Не подтверждён",
    };
    return statusMap[status] || status;
  }

  async saveUserChanges() {
    if (!this.currentEditingUser) return;

    const userId = this.currentEditingUser.id;
    const firstName = document.getElementById("editUserFirstName").value;
    const lastName = document.getElementById("editUserLastName").value;
    const email = document.getElementById("editUserEmail").value;
    const birthDate = document.getElementById("editUserbirthDate").value;
    const role = document.getElementById("editUserRole").value;
    const status = document.getElementById("editUserStatus").value;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          email: email,
          role: role,
          status: status,
          birthDate: birthDate,
        }),
      });

      if (response.ok) {
        this.editModal.hide();

        // Обновляем данные пользователя
        this.currentEditingUser.firstName = firstName;
        this.currentEditingUser.lastName = lastName;
        this.currentEditingUser.email = email;
        this.currentEditingUser.role = role;
        this.currentEditingUser.status = status;
        this.currentEditingUser.birthDate = birthDate;

        this.renderUsers();
        this.currentEditingUser = null;
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  }

  viewFriends(userId) {
    window.location.href = `/friends.html?userId=${userId}`;
  }

  viewMessages(userId) {
    window.location.href = `/messages.html?userId=${userId}`;
  }

  setupEventListeners() {
    document.getElementById("refreshBtn").addEventListener("click", () => {
      this.loadUsers().then(() => this.renderUsers());
    });

    document.getElementById("saveUserChanges").addEventListener("click", () => {
      this.saveUserChanges();
    });

    // Очищаем текущего пользователя при закрытии модального окна
    document
      .getElementById("editUserModal")
      .addEventListener("hidden.bs.modal", () => {
        this.currentEditingUser = null;
      });
  }
}

const userManager = new UserManager();
