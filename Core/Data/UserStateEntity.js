// Core/Data/UserStateEntity.js
class UserStateEntity {
    /**
     * @param {number} chatId
     * @param {string} scenarioId
     * @param {string} stateJson
     */
    constructor(chatId, scenarioId, stateJson) {
        this.chatId = chatId;
        this.scenarioId = scenarioId;
        this.stateJson = stateJson;
    }
}

module.exports = { UserStateEntity };
