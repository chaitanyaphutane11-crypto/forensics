import createModule from './core.js';

createModule().then(Module => {
  window.Module = Module;
  const status = document.getElementById('statusDisp');
  if (status) status.innerText = "JS Framework Ready";

  // Wrap exported functions
  const runSummation = Module.cwrap('runSummation', null,
    ['number','number','number','number','string']);
  const generateAuditReport = Module.cwrap('generateAuditReport', 'string',
    ['number','number']);
  const analyzeMatrix = Module.cwrap('analyzeMatrix', 'string', []);
  const calcRemaining = Module.cwrap('calcRemaining', 'number',
    ['number','number','number']);
  const runBracket = Module.cwrap('runBracket', 'string', ['string']);
  const getBufferSize = Module.cwrap('getBufferSize', 'number', []);
  const getArchBits = Module.cwrap('getArchBits', 'number', []);

  // Enable buttons once JS module is ready
  ['btnSum','btnMat','btnRem','btnBrk'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = false;
  });

  // Run Summation
  document.getElementById('btnSum').addEventListener('click', () => {
    const base = parseInt(document.getElementById('eBase').value, 10);
    const exp = parseInt(document.getElementById('eExp').value, 10);
    const iters = parseInt(document.getElementById('eIters').value, 10);
    const batch = parseInt(document.getElementById('eBatch').value, 10);

    runSummation(base, exp, iters, batch, "12345");

    const treeView = document.getElementById('treeView');
    treeView.innerHTML = "";
    for (let i = 1; i <= iters; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Step ${i}`;
      treeView.appendChild(opt);
    }

    status.innerText = `Buffer: ${getBufferSize()} B | Arch: ${getArchBits()}-bit`;
  });

  // TreeView selection → show audit report
  document.getElementById('treeView').addEventListener('change', (e) => {
    const idx = parseInt(e.target.value, 10);
    const detail = document.getElementById('detail');
    detail.value = generateAuditReport(1, idx);
  });

  // Analyze Matrix
  document.getElementById('btnMat').addEventListener('click', () => {
    const auditLog = document.getElementById('auditLog');
    auditLog.value = analyzeMatrix();
  });

  // Calc Remaining
  document.getElementById('btnRem').addEventListener('click', () => {
    const base = parseInt(document.getElementById('eBase').value, 10);
    const exp = parseInt(document.getElementById('eExp').value, 10);
    const batch = parseInt(document.getElementById('eBatch').value, 10);
    const rem = calcRemaining(base, exp, batch);
    alert(`Steps Remaining: ${rem}`);
  });

  // Bracket Logic
  document.getElementById('btnBrk').addEventListener('click', () => {
    const brkIn = document.getElementById('brkIn').value;
    const brkLog = document.getElementById('brkLog');
    brkLog.value = runBracket(brkIn);
  });

}).catch(err => {
  console.error("Failed to initialize JS fallback:", err);
  const status = document.getElementById('statusDisp');
  if (status) status.innerText = "Init failed";
});
