const { saveUser, saveMessage } = require('../database/db');

function registerLogger(bot) {
    bot.use(async (ctx, next) => {
        try {
            if (ctx.from) saveUser(ctx.from);
            saveMessage(ctx);
        } catch (error) {
            console.error('Error guardando actividad:', error);
        }
        return next();
    });
}

module.exports = { registerLogger };