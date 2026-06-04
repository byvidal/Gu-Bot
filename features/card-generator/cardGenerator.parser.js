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
        if (cvvInput === 'xxx' || cvvInput === 'xxxx' || cvvInput === 'rdn' || cvvInput === 'x' || cvvInput === '') {
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