require('dotenv').config();

const { bot } = require('./config/bot');
const { registerStartCommand } = require('./commands/start.command');
const { registerMenuActions } = require('./actions/menu.actions');
const { registerCloseAction } = require('./actions/close.action');
const { registerErrorHandler } = require('./utils/errorHandler');

// Si decides mantener tu comando de tarjetas, regístralo aquí:
const { registerCardGenerator } = require('./features/card-generator/cardGenerator.command');
const { registerRegenAction } = require('./features/card-generator/regen.action');

registerStartCommand(bot);
registerMenuActions(bot);
registerCloseAction(bot);
registerErrorHandler(bot);

registerCardGenerator(bot);
registerRegenAction(bot);

bot.launch();
console.log('Bot iniciado');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
