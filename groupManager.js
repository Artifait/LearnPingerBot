// groupManager.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const groupsFilePath = path.join(__dirname, 'groups.json');

function loadGroups() {
    if (!fs.existsSync(groupsFilePath)) {
        fs.writeFileSync(groupsFilePath, JSON.stringify([]));
    }
    const data = fs.readFileSync(groupsFilePath);
    try {
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function saveGroups(groups) {
    fs.writeFileSync(groupsFilePath, JSON.stringify(groups, null, 2));
}

function createGroup(group) {
    const groups = loadGroups();
    group.key = crypto.randomBytes(4).toString('hex');
    group.members = [group.creatorId];
    groups.push(group);
    saveGroups(groups);
    return group;
}

function joinGroup(userId, key) {
    const groups = loadGroups();
    const group = groups.find(g => g.key === key);
    if (!group) return null;
    if (!group.members.includes(userId)) {
        group.members.push(userId);
    }
    saveGroups(groups);
    return group;
}

function getGroupsByUser(userId) {
    const groups = loadGroups();
    return groups.filter(g => g.members.includes(userId));
}

function getCreatedGroups(userId) {
    const groups = loadGroups();
    return groups.filter(g => g.creatorId === userId);
}

/**
 * Получает полную информацию о группе по её ключу.
 */
function getGroupByKey(groupKey) {
    const groups = loadGroups();
    return groups.find(g => g.key === groupKey);
}

/**
 * Формирует уникальное отображаемое имя группы.
 * Если групп с таким именем несколько, добавляет минимальный суффикс ключа с начала,
 * достаточный для обеспечения уникальности.
 */
function getUniqueGroupDisplayName(group) {
    const groups = loadGroups();
    const sameNameGroups = groups.filter(g => g.name === group.name);
    if (sameNameGroups.length === 1) {
        return group.name;
    }

    const key = group.key;
    // Перебираем от 1 до полной длины ключа
    for (let i = 1; i <= key.length; i++) {
        const suffix = key.slice(0, i); // Берём начало ключа от 1 до i символов
        // Проверяем, есть ли среди других групп с таким же именем совпадающий суффикс
        const conflict = sameNameGroups.some(g => g.key !== key && g.key.slice(0, i) === suffix);
        if (!conflict) {
            return `${group.name}:${suffix}`;
        }
    }
    // На всякий случай, если не нашли уникального суффикса, возвращаем полное имя с ключом
    return `${group.name}:${key}`;
}



const currentGroupsFile = path.join(__dirname, 'currentGroups.json');
function loadCurrentGroups() {
    if (!fs.existsSync(currentGroupsFile)) {
        fs.writeFileSync(currentGroupsFile, JSON.stringify({}));
    }
    const data = fs.readFileSync(currentGroupsFile);
    try {
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

function saveCurrentGroups(obj) {
    fs.writeFileSync(currentGroupsFile, JSON.stringify(obj, null, 2));
}

function setCurrentGroup(userId, groupKey) {
    const currentGroups = loadCurrentGroups();
    currentGroups[userId] = groupKey;
    saveCurrentGroups(currentGroups);
}

function getCurrentGroup(userId) {
    const currentGroups = loadCurrentGroups();
    return currentGroups[userId] || null;
}

/**
 * Удаляет группу, если пользователь является её создателем.
 * Если группа удалена, также сбрасывается текущая группа для пользователя.
 * @param {number} userId - идентификатор пользователя
 * @param {string} groupKey - ключ группы
 * @returns {object} - { success: boolean, message?: string }
 */
function deleteGroup(userId, groupKey) {
    const groups = loadGroups();
    const index = groups.findIndex(g => g.key === groupKey);
    if (index === -1) {
        return { success: false, message: "Группа не найдена." };
    }
    const group = groups[index];
    if (group.creatorId !== userId) {
        return { success: false, message: "Удалять можно только созданные группы." };
    }
    groups.splice(index, 1);
    saveGroups(groups);

    // Если эта группа была установлена как текущая для пользователя, сбрасываем её
    const currentGroups = loadCurrentGroups();
    if (currentGroups[userId] === groupKey) {
        delete currentGroups[userId];
        saveCurrentGroups(currentGroups);
    }
    return { success: true };
}

module.exports = {
    createGroup,
    joinGroup,
    getGroupsByUser,
    getCreatedGroups,
    setCurrentGroup,
    getCurrentGroup,
    getGroupByKey,
    getUniqueGroupDisplayName,
    deleteGroup
};
