// Core/Blocks/ViewScheduleBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const { getCurrentGroup, getGroupByKey, getUniqueGroupDisplayName} = require('../../groupManager');
const { getEventsForGroup, cleanupOldEventsForGroup } = require('../../scheduleManager');

class ViewScheduleBlock extends HandlerBlock {
    constructor() {
        super();
    }

    get blockId() {
        return 'ViewScheduleBlock';
    }

    async enterAsync(context, bot) {
        const currentGroupKey = getCurrentGroup(context.chatId);
        if (!currentGroupKey) {
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "В главное меню", callback_data: "main_menu" }
                        ],
                        [
                            { text: "Ваши группы", callback_data: "switch_group" },
                            { text: "Создать группу", callback_data: "create_group" }],
                        [
                            { text: "Вступить в группу по ключу", callback_data: "join_group" }
                        ],
                    ]
                }
            };
            await context.send(bot, "Нет выбранной группы. Пожалуйста, выберите/вступите или создайте группу для просмотра расписания.", options);
            return;
        }

        // Сначала удаляем устаревшие события для данной группы
        cleanupOldEventsForGroup(currentGroupKey);

        // Получаем события, привязанные к выбранной группе
        const events = getEventsForGroup(currentGroupKey);
        const displayName = getUniqueGroupDisplayName(getGroupByKey(currentGroupKey));

        let message = `Расписание для группы ${displayName}:\n`;
        if (events.length === 0) {
            message += "Нет запланированных событий.";
        } else {
            const now = new Date();
            events.forEach(event => {
                const eventStart = new Date(`${event.date}T${event.time}:00`);
                let timeInfo = "";
                if (eventStart > now) {
                    const diffMinutes = Math.ceil((eventStart - now) / 60000);
                    timeInfo = `Осталось: ${diffMinutes} минут`;
                } else {
                    timeInfo = "Уже началось";
                }
                message += `\nНазвание: ${event.subject}
Дата: ${event.date}
Время: ${event.time}
Преподаватель: ${event.teacher}
Место: ${event.place}
Тип: ${event.type}
${timeInfo}\n`;
            });
        }
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "В главное меню", callback_data: "main_menu" }]
                ]
            }
        };
        await context.send(bot, message, options);
        // await bot.sendMessage(context.chatId, message, options);
    }

    async handleAsync(message, context, bot) {
        return HandlerBlockResult.end("MainMenuBlock");
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        let nextBlockId = null;

        switch (callbackQuery.data) {
            case 'main_menu':
                nextBlockId = "MainMenuBlock";
                break;
            case 'switch_group':
                nextBlockId = 'SwitchGroupBlock';
                break;
            case 'join_group':
                nextBlockId = 'JoinGroupBlock';
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
        return new ViewScheduleBlock();
    }
}

module.exports = { ViewScheduleBlock };
