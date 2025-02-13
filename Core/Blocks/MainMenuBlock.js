// Core/Blocks/MainMenuBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const { getCurrentGroup, getGroupByKey, getUniqueGroupDisplayName } = require('../../groupManager');

class MainMenuBlock extends HandlerBlock {
    constructor() {
        super();
    }

    get blockId() {
        return 'MainMenuBlock';
    }

    async enterAsync(context, bot) {
        const currentGroupKey = getCurrentGroup(context.chatId);
        let message = "Главное меню:\n";
        if (currentGroupKey) {
            const group = getGroupByKey(currentGroupKey);
            if (group) {
                const displayName = getUniqueGroupDisplayName(group);
                message += `Вы работаете с группой: ${displayName}\n`;
            } else {
                message += "Группа не найдена. Выберите или создайте группу.\n";
            }
        } else {
            message += "Вы не выбрали группу. Создайте или присоединитесь к группе.\n";
        }
        message += "Выберите действие:";
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Посмотреть расписание", callback_data: "view_schedule" },
                    ],
                    [
                        { text: "Группы", callback_data: "groups_info" },
                        { text: "Настройки", callback_data: "settings" },

                    ],
                    [
                        { text: "Создать группу", callback_data: "create_group" },
                        { text: "Сменить группу", callback_data: "switch_group" }
                    ],
                    [
                        { text: "Редактировать расписание", callback_data: "edit_schedule" },
                    ]
                ]
            }
        };

        await context.send(bot, message, options);
    }

    async handleAsync(message, context, bot) {
        await this.enterAsync(context, bot);
        return HandlerBlockResult.cont();
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        let nextBlockId = null;

        switch (callbackQuery.data) {
            case 'view_schedule':
                nextBlockId = 'ViewScheduleBlock';
                break;
            case 'edit_schedule':
                nextBlockId = 'EditScheduleBlock';
                break;
            case 'settings':
                nextBlockId = 'SettingsBlock';
                break;
            case 'delete_group':
                nextBlockId = 'DeleteGroupBlock';
                break;
            case 'groups_info':
                nextBlockId = 'GroupsInfoBlock';
                break;
            case 'switch_group':
                nextBlockId = 'SwitchGroupBlock';
                break;
            case 'create_group':
                nextBlockId = 'CreateGroupBlock';
                break;
            default:
                await this.enterAsync(context, bot);
                return HandlerBlockResult.cont();
        }
        return HandlerBlockResult.end(nextBlockId, {});
    }

    onEnd() { }

    clone() {
        return new MainMenuBlock();
    }
}

module.exports = { MainMenuBlock };
