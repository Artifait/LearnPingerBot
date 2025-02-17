// Core/Blocks/GroupsInfoBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const { getGroupsByUser, getCreatedGroups, getCurrentGroup } = require('../../groupManager');
const { getEventsByGroup } = require('../../scheduleManager');

class GroupsInfoBlock extends HandlerBlock {
    constructor() {
        super();
    }

    get blockId() {
        return 'GroupsInfoBlock';
    }

    async enterAsync(context, bot) {
        const userId = context.chatId;
        let groups = getGroupsByUser(userId);
        const createdGroups = getCreatedGroups(userId);
        const currentGroup = getCurrentGroup(userId);
        let message = "Информация о ваших группах:\n\n";

        message += "Группы, в которых вы состоите:\n";
        groups = groups.filter((group) => createdGroups.includes(group));
        if (groups.length === 0) {
            message += "  Нет групп\n";
        } else {
            groups.forEach(group => {
                const events = getEventsByGroup(group.key);
                message += `  Название: ${group.name}\n  Ключ: ${group.key}\n  Участников: ${group.members.length}\n  Событий: ${events.length}\n`;
                if (currentGroup === group.key) {
                    message += "  [Текущая группа]\n";
                }
                message += "\n";
            });
        }

        message += "\nГруппы, которые вы создали:\n";
        if (createdGroups.length === 0) {
            message += "  Нет созданных групп\n";
        } else {
            createdGroups.forEach(group => {
                const events = getEventsByGroup(group.key);
                message += `  Название: ${group.name}\n  Ключ: ${group.key}\n  Участников: ${group.members.length}\n  Событий: ${events.length}\n`;
                if (currentGroup === group.key) {
                    message += "  [Текущая группа]\n";
                }
                message += "\n";
            });
        }

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "В главное меню", callback_data: "main_menu" },
                        { text: "Создать группу", callback_data: "create_group" },
                        { text: "Удалить группу", callback_data: "delete_group" }
                    ],
                    [
                        { text: "Сменить группу", callback_data: "switch_group" },
                        { text: "Вступить в группу по ключу", callback_data: "join_group" }
                    ],
                ]
            }
        };
        await context.send(bot, message, options);
    }

    async handleAsync(message, context, bot) {
        return HandlerBlockResult.end("MainMenuBlock");
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        if (callbackQuery.data === "main_menu") {
            return HandlerBlockResult.end("MainMenuBlock");
        }
        if (callbackQuery.data === "switch_group") {
            return HandlerBlockResult.end("SwitchGroupBlock");
        }
        if (callbackQuery.data === "create_group") {
            return HandlerBlockResult.end("CreateGroupBlock");
        }
        if (callbackQuery.data === "join_group") {
            return HandlerBlockResult.end("JoinGroupBlock");
        }
        if (callbackQuery.data === "delete_group") {
            return HandlerBlockResult.end("DeleteGroupBlock");
        }
        return HandlerBlockResult.cont();
    }

    onEnd() { }

    clone() {
        return new GroupsInfoBlock();
    }
}

module.exports = { GroupsInfoBlock };
