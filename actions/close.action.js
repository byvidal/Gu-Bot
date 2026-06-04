function registerCloseAction(bot) {
  bot.action('menu:close', async (ctx) => {
    await ctx.answerCbQuery('Cerrado');
    await ctx.deleteMessage().catch(() => {});
  });
}

module.exports = { registerCloseAction };
