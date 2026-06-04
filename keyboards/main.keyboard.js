const { Markup } = require('telegraf');

const mainKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('Gateways', 'menu:gateways'),
    Markup.button.callback('Comandos', 'menu:commands'),
  ],
  [
    Markup.button.callback('Precios', 'menu:prices'),
    Markup.button.callback('Cerrar', 'menu:close'),
  ],
]);

module.exports = { mainKeyboard };
