const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

app.use(express.static(path.join(__dirname, 'public')));

// Mock evaluation endpoint
app.post('/api/evaluate', upload.single('audio'), (req, res) => {
  // In real life, forward to evaluation service. Here we mock a result.
  const segmentId = req.body.segmentId || 'seg-' + Date.now();
  const duration = req.body.duration || null;
  // Simulate async evaluation delay
  setTimeout(() => {
    res.json({
      segmentId,
      score: Math.round(Math.random() * 100),
      feedback: 'Mock feedback for segment',
      duration
    });
  }, 1200);
});

// Simple file server for uploaded PDFs if needed
app.post('/api/upload-pdf', upload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  res.json({ path: '/uploads/' + path.basename(req.file.path), originalName: req.file.originalname });
});

const port = process.env.PORT || 5173;
app.listen(port, () => console.log(`ui-presenter running on http://localhost:${port}`));
