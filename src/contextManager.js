import ContextDatabase from '../database/contextDB.js';
import MasterAgent from '../agents/masterAgent.js';
import CodeAgent from '../agents/codeAgent.js';
import TestAgent from '../agents/testAgent.js';
import DocsAgent from '../agents/docsAgent.js';
import ReviewAgent from '../agents/reviewAgent.js';
import TokenOptimizer from '../utils/tokenOptimizer.js';
import { defaultAgentConfigs, agentTypes } from '../config/agentConfig.js';

class ContextManager {
  constructor(options = {}) {
    this.dbPath = options.dbPath || './database/context.db';
    this.db = null;
    this.masterAgent = null;
    this.agents = {};
    this.tokenOptimizer = new TokenOptimizer();
    this.currentProject = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Inicializar base de datos
    this.db = new ContextDatabase(this.dbPath);
    
    // Inicializar agente maestro
    this.masterAgent = new MasterAgent(defaultAgentConfigs[agentTypes.MASTER]);
    this.masterAgent.setDatabase(this.db);
    
    // Inicializar agentes especializados
    this.agents = {
      [agentTypes.CODE]: new CodeAgent(defaultAgentConfigs[agentTypes.CODE]),
      [agentTypes.TEST]: new TestAgent(defaultAgentConfigs[agentTypes.TEST]),
      [agentTypes.DOCS]: new DocsAgent(defaultAgentConfigs[agentTypes.DOCS]),
      [agentTypes.REVIEW]: new ReviewAgent(defaultAgentConfigs[agentTypes.REVIEW])
    };
    
    // Configurar agentes en la base de datos
    this.initializeAgentConfigs();
    
    this.initialized = true;
    console.log('✅ Context Manager inicializado correctamente');
  }

  initializeAgentConfigs() {
    Object.entries(defaultAgentConfigs).forEach(([type, config]) => {
      this.db.setAgentConfig(type, config.model, {
        temperature: config.temperature,
        maxTokens: config.maxTokens
      });
    });
  }

  async createProject(projectName, description = '') {
    await this.initialize();
    
    const projectId = this.db.createProject(projectName, description);
    this.currentProject = this.db.getProject(projectId);
    this.masterAgent.setProjectContext(this.currentProject);
    
    console.log(`📁 Proyecto creado: ${projectName} (ID: ${projectId})`);
    return this.currentProject;
  }

  async loadProject(projectId) {
    await this.initialize();
    
    this.currentProject = this.db.getProject(projectId);
    if (!this.currentProject) {
      throw new Error(`Proyecto no encontrado: ${projectId}`);
    }
    
    this.masterAgent.setProjectContext(this.currentProject);
    console.log(`📂 Proyecto cargado: ${this.currentProject.project_name}`);
    return this.currentProject;
  }

  async processRequest(userInput) {
    if (!this.currentProject) {
      throw new Error('No hay un proyecto activo. Crea o carga un proyecto primero.');
    }
    
    // Guardar input del usuario en el contexto
    const tokensUsed = this.tokenOptimizer.countTokens(userInput);
    this.db.addConversation(
      this.currentProject.id,
      'user',
      userInput,
      tokensUsed
    );
    
    // Procesar con el agente maestro
    const result = await this.masterAgent.execute(userInput, this.getContext());
    
    // Actualizar contexto con el resultado
    if (result.message) {
      this.db.addConversation(
        this.currentProject.id,
        'assistant',
        result.message,
        this.tokenOptimizer.countTokens(result.message)
      );
    }
    
    // Si requiere delegación, ejecutar el agente correspondiente
    if (result.action === 'delegate' && result.delegatedTo) {
      const agentResult = await this.executeDelegatedTask(
        result.delegatedTo,
        userInput,
        this.getContext()
      );
      
      // Actualizar contexto con el resultado del agente
      await this.masterAgent.updateContextWithResult(result.taskInfo.id, agentResult);
      
      return {
        ...result,
        agentResult
      };
    }
    
    return result;
  }

  async executeDelegatedTask(agentType, task, context) {
    const agent = this.agents[agentType];
    if (!agent) {
      throw new Error(`Agente no encontrado: ${agentType}`);
    }
    
    console.log(`🤖 Ejecutando ${agentType} agent...`);
    return await agent.execute(task, context);
  }

  getContext() {
    if (!this.currentProject) return null;
    
    const summary = this.db.getContextSummary(this.currentProject.id);
    
    // Optimizar contexto si es muy grande
    const optimizedConversations = this.tokenOptimizer.optimizeConversationHistory(
      summary.recentConversations || [],
      4000 // Límite de tokens para contexto
    );
    
    return {
      project: summary.project,
      conversations: optimizedConversations,
      tasks: summary.tasks,
      state: summary.currentState,
      tokenUsage: summary.tokenUsage
    };
  }

  async getProjectStatus() {
    if (!this.currentProject) {
      return { message: 'No hay proyecto activo' };
    }
    
    return await this.masterAgent.summarizeProjectStatus();
  }

  async updateAgentConfig(agentType, config) {
    const agent = this.agents[agentType];
    if (!agent) {
      throw new Error(`Agente no encontrado: ${agentType}`);
    }
    
    // Actualizar configuración del agente
    Object.assign(agent.config, config);
    
    // Guardar en base de datos
    this.db.setAgentConfig(agentType, config.model || agent.config.model, config);
    
    console.log(`⚙️ Configuración actualizada para ${agentType}`);
  }

  async optimizeContext() {
    if (!this.currentProject) return;
    
    const context = this.getContext();
    const compressed = this.tokenOptimizer.compressContext(context);
    
    if (compressed.compressed) {
      console.log(`🗜️ Contexto optimizado: ${compressed.originalCount} -> ${compressed.compressedCount} mensajes`);
    }
    
    return compressed;
  }

  getTokenUsage() {
    if (!this.currentProject) return null;
    return this.db.getTokenUsage(this.currentProject.id);
  }

  async exportContext(format = 'json') {
    if (!this.currentProject) return null;
    
    const context = this.getContext();
    
    if (format === 'json') {
      return JSON.stringify(context, null, 2);
    }
    
    // Otros formatos pueden implementarse aquí
    return context;
  }

  async importContext(contextData) {
    if (!this.currentProject) {
      throw new Error('No hay proyecto activo para importar contexto');
    }
    
    // Importar conversaciones
    if (contextData.conversations) {
      for (const conv of contextData.conversations) {
        this.db.addConversation(
          this.currentProject.id,
          conv.role,
          conv.content,
          conv.tokens_used || 0
        );
      }
    }
    
    console.log('✅ Contexto importado exitosamente');
  }

  async cleanup() {
    if (this.db) {
      this.db.close();
    }
    
    if (this.tokenOptimizer) {
      this.tokenOptimizer.freeResources();
    }
    
    this.initialized = false;
    console.log('🧹 Recursos liberados');
  }
}

export default ContextManager;
