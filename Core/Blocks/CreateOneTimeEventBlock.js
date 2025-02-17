// Core/Blocks/CreateOneTimeEventBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const scheduleManager = require('../../scheduleManager');
const { getCurrentGroup } = require('../../groupManager');
const { getCurrentMSKTime } = require('../../notificationScheduler');

class CreateOneTimeEventBlock extends HandlerBlock {
    constructor() {
        super();
        // Инициализируем состояние блока
        this.internalState = {
            state: "menu", // Возможные состояния: "menu", "awaiting_input", "confirmation"
            eventData: {
                eventType: "one_time", // фиксированное значение для данного блока
                name: null,
                description: null,
                curator: null,
                eventDate: null, // новая: дата евента (ГГГГ-ММ-ДД)
                startTime: null, // формат "ЧЧ:ММ" (МСК)
                endTime: null    // формат "ЧЧ:ММ" (МСК)
            },
            editingField: null // текущее редактируемое поле
        };
    }

    get blockId() {
        return 'CreateOneTimeEventBlock';
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
            // В режиме ожидания ввода – сообщение уже было отправлено, ждем текстового ответа
        } else if (this.internalState.state === "confirmation") {
            const ed = this.internalState.eventData;
            const msg = `Подтвердите создание одноразового евента:\n\n` +
                `Название: ${ed.name}\n` +
                `Описание: ${ed.description}\n` +
                `Куратор: ${ed.curator}\n` +
                `Дата: ${ed.eventDate}\n` +
                `Время начала: ${ed.startTime}\n` +
                `Время окончания: ${ed.endTime}\n\n` +
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
                        eventType: "one_time",
                        name: null,
                        description: null,
                        curator: null,
                        eventDate: null,
                        startTime: null,
                        endTime: null
                    },
                    editingField: null
                };
            }
            const ed = this.internalState.eventData;
            const msg = `Создание одноразового евента(все даты нужно задавать по московскому времени):\n\n` +
                `Название: ${ed.name || "не задано"}\n` +
                `Описание: ${ed.description || "не задано"}\n` +
                `Куратор: ${ed.curator || "не задано"}\n` +
                `Дата: ${ed.eventDate || "не задана"}\n` +
                `Время начала: ${ed.startTime || "не задано"}\n` +
                `Время окончания: ${ed.endTime || "не задано"}\n\n` +
                `Выберите действие:`;
            const keyboard = [
                [
                    { text: "Установить название", callback_data: "set_name" },
                    { text: "Установить описание", callback_data: "set_description" }
                ],
                [{ text: "Установить куратора", callback_data: "set_curator" }],
                [{ text: "Установить дату", callback_data: "set_eventDate" }],
                [
                    { text: "Установить время начала", callback_data: "set_startTime" },
                    { text: "Установить время окончания", callback_data: "set_endTime" }
                ],
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
            // Валидация ввода в зависимости от редактируемого поля
            switch (field) {
                case "name":
                case "description":
                case "curator":
                    if (!input) {
                        valid = false;
                        errorMsg = "Значение не может быть пустым.";
                    }
                    break;
                case "eventDate":
                    // Формат ГГГГ-ММ-ДД и проверка, что дата не в прошлом
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
                        valid = false;
                        errorMsg = "Формат должен быть ГГГГ-ММ-ДД.";
                    } else {
                        const inputDate = new Date(input);
                        const now = getCurrentMSKTime();
                        // Сравниваем только дату (без времени)
                        const today = new Date(now.toISOString().split("T")[0]);
                        if (inputDate < today) {
                            valid = false;
                            errorMsg = "Дата не может быть в прошлом.";
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
            // Сохраняем корректное значение
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
        if (!this.internalState.eventData) {
            this.internalState = {
                state: "menu",
                eventData: {
                    eventType: "one_time",
                    name: null,
                    description: null,
                    curator: null,
                    eventDate: null,
                    startTime: null,
                    endTime: null
                },
                editingField: null
            };
        }
        if (this.internalState.state === "menu" || !this.internalState) {
            context.callbackMessageId = callbackQuery.message.message_id;

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
                case "set_eventDate":
                    this.internalState.state = "awaiting_input";
                    this.internalState.editingField = "eventDate";
                    await context.send(bot, "Введите дату евента (ГГГГ-ММ-ДД):");
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
                case "cancel_event":
                    await context.send(bot, "Создание евента отменено.");
                    return HandlerBlockResult.end("MainMenuBlock", {});
                case "attempt_create_event":
                    const ed = this.internalState.eventData;
                    if (!ed.name || !ed.description || !ed.curator || !ed.eventDate || !ed.startTime || !ed.endTime) {
                        await context.send(bot, "Не все обязательные поля заполнены. Пожалуйста, заполните все параметры.");
                        await this.enterAsync(context, bot);
                        return HandlerBlockResult.cont();
                    }
                    // Дополнительная проверка: проверить, что время окончания позже времени начала и евент не в прошлом
                {
                    const start = new Date(`${ed.eventDate}T${ed.startTime}`);
                    const end = new Date(`${ed.eventDate}T${ed.endTime}`);
                    if (end <= start) {
                        await context.send(bot, "Время окончания должно быть позже времени начала.");
                        return HandlerBlockResult.cont();
                    }
                    const now = getCurrentMSKTime();
                    if (start < now) {
                        await context.send(bot, "Нельзя задать евент в прошлом.");
                        return HandlerBlockResult.cont();
                    }
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
        const clone = new CreateOneTimeEventBlock();
        clone.internalState = JSON.parse(JSON.stringify(this.internalState));
        return clone;
    }
}

module.exports = { CreateOneTimeEventBlock };
