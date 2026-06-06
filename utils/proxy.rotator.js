class ProxyRotator {
  constructor(proxyList) {
    this.proxies = proxyList;
    this.currentIndex = 0;
    this.failedProxies = new Set();
  }

  getNext() {
    // Rotación simple round-robin
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }

  markFailed(proxy) {
    this.failedProxies.add(proxy);
    // Si falla 3 veces, quitar de la lista temporalmente
  }

  getHealthyProxy() {
    let attempts = 0;
    while (attempts < this.proxies.length) {
      const proxy = this.getNext();
      if (!this.failedProxies.has(proxy)) {
        return proxy;
      }
      attempts++;
    }
    // Si todos fallaron, resetear y devolver cualquiera
    this.failedProxies.clear();
    return this.proxies[0];
  }
}

module.exports = ProxyRotator;