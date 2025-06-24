export class RateLimitManager {
  private requestQueues: Map<string, Array<() => Promise<any>>> = new Map();
  private lastRequestTimes: Map<string, number> = new Map();
  private processingQueues: Set<string> = new Set();
  
  // Délais minimums par service (en millisecondes)
  private serviceDelays = {
    'fbref': 3000,      // 3 secondes entre les requêtes FBref
    'transfermarkt': 2000, // 2 secondes pour Transfermarkt
    'soccerdata': 2500,    // 2.5 secondes pour soccerdata
    'default': 2000
  };

  async executeWithRateLimit<T>(
    serviceName: string, 
    requestFn: () => Promise<T>,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queueKey = serviceName;
      
      if (!this.requestQueues.has(queueKey)) {
        this.requestQueues.set(queueKey, []);
      }
      
      const queue = this.requestQueues.get(queueKey)!;
      
      const queueItem = async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      // Ajouter à la queue selon la priorité
      if (priority === 'high') {
        queue.unshift(queueItem);
      } else {
        queue.push(queueItem);
      }
      
      this.processQueue(queueKey);
    });
  }

  private async processQueue(queueKey: string): Promise<void> {
    if (this.processingQueues.has(queueKey)) {
      return; // Déjà en cours de traitement
    }
    
    this.processingQueues.add(queueKey);
    
    const queue = this.requestQueues.get(queueKey);
    if (!queue) {
      this.processingQueues.delete(queueKey);
      return;
    }
    
    while (queue.length > 0) {
      const now = Date.now();
      const lastRequest = this.lastRequestTimes.get(queueKey) || 0;
      const delay = this.serviceDelays[queueKey] || this.serviceDelays.default;
      const timeSinceLastRequest = now - lastRequest;
      
      if (timeSinceLastRequest < delay) {
        const waitTime = delay - timeSinceLastRequest;
        console.log(`Rate limiting ${queueKey}: waiting ${waitTime}ms`);
        await this.sleep(waitTime);
      }
      
      const requestFn = queue.shift();
      if (requestFn) {
        this.lastRequestTimes.set(queueKey, Date.now());
        
        try {
          await requestFn();
        } catch (error) {
          console.error(`Request failed for ${queueKey}:`, error);
        }
      }
    }
    
    this.processingQueues.delete(queueKey);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Méthode pour nettoyer les queues vides
  cleanup(): void {
    for (const [key, queue] of this.requestQueues.entries()) {
      if (queue.length === 0) {
        this.requestQueues.delete(key);
        this.lastRequestTimes.delete(key);
      }
    }
  }

  // Obtenir le statut des queues
  getQueueStatus(): Record<string, number> {
    const status: Record<string, number> = {};
    for (const [key, queue] of this.requestQueues.entries()) {
      status[key] = queue.length;
    }
    return status;
  }
}

export const rateLimitManager = new RateLimitManager();