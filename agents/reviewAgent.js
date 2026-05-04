import BaseAgent from './baseAgent.js';
import { agentTypes } from '../config/agentConfig.js';

class ReviewAgent extends BaseAgent {
  constructor(config) {
    super(agentTypes.REVIEW, config);
  }

  async execute(task, context) {
    const codeToReview = this.extractCode(task, context);
    const review = await this.performReview(codeToReview, context);
    
    return this.formatResponse({
      task,
      review,
      score: review.score,
      recommendations: review.recommendations,
      tokensUsed: this.estimateTokens(JSON.stringify(review))
    });
  }

  extractCode(task, context) {
    // Extraer código del contexto o de la tarea
    const codePattern = /```[\s\S]*?```/g;
    const matches = task.match(codePattern);
    
    if (matches) {
      return matches.map(match => 
        match.replace(/```\w*\n?/, '').replace(/```$/, '')
      ).join('\n');
    }
    
    return task;
  }

  async performReview(code, context) {
    const issues = [];
    const recommendations = [];
    
    // Análisis estático básico
    issues.push(...this.checkCodeQuality(code));
    issues.push(...this.checkSecurity(code));
    issues.push(...this.checkPerformance(code));
    issues.push(...this.checkBestPractices(code));
    
    // Calcular score
    const score = this.calculateScore(issues);
    
    // Generar recomendaciones prioritarias
    recommendations.push(...this.generateRecommendations(issues));
    
    return {
      issues,
      score,
      recommendations,
      summary: this.generateSummary(issues, score),
      criticalIssues: issues.filter(i => i.severity === 'critical'),
      majorIssues: issues.filter(i => i.severity === 'major'),
      minorIssues: issues.filter(i => i.severity === 'minor')
    };
  }

  checkCodeQuality(code) {
    const issues = [];
    
    // Funciones demasiado largas
    const functionLines = code.split('\n').filter(line => 
      line.includes('function') || line.includes('=>') || line.includes('async')
    );
    
    if (code.split('\n').length > 200) {
      issues.push({
        type: 'code-quality',
        severity: 'major',
        message: 'Archivo demasiado largo (>200 líneas). Considera dividirlo en módulos más pequeños.',
        suggestion: 'Refactorizar en funciones o módulos más pequeños'
      });
    }
    
    // Anidamiento excesivo
    const maxIndentation = Math.max(...code.split('\n').map(line => {
      const spaces = line.match(/^\\s*/)[0].length;
      return Math.floor(spaces / 2);
    }));
    
    if (maxIndentation > 4) {
      issues.push({
        type: 'code-quality',
        severity: 'major',
        message: `Anidamiento excesivo detectado (${maxIndentation} niveles). Máximo recomendado: 4`,
        suggestion: 'Usar early returns o extraer funciones'
      });
    }
    
    // Variables no utilizadas (detección básica)
    const declaredVars = code.match(/(?:const|let|var)\\s+\\w+/g) || [];
    const usedVars = code.match(/\\b(?!const|let|var|if|for|while|return)\\w+\\b/g) || [];
    
    // Nombres poco descriptivos
    const shortVars = code.match(/(?:const|let|var)\\s+[a-z]{1}\\b/gi) || [];
    if (shortVars.length > 0) {
      issues.push({
        type: 'code-quality',
        severity: 'minor',
        message: `Variables con nombres poco descriptivos: ${shortVars.join(', ')}`,
        suggestion: 'Usar nombres de variables más descriptivos'
      });
    }
    
    // Console.log en producción
    if (code.includes('console.log')) {
      issues.push({
        type: 'code-quality',
        severity: 'minor',
        message: 'console.log encontrado. Remover antes de producción',
        suggestion: 'Usar un sistema de logging apropiado'
      });
    }
    
    // TODOs y FIXMEs
    const todos = code.match(/(TODO|FIXME|XXX|HACK)/gi) || [];
    if (todos.length > 0) {
      issues.push({
        type: 'code-quality',
        severity: 'minor',
        message: `${todos.length} comentarios de trabajo pendiente encontrados`,
        suggestion: 'Resolver o documentar los TODOs/FIXMEs'
      });
    }
    
    return issues;
  }

  checkSecurity(code) {
    const issues = [];
    
    // Eval() peligroso
    if (code.includes('eval(')) {
      issues.push({
        type: 'security',
        severity: 'critical',
        message: 'Uso de eval() detectado. Esto es extremadamente peligroso',
        suggestion: 'Nunca usar eval(). Usar alternativas seguras'
      });
    }
    
    // InnerHTML con contenido dinámico
    if (code.includes('.innerHTML')) {
      issues.push({
        type: 'security',
        severity: 'major',
        message: 'innerHTML puede ser vulnerable a XSS',
        suggestion: 'Usar textContent o sanitizar el contenido'
      });
    }
    
    // Contraseñas hardcodeadas
    if (/password\\s*[:=]\\s*['"][^'"]+['"]/i.test(code)) {
      issues.push({
        type: 'security',
        severity: 'critical',
        message: 'Contraseña hardcodeada detectada',
        suggestion: 'Usar variables de entorno para credenciales'
      });
    }
    
    // API keys hardcodeadas
    if (/api[_-]?key\\s*[:=]\\s*['"][^'"]+['"]/i.test(code)) {
      issues.push({
        type: 'security',
        severity: 'critical',
        message: 'API Key hardcodeada detectada',
        suggestion: 'Usar variables de entorno para API keys'
      });
    }
    
    // SQL injection potencial
    if (code.includes('SELECT') && code.includes('FROM') && code.includes('+')) {
      issues.push({
        type: 'security',
        severity: 'critical',
        message: 'Posible vulnerabilidad a SQL Injection',
        suggestion: 'Usar consultas parametrizadas o ORM'
      });
    }
    
    return issues;
  }

