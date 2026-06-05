// ============================================
// API BINLIST
// ============================================
const axios = require('axios');

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

module.exports = { getBinInfo, detectCardType };