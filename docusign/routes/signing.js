const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { Instances, Audit, Users } = require('../db');
const { sendAdminNotification, sendCompletedCopies } = require('../utils/email');
const { generatePDF } = require('../utils/pdf');

// Client: verify token and get agreement details
router.get('/verify/:token', (req, res) => {
  const inst = Instances.findByToken(req.params.token);
  if (!inst) return res.status(404).json({ error: 'Agreement not found' });
  if (inst.status === 'voided') return res.status(410).json({ error: 'This agreement has been voided' });
  if (inst.status !== 'sent') return res.status(409).json({ error: 'This agreement has already been signed' });

  const snapshot = JSON.parse(inst.template_snapshot);
  res.json({
    id: inst.id,
    client_name: inst.client_name,
    client_email: inst.client_email,
    client_message: inst.client_message,
    title: snapshot.title,
    description: snapshot.description,
    content: snapshot.content,
    fields: snapshot.fields,
  });
});

// Client: submit signature + form data
router.post('/client/:token', async (req, res) => {
  const inst = Instances.findByToken(req.params.token);
  if (!inst) return res.status(404).json({ error: 'Agreement not found' });
  if (inst.status !== 'sent') return res.status(409).json({ error: 'This link has already been used' });

  const { field_values, signature } = req.body;
  if (!signature) return res.status(400).json({ error: 'Signature is required' });

  const snapshot = JSON.parse(inst.template_snapshot);

  // Validate required fields
  const fields = snapshot.fields || [];
  for (const field of fields) {
    if (field.required && !field_values?.[field.name]) {
      return res.status(400).json({ error: `Field "${field.label}" is required` });
    }
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  const user_agent = req.headers['user-agent'];

  Instances.clientSign(inst.id, { field_values: field_values || {}, signature, ip, user_agent });

  Audit.log({
    instance_id: inst.id,
    action: 'client_signed',
    actor_type: 'client',
    actor_name: inst.client_name,
    actor_email: inst.client_email,
    ip,
    user_agent,
    metadata: { field_count: Object.keys(field_values || {}).length },
  });

  // Notify admin
  const adminUser = Users.findByEmail(process.env.ADMIN_EMAIL || 'admin@example.com');
  const reviewUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/review?id=${inst.id}`;
  try {
    await sendAdminNotification({
      admin_name: adminUser?.name || 'Admin',
      admin_email: adminUser?.email || process.env.ADMIN_EMAIL,
      client_name: inst.client_name,
      template_title: snapshot.title,
      review_url: reviewUrl,
    });
  } catch (err) {
    console.error('Admin notification failed:', err.message);
  }

  res.json({ ok: true, message: 'Signature submitted successfully' });
});

// Admin: get instance for review (protected)
router.get('/admin/review/:id', requireAuth, (req, res) => {
  const inst = Instances.findById(req.params.id);
  if (!inst) return res.status(404).json({ error: 'Not found' });
  if (inst.status !== 'client_signed') return res.status(409).json({ error: 'Agreement is not awaiting admin signature' });

  const snapshot = JSON.parse(inst.template_snapshot);
  const fieldValues = JSON.parse(inst.field_values || '{}');

  res.json({
    id: inst.id,
    client_name: inst.client_name,
    client_email: inst.client_email,
    client_signed_at: inst.client_signed_at,
    client_ip: inst.client_ip,
    title: snapshot.title,
    description: snapshot.description,
    content: snapshot.content,
    fields: snapshot.fields,
    field_values: fieldValues,
    client_signature: inst.client_signature,
    audit_log: Audit.forInstance(inst.id),
  });
});

// Admin: countersign
router.post('/admin/:id', requireAuth, async (req, res) => {
  const inst = Instances.findById(req.params.id);
  if (!inst) return res.status(404).json({ error: 'Not found' });
  if (inst.status !== 'client_signed') return res.status(409).json({ error: 'Agreement is not awaiting admin signature' });

  const { signature } = req.body;
  if (!signature) return res.status(400).json({ error: 'Signature is required' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

  // Generate PDF
  let pdfPath;
  try {
    const snapshot = JSON.parse(inst.template_snapshot);
    const fieldValues = JSON.parse(inst.field_values || '{}');
    const adminUser = Users.findById(req.user.id);
    pdfPath = await generatePDF({ inst, snapshot, fieldValues, adminSignature: signature, adminUser });
  } catch (err) {
    console.error('PDF generation failed:', err);
    return res.status(500).json({ error: 'PDF generation failed: ' + err.message });
  }

  Instances.adminSign(inst.id, { signature, admin_id: req.user.id, ip, pdf_path: pdfPath });

  Audit.log({
    instance_id: inst.id,
    action: 'admin_signed',
    actor_type: 'admin',
    actor_name: req.user.name,
    actor_email: req.user.email,
    ip,
    user_agent: req.headers['user-agent'],
  });

  // Email completed PDF to both parties
  try {
    const snapshot = JSON.parse(inst.template_snapshot);
    await sendCompletedCopies({
      client_name: inst.client_name,
      client_email: inst.client_email,
      admin_name: req.user.name,
      admin_email: req.user.email,
      template_title: snapshot.title,
      pdf_path: pdfPath,
      instance_id: inst.id,
    });
  } catch (err) {
    console.error('Completed email failed:', err.message);
  }

  res.json({ ok: true, pdf_path: pdfPath });
});

module.exports = router;
