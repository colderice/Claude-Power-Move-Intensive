require('dotenv').config();
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const db = new Database(path.join(__dirname, 'docusign.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS agreement_templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    fields TEXT NOT NULL DEFAULT '[]',
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS agreement_instances (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    template_snapshot TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_message TEXT,
    signing_token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'sent',
    field_values TEXT DEFAULT '{}',
    client_signature TEXT,
    client_signed_at DATETIME,
    client_ip TEXT,
    client_user_agent TEXT,
    admin_signature TEXT,
    admin_signed_by TEXT,
    admin_signed_at DATETIME,
    admin_ip TEXT,
    pdf_path TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES agreement_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_type TEXT NOT NULL,
    actor_name TEXT,
    actor_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_id) REFERENCES agreement_instances(id)
  );
`);

// Seed admin user if none exists
const existing = db.prepare('SELECT id FROM users LIMIT 1').get();
if (!existing) {
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'changeme123', 10);
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, 'admin')
  `).run(uuidv4(), process.env.ADMIN_NAME || 'Admin', process.env.ADMIN_EMAIL || 'admin@example.com', hash);
  console.log('Seeded admin user:', process.env.ADMIN_EMAIL || 'admin@example.com');
}

// --- Users ---
const Users = {
  findByEmail: (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email),
  findById: (id) => db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id),
};

// --- Templates ---
const Templates = {
  list: (userId) => db.prepare('SELECT * FROM agreement_templates ORDER BY created_at DESC').all(),
  findById: (id) => db.prepare('SELECT * FROM agreement_templates WHERE id = ?').get(id),
  create: (data) => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO agreement_templates (id, title, description, content, fields, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.title, data.description || '', data.content, JSON.stringify(data.fields || []), data.created_by);
    return id;
  },
  update: (id, data) => {
    db.prepare(`
      UPDATE agreement_templates
      SET title = ?, description = ?, content = ?, fields = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.title, data.description || '', data.content, JSON.stringify(data.fields || []), id);
  },
  delete: (id) => db.prepare('DELETE FROM agreement_templates WHERE id = ?').run(id),
};

// --- Instances ---
const Instances = {
  list: () => db.prepare('SELECT * FROM agreement_instances ORDER BY created_at DESC').all(),
  findById: (id) => db.prepare('SELECT * FROM agreement_instances WHERE id = ?').get(id),
  findByToken: (token) => db.prepare('SELECT * FROM agreement_instances WHERE signing_token = ?').get(token),
  create: (data) => {
    const id = uuidv4();
    const token = uuidv4();
    db.prepare(`
      INSERT INTO agreement_instances
        (id, template_id, template_snapshot, client_name, client_email, client_message, signing_token, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.template_id, JSON.stringify(data.template_snapshot), data.client_name, data.client_email, data.client_message || '', token, data.created_by);
    return { id, token };
  },
  clientSign: (id, data) => {
    db.prepare(`
      UPDATE agreement_instances
      SET status = 'client_signed',
          field_values = ?,
          client_signature = ?,
          client_signed_at = CURRENT_TIMESTAMP,
          client_ip = ?,
          client_user_agent = ?
      WHERE id = ?
    `).run(JSON.stringify(data.field_values), data.signature, data.ip, data.user_agent, id);
  },
  adminSign: (id, data) => {
    db.prepare(`
      UPDATE agreement_instances
      SET status = 'completed',
          admin_signature = ?,
          admin_signed_by = ?,
          admin_signed_at = CURRENT_TIMESTAMP,
          admin_ip = ?,
          pdf_path = ?
      WHERE id = ?
    `).run(data.signature, data.admin_id, data.ip, data.pdf_path, id);
  },
  void: (id) => db.prepare("UPDATE agreement_instances SET status = 'voided' WHERE id = ?").run(id),
};

// --- Audit Log ---
const Audit = {
  log: (data) => {
    db.prepare(`
      INSERT INTO audit_log (id, instance_id, action, actor_type, actor_name, actor_email, ip_address, user_agent, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), data.instance_id, data.action, data.actor_type, data.actor_name || null, data.actor_email || null, data.ip || null, data.user_agent || null, JSON.stringify(data.metadata || {}));
  },
  forInstance: (instanceId) => db.prepare('SELECT * FROM audit_log WHERE instance_id = ? ORDER BY created_at ASC').all(instanceId),
};

module.exports = { db, Users, Templates, Instances, Audit };
