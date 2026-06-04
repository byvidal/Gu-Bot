// Handler RE-GEN
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
        
            let text = `⚡ GU CHK | CC Generator\n`;
            text += `━━━━━━━━━━━━━━━━━━━━\n`;
            text += `Format: <code>${params.originalInput}</code>\n`;
            text += `━━━━━━━━━━━━━━━━━━━━\n`;
        
            cards.forEach((card) => {
                text += `${card.number}|${card.month}|${card.year}|${card.cvv}\n`;
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
        
            await ctx.editMessageText(text, keyboard);
        
        } catch (error) {
            ctx.reply('❌ Error: ' + error.message);
        }
    });
}

module.exports = {registerRegenAction };