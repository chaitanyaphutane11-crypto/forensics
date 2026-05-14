// State variables
let deltaStart = { step: 0 };
let wasmModuleRef = null;
let nodeBigIntMap = new Map();

// Exported initializer called from console.html
export function initUIBridge(Module) {
  wasmModuleRef = Module;
  console.log("UI Bridge connected to WASM.");

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab, .tab-content').forEach(el => el.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // Summation button
  document.getElementById('btnSum').addEventListener('click', () => {
    if (!wasmModuleRef) return;
    const base = BigInt(document.getElementById('eBase').value);
    const exp = parseInt(document.getElementById('eExp').value);
    const iters = parseInt(document.getElementById('eIters').value);
    const batch = BigInt(document.getElementById('eBatch').value);

    nodeBigIntMap.clear();
    const treeView = document.getElementById('treeView');
    treeView.innerHTML = '';
    deltaStart = { step: 0 };

    let currentVal = 0n;
    for (let i = 1; i <= iters; i++) {
      currentVal += batch;
      nodeBigIntMap.set(i, currentVal);
      const opt = document.createElement('option');
      opt.value = i;
      opt.text = `Step ${i}`;
      treeView.appendChild(opt);
    }

    wasmModuleRef.runSummation(Number(base), exp, iters, Number(batch), currentVal.toString());
    document.getElementById('statusDisp').innerText =
      `Buffer: ${wasmModuleRef.getBufferSize()} B | Arch: ${wasmModuleRef.getArchBits()}-bit`;
  });

  // TreeView change handler
  document.getElementById('treeView').addEventListener('change', (e) => {
    if (!wasmModuleRef) return;
    const stepId = parseInt(e.target.value);
    const currentBigIntVal = nodeBigIntMap.get(stepId);

    if (deltaStart.step === 0) {
      deltaStart.step = stepId;
      document.getElementById('detail').value =
        `DEC: ${currentBigIntVal.toString()}\nHEX: 0x${currentBigIntVal.toString(16).toUpperCase()}\n\n[START Locked. Select second node to audit]`;
    } else {
      const startVal = nodeBigIntMap.get(deltaStart.step);
      const diff = currentBigIntVal - startVal;
      let report = wasmModuleRef.generateAuditReport(deltaStart.step, stepId);

      let prefix = `AUDIT (Step ${deltaStart.step} -> ${stepId})\r\n`;
      prefix += `DELTA DEC: ${diff.toString()}\r\nDELTA HEX: 0x${diff.toString(16).toUpperCase()}\r\nDELTA OCT: 0${diff.toString(8)}\r\n`;

      document.getElementById('auditLog').value = prefix + report;
      document.getElementById('detail').value = `Metrics compiled in 'Binary Audit' Tab.`;
      deltaStart.step = 0;
    }
  });

  // Matrix root button
  document.getElementById('btnMat').addEventListener('click', () => {
    if (nodeBigIntMap.size === 0) return;
    const lastKey = Array.from(nodeBigIntMap.keys()).pop();
    const maxVal = nodeBigIntMap.get(lastKey);

    let root = 0n, x = maxVal;
    while (x > 0n) {
      let nextX = (x + maxVal / x) / 2n;
      if (nextX >= x) { root = x; break; }
      x = nextX;
    }

    const opt = document.createElement('option');
    opt.text = `Matrix Root: ${root.toString()}`;
    opt.style.fontWeight = "bold";
    document.getElementById('treeView').add(opt, null);
  });

  // Remaining steps button
  document.getElementById('btnRem').addEventListener('click', () => {
    if (nodeBigIntMap.size === 0) return;
    const base = BigInt(document.getElementById('eBase').value);
    const exp = parseInt(document.getElementById('eExp').value);
    const batch = BigInt(document.getElementById('eBatch').value);
    const maxVal = nodeBigIntMap.get(Array.from(nodeBigIntMap.keys()).pop());
    const target = base ** BigInt(exp);

    if (target < maxVal) {
      alert("Steps Remaining: 0");
      return;
    }
    alert(`Steps Remaining: ${((target - maxVal) / batch).toString()}`);
  });

  // Bracket audit button
  document.getElementById('btnBrk').addEventListener('click', () => {
    let logStr = "BRACKET BINARY AUDIT:\r\n";
    const stack = [];
    const tokens = document.getElementById('brkIn').value.split('');

    tokens.forEach((char, index) => {
      if (char === '{') stack.push(index + 1);
      else if (char === '}' && stack.length > 0)
        logStr += `Match: Pos ${stack.pop()}-${index + 1} | VALID\r\n`;
    });

    document.getElementById('brkLog').value = logStr;
  });
}
