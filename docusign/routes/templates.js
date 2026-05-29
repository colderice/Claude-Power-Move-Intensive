const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { Templates } = require('../db');

router.use(requireAuth);

router.get('/', (req, res) => {
  const templates = Templates.list(req.user.id).map((t) => ({
    ...t,
    fields: JSON.parse(t.fields),
  }));
  res.json(templates);
});

router.get('/:id', (req, res) => {
  const t = Templates.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Template not found' });
  res.json({ ...t, fields: JSON.parse(t.fields) });
});

router.post('/', (req, res) => {
  const { title, description, content, fields } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });
  const id = Templates.create({ title, description, content, fields, created_by: req.user.id });
  res.status(201).json({ id });
});

router.put('/:id', (req, res) => {
  const t = Templates.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Template not found' });
  const { title, description, content, fields } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });
  Templates.update(req.params.id, { title, description, content, fields });
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  const t = Templates.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Template not found' });
  Templates.delete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
