// Handler RE-GEN
const {userSessions} = require('./cardGenerator.session');
const { getBinInfo } = require('../../services/bin.service');
const { generateCards } = require('./cardGenerator.service');
const { Markup } = require('telegraf');

function registerRegenAction(bot){
    bot.action(/^regen_(.+)$/, async (ctx) => {
        const sessionId = ctx.match[1];
        const session = userSessions.get(sessionId);
        const user = ctx.from;
    
        if (!session) {
            return ctx.answerCbQuery('❌ Session expired', { show_alert: true });
        }
    
        if (session.userId !== user.id) {
            return ctx.answerCbQuery('⛔ Not your session', { show_alert: true });
        }
    
        await ctx.answerCbQuery('🔄 Regenerating...');
    
        try {
            session.timestamp = Date.now();
            const params = session.params;
            const binInfo = await getBinInfo(params.baseBin);
            const cards = generateCards(params);
        
            let text = `⚡ GU Generator\n`;
            text += `━━━━━━━━━━━━━━━━━━━━\n`;
            
            cards.forEach((card) => {
                text += `<code>${card.number}|${card.month}|${card.year}|${card.cvv}</code>\n`;
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
        
            await ctx.editMessageText(text, {
                parse_mode: 'HTML',
                ...keyboard
            });
        
        } catch (error) {
            ctx.reply('❌ Error: ' + error.message);
        }
    });
}

module.exports = {registerRegenAction };