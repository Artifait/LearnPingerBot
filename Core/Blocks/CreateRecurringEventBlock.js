// Core/Blocks/CreateRecurringEventBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const scheduleManager = require('../../scheduleManager');
const { getCurrentGroup } = require('../../groupManager');

class CreateRecurringEventBlock extends HandlerBlock {
    constructor() {
        super();
        // Инициализируем состояние блока
        this.internalState = {
            state: "menu", // Возможные состояния: "menu", "awaiting_input", "confirmation"
            eventData: {
                eventType: "recurring", // фиксированное значение для данного блока
                name: null,
                description: null,
                curator: null,
                daysOfWeek: null,    // Ожидается массив чисел (например, [1,3,5])
                startDate: null,     // новая: дата, с которой начинает действовать евент (ГГГГ-ММ-ДД)
                startTime: null,     // формат "ЧЧ:ММ" (МСК)
                endTime: null,       // формат "ЧЧ:ММ" (МСК)
                deleteAfter: null    // формат "ГГГГ-ММ-ДД"
            },
            editingField: null // текущее редактируемое поле
        };
    }

    get blockId() {
        return 'CreateRecurringEventBlock';
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
            await context.send(
                bot,
                "Нет выбранной группы. Пожалуйста, выберите/вступите или создайте группу для создания евента.",
                options
            );
            return;
        }

