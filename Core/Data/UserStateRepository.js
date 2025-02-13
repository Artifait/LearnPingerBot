// Core/Data/UserStateRepository.js
const { UserState } = require('./UserState');

class UserStateRepository {
    /**
     * @param {UserStateContext} userStateContext
     */
    constructor(userStateContext) {
        this.db = userStateContext.db;
    }

    /**
     * Получает состояние пользователя.
     * @param {number} chatId
     * @param {string} scenarioId
     * @returns {Promise<UserState|null>}
     */
    getUserStateAsync(chatId, scenarioId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT StateJson FROM UserStates WHERE ChatId = ? AND ScenarioId = ?`;
            this.db.get(query, [chatId, scenarioId], (err, row) => {
                if (err) return reject(err);
                if (!row) return resolve(null);
                try {
                    const userState = UserState.deserialize(row.StateJson);
                    resolve(userState);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    /**
     * Сохраняет или обновляет состояние пользователя.
     * @param {number} chatId
     * @param {string} scenarioId
     * @param {object} state – объект состояния (к примеру, { currentCompositeBlockId, compositeBlockState, context })
     */
    saveOrUpdateUserStateAsync(chatId, scenarioId, state) {
        return new Promise((resolve, reject) => {
            const serializedState = JSON.stringify(state);
            const updateQuery = `UPDATE UserStates SET StateJson = ? WHERE ChatId = ? AND ScenarioId = ?`;
            const self = this; // сохраняем репозиторий для дальнейшего использования
            this.db.run(updateQuery, [serializedState, chatId, scenarioId], function (err) {
                if (err) return reject(err);
                // здесь this – объект statement, предоставляемый sqlite3
                if (this.changes === 0) {
                    const insertQuery = `INSERT INTO UserStates (ChatId, ScenarioId, StateJson) VALUES (?, ?, ?)`;
                    self.db.run(insertQuery, [chatId, scenarioId, serializedState], function (err2) {
                        if (err2) return reject(err2);
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        });
    }



    /**
     * Удаляет состояние пользователя.
     * @param {number} chatId
     * @param {string} scenarioId
     */
    deleteUserStateAsync(chatId, scenarioId) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM UserStates WHERE ChatId = ? AND ScenarioId = ?`;
            this.db.run(query, [chatId, scenarioId], function (err) {
                if (err) return reject(err);
                resolve();
            });
        });
    }
}

module.exports = { UserStateRepository };
