// Core/Blocks/EditEventBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const scheduleManager = require('../../scheduleManager');
const { getCurrentGroup } = require('../../groupManager');

class EditEventBlock extends HandlerBlock {
    constructor() {
        super();
        // Фаза "select" – выбор евента, "edit" – редактирование выбранного евента
        this.internalState.editPhase = 'select';
        this.internalState.page = 1;
        this.internalState.eventData = {}; // выбранный евент
    }

    get blockId() {
        return 'EditEventBlock';
    }

    async enterAsync(context, bot) {
        // Если фаза "select" – показываем список евентов для выбора
        if (this.internalState.editPhase === 'select') {
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

            let message = "Выберите евент для редактирования:\n\n";
            if (pageEvents.length === 0) {
                message += "Нет евентов для редактирования.";
            } else {
                pageEvents.forEach((event, index) => {
                    message += `${startIndex + index + 1}. ${event.name}\n`;
                });
            }

            const inlineKeyboard = [];
            const navButtons = [];
            if (page > 1) {
                navButtons.push({ text: "Предыдущая", callback_data: `edit_event_page:${page - 1}` });
            }
            if (startIndex + itemsPerPage < events.length) {
                navButtons.push({ text: "Следующая", callback_data: `edit_event_page:${page + 1}` });
            }
            if (navButtons.length > 0) {
                inlineKeyboard.push(navButtons);
            }
            pageEvents.forEach(event => {
                inlineKeyboard.push([{ text: `Редактировать "${event.name}"`, callback_data: `select_edit:${event.id}` }]);
            });
            inlineKeyboard.push([{ text: "В главное меню", callback_data: "main_menu" }]);

            const options = { reply_markup: { inline_keyboard: inlineKeyboard } };
            await context.send(bot, message, options);
        }
        // Если фаза "edit" – запрашиваем новое название (в данном примере)
        if (this.internalState.editPhase === 'edit') {
            await context.send(bot, `Введите новое название для евента "${this.internalState.eventData.name}" (отправьте текст):`);
        }
    }

    async handleAsync(message, context, bot) {
        if (this.internalState.editPhase === 'edit') {
            const newName = message.text.trim();
            if (!newName) {
                await context.send(bot, "Название не может быть пустым. Попробуйте снова.");
                return HandlerBlockResult.cont();
            }
            // Обновляем евент
            const event = this.internalState.eventData;
            event.name = newName;
            const success = scheduleManager.editEvent(event);
            if (success) {
                await context.send(bot, "Евент обновлён.");
            } else {
                await context.send(bot, "Ошибка обновления евента.");
            }
            // Сбрасываем состояние и возвращаемся к выбору
            this.internalState.editPhase = 'select';
            await this.enterAsync(context, bot);
            return HandlerBlockResult.cont();
        }
        await this.enterAsync(context, bot);
        return HandlerBlockResult.cont();
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        const data = callbackQuery.data;
        if (data.startsWith("edit_event_page:")) {
            this.internalState.page = parseInt(data.split(":")[1]);
            await this.enterAsync(context, bot);
            return HandlerBlockResult.cont();
        }
        if (data.startsWith("select_edit:")) {
            const eventId = data.split(":")[1];
            const currentGroupKey = getCurrentGroup(context.chatId);
            const events = scheduleManager.getEventsByGroup(currentGroupKey);
            const event = events.find(e => e.id === eventId);
            if (!event) {
                await context.send(bot, "Евент не найден.");
                return HandlerBlockResult.cont();
            }
            this.internalState.editPhase = 'edit';
            this.internalState.eventData = event;
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
        const clone = new EditEventBlock();
        clone.internalState = JSON.parse(JSON.stringify(this.internalState));
        return clone;
    }
}

module.exports = { EditEventBlock };
