// Core/BotEngine.js
const TelegramBot = require('node-telegram-bot-api');
const { BlockExecutionContext } = require('./Blocks/BlockExecutionContext');
const { UserStateRepository } = require('./Data/UserStateRepository');

// Core/BotEngine.js
class BotEngine {
    constructor(scenarioSelector, userStateContext) {
        this.scenarioSelector = scenarioSelector;
        this.userStateContext = userStateContext; // обёртка для доступа к БД
        this.stateRepository = new UserStateRepository(this.userStateContext);
        this.bot = null;
        this.Logger = async (message, messageType = 'Information') => {
            console.log(`[${messageType}]: ${message}`);
        };
    }

    async startBot(token) {
        // Инициализируем бота с long polling
        this.bot = new TelegramBot(token, { polling: true });

        // Обработка входящих сообщений
        this.bot.on('message', async (msg) => {
            try {
                await this.handleUpdate({ message: msg });
            } catch (error) {
                if (this.Logger) await this.Logger("Ошибка: " + error.message, 'Errore');
            }
        });

        // Обработка CallbackQuery
        this.bot.on('callback_query', async (callbackQuery) => {
            try {
                await this.handleUpdate({ callback_query: callbackQuery });
            } catch (error) {
                if (this.Logger) await this.Logger("Ошибка: " + error.message, 'Errore');
            }
        });

        const me = await this.bot.getMe();
        console.log(`@${me.username} запущен. Для завершения нажмите CTRL+C.`);
    }

    async handleUpdate(update) {
        if(update.message == null && update.callback_query == null)
            return;

        let chatId, username, receivedText;
        if (update.message) {
            chatId = update.message.chat.id;
            username = update.message.from.username || update.message.from.first_name;
            receivedText = update.message.text;
        } else if (update.callback_query) {
            chatId = update.callback_query.message.chat.id;
            username = update.callback_query.from.username || update.callback_query.from.first_name;
            receivedText = `callbackData: ${update.callback_query.data}`;
        }
        if (this.Logger) await this.Logger(`[From: ${username}, Received: ${receivedText}]`);

        // Выбор сценария для пользователя
        const scenario = this.scenarioSelector.getScenarioForUser(chatId);
        const scenarioId = scenario.scenarioId;

        // Получаем сохранённое состояние (если есть)
        let userState = await this.stateRepository.getUserStateAsync(chatId, scenarioId);
        const context = new BlockExecutionContext();
        context.chatId = chatId;
        // Если пришёл callback, сохраняем message_id для редактирования
        if (update.callback_query) {
            context.callbackMessageId = update.callback_query.message.message_id;
        }
        let currentBlock;

        if (!userState) {
            // Если состояние отсутствует, выбираем стартовый блок
            currentBlock = scenario.initialBlock;
            currentBlock.Logger = this.Logger;
            await currentBlock.enterAsync(context, this.bot);
            // Сохраняем состояние
            const newState = {
                currentCompositeBlockId: currentBlock.blockId,
                compositeBlockState: currentBlock.captureState(),
                context: context.state
            };
            await this.stateRepository.saveOrUpdateUserStateAsync(chatId, scenarioId, newState);
            return;
        } else {
            // Восстанавливаем блок по его Id и применяем сохранённое состояние
            currentBlock = scenario.getBlock(userState.currentCompositeBlockId);
            currentBlock.Logger = this.Logger;
            currentBlock.applyState(userState.compositeBlockState);
            context.state = userState.context;
        }

        let result = null;
        if (update.message) {
            result = await currentBlock.handleAsync(update.message, context, this.bot);
        } else if (update.callback_query) {
            result = await currentBlock.handleCallbackAsync(update.callback_query, context, this.bot);
        }

        if (!result) {
            if (this.Logger) await this.Logger(`Нету результата от блока: ${currentBlock.blockId}`, 'Warning');
            return;
        }

        // Обработка результата работы блока
        switch (result.resultState) {
            case 'IsError':
                if (this.Logger) await this.Logger(`[From: ${username}, On Block: ${currentBlock.blockId}] -> ${result.errorMessage}`, 'Errore');
                await this.bot.sendMessage(chatId, `Ошибка: ${result.errorMessage}`);
                break;
            case 'IsContinue':
            {
                const newState = {
                    currentCompositeBlockId: currentBlock.blockId,
                    compositeBlockState: currentBlock.captureState(),
                    context: context.state
                };
                await this.stateRepository.saveOrUpdateUserStateAsync(chatId, scenarioId, newState);
            }
                break;
            case 'IsEnd':
                currentBlock.onEnd();
                await this.stateRepository.deleteUserStateAsync(chatId, scenarioId);
                if (result.nextBlockId) {
                    const newState = {
                        currentCompositeBlockId: result.nextBlockId,
                        compositeBlockState: {}, // начальное состояние для нового блока
                        context: result.data
                    };
                    currentBlock = scenario.getBlock(result.nextBlockId);
                    currentBlock.Logger = this.Logger;
                    await currentBlock.enterAsync(context, this.bot);
                    await this.stateRepository.saveOrUpdateUserStateAsync(chatId, scenarioId, newState);
                }
                break;
        }

        if (update.callback_query) {
            // Отвечаем на CallbackQuery, чтобы убрать "часики" у пользователя
            await this.bot.answerCallbackQuery(update.callback_query.id);
        }
    }
}

module.exports = { BotEngine };
