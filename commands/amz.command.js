const amazonChecker = require('../services/amazon.checker.service');
const parser = require('../features/amazon-checker/amazonChecker.parser');

module.exports = (bot) => {
  bot.command(['amz', 'amazon'], async (ctx) => {
    const user = ctx.from;
    
    if (!ctx.message.reply_to_message) {
      return ctx.reply(
        '⚡ GU CHKR | Amazon Checker\n' +
        '━━━━━━━━━━━━━━━━━━━━\n' +
        '❌ Responde a un mensaje con tarjetas\n\n' +
        'Uso: /amz us (responde al mensaje de tarjetas)'
      );
    }

    try {
      const cmd = parser.parseCommand(ctx.message.text);
      const cards = parser.parseCardsFromText(ctx.message.reply_to_message.text);
      
      if (cards.length === 0) {
        return ctx.reply('❌ No se encontraron tarjetas válidas');
      }

      if (cards.length > 50) {
        return ctx.reply('❌ Máximo 50 tarjetas por check. Divide en lotes.');
      }

      // Mensaje de progreso
      const statusMsg = await ctx.reply(
        `⏳ Iniciando check de ${cards.length} tarjetas...\n` +
        `🌎 Región: ${cmd.region.toUpperCase()}\n` +
        `⏱️ Estimado: ${Math.ceil(cards.length * 20 / 60)} minutos`
      );

      const results = [];
      let liveCount = 0;
      let deadCount = 0;

      // Procesar secuencialmente con delay
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        
        // Actualizar progreso cada 5 tarjetas
        if (i % 5 === 0) {
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            `⏳ Progreso: ${i}/${cards.length}\n` +
            `✅ LIVE: ${liveCount} | ❌ DEAD: ${deadCount}\n` +
            `🔄 Proxy: ${i + 1}/${cards.length}`
          ).catch(() => {});
        }

        // Check real
        const result = await amazonChecker.checkCard(card, cmd.region);
        results.push({ ...card, check: result });
        
        if (result.status === 'LIVE') liveCount++;
        else if (result.status === 'DEAD') deadCount++;

        // Delay entre checks (15 segundos)
        if (i < cards.length - 1) {
          await new Promise(r => setTimeout(r, 15000));
        }
      }

      // Borrar mensaje de progreso
      await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id)
        .catch(() => {});

      // Enviar resultados formateados
      const formatted = formatResults(results, cmd.region, liveCount, deadCount, user);
      await ctx.reply({ text: formatted, parse_mode: 'HTML' });

    } catch (error) {
      console.error('Check error:', error);
      ctx.reply(`❌ Error: ${error.message}`);
    }
  });
};

function formatResults(results, region, liveCount, deadCount, user) {
  let text = `⚡ GU CHKR | Amazon Checker\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Región: ${region.toUpperCase()}\n`;
  text += `Total: ${results.length} | ✅ LIVE: ${liveCount} | ❌ DEAD: ${deadCount}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  const lives = results.filter(r => r.check.status === 'LIVE');
  const deads = results.filter(r => r.check.status === 'DEAD');

  if (lives.length > 0) {
    text += `✅ LIVE CARDS:\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    lives.forEach(c => {
      text += `\${c.number}|${c.month}|${c.year}|${c.cvv}\\n`;
      text += `↳ ${c.check.message}\n\n`;
    });
  }

  if (deads.length > 0) {
    text += `❌ DEAD CARDS:\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    deads.forEach(c => {
      text += `\${c.number}|${c.month}|${c.year}|${c.cvv}\\n`;
      text += `↳ ${c.check.message}\n\n`;
    });
  }

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👤 Req By: ${user.first_name}\n`;

  return text;
}