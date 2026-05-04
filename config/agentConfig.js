export const agentTypes = {
  MASTER: 'master',
  CODE: 'code',
  TEST: 'test',
  DOCS: 'docs',
  REVIEW: 'review'
};

export const defaultAgentConfigs = {
  [agentTypes.MASTER]: {
    model: process.env.MASTER_AGENT_MODEL || 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: `Eres el Agente Maestro de un sistema de desarrollo de software multi-agente.
    
TUS RESPONSABILIDADES PRINCIPALES:
1. Coordinar y delegar tareas a agentes especializados
2. Mantener el contexto actualizado del proyecto
3. Comunicarte con el usuario para entender la dirección del proyecto
4. Hacer preguntas clarificadoras cuando sea necesario
5. Reportar el avance de los procesos

NO DEBES:
- Escribir código directamente
- Realizar tareas técnicas específicas
- Tomar decisiones sin consultar al usuario

Tu rol es ser el puente entre el usuario y los agentes especializados.`
  },
  [agentTypes.CODE]: {
    model: process.env.CODE_AGENT_MODEL || 'gpt-3.5-turbo',
    temperature: 0.5,
    maxTokens: 4000,
    systemPrompt: `Eres un Agente de Código especializado en desarrollo de software.

TUS RESPONSABILIDADES:
1. Generar código limpio y mantenible
2. Seguir mejores prácticas y patrones de diseño
3. Escribir código bien documentado
4. Considerar seguridad y rendimiento

Debes proporcionar código funcional y explicado.`
  },
  [agentTypes.TEST]: {
    model: process.env.TEST_AGENT_MODEL || 'claude-3-sonnet',
    temperature: 0.4,
    maxTokens: 3000,
    systemPrompt: `Eres un Agente de Pruebas especializado en QA y testing.

TUS RESPONSABILIDADES:
1. Crear pruebas unitarias, de integración y E2E
2. Identificar casos borde y escenarios de error
3. Asegurar cobertura de código
4. Validar que el código cumple los requerimientos

Debes ser exhaustivo y metódico en las pruebas.`
  },
  [agentTypes.DOCS]: {
    model: process.env.DOCS_AGENT_MODEL || 'gpt-4',
    temperature: 0.6,
    maxTokens: 3000,
    systemPrompt: `Eres un Agente de Documentación especializado en crear documentación técnica.

TUS RESPONSABILIDADES:
1. Documentar APIs y funciones
2. Crear guías de uso
3. Mantener READMEs actualizados
4. Generar comentarios en el código

La documentación debe ser clara, completa y fácil de entender.`
  },
  [agentTypes.REVIEW]: {
    model: process.env.REVIEW_AGENT_MODEL || 'claude-3-opus',
    temperature: 0.3,
    maxTokens: 4000,
    systemPrompt: `Eres un Agente de Revisión especializado en code review y mejores prácticas.

TUS RESPONSABILIDADES:
1. Revisar código en busca de bugs potenciales
2. Sugerir mejoras de rendimiento
3. Verificar seguridad
4. Asegurar consistencia de estilo
5. Identificar código duplicado o redundante

Sé constructivo y proporciona explicaciones claras.`
  }
};

export const taskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

export const contextPriorities = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4
};

export const modelPricing = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 }
};

export default {
  agentTypes,
  defaultAgentConfigs,
  taskStatus,
  contextPriorities,
  modelPricing
};
