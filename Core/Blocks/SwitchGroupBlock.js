// Core/Blocks/SwitchGroupBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const { getGroupsByUser, setCurrentGroup, getUniqueGroupDisplayName } = require('../../groupManager');

class SwitchGroupBlock extends HandlerBlock {
    constructor() {
        super();
    }

    get blockId() {
        return 'SwitchGroupBlock';
    }

    async enterAsync(context, bot) {
        const userId = context.chatId;
        const groups = getGroupsByUser(userId);
        if (groups.length === 0) {
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "В главное меню", callback_data: "main_menu" }],
                        [{ text: "Создать группу", callback_data: "create_group" }],
                        [{ text: "Вступить в группу по ключу", callback_data: "join_group" }],
                    ]
                }
            };
            await context.send(bot, "Вы не состоите ни в одной группе. Создайте или присоединитесь к группе.", options);
            return;
        }
        // Формируем кнопки для выбора группы
        const buttons = groups.map(group => [{ text: getUniqueGroupDisplayName(group), callback_data: `select_group_${group.key}` }]);
        buttons.push([{ text: "В главное меню", callback_data: "main_menu" }]);
        const options = {
            reply_markup: {
                inline_keyboard: buttons
            }
        };
        await context.send(bot, "Выберите группу, с которой хотите работать:", options);
        //await bot.sendMessage(userId, "Выберите группу, с которой хотите работать:", options);
    }

    async handleAsync(message, context, bot) {
        return HandlerBlockResult.end("MainMenuBlock");
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        const data = callbackQuery.data;
        if (data === "main_menu") {
            return HandlerBlockResult.end("MainMenuBlock");
        }
        if (data === "create_group") {
            return HandlerBlockResult.end("CreateGroupBlock");
        }
        if (data === "join_group") {
            return HandlerBlockResult.end("JoinGroupBlock");
        }
        if (data.startsWith("select_group_")) {
            const groupKey = data.replace("select_group_", "");
            setCurrentGroup(context.chatId, groupKey);
            return HandlerBlockResult.end("MainMenuBlock");
        }
        return HandlerBlockResult.cont();
    }

    onEnd() { }

    clone() {
        return new SwitchGroupBlock();
    }
}

module.exports = { SwitchGroupBlock };
