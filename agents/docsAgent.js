import BaseAgent from './baseAgent.js';
import { agentTypes } from '../config/agentConfig.js';

class DocsAgent extends BaseAgent {
  constructor(config) {
    super(agentTypes.DOCS, config);
  }

  async execute(task, context) {
    const docType = this.detectDocType(task);
    const documentation = await this.generateDocumentation(docType, task, context);
    
    return this.formatResponse({
      task,
      docType,
      documentation,
      tokensUsed: this.estimateTokens(JSON.stringify(documentation))
    });
  }

  detectDocType(task) {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('readme')) return 'readme';
    if (lowerTask.includes('api') || lowerTask.includes('endpoint')) return 'api';
    if (lowerTask.includes('función') || lowerTask.includes('clase')) return 'code';
    if (lowerTask.includes('guía') || lowerTask.includes('tutorial')) return 'guide';
    if (lowerTask.includes('comentario')) return 'comments';
    
    return 'general';
  }

  async generateDocumentation(docType, task, context) {
    switch (docType) {
      case 'readme':
        return this.generateREADME(task, context);
      case 'api':
        return this.generateAPIDocs(task, context);
      case 'code':
        return this.generateCodeDocs(task, context);
      case 'guide':
        return this.generateGuide(task, context);
      case 'comments':
        return this.generateComments(task, context);
      default:
        return this.generateGeneralDocs(task, context);
    }
  }

  generateREADME(task, context) {
    return `# Nombre del Proyecto

${task}

## Descripción

Este proyecto proporciona una solución para gestionar y optimizar el contexto en proyectos de desarrollo de software mediante un sistema multi-agente.

## Características Principales

- ✅ Gestión de contexto persistente en base de datos
- ✅ Sistema multi-agente especializado
- ✅ Agente maestro coordinador
- ✅ Optimización de tokens
- ✅ Configuración flexible por agente

## Instalación

\`\`\`bash
npm install
\`\`\`

## Uso

\`\`\`bash
npm start
\`\`\`

## Estructura del Proyecto

\`\`\`
project/
├── src/              # Código fuente principal
├── agents/           # Agentes especializados
├── database/         # Gestión de base de datos
├── config/           # Configuración
└── utils/            # Utilidades
\`\`\`

## Configuración

Crea un archivo \`.env\` con las siguientes variables:

\`\`\`env
MASTER_AGENT_MODEL=gpt-4
CODE_AGENT_MODEL=gpt-3.5-turbo
DB_PATH=./database/context.db
\`\`\`

## API Reference

### MasterAgent

El agente maestro coordina todas las tareas y se comunica con el usuario.

\`\`\`javascript
const masterAgent = new MasterAgent();
await masterAgent.execute(task, context);
\`\`\`

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit tus cambios (\`git commit -m 'Add some AmazingFeature'\`)
4. Push a la rama (\`git push origin feature/AmazingFeature\`)
5. Abre un Pull Request

## Licencia

MIT License
`;
  }

  generateAPIDocs(task, context) {
    return `# Documentación de API

## Endpoints

### GET /api/items

Obtiene una lista de items.

**Parámetros:**
- \`limit\` (number): Número máximo de items a retornar (default: 10)
- \`offset\` (number): Offset para paginación (default: 0)

**Respuesta Exitosa (200):**
\`\`\`json
{
  "success": true,
  "data": [],
  "pagination": {
    "limit": 10,
    "offset": 0
  }
}
\`\`\`

### POST /api/items

Crea un nuevo item.

**Body:**
\`\`\`json
{
  "name": "string",
  "value": "any"
}
\`\`\`

**Respuesta Exitosa (201):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "createdAt": "datetime"
  }
}
\`\`\`

### PUT /api/items/:id

Actualiza un item existente.

**Parámetros:**
- \`id\` (string): ID del item a actualizar

**Respuesta Exitosa (200):**
\`\`\`json
{
  "success": true,
  "data": {}
}
\`\`\`

### DELETE /api/items/:id

Elimina un item.

**Respuesta Exitosa (204):**
No content

## Errores Comunes

### 400 Bad Request
\`\`\`json
{
  "success": false,
  "error": "Datos inválidos"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "success": false,
  "error": "Mensaje del error"
}
\`\`\`

## Autenticación

Todas las rutas requieren autenticación mediante Bearer Token:

\`\`\`
Authorization: Bearer <token>
\`\`\`
`;
  }

  generateCodeDocs(task, context) {
    return `/**
 * ${task}
 * 
 * @description Esta función/clase proporciona funcionalidad para...
 * 
 * @param {Object} options - Opciones de configuración
 * @param {string} options.name - Nombre del recurso
 * @param {number} options.timeout - Timeout en milisegundos (default: 5000)
 * @param {boolean} options.cache - Habilitar caché (default: true)
 * 
 * @returns {Promise<Object>} Resultado del procesamiento
 * @returns {boolean} returns.success - Indica si la operación fue exitosa
 * @returns {any} returns.data - Datos procesados
 * @returns {string} returns.timestamp - Timestamp ISO de la ejecución
 * 
 * @throws {Error} Lanza error si los datos de entrada son inválidos
 * @throws {Error} Lanza error si hay timeout en la operación
 * 
 * @example
 * // Ejemplo de uso básico
 * const result = await processRequest({
 *   name: 'test',
 *   timeout: 3000
 * });
 * 
 * console.log(result);
 * // {
 * //   success: true,
 * //   data: {...},
 * //   timestamp: '2024-01-01T00:00:00.000Z'
 * // }
 * 
 * @example
 * // Manejo de errores
 * try {
 *   const result = await processRequest(null);
 * } catch (error) {
 *   console.error(error.message); // 'Datos inválidos'
 * }
 * 
 * @see {@link DataManager} Para gestión de datos persistente
 * @see {@link TestAgent} Para ejemplos de pruebas
 * 
 * @version 1.0.0
 * @author Tu Nombre
 */
`;
  }

  generateGuide(task, context) {
    return `# Guía de Uso

## Introducción

${task}

Esta guía te ayudará a entender cómo utilizar el sistema de manera efectiva.

## Primeros Pasos

### 1. Instalación

Asegúrate de tener Node.js instalado (versión 16 o superior).

\`\`\`bash
npm install
\`\`\`

### 2. Configuración

Copia el archivo de ejemplo y ajusta las variables:

\`\`\`bash
cp .env.example .env
\`\`\`

Edita \`.env\` con tus configuraciones.

### 3. Iniciar el Sistema

\`\`\`bash
npm start
\`\`\`

## Flujo de Trabajo Recomendado

### Paso 1: Definir el Proyecto

Proporciona al Agente Maestro una descripción clara de tu proyecto.

### Paso 2: Delegar Tareas

El Agente Maestro delegará automáticamente a los agentes especializados:
- **Code Agent**: Generación de código
- **Test Agent**: Creación de pruebas
- **Docs Agent**: Documentación
- **Review Agent**: Revisión de código

### Paso 3: Iterar

Revisa los resultados y proporciona feedback para refinar el trabajo.

## Mejores Prácticas

1. **Sé específico**: Describe claramente lo que necesitas
2. **Proporciona contexto**: Incluye información relevante del proyecto
3. **Itera gradualmente**: Comienza con funcionalidades básicas
4. **Revisa el código**: Siempre revisa el código generado antes de usarlo

## Solución de Problemas

### El sistema no responde

Verifica que la base de datos esté accesible y que tengas permisos de escritura.

### Errores de tokens

Si excedes el límite de tokens, el sistema comprimirá automáticamente el contexto histórico.

## Soporte

Para más ayuda, consulta la documentación completa o abre un issue en el repositorio.
`;
  }

  generateComments(task, context) {
    return `// ${task}
// ============================================
// DOCUMENTACIÓN DEL CÓDIGO
// ============================================

/**
 * Constantes globales del sistema
 * @constant {Object} CONFIG - Configuración principal
 * @property {string} CONFIG.version - Versión actual
 * @property {number} CONFIG.timeout - Timeout por defecto
 */

/**
 * Clase principal para gestión de contexto
 * @class ContextManager
 * @description Gestiona el ciclo de vida del contexto del proyecto
 */

/**
 * Método para inicializar el contexto
 * @memberof ContextManager
 * @async
 * @param {Object} options - Opciones de inicialización
 * @returns {Promise<void>}
 */

/**
 * Evento que se emite cuando el contexto está listo
 * @event ContextManager#ready
 * @type {object}
 * @property {string} projectId - ID del proyecto
 * @property {Date} timestamp - Momento de inicialización
 */

// ============================================
// FIN DE DOCUMENTACIÓN
// ============================================
`;
  }

  generateGeneralDocs(task, context) {
    return `# Documentación General

## Propósito

${task}

## Overview

Este documento proporciona información general sobre el sistema y sus componentes.

## Componentes Principales

### 1. Base de Datos de Contexto

Almacena de forma persistente:
- Historial de conversaciones
- Tareas delegadas
- Estado del proyecto
- Configuraciones de agentes

### 2. Agentes Especializados

Cada agente tiene responsabilidades específicas:
- **Master**: Coordinación y comunicación
- **Code**: Desarrollo de código
- **Test**: Pruebas y validación
- **Docs**: Documentación
- **Review**: Revisión de calidad

### 3. Optimizador de Tokens

Gestiona eficientemente el uso de tokens mediante:
- Compresión de contexto histórico
- Eliminación de redundancias
- Priorización de información relevante

## Arquitectura

El sistema sigue un patrón de arquitectura basada en eventos donde el Agente Maestro actúa como orquestador central.

## Consideraciones de Rendimiento

- La base de datos usa índices para consultas rápidas
- El contexto se optimiza automáticamente cuando excede límites
- Los agentes pueden configurarse con diferentes modelos según necesidad

## Seguridad

- Las credenciales se gestionan mediante variables de entorno
- La base de datos es local y no se comparte externamente
- El código generado debe ser revisado antes de producción
`;
  }

  formatDocumentation(content, format = 'markdown') {
    if (format === 'html') {
      // Conversión básica a HTML
      return content
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
    }
    
    return content;
  }
}

export default DocsAgent;
