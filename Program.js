// Program.js
const { BotEngine } = require('./Core/BotEngine');
const { Scenario } = require('./Core/Scenario');
const { ScenarioSelector } = require('./Core/ScenarioSelector');
const { UserStateContext } = require('./Core/Data/UserStateContext');
const { MainMenuBlock } = require('./Core/Blocks/MainMenuBlock');
const { ViewScheduleBlock } = require('./Core/Blocks/ViewScheduleBlock');
const { EditScheduleBlock } = require('./Core/Blocks/EditScheduleBlock');
const { SettingsBlock } = require('./Core/Blocks/SettingsBlock');
const { CreateGroupBlock } = require('./Core/Blocks/CreateGroupBlock');
const { JoinGroupBlock } = require('./Core/Blocks/JoinGroupBlock');
const { GroupsInfoBlock } = require('./Core/Blocks/GroupsInfoBlock');
const { SwitchGroupBlock } = require('./Core/Blocks/SwitchGroupBlock');
const { DeleteGroupBlock } = require("./Core/Blocks/DeleteGroupBlock");
const {CreateEventBlock} = require("./Core/Blocks/CreateEventBlock");
const {CreateOneTimeEventBlock} = require("./Core/Blocks/CreateOneTimeEventBlock");
const {CreateRecurringEventBlock} = require("./Core/Blocks/CreateRecurringEventBlock");
const { startNotificationScheduler } = require('./notificationScheduler');

// Создаём сценарий с уникальным идентификатором
const defaultScenario = new Scenario("default");

// Регистрируем стартовый блок – главное меню
defaultScenario.registerInitialBlock(new MainMenuBlock());

// Регистрируем остальные блоки
defaultScenario.registerBlock(new ViewScheduleBlock());
defaultScenario.registerBlock(new EditScheduleBlock());
defaultScenario.registerBlock(new SettingsBlock());
defaultScenario.registerBlock(new CreateGroupBlock());
defaultScenario.registerBlock(new JoinGroupBlock());
defaultScenario.registerBlock(new GroupsInfoBlock());
defaultScenario.registerBlock(new SwitchGroupBlock());
defaultScenario.registerBlock(new DeleteGroupBlock());
defaultScenario.registerBlock(new CreateEventBlock());
defaultScenario.registerBlock(new CreateOneTimeEventBlock());
defaultScenario.registerBlock(new CreateRecurringEventBlock());

const token = "YOUR_TOKEN";
if(token === "YOUR_TOKEN")
{
    console.log("Пожалуйста, укажите токен вашего бота.(39 строка в Program.js)");
    process.exit(0);
}

// Для простоты все пользователи используют один сценарий
const scenarioSelector = new ScenarioSelector();
scenarioSelector.setDefault(defaultScenario);

// Инициализируем базу для хранения состояний пользователей (SQLite)
const userStateContext = new UserStateContext();
userStateContext.initialize().then(() => {
    const botEngine = new BotEngine(scenarioSelector, userStateContext);

    botEngine.startBot(token).then(() => {
        // После старта бота запускаем планировщик уведомлений.
        const getNotificationOffset = (userId) => {
            // Используем настройки для каждого пользователя
            return require('./notificationsSettingsManager').getNotificationOffset(userId);
        };

        // Запускаем планировщик уведомлений для каждого пользователя, передавая их id
        startNotificationScheduler(botEngine.bot, getNotificationOffset);
    }).catch(err => {
        console.error("Ошибка при старте бота:", err);
    });
});
