// Основной класс приложения
class App {
    constructor() {
        this.api = api;
        this.user = null;
        this.cache = {
            userData: null,
            history: [],
            lastUpdate: null
        };
        
        this.init();
    }

    async init() {
        // Загружаем из кеша
        this.loadFromCache();
        
        // Показываем экран загрузки
        this.showLoading();
        
        // Проверяем, есть ли сохраненный токен
        const savedToken = localStorage.getItem('userToken');
        
        if (savedToken) {
            // Пытаемся войти
            const result = await this.api.login(savedToken);
            if (result.success) {
                this.user = result.user;
                this.showMainScreen();
                this.updateUserData();
            } else {
                this.showAuthScreen();
            }
        } else {
            this.showAuthScreen();
        }
        
        // Инициализируем обработчики событий
        this.initEventListeners();
    }

    loadFromCache() {
        try {
            const cached = localStorage.getItem('appCache');
            if (cached) {
                this.cache = JSON.parse(cached);
            }
        } catch (e) {
            console.error('Cache load error:', e);
        }
    }

    saveToCache() {
        try {
            localStorage.setItem('appCache', JSON.stringify(this.cache));
        } catch (e) {
            console.error('Cache save error:', e);
        }
    }

    showLoading() {
        document.getElementById('loadingScreen').style.display = 'flex';
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainScreen').style.display = 'none';
    }

