// Core/Blocks/DeleteEventBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const scheduleManager = require('../../scheduleManager');
const { getCurrentGroup } = require('../../groupManager');

class DeleteEventBlock extends HandlerBlock {
    constructor() {
        super();
        this.internalState.page = 1;
    }

    get blockId() {
        return 'DeleteEventBlock';
    }

    async enterAsync(context, bot) {
        const currentGroupKey = getCurrentGroup(context.chatId);
        if (!currentGroupKey) {
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "В главное меню", callback_data: "main_menu" }],
                        [
                            { text: "Ваши группы", callback_data: "switch_group" },
                            { text: "Создать группу", callback_data: "create_group" }
                        ],
                        [{ text: "Вступить в группу по ключу", callback_data: "join_group" }]
                    ]
                }
            };
            await context.send(bot, "Нет выбранной группы. Пожалуйста, выберите/вступите или создайте группу для управления евентами.", options);
            return;
        }

        const events = scheduleManager.getEventsByGroup(currentGroupKey);
        const itemsPerPage = 3;
        const page = this.internalState.page || 1;
        const startIndex = (page - 1) * itemsPerPage;
        const pageEvents = events.slice(startIndex, startIndex + itemsPerPage);

        let message = "Выберите евент для удаления:\n\n";
        if (pageEvents.length === 0) {
            message += "Нет евентов для удаления.";
        } else {
            pageEvents.forEach((event, index) => {
                message += `${startIndex + index + 1}. ${event.name}\n`;
            });
        }

        // Формирование клавиатуры для навигации и подтверждения удаления
        const inlineKeyboard = [];
        const navButtons = [];
        if (page > 1) {
            navButtons.push({ text: "Предыдущая", callback_data: `delete_event_page:${page - 1}` });
        }
        if (startIndex + itemsPerPage < events.length) {
            navButtons.push({ text: "Следующая", callback_data: `delete_event_page:${page + 1}` });
        }
        if (navButtons.length > 0) {
            inlineKeyboard.push(navButtons);
        }
        pageEvents.forEach(event => {
            inlineKeyboard.push([{ text: `Удалить "${event.name}"`, callback_data: `delete_confirm:${event.id}` }]);
        });
        inlineKeyboard.push([{ text: "В главное меню", callback_data: "main_menu" }]);

        const options = { reply_markup: { inline_keyboard: inlineKeyboard } };
        await context.send(bot, message, options);
    }

    async handleAsync(message, context, bot) {
        await this.enterAsync(context, bot);
        return HandlerBlockResult.cont();
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        const data = callbackQuery.data;
        if (data.startsWith("delete_event_page:")) {
            this.internalState.page = parseInt(data.split(":")[1]);
            await this.enterAsync(context, bot);
            return HandlerBlockResult.cont();
        }
        if (data.startsWith("delete_confirm:")) {
            const eventId = data.split(":")[1];
            const success = scheduleManager.deleteEvent(eventId);
            if (success) {
                await context.send(bot, "Евент удалён.");
            } else {
                await context.send(bot, "Ошибка удаления евента.");
            }
            // Обновляем список
            await this.enterAsync(context, bot);
            return HandlerBlockResult.cont();
        }
        if (data === "main_menu") {
            return HandlerBlockResult.end("MainMenuBlock", {});
        }
        await this.enterAsync(context, bot);
        return HandlerBlockResult.cont();
    }

    onEnd() { }

    clone() {
        const clone = new DeleteEventBlock();
        clone.internalState = { ...this.internalState };
        return clone;
    }
}

module.exports = { DeleteEventBlock };
