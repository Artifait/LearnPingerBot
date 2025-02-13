// Core/Blocks/JoinGroupBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const { joinGroup } = require('../../groupManager');

class JoinGroupBlock extends HandlerBlock {
    constructor() {
        super();
    }

    get blockId() {
        return 'JoinGroupBlock';
    }

    async enterAsync(context, bot) {
        await context.send(bot, "Введите ключ группы для подключения (или /exit для отмены):");
        // await bot.sendMessage(context.chatId, "Введите ключ группы для подключения (или /exit для отмены):");
    }

    async handleAsync(message, context, bot) {
        const text = message.text.trim();
        if (text === '/exit') {
            return HandlerBlockResult.end("MainMenuBlock");
        }
        const group = joinGroup(context.chatId, text);
        if (!group) {
            await bot.sendMessage(context.chatId, "Группа с таким ключом не найдена.");
        } else {
            await bot.sendMessage(context.chatId, `Вы успешно присоединились к группе: ${group.name}`);
        }
        return HandlerBlockResult.end("MainMenuBlock");
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        return HandlerBlockResult.cont();
    }

    onEnd() { }

    clone() {
        return new JoinGroupBlock();
    }
}

module.exports = { JoinGroupBlock };