    showAuthScreen() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('mainScreen').style.display = 'none';
    }

    showMainScreen() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainScreen').style.display = 'flex';
        
        // Показываем кнопку админа если нужно
        if (this.user && this.user.is_admin) {
            document.getElementById('adminBtn').style.display = 'inline-block';
        }
        
        // Обновляем баланс
        document.getElementById('userBalance').textContent = this.user.balance.toFixed(2);
    }

    initEventListeners() {
        // Переключение табов авторизации
        document.getElementById('loginTab').addEventListener('click', () => {
            document.getElementById('loginTab').classList.add('active');
            document.getElementById('registerTab').classList.remove('active');
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('registerForm').style.display = 'none';
        });

        document.getElementById('registerTab').addEventListener('click', () => {
            document.getElementById('registerTab').classList.add('active');
            document.getElementById('loginTab').classList.remove('active');
            document.getElementById('registerForm').style.display = 'block';
            document.getElementById('loginForm').style.display = 'none';
        });

        // Вход
        document.getElementById('loginBtn').addEventListener('click', async () => {
            const token = document.getElementById('loginToken').value;
            if (!token) {
                this.showError('Введите токен');
                return;
            }
            
            const result = await this.api.login(token);
            if (result.success && result.user) {
                this.user = result.user;
                localStorage.setItem('userToken', token);
                this.showMainScreen();
                this.updateUserData();
            } else {
                this.showError('Неверный токен');
            }
        });

        // Проверка токена при регистрации
        document.getElementById('checkTokenBtn').addEventListener('click', async () => {
            const token = document.getElementById('registerToken').value;
            if (!token) {
                this.showError('Введите токен');
                return;
            }
            
            const result = await this.api.checkToken(token);
            if (result.success && result.exists) {
                if (result.registered) {
                    this.showError('Этот токен уже зарегистрирован');
                } else {
                    // Показываем форму реквизитов
                    document.getElementById('requisitesForm').style.display = 'block';
                    document.getElementById('registerToken').disabled = true;
                }
            } else {
                this.showError('Токен не найден');
            }
        });

        // Завершение регистрации
        document.getElementById('completeRegistrationBtn').addEventListener('click', async () => {
            const token = document.getElementById('registerToken').value;
            const phone = document.getElementById('regPhone').value;
            const card = document.getElementById('regCard').value;
            const steam = document.getElementById('regSteam').value;
            
            if (!phone && !card && !steam) {
                this.showError('Введите хотя бы один реквизит');
                return;
            }
            
            const result = await this.api.saveRequisites(token, phone, card, steam);
            if (result.success) {
                // Входим
                const loginResult = await this.api.login(token);
                if (loginResult.success) {
                    this.user = loginResult.user;
                    localStorage.setItem('userToken', token);
                    this.showMainScreen();
                    this.updateUserData();
                }
            }
        });

        // Кнопки навигации
        document.getElementById('profileBtn').addEventListener('click', () => this.showProfile());
        document.getElementById('withdrawBtn').addEventListener('click', () => this.showWithdraw());
        document.getElementById('historyBtn').addEventListener('click', () => this.showHistory());
        document.getElementById('adminBtn').addEventListener('click', () => this.showAdmin());
        document.getElementById('adsBtn').addEventListener('click', () => {
            window.open(CONFIG.ADS_LINK, '_blank');
        });

        // Центральные кнопки
        document.getElementById('wordleBtn').addEventListener('click', () => this.showWordle());
        document.getElementById('receiptBtn').addEventListener('click', () => this.showReceipt());
        document.getElementById('linksBtn').addEventListener('click', () => this.showLinks());

        // Закрытие модальных окон
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').style.display = 'none';
            });
        });

        // Загрузка чека
        const dropArea = document.getElementById('dropArea');
        const fileInput = document.getElementById('receiptFile');
        
        dropArea.addEventListener('click', () => fileInput.click());
        
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.style.background = '#f0f0f0';
        });
        
        dropArea.addEventListener('dragleave', () => {
            dropArea.style.background = '#f9f9f9';
        });
        
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.style.background = '#f9f9f9';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleReceiptFile(files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleReceiptFile(e.target.files[0]);
            }
        });

        // Кнопка загрузки чека
        document.getElementById('uploadReceiptBtn').addEventListener('click', () => {
            this.uploadReceipt();
        });

        // Копирование ссылки
        document.getElementById('copyLink').addEventListener('click', () => {
            const linkInput = document.getElementById('userLink');
            linkInput.select();
            document.execCommand('copy');
            alert('Ссылка скопирована!');
        });

        // Показ токена в профиле
        document.getElementById('showToken').addEventListener('click', () => {
            const tokenSpan = document.getElementById('profileToken');
            tokenSpan.classList.remove('hidden-text');
            tokenSpan.textContent = this.user.token;
        });

        // Вывод средств
        document.getElementById('withdrawSubmit').addEventListener('click', () => {
            this.submitWithdraw();
        });
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        setTimeout(() => {
            document.getElementById('errorMessage').textContent = '';
        }, 3000);
    }

    async updateUserData() {
        if (!this.user) return;
        
        // Фоновое обновление
        const result = await this.api.getUserData(this.user.token);
        if (result.success && result.user) {
            this.user = result.user;
            document.getElementById('userBalance').textContent = this.user.balance.toFixed(2);
            
            // Обновляем кеш
            this.cache.userData = this.user;
            this.cache.lastUpdate = Date.now();
            this.saveToCache();
        }
    }

    async showProfile() {
        const modal = document.getElementById('profileModal');
        
        // Показываем кешированные данные
        if (this.cache.userData) {
            document.getElementById('profileName').textContent = this.cache.userData.name || '—';
            document.getElementById('profilePhone').textContent = this.cache.userData.phone || '—';
            document.getElementById('profileCard').textContent = this.cache.userData.card || '—';
            document.getElementById('profileSteam').textContent = this.cache.userData.steam || '—';
            document.getElementById('profileStreak').textContent = this.cache.userData.streak || 0;
        }
        
        modal.style.display = 'flex';
        
        // Фоновое обновление
        await this.updateUserData();
    }

    async showWithdraw() {
        const modal = document.getElementById('withdrawModal');
        
        // Заполняем реквизиты из кеша
        const select = document.getElementById('withdrawType');
        select.innerHTML = '<option value="">Выберите реквизит</option>';
        
        if (this.cache.userData.phone) {
            select.innerHTML += `<option value="phone">📱 ${this.cache.userData.phone}</option>`;
        }
        if (this.cache.userData.card) {
            select.innerHTML += `<option value="card">💳 ${this.cache.userData.card.slice(0,4)}...${this.cache.userData.card.slice(-4)}</option>`;
        }
        if (this.cache.userData.steam) {
            select.innerHTML += `<option value="steam">🎮 ${this.cache.userData.steam}</option>`;
        }
        
        modal.style.display = 'flex';
    }

    async submitWithdraw() {
        const amount = parseFloat(document.getElementById('withdrawAmount').value);
        const type = document.getElementById('withdrawType').value;
        const secret = document.getElementById('withdrawSecret').value;
        
        if (!amount || amount < 20) {
            alert('Минимальная сумма 20 рублей');
            return;
        }
        
        if (!type) {
            alert('Выберите реквизит');
            return;
        }
        
        if (!secret) {
            alert('Введите секретный код');
            return;
        }
        
        const result = await this.api.withdraw(this.user.token, amount, type, secret);
        if (result.success) {
            alert('Заявка на вывод создана!');
            document.getElementById('withdrawModal').style.display = 'none';
            await this.updateUserData();
        } else {
            alert(result.error || 'Ошибка при создании заявки');
        }
    }

    async showHistory() {
        const modal = document.getElementById('historyModal');
        const list = document.getElementById('historyList');
        
        // Показываем кешированную историю
        if (this.cache.history.length > 0) {
            this.renderHistory(this.cache.history);
        }
        
        modal.style.display = 'flex';
        
        // Обновляем в фоне
        const result = await this.api.getHistory(this.user.token);
        if (result.success && result.history) {
            this.cache.history = result.history;
            this.saveToCache();
            this.renderHistory(result.history);
        }
    }

    renderHistory(history) {
        const list = document.getElementById('historyList');
        list.innerHTML = '';
        
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = `history-item ${item.status}`;
            
            let amountClass = 'history-amount';
            if (item.amount > 0) amountClass += ' positive';
            if (item.amount < 0) amountClass += ' negative';
            
            div.innerHTML = `
                <div>
                    <div>${item.details || item.action}</div>
                    <small>${item.date}</small>
                </div>
                <div class="${amountClass}">${item.amount > 0 ? '+' : ''}${item.amount} ₽</div>
            `;
            
            list.appendChild(div);
        });
    }

    async showWordle() {
        const modal = document.getElementById('wordleModal');
        modal.style.display = 'flex';
        
        // Проверяем, можно ли играть
        const result = await this.api.checkWordle(this.user.token);
        if (result.success) {
            if (result.canPlay) {
                this.startWordleGame(result.word, result.streak);
            } else {
                document.getElementById('wordleGame').innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <p>Вы уже играли сегодня</p>
                        <p>Статус: ${result.status === 'won' ? 'Победа' : 'Поражение'}</p>
                        <p>Стрик: ${result.streak} дней</p>
                    </div>
                `;
            }
        }
    }

    startWordleGame(word, streak) {
        const gameDiv = document.getElementById('wordleGame');
        gameDiv.innerHTML = '';
        
        // Создаем сетку 6x5
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.className = 'wordle-row';
            for (let j = 0; j < 5; j++) {
                const cell = document.createElement('div');
                cell.className = 'wordle-cell';
                row.appendChild(cell);
            }
            gameDiv.appendChild(row);
        }
        
        // Создаем клавиатуру
        const keyboard = document.getElementById('wordleKeyboard');
        keyboard.innerHTML = '';
        
        const keys = [
            ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З'],
            ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж'],
            ['Enter', 'Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю', 'Backspace']
        ];
        
        keys.forEach(row => {
            row.forEach(key => {
                const btn = document.createElement('button');
                btn.className = 'wordle-key';
                btn.textContent = key;
                keyboard.appendChild(btn);
            });
        });
        
        // Загружаем сохраненную игру из кеша
        const savedGame = localStorage.getItem(`wordle_${this.user.token}`);
        if (savedGame) {
            const game = JSON.parse(savedGame);
            if (game.date === new Date().toDateString()) {
                // Восстанавливаем игру
                this.restoreWordleGame(game);
            }
        }
    }

    async showReceipt() {
        const modal = document.getElementById('receiptModal');
        modal.style.display = 'flex';
        
        // Устанавливаем сегодняшнюю дату
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('receiptDate').value = today;
    }

    handleReceiptFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите изображение');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('receiptPreview').style.display = 'block';
            document.getElementById('uploadReceiptBtn').disabled = false;
        };
        reader.readAsDataURL(file);
    }

    async uploadReceipt() {
        const store = document.getElementById('receiptStore').value;
        const date = document.getElementById('receiptDate').value;
        const preview = document.getElementById('previewImage').src;
        
        if (!store) {
            alert('Выберите магазин');
            return;
        }
        
        if (!date) {
            alert('Выберите дату чека');
            return;
        }
        
        // Здесь нужно отправить фото в Telegram
        // Временно используем заглушку
        const photoUrl = 'https://t.me/temp_photo';
        
        const result = await this.api.uploadReceipt(this.user.token, store, photoUrl, date);
        if (result.success) {
            alert('Чек отправлен на проверку!');
            document.getElementById('receiptModal').style.display = 'none';
        }
    }

    async showLinks() {
        const modal = document.getElementById('linksModal');
        
        // Генерируем ссылку
        const link = `https://work-btheb.ru/r/${this.user.token}`;
        document.getElementById('userLink').value = link;
        
        // Показываем статистику из кеша
        document.getElementById('linkClicks').textContent = this.cache.userData?.clicks || 0;
        document.getElementById('linkEarned').textContent = (this.cache.userData?.referral_earned || 0).toFixed(2);
        
        modal.style.display = 'flex';
        
        // Обновляем в фоне
        await this.updateUserData();
    }

    async showAdmin() {
        if (!this.user?.is_admin) return;
        
        const modal = document.getElementById('adminModal');
        modal.style.display = 'flex';
        
        // Загружаем ожидающие выводы
        const result = await this.api.adminGetPending(this.user.token);
        if (result.success && result.withdraws) {
            this.renderAdminWithdraws(result.withdraws);
        }
    }

    renderAdminWithdraws(withdraws) {
        const container = document.getElementById('adminWithdraws');
        container.innerHTML = '';
        
        if (withdraws.length === 0) {
            container.innerHTML = '<p>Нет ожидающих выводов</p>';
            return;
        }
        
        withdraws.forEach(w => {
            const div = document.createElement('div');
            div.className = 'admin-item';
            div.innerHTML = `
                <div>
                    <p><strong>ID:</strong> ${w.id}</p>
                    <p><strong>Токен:</strong> ${w.token}</p>
                    <p><strong>Сумма:</strong> ${w.amount} ₽</p>
                    <p><strong>Реквизит:</strong> ${w.requisiteType} - ${w.requisite}</p>
                    <p><strong>Дата:</strong> ${w.requestDate}</p>
                </div>
                <div>
                    <button class="small-btn approve-btn" data-id="${w.id}">✅ Одобрить</button>
                    <button class="small-btn reject-btn" data-id="${w.id}">❌ Отклонить</button>
                </div>
            `;
            container.appendChild(div);
        });
        
        // Добавляем обработчики
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => this.approveWithdraw(btn.dataset.id));
        });
        
        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', () => this.rejectWithdraw(btn.dataset.id));
        });
    }

    async approveWithdraw(id) {
        const result = await this.api.adminApproveWithdraw(this.user.token, id);
        if (result.success) {
            alert('Вывод одобрен');
            this.showAdmin(); // Обновляем
        }
    }

    async rejectWithdraw(id) {
        const reason = prompt('Причина отклонения:');
        if (!reason) return;
        
        const result = await this.api.adminRejectWithdraw(this.user.token, id, reason);
        if (result.success) {
            alert('Вывод отклонен');
            this.showAdmin(); // Обновляем
        }
    }
}

// Запускаем приложение
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
