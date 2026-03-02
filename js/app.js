// В классе App, добавим автоматическое открытие модалок

class App {
    constructor() {
        this.api = api;
        this.user = null;
        this.activeModal = null;
        
        // При заходе открываем нужное модальное окно
        this.checkUrlAndOpenModal();
    }

    checkUrlAndOpenModal() {
        const hash = window.location.hash.substring(1);
        
        setTimeout(() => {
            switch(hash) {
                case 'profile':
                    this.showProfile();
                    break;
                case 'withdraw':
                    this.showWithdraw();
                    break;
                case 'admin':
                    if (this.user?.is_admin) this.showAdmin();
                    break;
                case 'wordle':
                    this.showWordle();
                    break;
                case 'receipt':
                    this.showReceipt();
                    break;
                case 'links':
                    this.showLinks();
                    break;
                case 'history':
                    this.showHistory();
                    break;
            }
        }, 500); // Небольшая задержка после загрузки
    }

    // Обновляем метод showMainScreen
    showMainScreen() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainScreen').style.display = 'flex';
        
        if (this.user && this.user.is_admin) {
            document.getElementById('adminBtn').style.display = 'inline-block';
        }
        
        document.getElementById('userBalance').textContent = this.user.balance.toFixed(2);
        
        // Автоматически открываем модальное окно в зависимости от URL
        this.checkUrlAndOpenModal();
    }

    // Обновляем обработчики для навигации с хешами
    initEventListeners() {
        // Вместо прямого открытия модалок, меняем URL
        document.getElementById('profileBtn').addEventListener('click', () => {
            window.location.hash = 'profile';
            this.showProfile();
        });
        
        document.getElementById('withdrawBtn').addEventListener('click', () => {
            window.location.hash = 'withdraw';
            this.showWithdraw();
        });
        
        document.getElementById('historyBtn').addEventListener('click', () => {
            window.location.hash = 'history';
            this.showHistory();
        });
        
        document.getElementById('adminBtn').addEventListener('click', () => {
            window.location.hash = 'admin';
            this.showAdmin();
        });
        
        document.getElementById('wordleBtn').addEventListener('click', () => {
            window.location.hash = 'wordle';
            this.showWordle();
        });
        
        document.getElementById('receiptBtn').addEventListener('click', () => {
            window.location.hash = 'receipt';
            this.showReceipt();
        });
        
        document.getElementById('linksBtn').addEventListener('click', () => {
            window.location.hash = 'links';
            this.showLinks();
        });

        // При закрытии модалки убираем хеш
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').style.display = 'none';
                window.location.hash = '';
                this.activeModal = null;
            });
        });
    }

    // Обновляем методы показа модалок
    async showProfile() {
        if (this.activeModal) this.activeModal.style.display = 'none';
        
        const modal = document.getElementById('profileModal');
        
        if (this.cache.userData) {
            document.getElementById('profileName').textContent = this.cache.userData.name || '—';
            document.getElementById('profilePhone').textContent = this.cache.userData.phone || '—';
            document.getElementById('profileCard').textContent = this.cache.userData.card || '—';
            document.getElementById('profileSteam').textContent = this.cache.userData.steam || '—';
            document.getElementById('profileStreak').textContent = this.cache.userData.streak || 0;
        }
        
        modal.style.display = 'flex';
        this.activeModal = modal;
        
        await this.updateUserData();
    }

    async showWithdraw() {
        if (this.activeModal) this.activeModal.style.display = 'none';
        
        const modal = document.getElementById('withdrawModal');
        
        const container = document.querySelector('.requisite-selector');
        if (container) {
            container.innerHTML = '';
            
            if (this.cache.userData.phone) {
                container.innerHTML += `<div class="requisite-option" data-type="phone">📱 Телефон</div>`;
            }
            if (this.cache.userData.card) {
                container.innerHTML += `<div class="requisite-option" data-type="card">💳 Карта</div>`;
            }
            if (this.cache.userData.steam) {
                container.innerHTML += `<div class="requisite-option" data-type="steam">🎮 Steam</div>`;
            }
            
            document.querySelectorAll('.requisite-option').forEach(opt => {
                opt.addEventListener('click', function() {
                    document.querySelectorAll('.requisite-option').forEach(o => o.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        }
        
        modal.style.display = 'flex';
        this.activeModal = modal;
    }

    async showHistory() {
        if (this.activeModal) this.activeModal.style.display = 'none';
        
        const modal = document.getElementById('historyModal');
        
        if (this.cache.history.length > 0) {
            this.renderHistory(this.cache.history);
        }
        
        modal.style.display = 'flex';
        this.activeModal = modal;
        
        const result = await this.api.getHistory(this.user.token);
        if (result.success && result.history) {
            this.cache.history = result.history;
            this.saveToCache();
            this.renderHistory(result.history);
        }
    }

    async showAdmin() {
        if (!this.user?.is_admin) return;
        if (this.activeModal) this.activeModal.style.display = 'none';
        
        const modal = document.getElementById('adminModal');
        modal.style.display = 'flex';
        this.activeModal = modal;
        
        const result = await this.api.adminGetPending(this.user.token);
        if (result.success && result.withdraws) {
            this.renderAdminWithdraws(result.withdraws);
        }
    }

    async showWordle() {
        if (this.activeModal) this.activeModal.style.display = 'none';
        
        const modal = document.getElementById('wordleModal');
        modal.style.display = 'flex';
        this.activeModal = modal;
        
        const result = await this.api.checkWordle(this.user.token);
        if (result.success) {
            if (result.canPlay) {
                this.startWordleGame(result.word, result.streak);
            } else {
                document.getElementById('wordleGame').innerHTML = `
                    <div style="text-align: center; padding: 30px;">
                        <div style="font-size: 48px; margin-bottom: 20px;">🎮</div>
                        <p style="color: #a0a0a0; margin-bottom: 10px;">Вы уже играли сегодня</p>
                        <p style="color: ${result.status === 'won' ? '#4ade80' : '#f87171'}; font-weight: 600;">
                            ${result.status === 'won' ? 'Победа' : 'Поражение'}
                        </p>
                        <p style="color: #a78bfa; margin-top: 20px;">Стрик: ${result.streak} дней</p>
                    </div>
                `;
            }
        }
    }

    async showReceipt() {
        if (this.activeModal) this.activeModal.style.display = 'none';
        
        const modal = document.getElementById('receiptModal');
        modal.style.display = 'flex';
        this.activeModal = modal;
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('receiptDate').value = today;
    }

    async showLinks() {
        if (this.activeModal) this.activeModal.style.display = 'none';
        
        const modal = document.getElementById('linksModal');
        
        const link = `https://work-btheb.ru/r/${this.user.token}`;
        document.getElementById('userLink').value = link;
        
        document.getElementById('linkClicks').textContent = this.cache.userData?.clicks || 0;
        document.getElementById('linkEarned').textContent = (this.cache.userData?.referral_earned || 0).toFixed(2);
        
        modal.style.display = 'flex';
        this.activeModal = modal;
        
        await this.updateUserData();
    }
}
