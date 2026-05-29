const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { Templates, Instances, Audit } = require('../db');
const { sendClientInvite, sendAdminNotification } = require('../utils/email');

router.use(requireAuth);

router.get('/', (req, res) => {
  const instances = Instances.list().map(parseInstance);
  res.json(instances);
});

router.get('/:id', (req, res) => {
  const inst = Instances.findById(req.params.id);
  if (!inst) return res.status(404).json({ error: 'Not found' });
  const auditLog = Audit.forInstance(req.params.id);
  res.json({ ...parseInstance(inst), audit_log: auditLog });
});

router.post('/', async (req, res) => {
  const { template_id, client_name, client_email, client_message } = req.body;
  if (!template_id || !client_name || !client_email) {
    return res.status(400).json({ error: 'template_id, client_name, and client_email are required' });
  }

  const template = Templates.findById(template_id);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const snapshot = { ...template, fields: JSON.parse(template.fields) };
  const { id, token } = Instances.create({
    template_id,
    template_snapshot: snapshot,
    client_name,
    client_email: client_email.toLowerCase().trim(),
    client_message,
    created_by: req.user.id,
  });

  Audit.log({
    instance_id: id,
    action: 'agreement_sent',
    actor_type: 'admin',
    actor_name: req.user.name,
    actor_email: req.user.email,
    ip: req.ip,
    user_agent: req.headers['user-agent'],
    metadata: { client_name, client_email },
  });

  const signingUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/sign?token=${token}`;
  try {
    await sendClientInvite({ client_name, client_email, template_title: template.title, signing_url: signingUrl, client_message });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }

  res.status(201).json({ id, signing_url: signingUrl });
});

router.post('/:id/void', (req, res) => {
  const inst = Instances.findById(req.params.id);
  if (!inst) return res.status(404).json({ error: 'Not found' });
  if (inst.status === 'completed') return res.status(400).json({ error: 'Cannot void a completed agreement' });

  Instances.void(req.params.id);
  Audit.log({
    instance_id: req.params.id,
    action: 'agreement_voided',
    actor_type: 'admin',
    actor_name: req.user.name,
    actor_email: req.user.email,
    ip: req.ip,
    user_agent: req.headers['user-agent'],
  });
  res.json({ ok: true });
});

router.post('/:id/remind', async (req, res) => {
  const inst = Instances.findById(req.params.id);
  if (!inst) return res.status(404).json({ error: 'Not found' });
  if (inst.status !== 'sent') return res.status(400).json({ error: 'Can only remind for pending agreements' });

  const snapshot = JSON.parse(inst.template_snapshot);
  const signingUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/sign?token=${inst.signing_token}`;
  try {
    await sendClientInvite({
      client_name: inst.client_name,
      client_email: inst.client_email,
      template_title: snapshot.title,
      signing_url: signingUrl,
      client_message: inst.client_message,
      is_reminder: true,
    });
    Audit.log({ instance_id: inst.id, action: 'reminder_sent', actor_type: 'admin', actor_name: req.user.name, actor_email: req.user.email, ip: req.ip });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reminder: ' + err.message });
  }
});

router.get('/:id/pdf', (req, res) => {
  const inst = Instances.findById(req.params.id);
  if (!inst) return res.status(404).json({ error: 'Not found' });
  if (!inst.pdf_path) return res.status(404).json({ error: 'PDF not generated yet' });
  res.download(inst.pdf_path, `agreement-${inst.id.slice(0, 8)}.pdf`);
});

function parseInstance(inst) {
  return {
    ...inst,
    template_snapshot: safeJson(inst.template_snapshot, {}),
    field_values: safeJson(inst.field_values, {}),
  };
}

function safeJson(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = router;
