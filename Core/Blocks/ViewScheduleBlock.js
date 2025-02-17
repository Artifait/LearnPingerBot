// Core/Blocks/ViewScheduleBlock.js
const { HandlerBlock } = require('./HandlerBlock');
const { HandlerBlockResult } = require('./HandlerBlockResult');
const scheduleManager = require('../../scheduleManager');
const { getCurrentGroup } = require('../../groupManager');

/**
 * Для одноразового евента вычисляет статус.
 */
function computeStatusOneTime(event) {
    // Получаем текущее время по МСК
    const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" })
    );

    // Парсим дату евента (учитываем, что eventDate имеет формат "YYYY-MM-DD")
    const eventDateMoscow = new Date(event.eventDate);

    // Разбираем время старта и окончания
    const [startHour, startMinute] = event.startTime.split(":").map(Number);
    const [endHour, endMinute] = event.endTime.split(":").map(Number);

    // Собираем объекты Date для старта и окончания евента в МСК
    const eventStart = new Date(
        eventDateMoscow.getFullYear(),
        eventDateMoscow.getMonth(),
        eventDateMoscow.getDate(),
        startHour,
        startMinute
    );
    const eventEnd = new Date(
        eventDateMoscow.getFullYear(),
        eventDateMoscow.getMonth(),
        eventDateMoscow.getDate(),
        endHour,
        endMinute
    );

    // Проверяем, совпадает ли текущая дата с датой евента
    const isToday =
        now.getFullYear() === eventStart.getFullYear() &&
        now.getMonth() === eventStart.getMonth() &&
        now.getDate() === eventStart.getDate();

    if (isToday) {
        if (now >= eventStart && now <= eventEnd) {
            // Евент идёт
            const minutesSinceStart = Math.floor((now - eventStart) / 60000);
            const minutesUntilEnd = Math.floor((eventEnd - now) / 60000);
            if (minutesSinceStart < minutesUntilEnd) {
                return `Евент идёт уже ${minutesSinceStart} минут!`;
            } else {
                return `До конца евента: ${minutesUntilEnd} минут!`;
            }
        } else if (now < eventStart) {
            // Евент ещё не начался
            const minutesUntilStart = Math.floor((eventStart - now) / 60000);
            return `Евент начнёться через ${minutesUntilStart} минут!`;
        } else {
            // Евент уже закончился
            const minutesSinceEnd = Math.floor((now - eventEnd) / 60000);
            return `Евент закончился ${minutesSinceEnd} минут назад!`;
        }
    } else {
        // Если сегодня евента нет
        if (now < eventStart) {
            // Евент в будущем, но не сегодня
            const daysAccusative = {
                0: "воскресенье",
                1: "понедельник",
                2: "вторник",
                3: "среду",
                4: "четверг",
                5: "пятницу",
                6: "субботу",
            };
            const dayName = daysAccusative[eventStart.getDay()];
            return `Сегодня нету, евент состоится в ${dayName} ${event.startTime}(по МСК)`;
        } else {
            // Евент в прошлом, не сегодня
            const minutesSinceEnd = Math.floor((now - eventEnd) / 60000);
            return `Евент закончился ${minutesSinceEnd} минут назад!`;
        }
    }
}

/**
 * Для повторяющегося евента вычисляет статус на основе ближайшего вхождения.
 * Если дата начала действия евента ещё не наступила, возвращает "Начнется с {startDate}".
 * Иначе ищется ближайшее совпадение дня недели и рассчитывается статус аналогично одноразовому евенту.
 */
function computeStatusRecurring(event) {
    // Получаем текущее время по МСК
    const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" })
    );

    // Разбираем время старта и окончания (в формате "HH:mm")
    const [startHour, startMinute] = event.startTime.split(":").map(Number);
    const [endHour, endMinute] = event.endTime.split(":").map(Number);

    // Если указан event.startDate – это дата начала расписания.
    // Преобразуем её в объект Date (без времени)
    let scheduleStart = event.startDate ? new Date(event.startDate + "T00:00:00") : null;
    // Если событие ещё не началось – берём за базу дату начала расписания
    let baseDate = now;
    if (scheduleStart && now < scheduleStart) {
        baseDate = scheduleStart;
    }

    // Определяем ближайшую дату, когда событие проходит.
    // Ищем в интервале ближайших 7 дней дату, день недели которой входит в event.daysOfWeek.
    let nextOccurrence = null;
    for (let i = 0; i < 7; i++) {
        let candidate = new Date(baseDate);
        candidate.setDate(baseDate.getDate() + i);
        if (event.daysOfWeek.includes(candidate.getDay())) {
            nextOccurrence = candidate;
            break;
        }
    }

    // Если ближайшего вхождения нет (на всякий случай)
    if (!nextOccurrence) {
        return "Нет предстоящих евентов";
    }

    // Собираем дату и время старта и окончания для ближайшего вхождения
    const occurrenceStart = new Date(
        nextOccurrence.getFullYear(),
        nextOccurrence.getMonth(),
        nextOccurrence.getDate(),
        startHour,
        startMinute
    );
    const occurrenceEnd = new Date(
        nextOccurrence.getFullYear(),
        nextOccurrence.getMonth(),
        nextOccurrence.getDate(),
        endHour,
        endMinute
    );

    // Проверяем, является ли ближайшее вхождение сегодняшним
    const isToday =
        now.getFullYear() === occurrenceStart.getFullYear() &&
        now.getMonth() === occurrenceStart.getMonth() &&
        now.getDate() === occurrenceStart.getDate();

    if (isToday) {
        if (now >= occurrenceStart && now <= occurrenceEnd) {
            // Событие идёт – определяем, ближе ли мы к началу или к концу
            const minutesSinceStart = Math.floor((now - occurrenceStart) / 60000);
            const minutesUntilEnd = Math.floor((occurrenceEnd - now) / 60000);
            if (minutesSinceStart < minutesUntilEnd) {
                return `Евент идёт уже ${minutesSinceStart} минут!`;
            } else {
                return `До конца евента: ${minutesUntilEnd} минут!`;
            }
        } else if (now < occurrenceStart) {
            // Событие ещё не началось сегодня
            const minutesUntilStart = Math.floor((occurrenceStart - now) / 60000);
            return `Евент начнёться через ${minutesUntilStart} минут!`;
        } else if (now > occurrenceEnd) {
            // Событие уже закончилось сегодня
            const minutesSinceEnd = Math.floor((now - occurrenceEnd) / 60000);
            return `Евент закончился ${minutesSinceEnd} минут назад!`;
        }
    }

    // Если сегодня события нет – сообщаем, когда ближайший будет
    // Форматируем название дня в нужном падеже для вывода (пример: "среду")
    const daysAccusative = {
        0: "воскресенье",
        1: "понедельник",
        2: "вторник",
        3: "среду",
        4: "четверг",
        5: "пятницу",
        6: "субботу",
    };
    const dayName = daysAccusative[occurrenceStart.getDay()];

    return `Сегодня нету, ближайший в ${dayName} ${event.startTime}(по МСК)`;
}


