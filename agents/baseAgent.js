import { agentTypes, defaultAgentConfigs, taskStatus } from '../config/agentConfig.js';

class BaseAgent {
  constructor(agentType, config) {
    this.agentType = agentType;
    this.config = config || defaultAgentConfigs[agentType];
    this.model = this.config.model;
    this.temperature = this.config.temperature;
    this.maxTokens = this.config.maxTokens;
    this.systemPrompt = this.config.systemPrompt;
  }

  async execute(task, context) {
    throw new Error('Method execute() must be implemented by subclass');
  }

  formatResponse(result) {
    return {
      agentType: this.agentType,
      model: this.model,
      result,
      timestamp: new Date().toISOString()
    };
  }

  estimateTokens(input) {
    // Estimación básica: ~4 caracteres por token en promedio
    return Math.ceil(input.length / 4);
  }
}

export default BaseAgent;
