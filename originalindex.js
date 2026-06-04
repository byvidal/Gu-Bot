require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const userSessions = new Map();

// ============================================
// SISTEMA DE USUARIOS (Placeholder - conecta tu DB aquí)
// ============================================

async function getUserInfo(userId) {
    // TODO: Conectar a tu base de datos
    // Placeholder - reemplaza con tu lógica real
    return {
        subscription: 'Free', // Free, Premium, VIP, etc.
        credits: 100,
        rank: 'Member', // Member, Admin, Owner, etc.
        generated: 1500
    };
}

// ============================================
// UTILIDADES LUHN
// ============================================

function generateLuhnDigit(number) {
    let sum = 0;
    let alternate = true;
    for (let i = number.length - 1; i >= 0; i--) {
        let n = parseInt(number.substring(i, i + 1));
        if (alternate) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        alternate = !alternate;
    }
    return (10 - (sum % 10)) % 10;
}

function generateFromPattern(baseBin, variablePart) {
    let result = baseBin;
    for (let char of variablePart) {
        const lower = char.toLowerCase();
        if (lower === 'x' || lower === 'r' || lower === 'd' || lower === 'n') {
            result += Math.floor(Math.random() * 10);
        } else if (/^\d$/.test(char)) {
            result += char;
        } else {
            result += Math.floor(Math.random() * 10);
        }
    }
    return result;
}

function completeCardNumber(prefix) {
    const isAmex = prefix.startsWith('34') || prefix.startsWith('37');
    const targetLength = isAmex ? 15 : 16;
    let number = prefix;
    
    while (number.length < targetLength - 1) {
        number += Math.floor(Math.random() * 10);
    }
    
    if (number.length >= targetLength) {
        number = number.substring(0, targetLength - 1);
    }
    
    const checkDigit = generateLuhnDigit(number);
    return number + checkDigit;
}

function generateCVV(isAmex) {
    const length = isAmex ? 4 : 3;
    let cvv = '';
    for (let i = 0; i < length; i++) {
        cvv += Math.floor(Math.random() * 10);
    }
    return cvv;
}

// ============================================
// API BINLIST
// ============================================

