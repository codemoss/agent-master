import ContextManager from './contextManager.js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

async function main() {
  console.log('🚀 OpenCode Context Manager Plugin');
  console.log('==================================\n');

  // Crear instancia del manager
  const manager = new ContextManager({
    dbPath: process.env.DB_PATH || './database/context.db'
  });

  try {
    // Inicializar el sistema
    await manager.initialize();

    // Crear un proyecto de ejemplo
    const project = await manager.createProject(
      'Mi Proyecto Demo',
      'Proyecto de demostración del plugin OpenCode Context Manager'
    );

    console.log('\n📋 Estado inicial del proyecto:');
    const status = await manager.getProjectStatus();
    console.log(JSON.stringify(status, null, 2));

    // Ejemplo de solicitud al sistema
    console.log('\n\n💬 Procesando solicitud de ejemplo...');
    const result = await manager.processRequest(
      'Necesito crear una función para validar emails en JavaScript'
    );

    console.log('\n📝 Respuesta del Agente Maestro:');
    console.log(result.message);

    // Si se delegó la tarea, mostrar resultado del agente
    if (result.agentResult) {
      console.log('\n🤖 Resultado del Agente Especializado:');
      console.log(JSON.stringify(result.agentResult.result, null, 2));
    }

    // Mostrar uso de tokens
    console.log('\n\n📊 Uso de Tokens:');
    const tokenUsage = manager.getTokenUsage();
    console.log(JSON.stringify(tokenUsage, null, 2));

    // Optimizar contexto
    console.log('\n\n🗜️ Optimizando contexto...');
    const optimized = await manager.optimizeContext();
    if (optimized && optimized.compressed) {
      console.log(`Mensajes originales: ${optimized.originalCount}`);
      console.log(`Mensajes después de optimizar: ${optimized.compressedCount}`);
    } else {
      console.log('El contexto no requiere optimización por ahora');
    }

    // Exportar contexto
    console.log('\n\n📤 Exportando contexto...');
    const exportedContext = await manager.exportContext();
    console.log('Contexto exportado (primeros 500 caracteres):');
    console.log(exportedContext.substring(0, 500) + '...');

    console.log('\n\n✅ Demo completada exitosamente!');
    console.log('\n💡 Próximos pasos:');
    console.log('1. Configura tus API keys en el archivo .env');
    console.log('2. Integra con tu proveedor de IA preferido');
    console.log('3. Personaliza los prompts de cada agente');
    console.log('4. Comienza a usar el plugin en tu proyecto OpenCode');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    // Limpiar recursos
    await manager.cleanup();
  }
}

// Ejecutar si es el módulo principal
if (process.argv[1] && process.argv[1].includes('index.js')) {
  main().catch(console.error);
}

export default main;
