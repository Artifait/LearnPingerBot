// Core/Data/UserState.js
class UserState {
    /**
     * @param {string} currentCompositeBlockId
     * @param {object} compositeBlockState
     * @param {object} context
     */
    constructor(currentCompositeBlockId, compositeBlockState, context) {
        this.currentCompositeBlockId = currentCompositeBlockId;
        this.compositeBlockState = compositeBlockState;
        this.context = context;
    }

    serialize() {
        return JSON.stringify(this);
    }

    static deserialize(json) {
        const obj = JSON.parse(json);
        return new UserState(obj.currentCompositeBlockId, obj.compositeBlockState, obj.context);
    }
}

module.exports = { UserState };
