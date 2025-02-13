// Core/Blocks/HandlerBlock.js
class HandlerBlock {
    constructor() {
        if (new.target === HandlerBlock)
            throw new Error("Абстрактный класс HandlerBlock нельзя инстанцировать напрямую.");
        this.internalState = {};
        this.Logger = null;
    }

    // Геттер для идентификатора блока – должен быть реализован в наследниках.
    get blockId() {
        throw new Error("Свойство blockId должно быть реализовано.");
    }

    /**
     * Применяет сохранённое состояние.
     * @param {object} state
     */
    applyState(state) {
        this.internalState = state || {};
    }

    /**
     * Захватывает состояние для сохранения.
     * @returns {object}
     */
    captureState() {
        return { ...this.internalState };
    }

    /**
     * Вызывается при входе в блок.
     * @param {BlockExecutionContext} context
     * @param {TelegramBot} bot
     */
    async enterAsync(context, bot) {
        throw new Error("Метод enterAsync должен быть реализован.");
    }

    /**
     * Обработка входящего сообщения.
     * @param {object} message
     * @param {BlockExecutionContext} context
     * @param {TelegramBot} bot
     */
    async handleAsync(message, context, bot) {
        throw new Error("Метод handleAsync должен быть реализован.");
    }

    /**
     * Обработка CallbackQuery.
     * @param {object} callbackQuery
     * @param {BlockExecutionContext} context
     * @param {TelegramBot} bot
     */
    async handleCallbackAsync(callbackQuery, context, bot) {
        throw new Error("Метод handleCallbackAsync должен быть реализован.");
    }

    /**
     * Вызывается при завершении работы блока.
     */
    onEnd() {
        throw new Error("Метод onEnd должен быть реализован.");
    }

    /**
     * Клонирует блок.
     */
    clone() {
        throw new Error("Метод clone должен быть реализован.");
    }
}

module.exports = { HandlerBlock };