async function getBinInfo(bin) {
    try {
        const binClean = bin.toString().substring(0, 8);
        const response = await axios.get(`https://lookup.binlist.net/${binClean}`, {
            headers: { 'Accept-Version': '3' },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        return {
            scheme: detectCardType(bin),
            type: 'unknown',
            brand: 'unknown',
            bank: { name: 'Unknown' },
            country: { name: 'Unknown', emoji: '🏳️' }
        };
    }
}

function detectCardType(bin) {
    const first = bin[0];
    const firstTwo = parseInt(bin.substring(0, 2));
    
    if (first === '4') return 'visa';
    if ((firstTwo >= 51 && firstTwo <= 55) || (firstTwo >= 2221 && firstTwo <= 2720)) return 'mastercard';
    if (firstTwo === 34 || firstTwo === 37) return 'amex';
    if (firstTwo === 65 || bin.substring(0, 4) === '6011') return 'discover';
    return 'unknown';
}

// ============================================
// PARSER
// ============================================

function parseInput(fullInput) {
    const trimmed = fullInput.trim();
    const spaceParts = trimmed.split(/\s+/);
    const mainPart = spaceParts[0];
    const quantityPart = spaceParts[1];
    
    let quantity = 10;
    if (quantityPart) {
        const parsedQty = parseInt(quantityPart);
        if (!isNaN(parsedQty) && parsedQty > 0) {
            quantity = Math.min(parsedQty, 50);
        }
    }
    
    const pipeParts = mainPart.split('|').map(p => p.trim());
    
    if (pipeParts.length < 3) {
        throw new Error('Formato: BIN|mes|año|cvv cantidad');
    }
    
    const fullBin = pipeParts[0];
    if (!/^\d{6}/.test(fullBin)) {
        throw new Error('Los primeros 6 caracteres deben ser dígitos numéricos');
    }
    
    const baseBin = fullBin.substring(0, 6);
    const variablePart = fullBin.substring(6);
    
    // Mes
    let monthInput = pipeParts[1].toLowerCase();
    let finalMonth;
    if (monthInput === 'xx' || monthInput === 'rdn' || monthInput === 'x') {
        finalMonth = 'random';
    } else {
        finalMonth = parseInt(monthInput);
        if (isNaN(finalMonth) || finalMonth < 1 || finalMonth > 12) {
            finalMonth = 'random';
        }
    }
    
    // Año
    let yearInput = pipeParts[2].toLowerCase();
    let finalYear;
    if (yearInput === 'xx' || yearInput === 'xxxx' || yearInput === 'rdn' || yearInput === 'x') {
        finalYear = 'random';
    } else {
        finalYear = parseInt(yearInput);
        if (isNaN(finalYear)) {
            finalYear = 'random';
        } else if (finalYear < 100) {
            finalYear = 2000 + finalYear;
        }
    }
    
    // CVV
    let cvvMode = 'auto';
    let fixedCVV = null;
    
    if (pipeParts[3]) {
        const cvvInput = pipeParts[3].toLowerCase();
        if (cvvInput === 'xxx' || cvvInput === 'xxxx' || cvvInput === 'rdn' || cvvInput === 'x' || cvvInput === 'xx') {
            cvvMode = 'auto';
        } else if (/^\d+$/.test(pipeParts[3])) {
            cvvMode = 'fixed';
            fixedCVV = pipeParts[3];
        }
    }
    
    return { 
        baseBin, 
        variablePart, 
        month: finalMonth, 
        year: finalYear, 
        quantity,
        cvvMode,
        fixedCVV,
        originalInput: mainPart
    };
}

// ============================================
// GENERADOR
// ============================================

function generateCards(params) {
    const { baseBin, variablePart, month, year, quantity, cvvMode, fixedCVV } = params;
    const isAmex = baseBin.startsWith('34') || baseBin.startsWith('37');
    const cards = [];
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i < quantity; i++) {
        const prefix = generateFromPattern(baseBin, variablePart);
        const cardNumber = completeCardNumber(prefix);
        
        let cardMonth, cardYear;
        
        if (month === 'random') {
            cardMonth = Math.floor(Math.random() * 12) + 1;
        } else {
            cardMonth = month;
        }
        
        if (year === 'random') {
            cardYear = currentYear + Math.floor(Math.random() * 5) + 1;
        } else {
            cardYear = year;
        }
        
        let cardCVV;
        if (cvvMode === 'fixed' && fixedCVV) {
            cardCVV = fixedCVV;
        } else {
            cardCVV = generateCVV(isAmex);
        }
        
        cards.push({
            number: cardNumber,
            month: cardMonth.toString().padStart(2, '0'),
            year: cardYear.toString(),
            shortYear: cardYear.toString().slice(-2),
            cvv: cardCVV
        });
    }
    
    return cards;
}

// ============================================
// BOT TELEGRAF
// ============================================

bot.command('start', async (ctx) => {
    const user = ctx.from;
    const userInfo = await getUserInfo(user.id);
    
    const text = 
`
━━━━━━━━━━━━━━━━━━━━
      𝗚𝗨 𝗖𝗛𝗞
━━━━━━━━━━━━━━━━━━━━

Bienvenido a 𝗚𝗨 𝗖𝗛𝗞

⤷ Nombre: ${user.first_name}
⤷ Chat ID: ${ctx.chat.id}
⤷ Plan: ${plan}
⤷ Créditos: ${creditos}
⤷ Estado: Activo

Selecciona una opción para continuar.
`;

    ctx.reply(text);
});

bot.command('gen', async (ctx) => {
    const fullInput = ctx.message.text.split(' ').slice(1).join(' ').trim();
    const user = ctx.from;
    
    if (!fullInput) {
        return ctx.reply(
`⚠️ GU CHKR | Error
➖➖➖➖➖➖➖➖➖➖
❌ Format required: BIN|mes|año|cvv cantidad

✅ Example:
/gen 473912xxxxxxxxxx|09|30|xxx 10
➖➖➖➖➖➖➖➖➖➖
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
        text += `➖➖➖➖➖➖➖➖➖➖\n`;
        text += `Format: ${params.originalInput}\n`;
        text += `➖➖➖➖➖➖➖➖➖➖\n`;
        
        // Lista de tarjetas en formato: numero|mes|año|cvv
        cards.forEach((card) => {
            text += `${card.number}|${card.month}|${card.year}|${card.cvv}\n`;
        });
        
        text += `➖➖➖➖➖➖➖➖➖➖\n`;
        text += `➡️ Info: ${(binInfo.scheme || 'Unknown').toUpperCase()} - ${(binInfo.type || 'Unknown').toUpperCase()}\n`;
        text += `➡️ Issuer: ${binInfo.bank?.name || 'Unknown'} - ${(binInfo.type || 'Unknown').toUpperCase()}\n`;
        text += `➡️ Country: ${binInfo.country?.name || 'Unknown'} ${binInfo.country?.emoji || '🏳️'}\n`;
        text += `➖➖➖➖➖➖➖➖➖➖\n`;
        text += `👤 Req By: ${user.first_name}\n`;
        text += `➖➖➖➖➖➖➖➖➖➖\n`;
        text += `🔥 Bot Version: alpha 1`;
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 RE-GEN', `regen_${sessionId}`)]
        ]);
        
        await ctx.reply(text, keyboard);
        
    } catch (error) {
        ctx.reply(
`⚡ GU CHKR | Error
➖➖➖➖➖➖➖➖➖➖
❌ ${error.message}
➖➖➖➖➖➖➖➖➖➖
👤 Req By: ${user.first_name}
🔥 Bot Version: alpha 1`);
    }
});

// Handler RE-GEN
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
        
        let text = `⚡ GU CHKR | CC Generator\n`;
        text += `➖➖➖➖➖➖➖➖➖➖\n`;
        text += `Format: ${params.originalInput}\n`;
        text += `➖➖➖➖➖➖➖➖➖➖\n`;
        
        cards.forEach((card) => {
            text += `${card.number}|${card.month}|${card.year}|${card.cvv}\n`;
        });
        
        text += `➖➖➖➖➖➖➖➖➖➖\n`;
        text += `➡️ Info: ${(binInfo.scheme || 'Unknown').toUpperCase()} - ${(binInfo.type || 'Unknown').toUpperCase()}\n`;
        text += `➡️ Issuer: ${binInfo.bank?.name || 'Unknown'} - ${(binInfo.type || 'Unknown').toUpperCase()}\n`;
        text += `➡️ Country: ${binInfo.country?.name || 'Unknown'} ${binInfo.country?.emoji || '🏳️'}\n`;
        text += `➖➖➖➖➖➖➖➖➖➖\n`;
        text += `👤 Req By: ${user.first_name}\n`;
        text += `➖➖➖➖➖➖➖➖➖➖\n`;
        text += `🔥 Bot Version: alpha 1`;
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 RE-GEN', `regen_${sessionId}`)]
        ]);
        
        await ctx.editMessageText(text, keyboard);
        
    } catch (error) {
        ctx.reply('❌ Error: ' + error.message);
    }
});

bot.catch((err, ctx) => {
    console.error('Error:', err);
});

bot.launch();
console.log('🤖 Bot iniciado');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));