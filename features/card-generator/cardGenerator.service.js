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
