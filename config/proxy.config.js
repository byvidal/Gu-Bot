module.exports = {
  webshare: {
    // Formato: http://username:password@proxy-server:port
    proxyList: [
      'http://user1:pass1@proxy.webshare.io:80',
      'http://user2:pass2@proxy.webshare.io:80',
      // ... tus 25-50 proxies de webshare
    ],
    rotateEvery: 1, // Cambiar proxy cada 1 request para máxima anonimidad
    timeout: 30000
  },
  
  // Rate limiting: 5000/día = ~208/hora = ~3.5/minuto
  rateLimit: {
    maxPerDay: 5000,
    maxPerHour: 208,
    maxPerMinute: 20, // Conservador para evitar bans
    delayBetweenChecks: 15000 // 15 segundos entre checks
  }
};