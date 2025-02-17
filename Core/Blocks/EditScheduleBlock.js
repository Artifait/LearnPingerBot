// Core/Blocks/EditScheduleBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
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
            "Что вы хотите сделать?";

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Добавить event", callback_data: "create_event" },
                        { text: "Редактировать event", callback_data: "edit_event" },
                    ],
                    [
                        { text: "Удалить event", callback_data: "delete_event" },
                        { text: "В главное меню", callback_data: "main_menu" },
                    ]
                ]
            }
        };

        await context.send(bot, message, options);
    }

    async handleAsync(message, context, bot) {
        const text = message.text.trim();
        if (text === '/exit') {
            return HandlerBlockResult.end("MainMenuBlock");
        }

        if (text.startsWith('/add')) {
            return HandlerBlockResult.end("CreateEventBlock");
        }

        if (text.startsWith('/edit')) {
            return HandlerBlockResult.end("EditEventBlock");
        }

        if (text.startsWith('/delete')) {
            return HandlerBlockResult.end("DeleteEventBlock");
        }

        await bot.sendMessage(context.chatId, "Команда не распознана. Используйте /add, /edit, /delete или /exit.");
        return HandlerBlockResult.cont();
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        let nextBlockId = null;

        switch (callbackQuery.data) {
            case 'main_menu':
                nextBlockId = 'MainMenuBlock';
                break;
            case 'create_event':
                nextBlockId = 'CreateEventBlock';
                break;
            case 'edit_event':
                nextBlockId = 'EditEventBlock';
                break;
            case 'delete_event':
                nextBlockId = 'DeleteEventBlock';
                break;
            default:
                await this.enterAsync(context, bot);
                return HandlerBlockResult.cont();
        }

        return HandlerBlockResult.end(nextBlockId, {});
    }

    onEnd() { }

    clone() {
        return new EditScheduleBlock();
    }
}

module.exports = { EditScheduleBlock };
