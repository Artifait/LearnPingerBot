// Core/Blocks/CreateEventBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');

class CreateEventBlock extends HandlerBlock {
    constructor() {
        super();
        // Инициализируем состояние
        this.internalState = { state: "menu" };
    }

    get blockId() {
        return 'CreateEventBlock';
    }

    async enterAsync(context, bot) {
        const message = "Выберите тип евента для создания:";
        const keyboard = [
            [{ text: "Одноразовый евент", callback_data: "choose_one_time" }],
            [{ text: "Повторяющийся евент", callback_data: "choose_recurring" }],
            [{ text: "В главное меню", callback_data: "main_menu" }]
        ];
        const options = { reply_markup: { inline_keyboard: keyboard } };
        await context.send(bot, message, options);
    }

    async handleAsync(message, context, bot) {
        // Если пришёл текст – просто показываем меню выбора
        await this.enterAsync(context, bot);
        return HandlerBlockResult.cont();
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        const data = callbackQuery.data;
        if (data === "choose_one_time") {
            return HandlerBlockResult.end("CreateOneTimeEventBlock", {});
        } else if (data === "choose_recurring") {
            return HandlerBlockResult.end("CreateRecurringEventBlock", {});
        } else if (data === "main_menu") {
            return HandlerBlockResult.end("MainMenuBlock", {});
        }
        await this.enterAsync(context, bot);
        return HandlerBlockResult.cont();
    }

    onEnd() { }

    clone() {
        const clone = new CreateEventBlock();
        clone.internalState = JSON.parse(JSON.stringify(this.internalState));
        return clone;
    }
}

module.exports = { CreateEventBlock };
