// Core/Blocks/DeleteGroupBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const { getCreatedGroups, getUniqueGroupDisplayName, deleteGroup } = require('../../groupManager');

class DeleteGroupBlock extends HandlerBlock {
    constructor() {
        super();
    }

    get blockId() {
        return "DeleteGroupBlock";
    }

    async enterAsync(context, bot) {
        const userId = context.chatId;
        const createdGroups = getCreatedGroups(userId);
        if (createdGroups.length === 0) {
            await context.send(bot, "У вас нет созданных групп для удаления.", {});
            return;
        }
        let message = "Выберите группу для удаления:";
        const buttons = createdGroups.map(group => {
            const displayName = getUniqueGroupDisplayName(group);
            return [{ text: displayName, callback_data: `delete_group_${group.key}` }];
        });
        buttons.push([{ text: "В главное меню", callback_data: "main_menu" }]);
        const options = {
            reply_markup: {
                inline_keyboard: buttons
            }
        };
        await context.send(bot, message, options);
    }

    async handleAsync(message, context, bot) {
        return HandlerBlockResult.end("MainMenuBlock");
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        const data = callbackQuery.data;
        if (data === "main_menu") {
            return HandlerBlockResult.end("MainMenuBlock");
        }
        if (data.startsWith("delete_group_")) {
            const groupKey = data.replace("delete_group_", "");
            const userId = context.chatId;
            const result = deleteGroup(userId, groupKey);
            if (result.success) {
                await context.send(bot, "Группа успешно удалена.", {});
            } else {
                await context.send(bot, `Ошибка удаления: ${result.message}`, {});
            }
            return HandlerBlockResult.end("MainMenuBlock");
        }
        return HandlerBlockResult.cont();
    }

    onEnd() {}

    clone() {
        return new DeleteGroupBlock();
    }
}

module.exports = { DeleteGroupBlock };
