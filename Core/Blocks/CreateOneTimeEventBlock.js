// Core/Blocks/CreateOneTimeEventBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const { addEvent } = require('../../scheduleManager');
const { getCurrentGroup } = require('../../groupManager');

class CreateOneTimeEventBlock extends HandlerBlock {
    constructor() {
        super();
    }

    get blockId() {
        return 'CreateOneTimeEventBlock';
    }

    async enterAsync(context, bot) {
        const message = "Введите параметры одноразового события (YYYY-MM-DD HH:MM Место Предмет Преподаватель) или /exit для отмены:";
        await context.send(bot, message);
    }

    async handleAsync(message, context, bot) {
        const text = message.text.trim();
        if (text === '/exit') {
            return HandlerBlockResult.end("MainMenuBlock");
        }

        const parts = text.split(' ');
        if (parts.length !== 5) {
            await bot.sendMessage(context.chatId, "Неверный формат. Используйте: YYYY-MM-DD HH:MM Место Предмет Преподаватель(или /exit для отмены):");
            return HandlerBlockResult.cont();
        }

        const [ date, time, place, subject, teacher ] = parts;
        const currentGroup = getCurrentGroup(context.chatId);
        if (!currentGroup) {
            await bot.sendMessage(context.chatId, "Нет выбранной группы.");
            return HandlerBlockResult.end("MainMenuBlock");
        }

        const event = {
            date,
            time,
            place,
            subject,
            teacher,
            type: 'once', // Одноразовое событие
            groupKey: currentGroup
        };

        addEvent(event);
        await bot.sendMessage(context.chatId, "Одноразовое событие добавлено.");
        return HandlerBlockResult.end("MainMenuBlock");
    }

    onEnd() {}

    clone() {
        return new CreateOneTimeEventBlock();
    }
}

module.exports = { CreateOneTimeEventBlock };
