const { buildGatewaysMessage } = require('../messages/gateways.message');
const { buildCommandsMessage } = require('../messages/commands.message');
const { buildPricesMessage } = require('../messages/prices.message');

function registerMenuActions(bot) {
  bot.action('menu:gateways', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(buildGatewaysMessage());
  });

  bot.action('menu:commands', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(buildCommandsMessage());
  });

  bot.action('menu:prices', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(buildPricesMessage());
  });
}

module.exports = { registerMenuActions };
