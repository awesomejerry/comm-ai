// Minimal slide presenter + recorder prototype

const pdfInput = document.getElementById('pdfInput');
const main = document.getElementById('main');
const thumbnails = document.getElementById('thumbnails');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const slidePos = document.getElementById('slidePos');
const startRec = document.getElementById('startRec');
const pauseRec = document.getElementById('pauseRec');
const stopRec = document.getElementById('stopRec');
const recState = document.getElementById('recState');
const segmentsDiv = document.getElementById('segments');

let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;

let mediaRecorder = null;
let audioChunks = [];
let recording = false;
let segmentCounter = 0;
let segmentQueue = [];

function renderPage(pageNum) {
  pdfDoc.getPage(pageNum).then(page => {
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    const renderContext = { canvasContext: ctx, viewport };
    page.render(renderContext).promise.then(() => {
      main.innerHTML = '';
      main.appendChild(canvas);
      slidePos.textContent = `Slide ${currentPage} / ${totalPages}`;
    });
  });
}

function buildThumbnails() {
  thumbnails.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    pdfDoc.getPage(i).then(page => {
      const viewport = page.getViewport({ scale: 0.4 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      page.render({ canvasContext: ctx, viewport }).promise.then(() => {
        const div = document.createElement('div');
        div.className = 'thumb';
        div.appendChild(canvas);
        div.addEventListener('click', () => {
          currentPage = i;
          renderPage(currentPage);
        });
        thumbnails.appendChild(div);
      });
    });
  }
}

pdfInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function() {
    const typed = new Uint8Array(this.result);
    pdfjsLib.getDocument({ data: typed }).promise.then(doc => {
      pdfDoc = doc;
      totalPages = doc.numPages;
      currentPage = 1;
      renderPage(currentPage);
      buildThumbnails();
    });
  }
  reader.readAsArrayBuffer(file);
});

prevBtn.addEventListener('click', () => {
  if (!pdfDoc) return;
  if (currentPage > 1) { currentPage--; renderPage(currentPage); }
});
nextBtn.addEventListener('click', () => {
  if (!pdfDoc) return;
  if (currentPage < totalPages) { currentPage++; renderPage(currentPage); }
});

// Recording
async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];
  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  mediaRecorder.onstop = () => {
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    const id = 'segment-' + (++segmentCounter) + '-' + Date.now();
    const startSlide = currentPage; // simplification: mark start slide at pause
    const endSlide = currentPage;
    const seg = { id, blob, state: 'queued', startSlide, endSlide, createdAt: Date.now() };
    segmentQueue.push(seg);
    renderSegments();
    // auto-upload when created (on pause flow triggers stop())
    uploadSegment(seg);
  };
  mediaRecorder.start();
  recording = true;
  recState.textContent = 'Recording...';
  recState.className = 'recording';
  startRec.disabled = true;
  pauseRec.disabled = false;
  stopRec.disabled = false;
}

function pauseRecording() {
  if (mediaRecorder && recording) {
    mediaRecorder.stop();
    recording = false;
    recState.textContent = 'Paused';
    recState.className = '';
    startRec.disabled = false;
    pauseRec.disabled = true;
  }
}

function stopRecording() {
  if (mediaRecorder && recording) {
    mediaRecorder.stop();
    recording = false;
  }
  recState.textContent = 'Stopped';
  recState.className = '';
  startRec.disabled = false;
  pauseRec.disabled = true;
  stopRec.disabled = true;
}

startRec.addEventListener('click', startRecording);
pauseRec.addEventListener('click', pauseRecording);
stopRec.addEventListener('click', stopRecording);

function renderSegments() {
  segmentsDiv.innerHTML = '';
  for (const seg of segmentQueue) {
    const div = document.createElement('div');
    div.className = 'segment';
    div.innerHTML = `<div><strong>${seg.id}</strong> - ${seg.state} - slides ${seg.startSlide}-${seg.endSlide}</div>`;
    if (seg.state === 'uploading') div.innerHTML += '<div>Uploading...</div>';
    if (seg.state === 'failed') {
      const btn = document.createElement('button');
      btn.textContent = 'Retry';
      btn.addEventListener('click', () => uploadSegment(seg));
      div.appendChild(btn);
    }
    if (seg.evaluation) {
      div.innerHTML += `<div><strong>Score:</strong> ${seg.evaluation.score}</div><div>${seg.evaluation.feedback}</div>`;
    }
    segmentsDiv.appendChild(div);
  }
}

async function uploadSegment(seg) {
  seg.state = 'uploading';
  renderSegments();
  const form = new FormData();
  form.append('audio', seg.blob, seg.id + '.webm');
  form.append('segmentId', seg.id);
  form.append('startSlide', seg.startSlide);
  form.append('endSlide', seg.endSlide);
  form.append('duration', 'unknown');

  try {
    const resp = await fetch('/api/evaluate', { method: 'POST', body: form });
    if (!resp.ok) throw new Error('upload failed');
    const data = await resp.json();
    seg.state = 'evaluated';
    seg.evaluation = data;
    renderSegments();
  } catch (err) {
    console.error('upload error', err);
    seg.state = 'failed';
    renderSegments();
    // rudimentary retry after delay
    setTimeout(() => uploadSegment(seg), 2000);
  }
}

renderSegments();
