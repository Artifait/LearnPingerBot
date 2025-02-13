// scheduleManager.js
const fs = require('fs');
const path = require('path');

const scheduleFilePath = path.join(__dirname, 'schedule.json');

const DEFAULT_EVENT_EXPIRY_MINUTES = 60;    // по умолчанию событие видно 60 минут после начала
const MAX_EVENT_EXPIRY_MINUTES = 1440;        // максимум – 1440 минут (24 часа)

function loadSchedule() {
    if (!fs.existsSync(scheduleFilePath)) {
        fs.writeFileSync(scheduleFilePath, JSON.stringify([]));
    }
    const data = fs.readFileSync(scheduleFilePath);
    try {
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function saveSchedule(schedule) {
    fs.writeFileSync(scheduleFilePath, JSON.stringify(schedule, null, 2));
}

function getEvents() {
    return loadSchedule();
}

/**
 * Возвращает события для указанной группы (по ключу).
 * @param {string} groupKey
 */
function getEventsForGroup(groupKey) {
    const schedule = loadSchedule();
    return schedule.filter(e => e.groupKey === groupKey);
}

/**
 * Добавление нового события (пары).
 * Объект event должен содержать:
 * - date: дата (YYYY-MM-DD)
 * - time: время (HH:MM)
 * - place: место проведения
 * - subject: название предмета
 * - teacher: ФИО преподавателя
 * - type: 'once' или 'recurring'
 * - interval: интервал (в минутах, для повторяющихся событий)
 * - groupKey: ключ группы, к которой относится событие
 * - expiryMinutes (необязательно): время видимости события после начала (в минутах)
 */
function addEvent(event) {
    const schedule = loadSchedule();
    event.id = Date.now();
    if (!event.expiryMinutes) {
        event.expiryMinutes = DEFAULT_EVENT_EXPIRY_MINUTES;
    }
    if (event.expiryMinutes > MAX_EVENT_EXPIRY_MINUTES) {
        event.expiryMinutes = MAX_EVENT_EXPIRY_MINUTES;
    }
    // Если не задано, добавляем свойство для хранения уведомлений
    if (!event.notifiedUsers) {
        event.notifiedUsers = [];
    }
    schedule.push(event);
    saveSchedule(schedule);
    return event;
}


function editEvent(eventId, updatedEvent) {
    const schedule = loadSchedule();
    const index = schedule.findIndex(e => e.id === eventId);
    if (index === -1) return null;
    schedule[index] = { ...schedule[index], ...updatedEvent };
    saveSchedule(schedule);
    return schedule[index];
}

function deleteEvent(eventId) {
    let schedule = loadSchedule();
    schedule = schedule.filter(e => e.id !== eventId);
    saveSchedule(schedule);
}

/**
 * Удаляет устаревшие события для конкретной группы.
 * Событие считается устаревшим, если текущее время больше, чем время начала события + cleanupBufferMinutes.
 * @param {string} groupKey
 * @param {number} cleanupBufferMinutes – количество минут после начала события, после которых оно удаляется.
 */
function cleanupOldEventsForGroup(groupKey, cleanupBufferMinutes = DEFAULT_EVENT_EXPIRY_MINUTES) {
    let schedule = loadSchedule();
    const now = new Date();
    schedule = schedule.filter(event => {
        if (event.groupKey === groupKey) {
            const eventStart = new Date(`${event.date}T${event.time}:00`);
            // Оставляем событие, если текущее время меньше чем eventStart + buffer
            return now < new Date(eventStart.getTime() + cleanupBufferMinutes * 60000);
        }
        return true;
    });
    saveSchedule(schedule);
}

function getEventStatus(event) {
    const now = new Date();
    const eventStart = new Date(`${event.date}T${event.time}:00`);
    const eventEnd = new Date(event.endTime);

    // Статус: событие скоро начнется
    if (now < eventStart) {
        const diffMinutes = Math.ceil((eventStart - now) / 60000); // Разница в минутах
        return `Начнется через: ${diffMinutes} минут!`;
    }

    // Статус: событие идет
    if (now >= eventStart && now <= eventEnd) {
        const diffMinutes = Math.ceil((eventEnd - now) / 60000); // Разница в минутах
        return `Уже идет, до конца ${diffMinutes} минут!`;
    }

    // Статус: событие завершилось
    if (now > eventEnd) {
        const diffMinutes = Math.ceil((now - eventEnd) / 60000); // Разница в минутах
        return `Закончилось ${diffMinutes} минут назад!`;
    }
}

module.exports = {
    getEvents,
    addEvent,
    editEvent,
    deleteEvent,
    getEventsForGroup,
    cleanupOldEventsForGroup,
    getEventStatus,
    DEFAULT_EVENT_EXPIRY_MINUTES,
    MAX_EVENT_EXPIRY_MINUTES
};
