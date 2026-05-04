import { encoding_for_model } from 'tiktoken';

class TokenOptimizer {
  constructor() {
    this.defaultModel = 'gpt-3.5-turbo';
    this.encodings = new Map();
  }

  getEncoding(modelName) {
    if (!this.encodings.has(modelName)) {
      try {
        const enc = encoding_for_model(modelName);
        this.encodings.set(modelName, enc);
      } catch (error) {
        // Fallback a cl100k_base para modelos no soportados
        const enc = encoding_for_model('gpt-3.5-turbo');
        this.encodings.set(modelName, enc);
      }
    }
    return this.encodings.get(modelName);
  }

  countTokens(text, modelName = this.defaultModel) {
    const encoder = this.getEncoding(modelName);
    const tokens = encoder.encode(text);
    return tokens.length;
  }

  calculateMessagesTokens(messages, modelName = this.defaultModel) {
    let totalTokens = 0;
    
    for (const message of messages) {
      // Tokens base por mensaje
      totalTokens += 4;
      
      if (message.role) {
        totalTokens += this.countTokens(message.role, modelName);
      }
      
      if (message.content) {
        totalTokens += this.countTokens(message.content, modelName);
      }
    }
    
    // Tokens adicionales para el formato del mensaje
    totalTokens += 2;
    
    return totalTokens;
  }

  truncateContent(content, maxTokens, modelName = this.defaultModel) {
    const encoder = this.getEncoding(modelName);
    const tokens = encoder.encode(content);
    
    if (tokens.length <= maxTokens) {
      return content;
    }
    
    const truncatedTokens = tokens.slice(0, maxTokens);
    return encoder.decode(truncatedTokens);
  }

  optimizeConversationHistory(messages, maxContextTokens = 4000, modelName = this.defaultModel) {
    const optimizedMessages = [];
    let currentTokens = 0;
    
    // Procesar mensajes en orden inverso (más recientes primero)
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageTokens = this.calculateMessagesTokens([message], modelName);
      
      if (currentTokens + messageTokens <= maxContextTokens) {
        optimizedMessages.unshift(message);
        currentTokens += messageTokens;
      } else {
        // Si es el primer mensaje y excede el límite, truncarlo
        if (optimizedMessages.length === 0) {
          const availableTokens = maxContextTokens - 4; // Reservar tokens para formato
          const truncatedContent = this.truncateContent(
            message.content, 
            availableTokens, 
            modelName
          );
          optimizedMessages.unshift({
            ...message,
            content: truncatedContent
          });
          break;
        } else {
          // Crear resumen de mensajes antiguos
          const summary = this.createSummary(messages.slice(0, i + 1));
          optimizedMessages.unshift({
            role: 'system',
            content: `Resumen de conversación anterior: ${summary}`
          });
          break;
        }
      }
    }
    
    return optimizedMessages;
  }

  createSummary(messages) {
    // Implementación básica de resumen
    // En producción, esto podría usar un modelo de IA para generar resúmenes inteligentes
    const importantInfo = [];
    
    for (const message of messages) {
      if (message.role === 'user' && message.content.includes('importante') || 
          message.content.includes('decisión') ||
          message.content.includes('requerimiento')) {
        importantInfo.push(message.content.substring(0, 100));
      }
    }
    
    return importantInfo.join(' | ') || 'Conversación sin información crítica identificada';
  }

  compressContext(context, compressionRatio = 0.7) {
    // Comprimir contexto eliminando información redundante
    if (!context || !context.messages) {
      return context;
    }

    const uniqueMessages = [];
    const seenContents = new Set();

    for (const message of context.messages) {
      const contentHash = this.hashContent(message.content);
      
      if (!seenContents.has(contentHash)) {
        seenContents.add(contentHash);
        uniqueMessages.push(message);
      }
    }

    // Mantener solo el porcentaje especificado de mensajes más relevantes
    const messagesToKeep = Math.max(
      Math.floor(uniqueMessages.length * compressionRatio),
      5 // Mínimo 5 mensajes
    );

    return {
      ...context,
      messages: uniqueMessages.slice(-messagesToKeep),
      compressed: true,
      originalCount: context.messages.length,
      compressedCount: uniqueMessages.slice(-messagesToKeep).length
    };
  }

  hashContent(content) {
    // Hash simple para detección de duplicados
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  prioritizeContextSections(sections, priorityOrder = ['decisions', 'requirements', 'code', 'discussions']) {
    // Ordenar secciones del contexto por prioridad
    const prioritized = {};
    
    for (const priority of priorityOrder) {
      if (sections[priority]) {
        prioritized[priority] = sections[priority];
      }
    }
    
    // Agregar secciones no priorizadas al final
    for (const key of Object.keys(sections)) {
      if (!prioritized[key]) {
        prioritized[key] = sections[key];
      }
    }
    
    return prioritized;
  }

  estimateCost(tokens, modelPricing = { input: 0.0015, output: 0.002 }) {
    return {
      inputCost: (tokens * modelPricing.input / 1000).toFixed(4),
      outputCost: (tokens * modelPricing.output / 1000).toFixed(4),
      totalCost: (tokens * (modelPricing.input + modelPricing.output) / 1000).toFixed(4)
    };
  }

  freeResources() {
    for (const [modelName, encoder] of this.encodings.entries()) {
      encoder.free();
    }
    this.encodings.clear();
  }
}

export default TokenOptimizer;
