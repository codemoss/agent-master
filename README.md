# OpenCode Context Manager Plugin

Un plugin para OpenCode que optimiza la gestión del contexto en proyectos de desarrollo de software mediante un sistema de agentes especializados.

## Características Principales

- **Gestión de Contexto Persistente**: Almacena el contexto del proyecto en una base de datos SQLite, evitando pérdida de información sin importar el tamaño o historial de la conversación.
- **Sistema Multi-Agente**: Delegación de tareas a agentes especializados.
- **Agente Maestro**: Coordina todos los agentes, mantiene el contexto actualizado y se comunica con el usuario.
- **Configuración Flexible**: Cada agente puede usar diferentes modelos de IA.
- **Optimización de Tokens**: Implementa estrategias para reducir el uso de tokens manteniendo la calidad del contexto.

## Estructura del Proyecto

```
opencode-context-manager/
├── src/                    # Código fuente principal
│   ├── index.js           # Punto de entrada
│   └── contextManager.js  # Gestor de contexto
├── agents/                 # Definición de agentes
│   ├── masterAgent.js     # Agente maestro
│   ├── codeAgent.js       # Agente de código
│   ├── testAgent.js       # Agente de pruebas
│   ├── docsAgent.js       # Agente de documentación
│   └── reviewAgent.js     # Agente de revisión
├── database/               # Gestión de base de datos
│   └── contextDB.js       # Operaciones de BD
├── config/                 # Configuración
│   └── agentConfig.js     # Configuración de agentes
├── utils/                  # Utilidades
│   ├── tokenOptimizer.js  # Optimización de tokens
│   └── logger.js          # Sistema de logs
├── package.json
└── README.md
```

## Instalación

```bash
npm install
```

## Uso

```bash
npm start
```

## Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
# Modelos para cada agente
MASTER_AGENT_MODEL=gpt-4
CODE_AGENT_MODEL=gpt-3.5-turbo
TEST_AGENT_MODEL=claude-3-sonnet
DOCS_AGENT_MODEL=gpt-4
REVIEW_AGENT_MODEL=claude-3-opus

# Base de datos
DB_PATH=./database/context.db

# Logs
LOG_LEVEL=info
```

## Arquitectura

### Agente Maestro
- Coordina todas las tareas del proyecto
- Mantiene y actualiza el contexto global
- Se comunica con el usuario para dirección del proyecto
- Delega tareas a agentes especializados
- No realiza trabajo técnico directo

### Agentes Especializados
- **Code Agent**: Generación y modificación de código
- **Test Agent**: Creación y ejecución de pruebas
- **Docs Agent**: Documentación del proyecto
- **Review Agent**: Revisión de código y mejores prácticas

### Base de Datos de Contexto
- Almacena contexto estructurado del proyecto
- Historial de decisiones y cambios
- Estado actual de cada componente
- Metadatos optimizados para recuperación rápida

## Optimización de Tokens

El sistema implementa:
- Compresión de contexto histórico
- Resumen automático de conversaciones largas
- Priorización de información relevante
- Eliminación de información redundante

## Licencia

MIT
