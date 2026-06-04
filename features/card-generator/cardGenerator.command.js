const {getBinInfo} = require('../../services/bin.service');

function registerCardGenerator(bot) {
bot.command('gen', async (ctx) => {
    const fullInput = ctx.message.text.split(' ').slice(1).join(' ').trim();
    const user = ctx.from;
    
    if (!fullInput) {
        return ctx.reply(
`⚠️ GU CHKR | Error
━━━━━━━━━━━━━━━━━━━━
❌ Format required: BIN|mes|año|cvv cantidad
━━━━━━━━━━━━━━━━━━━━
👤 Req By: ${user.first_name}
🔥 Bot Version: alpha 1`);
    }
    
    try {
        const params = parseInput(fullInput);
        const binInfo = await getBinInfo(params.baseBin);
        
        // Crear sesión RE-GEN
        const sessionId = user.id + '_' + Date.now().toString(36);
        userSessions.set(sessionId, {
            userId: user.id,
            params: params,
            timestamp: Date.now()
        });
        
        // Limpiar viejas
        const now = Date.now();
        for (let [key, val] of userSessions.entries()) {
            if (now - val.timestamp > 3600000) userSessions.delete(key);
        }
        
        const cards = generateCards(params);
        
        // Construir mensaje en formato exacto solicitado
        let text = `⚡ GU CHKR | CC Generator\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `Format: <code>${params.originalInput}</code>\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        
        // Lista de tarjetas en formato: numero|mes|año|cvv
        cards.forEach((card) => {
            text += `<code>${card.number}|${card.month}|${card.year}|${card.cvv}</code>\n`;
        });
        
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `➡️ Info: <code>${(binInfo.scheme || 'Unknown').toUpperCase()} - ${(binInfo.type || 'Unknown').toUpperCase()}</code>\n`;
        text += `➡️ Issuer: <code>${binInfo.bank?.name || 'Unknown'} - ${(binInfo.type || 'Unknown').toUpperCase()}</code>\n`;
        text += `➡️ Country: <code>${binInfo.country?.name || 'Unknown'} ${binInfo.country?.emoji || '🏳️'}</code>\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `👤 Req By: ${user.first_name}\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🔥 Bot Version: alpha 1`;
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 RE-GEN', `regen_${sessionId}`)]
        ]);
        
        await ctx.reply(text, keyboard);
        
    } catch (error) {
        ctx.reply(
`⚡ GU CHKR | Error
━━━━━━━━━━━━━━━━━━━━
❌ ${error.message}
━━━━━━━━━━━━━━━━━━━━
👤 Req By: ${user.first_name}
🔥 Bot Version: alpha 1`);
    }
});
}

module.exports = { registerCardGenerator };
