function registerErrorHandler(bot) {
  bot.catch((err, ctx) => {
    console.error('Error en el bot:', err);
  });
}

module.exports = { registerErrorHandler };