  checkPerformance(code) {
    const issues = [];
    
    // Bucles anidados
    const forLoops = (code.match(/for\\s*\\(/g) || []).length;
    if (forLoops > 2) {
      issues.push({
        type: 'performance',
        severity: 'major',
        message: 'Múltiples bucles detectados. Verificar complejidad algorítmica',
        suggestion: 'Considerar optimizaciones o estructuras de datos más eficientes'
      });
    }
    
    // Operaciones en arrays dentro de loops
    if (code.includes('for') && (code.includes('.map(') || code.includes('.filter('))) {
      issues.push({
        type: 'performance',
        severity: 'minor',
        message: 'Operaciones de array dentro de bucle pueden ser ineficientes',
        suggestion: 'Considerar optimizar operaciones de array'
      });
    }
    
    // Múltiples queries en loop
    if (code.includes('for') && (code.includes('SELECT') || code.includes('fetch'))) {
      issues.push({
        type: 'performance',
        severity: 'major',
        message: 'Posible problema N+1 en consultas',
        suggestion: 'Batchear consultas o usar joins'
      });
    }
    
    return issues;
  }

  checkBestPractices(code) {
    const issues = [];
    
    // Error handling
    const asyncFunctions = (code.match(/async\\s+\\w+/g) || []).length;
    const tryCatch = (code.match(/try\\s*{/g) || []).length;
    
    if (asyncFunctions > tryCatch) {
      issues.push({
        type: 'best-practice',
        severity: 'major',
        message: 'Funciones asíncronas sin manejo adecuado de errores',
        suggestion: 'Agregar try-catch o .catch() para manejar errores'
      });
    }
    
    // Magic numbers
    const magicNumbers = code.match(/\\b(?<!\\.)\\d{2,}\\b(?!\\.)/g) || [];
    if (magicNumbers.length > 0) {
      issues.push({
        type: 'best-practice',
        severity: 'minor',
        message: `Números mágicos encontrados: ${[...new Set(magicNumbers)].join(', ')}`,
        suggestion: 'Extraer a constantes con nombres descriptivos'
      });
    }
    
    // Duplicación de código
    const lines = code.split('\n').filter(l => l.trim().length > 0);
    const uniqueLines = new Set(lines);
    const duplicationRatio = 1 - (uniqueLines.size / lines.length);
    
    if (duplicationRatio > 0.3) {
      issues.push({
        type: 'best-practice',
        severity: 'major',
        message: `Alto nivel de duplicación de código (${Math.round(duplicationRatio * 100)}%)`,
        suggestion: 'Refactorizar código duplicado en funciones reutilizables'
      });
    }
    
    // Comentarios útiles
    const commentLines = code.split('\n').filter(l => l.trim().startsWith('//'));
    const codeLines = lines.length;
    const commentRatio = commentLines.length / codeLines;
    
    if (commentRatio < 0.1 && codeLines > 50) {
      issues.push({
        type: 'best-practice',
        severity: 'minor',
        message: 'Pocos comentarios en relación al tamaño del código',
        suggestion: 'Agregar comentarios explicativos para lógica compleja'
      });
    }
    
    return issues;
  }

  calculateScore(issues) {
    const weights = {
      critical: 25,
      major: 10,
      minor: 3
    };
    
    const totalDeduction = issues.reduce((sum, issue) => {
      return sum + (weights[issue.severity] || 0);
    }, 0);
    
    return Math.max(0, 100 - totalDeduction);
  }

  generateRecommendations(issues) {
    const recommendations = [];
    
    // Priorizar issues críticos
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Security',
        text: 'Resolver inmediatamente los siguientes problemas críticos de seguridad:',
        items: criticalIssues.map(i => i.message)
      });
    }
    
    // Issues mayores
    const majorIssues = issues.filter(i => i.severity === 'major');
    if (majorIssues.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Code Quality',
        text: 'Mejorar la calidad del código abordando:',
        items: majorIssues.slice(0, 5).map(i => i.message)
      });
    }
    
    // Sugerencias generales
    if (issues.some(i => i.type === 'performance')) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        text: 'Considerar optimizaciones de rendimiento',
        items: ['Perfilar el código', 'Identificar bottlenecks', 'Optimizar algoritmos']
      });
    }
    
    return recommendations;
  }

  generateSummary(issues, score) {
    let summary = `Código revisado con score: ${score}/100.\\n\\n`;
    
    if (score >= 90) {
      summary += '✅ Excelente calidad de código. Pocas mejoras necesarias.';
    } else if (score >= 70) {
      summary += '⚠️ Buena calidad general, pero se recomiendan algunas mejoras.';
    } else if (score >= 50) {
      summary += '⚠️ Calidad regular. Se necesitan mejoras significativas.';
    } else {
      summary += '❌ Calidad pobre. Requiere refactorización importante.';
    }
    
    summary += `\\n\\nTotal de issues encontrados: ${issues.length}`;
    summary += `\\n- Críticos: ${issues.filter(i => i.severity === 'critical').length}`;
    summary += `\\n- Mayores: ${issues.filter(i => i.severity === 'major').length}`;
    summary += `\\n- Menores: ${issues.filter(i => i.severity === 'minor').length}`;
    
    return summary;
  }

  generateDiff(originalCode, improvedCode) {
    // Generar diff básico (en producción usar una librería como diff)
    return {
      original: originalCode,
      improved: improvedCode,
      changes: 'Diff no disponible en esta versión'
    };
  }

  async suggestRefactoring(code, issue) {
    return {
      issue,
      suggestion: `Refactorización sugerida para: ${issue.message}`,
      example: '// Código refactorizado de ejemplo'
    };
  }
}

export default ReviewAgent;
