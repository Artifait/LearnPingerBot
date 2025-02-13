// Core/Scenario.js
class Scenario {
    /**
     * @param {string} scenarioId – уникальный идентификатор сценария
     */
    constructor(scenarioId) {
        this.scenarioId = scenarioId;
        this.blocks = {}; // Хранит зарегистрированные блоки: { blockId: HandlerBlock }
        this.initialBlock = null;
    }

    registerInitialBlock(block) {
        this.blocks[block.blockId] = block;
        this.initialBlock = block;
    }

    registerBlock(block) {
        if (this.blocks[block.blockId])
            throw new Error(`Блок с ID ${block.blockId} уже зарегистрирован`);
        this.blocks[block.blockId] = block;
    }

    /**
     * Возвращает клон блока по его идентификатору.
     */
    getBlock(id) {
        const block = this.blocks[id];
        if (!block) {
            throw new Error(`Блок с ID ${id} не найден`);
        }
        return block.clone();
    }
}

module.exports = { Scenario };
