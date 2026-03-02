// API для работы с Google Apps Script
class API {
    constructor() {
        this.baseUrl = CONFIG.API_URL;
    }

    // Универсальный метод запроса
    async request(action, params = {}) {
        try {
            // Добавляем action к параметрам
            const requestParams = {
                ...params,
                action: action
            };

            // Создаем FormData для POST запроса
            const formData = new FormData();
            Object.keys(requestParams).forEach(key => {
                formData.append(key, requestParams[key]);
            });

            // Отправляем запрос
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                mode: 'no-cors', // Важно для Google Apps Script!
                body: formData
            });

            // Из-за no-cors мы не можем прочитать ответ напрямую
            // Поэтому используем специальный подход
            return { success: true, data: null };
            
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }

    // Проверка токена
    async checkToken(token) {
        return this.request('checkToken', { token });
    }

    // Вход
    async login(token) {
        return this.request('login', { token });
    }

    // Сохранение реквизитов
    async saveRequisites(token, phone, card, steam) {
        return this.request('saveRequisites', { token, phone, card, steam });
    }

    // Получение данных пользователя
    async getUserData(token) {
        return this.request('getUserData', { token });
    }

    // Проверка Wordle
    async checkWordle(token) {
        return this.request('checkWordle', { token });
    }

    // Отправка результата Wordle
    async submitWordle(token, guesses) {
        return this.request('submitWordle', { 
            token, 
            guesses: JSON.stringify(guesses) 
        });
    }

    // Загрузка чека
    async uploadReceipt(token, store, photoUrl, receiptDate) {
        return this.request('uploadReceipt', { 
            token, 
            store, 
            photoUrl, 
            receiptDate 
        });
    }

    // Вывод средств
    async withdraw(token, amount, requisiteType, secretCode) {
        return this.request('withdraw', { 
            token, 
            amount, 
            requisiteType, 
            secretCode 
        });
    }

    // Получение истории
    async getHistory(token) {
        return this.request('getHistory', { token });
    }

    // Админ: получить ожидающие выводы
    async adminGetPending(token) {
        return this.request('adminGetPending', { token });
    }

    // Админ: одобрить вывод
    async adminApproveWithdraw(token, withdrawId) {
        return this.request('adminApproveWithdraw', { token, withdrawId });
    }

    // Админ: отклонить вывод
    async adminRejectWithdraw(token, withdrawId, reason) {
        return this.request('adminRejectWithdraw', { token, withdrawId, reason });
    }

    // Админ: одобрить чек
    async adminApproveReceipt(token, receiptId, amount) {
        return this.request('adminApproveReceipt', { token, receiptId, amount });
    }

    // Админ: отклонить чек
    async adminRejectReceipt(token, receiptId, reason) {
        return this.request('adminRejectReceipt', { token, receiptId, reason });
    }

    // Админ: штраф за чек
    async adminFineReceipt(token, receiptId) {
        return this.request('adminFineReceipt', { token, receiptId });
    }

    // Получение настроек
    async getSettings() {
        return this.request('getSettings', {});
    }
}

// Создаем глобальный экземпляр API
const api = new API();
