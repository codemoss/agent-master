import BaseAgent from './baseAgent.js';
import { agentTypes, taskStatus } from '../config/agentConfig.js';

class MasterAgent extends BaseAgent {
  constructor(config) {
    super(agentTypes.MASTER, config);
    this.activeTasks = new Map();
    this.projectContext = null;
    this.db = null;
  }

  setDatabase(db) {
    this.db = db;
  }

  setProjectContext(context) {
    this.projectContext = context;
  }

  async execute(task, context) {
    // El agente maestro no ejecuta tareas técnicas directamente
    // Solo coordina y comunica
    
    const analysis = await this.analyzeRequest(task, context);
    
    if (analysis.requiresDelegation) {
      return await this.delegateTask(analysis);
    } else {
      return await this.communicateProgress(analysis, context);
    }
  }

  async analyzeRequest(task, context) {
    // Analizar si la tarea requiere delegación o es solo comunicación
    const requiresTechnicalWork = 
      task.toLowerCase().includes('crear') ||
      task.toLowerCase().includes('modificar') ||
      task.toLowerCase().includes('implementar') ||
      task.toLowerCase().includes('escribir') ||
      task.toLowerCase().includes('generar');

    const requiresReview = 
      task.toLowerCase().includes('revisar') ||
      task.toLowerCase().includes('analizar') ||
      task.toLowerCase().includes('auditar');

    const requiresTests = 
      task.toLowerCase().includes('probar') ||
      task.toLowerCase().includes('test') ||
      task.toLowerCase().includes('validar');

    const requiresDocs = 
      task.toLowerCase().includes('documentar') ||
      task.toLowerCase().includes('documentación') ||
      task.toLowerCase().includes('readme');

    return {
      requiresDelegation: requiresTechnicalWork || requiresReview || requiresTests || requiresDocs,
      taskType: this.determineTaskType(task, { requiresTechnicalWork, requiresReview, requiresTests, requiresDocs }),
      priority: this.assessPriority(task),
      questions: this.generateClarifyingQuestions(task, context),
      originalTask: task
    };
  }

  determineTaskType(task, flags) {
    if (flags.requiresTechnicalWork) return agentTypes.CODE;
    if (flags.requiresReview) return agentTypes.REVIEW;
    if (flags.requiresTests) return agentTypes.TEST;
    if (flags.requiresDocs) return agentTypes.DOCS;
    return null;
  }

  assessPriority(task) {
    const urgentKeywords = ['urgente', 'crítico', 'importante', 'prioridad'];
    const hasUrgentKeyword = urgentKeywords.some(keyword => 
      task.toLowerCase().includes(keyword)
    );
    
    return hasUrgentKeyword ? 'HIGH' : 'MEDIUM';
  }

  generateClarifyingQuestions(task, context) {
    const questions = [];
    
    // Preguntas genéricas para entender mejor la tarea
    if (!context || !context.projectName) {
      questions.push('¿Podrías describir el proyecto en el que estás trabajando?');
    }
    
    if (task.includes('nuevo') || task.includes('crear')) {
      questions.push('¿Cuáles son los requerimientos específicos para esta funcionalidad?');
      questions.push('¿Hay alguna restricción técnica o preferencia de implementación?');
    }
    
    if (task.includes('modificar') || task.includes('cambiar')) {
      questions.push('¿Qué comportamiento actual deseas cambiar?');
      questions.push('¿Cuál es el resultado esperado después del cambio?');
    }
    
    return questions;
  }

  async delegateTask(analysis) {
    const taskInfo = {
      type: analysis.taskType,
      description: analysis.originalTask,
      priority: analysis.priority,
      questions: analysis.questions
    };
    
    // Crear tarea en la base de datos
    if (this.db && this.projectContext) {
      const taskId = this.db.createTask(
        this.projectContext.id,
        analysis.taskType,
        analysis.originalTask
      );
      taskInfo.id = taskId;
      this.activeTasks.set(taskId, taskInfo);
    }
    
    return {
      action: 'delegate',
      delegatedTo: analysis.taskType,
      taskInfo,
      message: this.formatDelegationMessage(analysis),
      needsUserInput: analysis.questions.length > 0
    };
  }

  formatDelegationMessage(analysis) {
    const agentNames = {
      [agentTypes.CODE]: 'Agente de Código',
      [agentTypes.TEST]: 'Agente de Pruebas',
      [agentTypes.DOCS]: 'Agente de Documentación',
      [agentTypes.REVIEW]: 'Agente de Revisión'
    };
    
    return `He analizado tu solicitud y voy a delegarla al ${agentNames[analysis.taskType]}.` +
           (analysis.questions.length > 0 
             ? '\n\nAntes de proceder, necesito que me ayudes con las siguientes preguntas:' +
               analysis.questions.map((q, i) => `\n${i + 1}. ${q}`).join('')
             : '\n\nProcederé inmediatamente con la tarea.');
  }

  async communicateProgress(analysis, context) {
    // Actualizar contexto en la base de datos
    if (this.db && this.projectContext) {
      this.db.addConversation(
        this.projectContext.id,
        'assistant',
        `Analizando: ${analysis.originalTask}`,
        this.estimateTokens(analysis.originalTask)
      );
    }
    
    return {
      action: 'communicate',
      message: this.formatProgressMessage(analysis, context),
      questions: analysis.questions,
      needsUserInput: analysis.questions.length > 0
    };
  }

  formatProgressMessage(analysis, context) {
    let message = 'Entiendo tu solicitud. ';
    
    if (analysis.questions.length > 0) {
      message += '\n\nPara asegurarme de que estamos en la dirección correcta, ¿podrías ayudarme con lo siguiente?';
      analysis.questions.forEach((q, i) => {
        message += `\n${i + 1}. ${q}`;
      });
    } else {
      message += '\n\n¿Hay algo más que deba considerar antes de proceder?';
    }
    
    if (context && context.currentTasks && context.currentTasks.length > 0) {
      message += '\n\nTareas actuales en progreso:';
      context.currentTasks.forEach(task => {
        message += `\n- ${task.description} (${task.status})`;
      });
    }
    
    return message;
  }

  async updateContextWithResult(taskId, result) {
    if (!this.db || !this.projectContext) return;
    
    const task = this.activeTasks.get(taskId);
    if (task) {
      this.db.updateTaskStatus(taskId, taskStatus.COMPLETED, JSON.stringify(result));
      
      this.db.addConversation(
        this.projectContext.id,
        'system',
        `Tarea completada por ${task.type}: ${JSON.stringify(result)}`,
        this.estimateTokens(JSON.stringify(result))
      );
      
      this.activeTasks.delete(taskId);
    }
  }

  async askUserQuestion(question) {
    // En una implementación real, esto interactuaría con el usuario
    return {
      question,
      awaitingResponse: true
    };
  }

  getActiveTasks() {
    return Array.from(this.activeTasks.values());
  }

  async summarizeProjectStatus() {
    if (!this.db || !this.projectContext) {
      return { message: 'No hay contexto de proyecto disponible' };
    }
    
    const summary = this.db.getContextSummary(this.projectContext.id);
    
    return {
      projectName: summary.project?.project_name,
      totalTasks: summary.tasks?.length || 0,
      pendingTasks: summary.tasks?.filter(t => t.status === taskStatus.PENDING).length || 0,
      completedTasks: summary.tasks?.filter(t => t.status === taskStatus.COMPLETED).length || 0,
      tokenUsage: summary.tokenUsage,
      recentActivity: summary.recentConversations?.slice(0, 5)
    };
  }
}

export default MasterAgent;
