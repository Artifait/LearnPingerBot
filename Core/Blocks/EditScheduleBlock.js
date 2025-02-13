// Core/Blocks/EditScheduleBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const { addEvent, editEvent, deleteEvent } = require('../../scheduleManager');
const { getCurrentGroup } = require('../../groupManager');

class EditScheduleBlock extends HandlerBlock {
    constructor() {
        super();
        this.internalState.step = 0;
        this.internalState.eventData = {};
    }

    get blockId() {
        return 'EditScheduleBlock';
    }

    async enterAsync(context, bot) {
        const currentGroup = getCurrentGroup(context.chatId);
        if (!currentGroup) {
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "В главное меню", callback_data: "main_menu" },
                        ]
                    ]
                }
            };
            await context.send(bot, "Для редактирования расписания необходимо выбрать группу. Используйте команду 'Сменить группу' в главном меню.", options);
            return;
        }

        const message =
            "Редактирование расписания.\n" +
            "Введите команду:\n" +
            "  /add - добавить событие\n" +
            "  /edit - редактировать событие\n" +
            "  /delete - удалить событие\n" +
            "  /exit - выйти в главное меню\n\n" +
            "Формат для /add:\n" +
            "/add YYYY-MM-DD HH:MM Место Предмет Преподаватель Тип[once|recurring] [Интервал(мин)] [Expiry(мин)]\n" +
            "Пример:\n" +
            "/add 2025-03-15 10:00 Аудитория-101 Математика Иванов once\n" +
            "или\n" +
            "/add 2025-03-15 10:00 Аудитория-101 Физика Петров recurring 1440 120";

        await context.send(bot, message);
    }

    async handleAsync(message, context, bot) {
        const text = message.text.trim();
        if (text === '/exit') {
            return HandlerBlockResult.end("MainMenuBlock");
        }

        if (text.startsWith('/add')) {
            // Переход к выбору типа события (одноразовое или повторяющееся)
            return HandlerBlockResult.end("CreateEventBlock");
        }


        if (text.startsWith('/edit')) {
            const parts = text.split(' ');
            if (parts.length < 8) {
                await bot.sendMessage(context.chatId, "Неверный формат. Используйте: /edit eventId YYYY-MM-DD HH:MM Место Предмет Преподаватель Тип [Интервал] [Expiry]");
                return HandlerBlockResult.cont();
            }
            const [ , id, date, time, place, subject, teacher, type, interval, expiry ] = parts;
            const updated = { date, time, place, subject, teacher, type: type.toLowerCase() };
            if (type.toLowerCase() === 'recurring' && interval) {
                updated.interval = Number(interval);
            }
            if (expiry) {
                updated.expiryMinutes = Number(expiry);
            }

            const result = editEvent(Number(id), updated);
            if (result) {
                await bot.sendMessage(context.chatId, "Событие обновлено.");
            } else {
                await bot.sendMessage(context.chatId, "Событие не найдено.");
            }
            return HandlerBlockResult.cont();
        }

        if (text.startsWith('/delete')) {
            const parts = text.split(' ');
            if (parts.length !== 2) {
                await bot.sendMessage(context.chatId, "Неверный формат. Используйте: /delete eventId");
                return HandlerBlockResult.cont();
            }
            const id = Number(parts[1]);
            deleteEvent(id);
            await bot.sendMessage(context.chatId, "Событие удалено (если существовало).");
            return HandlerBlockResult.cont();
        }

        await bot.sendMessage(context.chatId, "Команда не распознана. Используйте /add, /edit, /delete или /exit.");
        return HandlerBlockResult.cont();
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        if (callbackQuery.data === "main_menu") {
            return HandlerBlockResult.end("MainMenuBlock");
        }
        return HandlerBlockResult.cont();
    }

    onEnd() { }

    clone() {
        return new EditScheduleBlock();
    }
}

module.exports = { EditScheduleBlock };
