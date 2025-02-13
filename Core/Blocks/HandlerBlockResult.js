// Core/Blocks/HandlerBlockResult.js
class HandlerBlockResult {
    /**
     * @param {'IsContinue'|'IsError'|'IsEnd'} resultState
     * @param {string|null} errorMessage
     * @param {object} data
     * @param {string|null} nextBlockId
     */
    constructor(resultState, errorMessage = null, data = {}, nextBlockId = null) {
        this.resultState = resultState;
        this.errorMessage = errorMessage;
        this.data = data;
        this.nextBlockId = nextBlockId;
    }

    static error(message, data = {}) {
        return new HandlerBlockResult('IsError', message, data);
    }

    static end(nextBlockId = null, data = {}) {
        return new HandlerBlockResult('IsEnd', null, data, nextBlockId);
    }

    static cont(data = {}) {
        return new HandlerBlockResult('IsContinue', null, data);
    }
}

module.exports = { HandlerBlockResult };
