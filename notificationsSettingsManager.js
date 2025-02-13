// notificationsSettingsManager.js
const fs = require('fs');
const path = require('path');

const settingsFilePath = path.join(__dirname, 'notificationsSettings.json');

function loadSettings() {
    if (!fs.existsSync(settingsFilePath)) {
        fs.writeFileSync(settingsFilePath, JSON.stringify({}));
    }
    const data = fs.readFileSync(settingsFilePath);
    try {
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

function saveSettings(settings) {
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
}

/**
 * Получает время уведомления (в минутах) для пользователя.
 * Если настройки отсутствуют, возвращается значение по умолчанию (10 минут).
 * @param {number} userId
 * @returns {number}
 */
function getNotificationOffset(userId) {
    const settings = loadSettings();
    return settings[userId] || 10;
}

/**
 * Устанавливает время уведомления (в минутах) для пользователя.
 * @param {number} userId
 * @param {number} offset
 */
function setNotificationOffset(userId, offset) {
    const settings = loadSettings();
    settings[userId] = offset;
    saveSettings(settings);
}

module.exports = { getNotificationOffset, setNotificationOffset };
