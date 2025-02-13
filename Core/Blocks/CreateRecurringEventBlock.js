// Core/Blocks/CreateRecurringEventBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const { addEvent } = require('../../scheduleManager');
const { getCurrentGroup } = require('../../groupManager');

class CreateRecurringEventBlock extends HandlerBlock {
    constructor() {
        super();
    }

    get blockId() {
        return 'CreateRecurringEventBlock';
    }

    async enterAsync(context, bot) {
        const message = "Введите параметры повторяющегося события (YYYY-MM-DD HH:MM Место Предмет Преподаватель Интервал(мин)) или /exit для отмены:";
        await context.send(bot, message);
    }

    async handleAsync(message, context, bot) {
        const text = message.text.trim();
        if (text === '/exit') {
            return HandlerBlockResult.end("MainMenuBlock");
        }

        const parts = text.split(' ');
        if (parts.length !== 6) {
            await bot.sendMessage(context.chatId, "Неверный формат. Используйте: YYYY-MM-DD HH:MM Место Предмет Преподаватель Интервал(мин) или /exit для отмены.");
            return HandlerBlockResult.cont();
        }

        const [ date, time, place, subject, teacher, interval ] = parts;
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
            type: 'recurring', // Повторяющееся событие
            interval: Number(interval),
            groupKey: currentGroup
        };

        addEvent(event);
        await bot.sendMessage(context.chatId, "Повторяющееся событие добавлено.");
        return HandlerBlockResult.end("MainMenuBlock");
    }

    onEnd() {}

    clone() {
        return new CreateRecurringEventBlock();
    }
}

module.exports = { CreateRecurringEventBlock };
