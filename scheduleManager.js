// scheduleManager.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const eventsFilePath = path.join(__dirname, 'events.json');

function loadEvents() {
    if (!fs.existsSync(eventsFilePath)) {
        fs.writeFileSync(eventsFilePath, JSON.stringify([]));
    }
    const data = fs.readFileSync(eventsFilePath);
    try {
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function saveEvents(events) {
    fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2));
}

/**
 * Добавляет новый евент.
 * Для одноразового евента: eventDate, startTime, endTime
 * Для повторяющегося евента: startDate, daysOfWeek, startTime, endTime, deleteAfter
 */
function addEvent(eventData) {
    const events = loadEvents();
    const event = {
        id: crypto.randomBytes(4).toString('hex'),
        groupKey: eventData.groupKey,
        name: eventData.name,
        curator: eventData.curator,
        description: eventData.description,
        eventType: eventData.eventType, // "one_time" или "recurring"
        // Для одноразовых евентов
        eventDate: eventData.eventDate || null,
        startTime: eventData.startTime || null,
        endTime: eventData.endTime || null,
        // Для повторяющихся евентов
        startDate: eventData.startDate || null,
        daysOfWeek: eventData.daysOfWeek || null,
        // Если используется times, можно его передать
        times: eventData.times || null,
        deleteAfter: eventData.deleteAfter || null,
        notifications: {} // { userId: { pre: false, start: false, end: false } }
    };
    events.push(event);
    saveEvents(events);
    return event;
}

function editEvent(updatedEvent) {
    const events = loadEvents();
    const index = events.findIndex(e => e.id === updatedEvent.id);
    if (index !== -1) {
        events[index] = updatedEvent;
        saveEvents(events);
        return true;
    }
    return false;
}

function deleteEvent(eventId) {
    let events = loadEvents();
    const initialLength = events.length;
    events = events.filter(e => e.id !== eventId);
    if (events.length !== initialLength) {
        saveEvents(events);
        return true;
    }
    return false;
}

function getEventsByGroup(groupKey) {
    const events = loadEvents();
    return events.filter(e => e.groupKey === groupKey);
}

function getAllEvents() {
    return loadEvents();
}

/**
 * Помечает, что для данного евента уведомление типа notificationType отправлено пользователю userId.
 * notificationType: 'pre', 'start', 'end'
 */
function markUserNotified(eventId, userId, notificationType) {
    const events = loadEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    if (!event.notifications[userId]) {
        event.notifications[userId] = { pre: false, start: false, end: false };
    }
    event.notifications[userId][notificationType] = true;
    saveEvents(events);
}

/**
 * Проверяет, было ли уведомление типа notificationType отправлено пользователю userId.
 */
function hasUserBeenNotified(event, userId, notificationType) {
    if (!event.notifications[userId]) return false;
    return event.notifications[userId][notificationType];
}

module.exports = {
    addEvent,
    editEvent,
    deleteEvent,
    getEventsByGroup,
    getAllEvents,
    markUserNotified,
    hasUserBeenNotified
};
