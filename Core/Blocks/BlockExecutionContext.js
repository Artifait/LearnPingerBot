// Core/Blocks/BlockExecutionContext.js
class BlockExecutionContext {
    constructor() {
        /**
         * Идентификатор чата (или другой идентификатор пользователя)
         * @type {number}
         */
        this.chatId = null;
        /**
         * Контекст (данные, переданные от предыдущего блока)
         * @type {object}
         */
        this.state = {};
        /**
         * Если обновление произошло по callback, здесь сохраняется ID сообщения
         */
        this.callbackMessageId = null;
    }

    /**
     * Универсальная отправка сообщения:
     * Если callbackMessageId задан, редактируем сообщение,
     * иначе отправляем новое.
     * @param {TelegramBot} bot
     * @param {string} text
     * @param {object} options
     */
    async send(bot, text, options) {
        if (this.callbackMessageId) {
            // Редактируем существующее сообщение
            return bot.editMessageText(text, {
                chat_id: this.chatId,
                message_id: this.callbackMessageId,
                ...options
            });
        } else {
            // Отправляем новое сообщение
            return bot.sendMessage(this.chatId, text, options);
        }
    }
}

module.exports = { BlockExecutionContext };
