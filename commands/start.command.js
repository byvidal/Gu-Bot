// ============================================
// BOT TELEGRAF
// ============================================

const { getUserInfo } = require('../services/user.service');
const { buildWelcomeMessage } = require('../messages/welcome.message');
const { mainKeyboard } = require('../keyboards/main.keyboard');

function registerStartCommand(bot) {
  bot.command("start", async (ctx) => {
    const user = ctx.from;
    const userInfo = await getUserInfo(user.id);

    await ctx.reply(buildWelcomeMessage(user, ctx, userInfo),
  mainKeyboard);
  });
}

module.exports = {registerStartCommand};