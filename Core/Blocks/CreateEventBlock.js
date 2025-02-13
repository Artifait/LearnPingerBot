// Core/Blocks/CreateEventBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');

class CreateEventBlock extends HandlerBlock {
    constructor() {
        super();
    }

    get blockId() {
        return 'CreateEventBlock';
    }

    async enterAsync(context, bot) {
        const message = `Привет! Давайте создадим новое событие. Пожалуйста, выберите тип события:
1. Одноразовое
2. Повторяющееся`;

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Одноразовое событие", callback_data: "one-time" }],
                    [{ text: "Повторяющееся событие", callback_data: "recurring" }]
                ]
            }
        };

        await context.send(bot, message, options);
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        const data = callbackQuery.data;

        if (data === "one-time") {
            // Переход к созданию одноразового события
            return HandlerBlockResult.end("CreateOneTimeEventBlock");
        }
        if (data === "recurring") {
            // Переход к созданию повторяющегося события
            return HandlerBlockResult.end("CreateRecurringEventBlock");
        }

        return HandlerBlockResult.cont();
    }

    onEnd() {}

    clone() {
        return new CreateEventBlock();
    }
}

module.exports = { CreateEventBlock };
