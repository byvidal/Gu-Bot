const {getBinInfo} = require('../../services/bin.service');
const {parseInput} = require('./cardGenerator.parser');
const {generateCards} = require('./cardGenerator.service');
const { Markup } = require('telegraf');
const {userSessions} = require('./cardGenerator.session');

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
        let //text = `━━━━━━━━━━━━━━━━━━━━\n`;
        text = `⚡ GU Generator\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        
        // Lista de tarjetas en formato: numero|mes|año|cvv
        cards.forEach((card) => {
            text += `${card.number}|${card.month}|${card.year}|${card.cvv}\n`;
        });
        
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `Info: ${(binInfo.scheme || 'Unknown').toUpperCase()} - ${(binInfo.type || 'Unknown').toUpperCase()}\n`;
        text += `Issuer: ${binInfo.bank?.name || 'Unknown'} - ${(binInfo.type || 'Unknown').toUpperCase()}\n`;
        text += `Country: ${binInfo.country?.name || 'Unknown'} ${binInfo.country?.emoji || '🏳️'}\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `👤 Req By: ${user.first_name}\n`;
        
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
