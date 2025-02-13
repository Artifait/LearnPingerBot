// notificationScheduler.js
const { getEvents, editEvent, deleteEvent } = require('./scheduleManager');
const { getGroupByKey } = require('./groupManager');
const { getNotificationOffset } = require('./notificationsSettingsManager');

/**
 * Запускает планировщик уведомлений.
 * Каждую минуту проверяет все события и для каждого события, если наступило время уведомления,
 * отправляет сообщение пользователю (если он ещё не был уведомлён) и отмечает, что уведомление отправлено.
 * @param {TelegramBot} bot - экземпляр TelegramBot
 * @param {function} getNotificationOffset - функция получения времени уведомления для каждого пользователя
 */
function startNotificationScheduler(bot, getNotificationOffset) {
    if (!bot) {
        console.error("Bot object is undefined");
        return;
    }

    setInterval(() => {
        try {
            const events = getEvents();
            const now = new Date();
            let updated = false;
            events.forEach(event => {
                // Если в событии нет свойства notifiedUsers, задаём его как пустой массив
                if (!event.notifiedUsers) {
                    event.notifiedUsers = [];
                }
                // Формируем дату/время начала события (предполагается формат YYYY-MM-DD и HH:MM)
                const eventStart = new Date(`${event.date}T${event.time}:00`);
                // Получаем информацию о группе, к которой относится событие
                const group = getGroupByKey(event.groupKey);
                if (!group) return; // Если группа не найдена, пропускаем событие

                // Для каждого участника группы проверяем, уведомлён ли он уже для этого события
                group.members.forEach(async (userId) => {
                    if (event.notifiedUsers.includes(userId)) return; // уже уведомляли
                    // Получаем время уведомления для данного пользователя (в минутах)
                    const offset = getNotificationOffset(userId);
                    // Расчитываем время, начиная с которого нужно уведомить
                    const notificationTime = new Date(eventStart.getTime() - offset * 60000);
                    // Если текущее время находится в интервале уведомления (от notificationTime до начала события)
                    if (now >= notificationTime && now < eventStart) {
                        const message = `Напоминание!
Скоро начнется событие:
Предмет: ${event.subject}
Преподаватель: ${event.teacher}
Место: ${event.place}
Дата: ${event.date}
Время: ${event.time}`;
                        try {
                            await bot.sendMessage(userId, message);
                            // Отмечаем, что для этого события пользователь уведомлён
                            event.notifiedUsers.push(userId);
                            updated = true;
                        } catch (err) {
                            console.error(`Ошибка отправки уведомления пользователю ${userId}:`, err.message);
                        }
                    }
                });
            });
            // Если какие-то события были обновлены (пользователи уведомлены), сохраняем изменения
            if (updated) {
                events.forEach(event => {
                    // Обновляем событие по его id, записывая обновлённое свойство notifiedUsers
                    editEvent(event.id, { notifiedUsers: event.notifiedUsers });
                });
            }
        } catch (err) {
            console.error("Ошибка в планировщике уведомлений:", err.message);
        }
    }, 60000); // запускаем проверку каждую минуту
}

function cleanUpOldEvents() {
    const now = new Date();
    const events = getEvents();
    events.forEach(event => {
        const eventEnd = new Date(event.endTime);
        const cleanupTime = new Date(eventEnd.getTime() + event.cleanupAfter * 60000); // Время удаления

        if (now > cleanupTime) {
            // Удаляем событие, если оно прошло и время для его удаления наступило
            deleteEvent(event.id);
            console.log(`Событие ${event.name} удалено.`);
        }
    });
}

// Запуск очистки старых событий каждую минуту
setInterval(cleanUpOldEvents, 60000);

module.exports = { startNotificationScheduler };
