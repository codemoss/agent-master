import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ContextDatabase {
  constructor(dbPath = './database/context.db') {
    this.dbPath = path.join(__dirname, '..', dbPath);
    this.db = new Database(this.dbPath);
    this.initializeTables();
  }

  initializeTables() {
    // Tabla para el contexto global del proyecto
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_context (
        id TEXT PRIMARY KEY,
        project_name TEXT NOT NULL,
        description TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Tabla para el historial de conversaciones y decisiones
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversation_history (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        tokens_used INTEGER DEFAULT 0,
        summary TEXT,
        compressed BOOLEAN DEFAULT FALSE,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (project_id) REFERENCES project_context(id)
      )
    `);

    // Tabla para tareas delegadas a agentes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        agent_type TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        result TEXT,
        tokens_used INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        completed_at INTEGER,
        FOREIGN KEY (project_id) REFERENCES project_context(id)
      )
    `);

    // Tabla para el estado de los archivos y componentes del proyecto
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_state (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        file_path TEXT,
        component_name TEXT,
        state_type TEXT NOT NULL,
        content_hash TEXT,
        metadata TEXT,
        last_modified INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (project_id) REFERENCES project_context(id)
      )
    `);

    // Tabla para configuraciones de agentes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_configs (
        id TEXT PRIMARY KEY,
        agent_type TEXT UNIQUE NOT NULL,
        model_name TEXT NOT NULL,
        config_params TEXT,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Índices para optimizar consultas
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_conversation_project ON conversation_history(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_state_project ON project_state(project_id);
    `);
  }

  // Operaciones para Project Context
  createProject(projectName, description = '') {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO project_context (id, project_name, description)
      VALUES (?, ?, ?)
    `);
    stmt.run(id, projectName, description);
    return id;
  }

  getProject(projectId) {
    const stmt = this.db.prepare('SELECT * FROM project_context WHERE id = ?');
    return stmt.get(projectId);
  }

  updateProject(projectId, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(projectId);
    
    const stmt = this.db.prepare(`
      UPDATE project_context 
      SET ${fields}, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `);
    stmt.run(...values);
  }

  // Operaciones para Conversation History
  addConversation(projectId, role, content, tokensUsed = 0) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO conversation_history (id, project_id, role, content, tokens_used)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, projectId, role, content, tokensUsed);
    return id;
  }

  getConversationHistory(projectId, limit = 50, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT * FROM conversation_history 
      WHERE project_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(projectId, limit, offset);
  }

  compressConversation(conversationId, summary) {
    const stmt = this.db.prepare(`
      UPDATE conversation_history 
      SET summary = ?, compressed = TRUE 
      WHERE id = ?
    `);
    stmt.run(summary, conversationId);
  }

  // Operaciones para Tasks
  createTask(projectId, agentType, description) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, project_id, agent_type, description)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, projectId, agentType, description);
    return id;
  }

  updateTaskStatus(taskId, status, result = null) {
    const stmt = this.db.prepare(`
      UPDATE tasks 
      SET status = ?, result = ?, completed_at = strftime('%s', 'now')
      WHERE id = ?
    `);
    stmt.run(status, result, taskId);
  }

  getTasksByProject(projectId, status = null) {
    let query = 'SELECT * FROM tasks WHERE project_id = ?';
    const params = [projectId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  // Operaciones para Project State
  updateProjectState(projectId, filePath, stateType, contentHash, metadata = {}) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO project_state (id, project_id, file_path, state_type, content_hash, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, projectId, filePath, stateType, contentHash, JSON.stringify(metadata));
    return id;
  }

  getProjectState(projectId) {
    const stmt = this.db.prepare(`
      SELECT * FROM project_state WHERE project_id = ?
    `);
    return stmt.all(projectId);
  }

  // Operaciones para Agent Configs
  setAgentConfig(agentType, modelName, configParams = {}) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO agent_configs (id, agent_type, model_name, config_params)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, agentType, modelName, JSON.stringify(configParams));
  }

  getAgentConfig(agentType) {
    const stmt = this.db.prepare('SELECT * FROM agent_configs WHERE agent_type = ?');
    return stmt.get(agentType);
  }

  getAllAgentConfigs() {
    const stmt = this.db.prepare('SELECT * FROM agent_configs');
    return stmt.all();
  }

  // Utilidades
  getTokenUsage(projectId) {
    const stmt = this.db.prepare(`
      SELECT 
        SUM(tokens_used) as total_tokens,
        (SELECT SUM(tokens_used) FROM conversation_history WHERE project_id = ?) as conversation_tokens,
        (SELECT SUM(tokens_used) FROM tasks WHERE project_id = ?) as task_tokens
      FROM conversation_history
      WHERE project_id = ?
    `);
    return stmt.get(projectId, projectId, projectId);
  }

  getContextSummary(projectId) {
    const project = this.getProject(projectId);
    const conversations = this.getConversationHistory(projectId, 10);
    const tasks = this.getTasksByProject(projectId);
    const state = this.getProjectState(projectId);
    const tokenUsage = this.getTokenUsage(projectId);

    return {
      project,
      recentConversations: conversations,
      tasks,
      currentState: state,
      tokenUsage
    };
  }

  close() {
    this.db.close();
  }
}

export default ContextDatabase;
