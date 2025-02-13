// Core/Data/UserStateContext.js
const sqlite3 = require('sqlite3').verbose();

class UserStateContext {
    /**
     * @param {string} dbPath – путь к файлу базы данных
     */
    constructor(dbPath = 'userstates.db') {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) console.error("Ошибка открытия базы данных:", err.message);
        });
    }

    /**
     * Создаёт таблицу, если её ещё нет.
     */
    async initialize() {
        const query = `
      CREATE TABLE IF NOT EXISTS UserStates (
        ChatId INTEGER NOT NULL,
        ScenarioId TEXT NOT NULL,
        StateJson TEXT,
        PRIMARY KEY (ChatId, ScenarioId)
      )
    `;
        return new Promise((resolve, reject) => {
            this.db.run(query, function (err) {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = { UserStateContext };
