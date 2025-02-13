// Core/Blocks/SettingsBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const { getNotificationOffset, setNotificationOffset } = require('../../notificationsSettingsManager');

class SettingsBlock extends HandlerBlock {
    constructor() {
        super();
    }

    get blockId() {
        return 'SettingsBlock';
    }

    async enterAsync(context, bot) {
        const chatId = context.chatId;
        const currentOffset = getNotificationOffset(chatId);
        const message = `Настройки уведомлений:\nТекущее время уведомления: ${currentOffset} минут до события.\nВведите новое значение (в минутах) или /exit для выхода.`;
        await context.send(bot, message);
        // await bot.sendMessage(chatId, message);
    }

    async handleAsync(message, context, bot) {
        const chatId = context.chatId;
        const text = message.text.trim();
        if (text === '/exit') {
            return HandlerBlockResult.end("MainMenuBlock");
        }

        const newOffset = parseInt(text);
        if (isNaN(newOffset) || newOffset < 0) {
            await bot.sendMessage(chatId, "Введите корректное число.");
            return HandlerBlockResult.end("MainMenuBlock");
        }
        setNotificationOffset(chatId, newOffset);
        await bot.sendMessage(chatId, `Время уведомления установлено: ${newOffset} минут до события.`);
        return HandlerBlockResult.end("MainMenuBlock");
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        if (callbackQuery.data === "main_menu") {
            return HandlerBlockResult.end("MainMenuBlock");
        }
        return HandlerBlockResult.cont();
    }

    onEnd() { }

    clone() {
        return new SettingsBlock();
    }
}

module.exports = { SettingsBlock };
