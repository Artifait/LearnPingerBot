// notificationScheduler.js
const scheduleManager = require('./scheduleManager');
const groupManager = require('./groupManager');

/**
 * Возвращает текущее время в МСК (UTC+3) корректно.
 */
function getCurrentMSKTime() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
}

/**
 * Для одноразового евента вычисляет время старта и окончания.
 */
function getOneTimeOccurrence(event) {
    // Для одноразового евента event.eventDate – строка "YYYY-MM-DD"
    const eventDate = new Date(event.eventDate);
    const [startHour, startMinute] = event.startTime.split(":").map(Number);
    const [endHour, endMinute] = event.endTime.split(":").map(Number);

    const eventStart = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        startHour,
        startMinute
    );
    const eventEnd = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        endHour,
        endMinute
    );
    return { start: eventStart, end: eventEnd };
}

/**
 * Для повторяющегося евента на основе текущего времени (MSK)
 * вычисляет ближайшее вхождение (с учетом event.startDate, если указан).
 */
function getNextOccurrence(event, now) {
    let baseDate = now;
    if (event.startDate) {
        // event.startDate – строка "YYYY-MM-DD"
        const startDate = new Date(event.startDate + "T00:00:00");
        if (startDate > now) {
            baseDate = startDate;
        }
    }

    // Ищем в ближайшие 7 дней день, входящий в event.daysOfWeek
    for (let i = 0; i < 7; i++) {
        let candidate = new Date(baseDate);
        candidate.setDate(baseDate.getDate() + i);
        if (event.daysOfWeek && event.daysOfWeek.includes(candidate.getDay())) {
            const [startHour, startMinute] = event.startTime.split(":").map(Number);
            const [endHour, endMinute] = event.endTime.split(":").map(Number);
            const occurrenceStart = new Date(
                candidate.getFullYear(),
                candidate.getMonth(),
                candidate.getDate(),
                startHour,
                startMinute
            );
            const occurrenceEnd = new Date(
                candidate.getFullYear(),
                candidate.getMonth(),
                candidate.getDate(),
                endHour,
                endMinute
            );
            // Если сегодня уже прошёл конец евента – ищем следующий
            if (i === 0 && now > occurrenceEnd) continue;
            return { start: occurrenceStart, end: occurrenceEnd };
        }
    }
    return null;
}

/**
 * Запускает планировщик уведомлений.
 * bot – клиент Telegram,
 * getNotificationOffset(userId) – функция получения смещения уведомления (в минутах) для пользователя.
 */
function startNotificationScheduler(bot, getNotificationOffset) {
    // Константа для удаления одноразовых евентов спустя N минут после их окончания
    const ONE_TIME_EVENT_DELETE_DELAY = 5; // например, 5 минут

    // Каждую минуту проверяем евенты
    setInterval(async () => {
        try {
            const events = scheduleManager.getAllEvents();
            const now = getCurrentMSKTime();

            for (const event of events) {
                // Получаем группу; если группы нет — пропускаем евент
                const group = groupManager.getGroupByKey(event.groupKey);
                if (!group) continue;

                // Вычисляем время старта и окончания для текущего евента
                let occurrence = null;
                if (event.eventType === "one_time") {
                    occurrence = getOneTimeOccurrence(event);
                } else if (event.eventType === "recurring") {
                    occurrence = getNextOccurrence(event, now);
                }
                if (!occurrence) continue; // если не удалось вычислить, пропускаем

                // Для каждого пользователя из группы
                for (const userId of group.members) {
                    const offset = getNotificationOffset(userId); // смещение в минутах
                    // Рассчитываем время предварительного уведомления:
                    const preNotificationTime = new Date(
                        occurrence.start.getTime() - offset * 60000
                    );

                    // Проверяем необходимость "pre" уведомления (до старта евента)
                    if (
                        !scheduleManager.hasUserBeenNotified(event, userId, 'pre') &&
                        now >= preNotificationTime &&
                        now < new Date(preNotificationTime.getTime() + 60000)
                    ) {
                        bot.sendMessage(
                            userId,
                            `Напоминание: событие "${event.name}" начнется через ${offset} минут.`
                        );
                        scheduleManager.markUserNotified(event.id, userId, 'pre');
                    }

                    // Проверяем уведомление "start" (в момент начала евента)
                    if (
                        !scheduleManager.hasUserBeenNotified(event, userId, 'start') &&
                        now >= occurrence.start &&
                        now < new Date(occurrence.start.getTime() + 60000)
                    ) {
                        bot.sendMessage(
                            userId,
                            `Событие "${event.name}" началось!`
                        );
                        scheduleManager.markUserNotified(event.id, userId, 'start');
                    }

                    // Проверяем уведомление "end" (в момент окончания евента)
                    if (
                        !scheduleManager.hasUserBeenNotified(event, userId, 'end') &&
                        now >= occurrence.end &&
                        now < new Date(occurrence.end.getTime() + 60000)
                    ) {
                        bot.sendMessage(
                            userId,
                            `Событие "${event.name}" завершилось!`
                        );
                        scheduleManager.markUserNotified(event.id, userId, 'end');
                    }
                }

                // Удаление устаревших евентов:
                if (event.eventType === "one_time") {
                    // Для одноразовых – удаляем спустя ONE_TIME_EVENT_DELETE_DELAY минут после окончания
                    const deletionTime = new Date(
                        occurrence.end.getTime() + ONE_TIME_EVENT_DELETE_DELAY * 60000
                    );
                    if (now > deletionTime) {
                        scheduleManager.deleteEvent(event.id);
                    }
                } else if (event.eventType === "recurring" && event.deleteAfter) {
                    // Для повторяющихся – удаляем на следующий день после даты deleteAfter
                    const deleteAfterDate = new Date(event.deleteAfter + "T00:00:00");
                    deleteAfterDate.setDate(deleteAfterDate.getDate() + 1);
                    if (now > deleteAfterDate) {
                        scheduleManager.deleteEvent(event.id);
                    }
                }
            }
        } catch (err) {
            console.error("Ошибка в планировщике уведомлений:", err);
        }
    }, 60 * 1000);
}

module.exports = { startNotificationScheduler, getCurrentMSKTime };
