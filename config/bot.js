const { Telegraf } = require('telegraf');

if (!process.env.BOT_TOKEN) {
  throw new Error('Falta BOT_TOKEN en el archivo .env');
}

const bot = new Telegraf(process.env.BOT_TOKEN);

module.exports = { bot };