        if (this.internalState.state === "awaiting_input") {
            // Ждем текстового ввода
        } else if (this.internalState.state === "confirmation") {
            const ed = this.internalState.eventData;
            const msg = `Подтвердите создание повторяющегося евента:\n\n` +
                `Название: ${ed.name}\n` +
                `Описание: ${ed.description}\n` +
                `Куратор: ${ed.curator}\n` +
                `Дни недели: ${ed.daysOfWeek ? ed.daysOfWeek.join(", ") : "не заданы"}\n` +
                `Дата начала: ${ed.startDate}\n` +
                `Время начала: ${ed.startTime}\n` +
                `Время окончания: ${ed.endTime}\n` +
                `Дата удаления: ${ed.deleteAfter}\n\n` +
                `Выберите действие:`;
            const keyboard = [
                [
                    { text: "Вернуться к редактору", callback_data: "back_to_menu" },
                    { text: "Создать евент", callback_data: "confirm_create" }
                ]
            ];
            const options = { reply_markup: { inline_keyboard: keyboard } };
            await context.send(bot, msg, options);
        } else {
            if (!this.internalState.eventData) {
                this.internalState = {
                    state: "menu",
                    eventData: {
                        eventType: "recurring",
                        name: null,
                        description: null,
                        curator: null,
                        daysOfWeek: null,
                        startDate: null,
                        startTime: null,
                        endTime: null,
                        deleteAfter: null
                    },
                    editingField: null
                };
            }
            const ed = this.internalState.eventData;
            const msg = `Создание повторяющегося евента:\n\n` +
                `Название: ${ed.name || "не задано"}\n` +
                `Описание: ${ed.description || "не задано"}\n` +
                `Куратор: ${ed.curator || "не задано"}\n` +
                `Дни недели: ${ed.daysOfWeek ? ed.daysOfWeek.join(", ") : "не заданы"}\n` +
                `Дата начала: ${ed.startDate || "не задана"}\n` +
                `Время начала: ${ed.startTime || "не задано"}\n` +
                `Время окончания: ${ed.endTime || "не задано"}\n` +
                `Дата удаления: ${ed.deleteAfter || "не задана"}\n\n` +
                `Выберите действие:`;
            const keyboard = [
                [
                    { text: "Установить название", callback_data: "set_name" },
                    { text: "Установить описание", callback_data: "set_description" }
                ],
                [{ text: "Установить куратора", callback_data: "set_curator" }],
                [{ text: "Установить дни недели", callback_data: "set_daysOfWeek" }],
                [{ text: "Установить дату начала", callback_data: "set_startDate" }],
                [
                    { text: "Установить время начала", callback_data: "set_startTime" },
                    { text: "Установить время окончания", callback_data: "set_endTime" }
                ],
                [{ text: "Установить дату удаления", callback_data: "set_deleteAfter" }],
                [
                    { text: "Отменить создание евента", callback_data: "cancel_event" },
                    { text: "Создать евент", callback_data: "attempt_create_event" }
                ]
            ];
            const options = { reply_markup: { inline_keyboard: keyboard } };
            await context.send(bot, msg, options);
        }
    }

    async handleAsync(message, context, bot) {
        if (this.internalState.state === "awaiting_input") {
            const field = this.internalState.editingField;
            let input = message.text.trim();
            let valid = true;
            let errorMsg = "";
            // Валидация ввода
            switch (field) {
                case "name":
                case "description":
                case "curator":
                    if (!input) {
                        valid = false;
                        errorMsg = "Значение не может быть пустым.";
                    }
                    break;
                case "daysOfWeek":
                    // Ожидается ввод чисел от 0 до 6 через запятую
                    const days = input.split(",").map(s => Number(s.trim()));
                    if (days.some(isNaN) || days.some(d => d < 0 || d > 6)) {
                        valid = false;
                        errorMsg = "Введите числа от 0 до 6, разделённые запятыми.";
                    } else {
                        input = days;
                    }
                    break;
                case "startDate":
                    // Формат ГГГГ-ММ-ДД, не в прошлом
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
                        valid = false;
                        errorMsg = "Формат должен быть ГГГГ-ММ-ДД.";
                    } else {
                        const inputDate = new Date(input + "T00:00:00+03:00");
                        const now = new Date(new Date().getTime() + 3*60*60*1000);
                        const today = new Date(now.toISOString().split("T")[0]);
                        if (inputDate < today) {
                            valid = false;
                            errorMsg = "Дата начала не может быть в прошлом.";
                        }
                    }
                    break;
                case "deleteAfter":
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
                        valid = false;
                        errorMsg = "Формат должен быть ГГГГ-ММ-ДД.";
                    } else {
                        const inputDate = new Date(input + "T00:00:00+03:00");
                        const startDate = new Date(this.internalState.eventData.startDate + "T00:00:00+03:00");
                        if (inputDate < startDate) {
                            valid = false;
                            errorMsg = "Дата удаления не может быть раньше даты начала.";
                        }
                    }
                    break;
                case "startTime":
                case "endTime":
                    if (!/^\d{1,2}:\d{2}$/.test(input)) {
                        valid = false;
                        errorMsg = "Формат должен быть ЧЧ:ММ.";
                    }
                    break;
                default:
                    valid = false;
                    errorMsg = "Неизвестное поле.";
            }
            if (!valid) {
                await context.send(bot, `Ошибка: ${errorMsg}`);
                return HandlerBlockResult.cont();
            }
            this.internalState.eventData[field] = input;
            this.internalState.state = "menu";
            this.internalState.editingField = null;
            await this.enterAsync(context, bot);
            return HandlerBlockResult.cont();
        }
        await this.enterAsync(context, bot);
        return HandlerBlockResult.cont();
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        const data = callbackQuery.data;
        if (this.internalState.state === "menu" || !this.internalState) {
            switch (data) {
                case "set_name":
                    this.internalState.state = "awaiting_input";
                    this.internalState.editingField = "name";
                    await context.send(bot, "Введите название евента:");
                    break;
                case "set_description":
                    this.internalState.state = "awaiting_input";
                    this.internalState.editingField = "description";
                    await context.send(bot, "Введите описание евента:");
                    break;
                case "set_curator":
                    this.internalState.state = "awaiting_input";
                    this.internalState.editingField = "curator";
                    await context.send(bot, "Введите имя куратора евента:");
                    break;
                case "set_daysOfWeek":
                    this.internalState.state = "awaiting_input";
                    this.internalState.editingField = "daysOfWeek";
                    await context.send(bot, "Введите дни недели (0 – воскресенье, 1 – понедельник, ...), разделённые запятыми:");
                    break;
                case "set_startDate":
                    this.internalState.state = "awaiting_input";
                    this.internalState.editingField = "startDate";
                    await context.send(bot, "Введите дату начала евента (ГГГГ-ММ-ДД):");
                    break;
                case "set_startTime":
                    this.internalState.state = "awaiting_input";
                    this.internalState.editingField = "startTime";
                    await context.send(bot, "Введите время начала евента (ЧЧ:ММ):");
                    break;
                case "set_endTime":
                    this.internalState.state = "awaiting_input";
                    this.internalState.editingField = "endTime";
                    await context.send(bot, "Введите время окончания евента (ЧЧ:ММ):");
                    break;
                case "set_deleteAfter":
                    this.internalState.state = "awaiting_input";
                    this.internalState.editingField = "deleteAfter";
                    await context.send(bot, "Введите дату удаления евента (ГГГГ-ММ-ДД):");
                    break;
                case "cancel_event":
                    await context.send(bot, "Создание евента отменено.");
                    return HandlerBlockResult.end("MainMenuBlock", {});
                case "attempt_create_event":
                    const ed = this.internalState.eventData;
                    if (!ed.name || !ed.description || !ed.curator || !ed.daysOfWeek || !ed.startDate || !ed.startTime || !ed.endTime || !ed.deleteAfter) {
                        await context.send(bot, "Не все обязательные поля заполнены. Пожалуйста, заполните все параметры.");
                        await this.enterAsync(context, bot);
                        return HandlerBlockResult.cont();
                    }
                    this.internalState.state = "confirmation";
                    await this.enterAsync(context, bot);
                    break;
                default:
                    await this.enterAsync(context, bot);
            }
        } else if (this.internalState.state === "confirmation") {
            if (data === "back_to_menu") {
                this.internalState.state = "menu";
                await this.enterAsync(context, bot);
            } else if (data === "confirm_create") {
                const ed = this.internalState.eventData;
                ed.groupKey = getCurrentGroup(context.chatId);
                const event = scheduleManager.addEvent(ed);
                await context.send(bot, `Евент "${event.name}" создан!`);
                return HandlerBlockResult.end("MainMenuBlock", {});
            }
        } else {
            this.internalState.state = "menu";
            await this.enterAsync(context, bot);
        }
        return HandlerBlockResult.cont();
    }

    onEnd() { }

    clone() {
        const clone = new CreateRecurringEventBlock();
        clone.internalState = JSON.parse(JSON.stringify(this.internalState));
        return clone;
    }
}

module.exports = { CreateRecurringEventBlock };