class ViewScheduleBlock extends HandlerBlock {
    constructor() {
        super();
        this.internalState = { page: 1 };
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
                        [{ text: "В главное меню", callback_data: "main_menu" }],
                        [
                            { text: "Ваши группы", callback_data: "switch_group" },
                            { text: "Создать группу", callback_data: "create_group" }
                        ],
                        [{ text: "Вступить в группу по ключу", callback_data: "join_group" }]
                    ]
                }
            };
            await context.send(bot, "Нет выбранной группы. Пожалуйста, выберите/вступите или создайте группу для просмотра расписания.", options);
            return;
        }

        // Получаем евенты для группы
        const events = scheduleManager.getEventsByGroup(currentGroupKey);
        // Сортировка евентов по ближайшему наступлению (для one_time – по eventDate+startTime, для recurring – по ближайшему вхождению)
        const sorted = events.slice().sort((a, b) => {
            let aTime, bTime;
            if (a.eventType === "one_time") {
                aTime = new Date(`${a.eventDate}T${a.startTime}:00+03:00`);
            } else {
                aTime = new Date(`${a.startDate}T${a.startTime}:00+03:00`);
            }
            if (b.eventType === "one_time") {
                bTime = new Date(`${b.eventDate}T${b.startTime}:00+03:00`);
            } else {
                bTime = new Date(`${b.startDate}T${b.startTime}:00+03:00`);
            }
            return aTime - bTime;
        });

        const itemsPerPage = 3;
        const page = this.internalState.page || 1;
        const startIndex = (page - 1) * itemsPerPage;
        const pageEvents = sorted.slice(startIndex, startIndex + itemsPerPage);

        let message = "Расписание евентов:\n\n";
        if (pageEvents.length === 0) {
            message += "Нет евентов для отображения.";
        } else {
            pageEvents.forEach((event, index) => {
                let status = "";
                if (event.eventType === "one_time") {
                    status = computeStatusOneTime(event);
                } else if (event.eventType === "recurring") {
                    status = computeStatusRecurring(event);
                }
                message += `${startIndex + index + 1}. ${event.name}\n`;// (${event.eventType === 'one_time' ? "Одноразовый" : "Повторяющийся"}
                message += `   Статус: ${status}\n`;
                message += `   Куратор: ${event.curator}\n\n`;
            });
        }

        const inlineKeyboard = [];
        const navButtons = [];
        if (page > 1) {
            navButtons.push({ text: "Предыдущая", callback_data: `view_schedule_page:${page - 1}` });
        }
        if (startIndex + itemsPerPage < sorted.length) {
            navButtons.push({ text: "Следующая", callback_data: `view_schedule_page:${page + 1}` });
        }
        if (navButtons.length > 0) {
            inlineKeyboard.push(navButtons);
        }
        inlineKeyboard.push([
            { text: "Редактировать", callback_data: `edit_event` },
            { text: "Удалить", callback_data: `delete_event` }
        ]);
        inlineKeyboard.push([{ text: "В главное меню", callback_data: "main_menu" }]);

        const options = { reply_markup: { inline_keyboard: inlineKeyboard } };
        await context.send(bot, message, options);
    }

    async handleAsync(message, context, bot) {
        await this.enterAsync(context, bot);
        return HandlerBlockResult.cont();
    }

    async handleCallbackAsync(callbackQuery, context, bot) {
        const data = callbackQuery.data;
        if (data.startsWith("view_schedule_page:")) {
            this.internalState.page = parseInt(data.split(":")[1]);
            await this.enterAsync(context, bot);
            return HandlerBlockResult.cont();
        }
        if (data === "main_menu") {
            return HandlerBlockResult.end("MainMenuBlock", {});
        }
        if (data.startsWith("edit_event")) {
            return HandlerBlockResult.end("EditEventBlock", {});
        }
        if (data.startsWith("delete_event")) {
            return HandlerBlockResult.end("DeleteEventBlock", {});
        }
        await this.enterAsync(context, bot);
        return HandlerBlockResult.cont();
    }

    onEnd() { }

    clone() {
        const clone = new ViewScheduleBlock();
        clone.internalState = { ...this.internalState };
        return clone;
    }
}

module.exports = { ViewScheduleBlock };
