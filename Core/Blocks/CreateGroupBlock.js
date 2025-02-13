// Core/Blocks/CreateGroupBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const { createGroup } = require('../../groupManager');

class CreateGroupBlock extends HandlerBlock {
    constructor() {
        super();
    }

    get blockId() {
        return 'CreateGroupBlock';
    }

    async enterAsync(context, bot) {
        await context.send(bot, "Введите название группы для создания (или /exit для отмены):");
        //await bot.sendMessage(context.chatId, "Введите название группы для создания (или /exit для отмены):");
    }

    async handleAsync(message, context, bot) {
        const text = message.text.trim();
        if (text === '/exit') {
            return HandlerBlockResult.end("MainMenuBlock");
        }
        const group = createGroup({ name: text, creatorId: context.chatId });
        await bot.sendMessage(context.chatId, `Группа создана. Ваш ключ для подключения: ${group.key}`);
        return HandlerBlockResult.end("MainMenuBlock");
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        return HandlerBlockResult.cont();
    }

    onEnd() { }

    clone() {
        return new CreateGroupBlock();
    }
}

module.exports = { CreateGroupBlock };
