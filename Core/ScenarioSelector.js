// Core/ScenarioSelector.js
class ScenarioSelector {
    constructor() {
        this.rules = []; // Массив объектов вида { scenario, condition }
        this.defaultScenario = null;
    }

    /**
     * Регистрирует сценарий с условием.
     * @param {Scenario} scenario
     * @param {(chatId: number) => boolean} condition
     */
    register(scenario, condition) {
        this.rules.push({ scenario, condition });
    }

    setDefault(scenario) {
        this.defaultScenario = scenario;
    }

    getScenarioForUser(chatId) {
        for (const rule of this.rules) {
            if (rule.condition(chatId)) {
                return rule.scenario;
            }
        }
        return this.defaultScenario;
    }
}

module.exports = { ScenarioSelector };
