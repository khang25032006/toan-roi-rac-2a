let network = null;
let nodesDataSet = new vis.DataSet();
let edgesDataSet = new vis.DataSet();
let currentMode = 'node'; 
let edgeStartNodeId = null;

const modeButtons = {
    node: document.getElementById('mode-node'),
    edge: document.getElementById('mode-edge'),
    arc: document.getElementById('mode-arc'),
    delete: document.getElementById('mode-delete')
};

function formatNodeLabel(id) {
    const mode = document.getElementById('display-mode').value;
    if (mode === 'alpha') {
        return String.fromCharCode(64 + id);
    }
    return String(id);
}

function parseNodeInput(val) {
    if (!val) return null;
    let clean = val.trim().toUpperCase();
    if (clean.length === 0) return null;
    if (!isNaN(clean)) return parseInt(clean);
    return clean.charCodeAt(0) - 64;
}

function changeMode(mode) {
    currentMode = mode;
    if (edgeStartNodeId !== null) {
        nodesDataSet.update({ id: edgeStartNodeId, color: { background: '#ffffff', border: '#004ac6' } });
        edgeStartNodeId = null;
    }
    Object.keys(modeButtons).forEach(key => {
        if (key === mode) {
            modeButtons[key].classList.remove('bg-gray-200', 'text-on-surface');
            modeButtons[key].classList.add('bg-primary', 'text-white');
        } else {
            modeButtons[key].classList.remove('bg-primary', 'text-white');
            modeButtons[key].classList.add('bg-gray-200', 'text-on-surface');
        }
    });
}

Object.keys(modeButtons).forEach(mode => {
    modeButtons[mode].addEventListener('click', () => changeMode(mode));
});

document.getElementById('display-mode').addEventListener('change', () => {
    nodesDataSet.get().forEach(node => {
        nodesDataSet.update({ id: node.id, label: formatNodeLabel(node.id) });
    });
    if (!document.getElementById('output-section').classList.contains('hidden')) {
        runFloydAlgorithm();
    }
});

document.getElementById('btn-reset-graph').addEventListener('click', () => {
    document.getElementById('matrix-input').value = "";
    nodesDataSet.clear();
    edgesDataSet.clear();
    document.getElementById('output-section').classList.add('hidden');
    edgeStartNodeId = null;
    if (network) { network.destroy(); network = null; }
    initNetwork();
});

function parseMatrix() {
    const text = document.getElementById("matrix-input").value.trim();
    if (!text) return [];
    return text.split("\n").map((row, rIdx) => 
        row.trim().split(/\s+/).map((num, cIdx) => {
            let clean = num.toLowerCase().trim();
            if (clean === 'i' || clean === 'inf' || clean === '∞') {
                return Infinity;
            }
            const val = parseFloat(num);
            if (isNaN(val)) return Infinity;
            if (val === 0 && rIdx !== cIdx) {
                return 0;
            }
            return val;
        })
    );
}

function updateMatrixFromUI() {
    const ids = nodesDataSet.getIds().map(Number).sort((a, b) => a - b);
    const n = ids.length;
    if (n === 0) { document.getElementById("matrix-input").value = ""; return; }
    
    let matrix = Array.from({ length: n }, () => Array(n).fill('I'));
    for (let i = 0; i < n; i++) matrix[i][i] = 0;

    const idToIndex = {};
    ids.forEach((id, index) => { idToIndex[id] = index; });
    
    edgesDataSet.get().forEach(edge => {
        const uIdx = idToIndex[edge.from];
        const vIdx = idToIndex[edge.to];
        if (uIdx !== undefined && vIdx !== undefined) {
            matrix[uIdx][vIdx] = edge.weight;
            if (edge.type === 'edge') {
                matrix[vIdx][uIdx] = edge.weight;
            }
        }
    });
    document.getElementById("matrix-input").value = matrix.map(row => row.join(" ")).join("\n");
}

function drawGraph() {
    const matrix = parseMatrix();
    const n = matrix.length;
    nodesDataSet.clear();
    edgesDataSet.clear();
    if (n === 0) {
        if (network) { network.destroy(); network = null; }
        initNetwork();
        return;
    }
    for (let i = 1; i <= n; i++) {
        nodesDataSet.add({ id: i, label: formatNodeLabel(i), color: { background: '#ffffff', border: '#004ac6' } });
    }
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (matrix[i][j] !== Infinity) {
                if (i === j) continue;
                if (matrix[j][i] === matrix[i][j] && i < j) {
                    edgesDataSet.add({
                        id: `${i+1}-${j+1}`,
                        from: i + 1, to: j + 1,
                        weight: matrix[i][j], label: String(matrix[i][j]),
                        color: '#737686', width: 2, type: 'edge', arrows: ''
                    });
                } else if (matrix[j][i] !== matrix[i][j]) {
                    edgesDataSet.add({
                        id: `${i+1}->${j+1}`,
                        from: i + 1, to: j + 1,
                        weight: matrix[i][j], label: String(matrix[i][j]),
                        color: '#737686', width: 2, type: 'arc', arrows: 'to'
                    });
                }
            }
        }
    }
    if (network) { network.destroy(); network = null; }
    initNetwork();
}

function showWeightInputDialog(title, defaultValue, callback) {
    const overlay = document.createElement('div');
    overlay.id = 'weight-modal-overlay';
    overlay.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center;
        z-index:1000;
    `;
    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4';
    modal.innerHTML = `
        <h3 class="text-lg font-bold text-primary mb-4">${title}</h3>
        <input id="weight-input" type="number" step="any" value="${defaultValue}" 
               class="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary" autofocus>
        <div class="flex justify-end gap-2">
            <button id="weight-cancel" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition">Hủy</button>
            <button id="weight-ok" class="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 transition">OK</button>
        </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = document.getElementById('weight-input');
    const okBtn = document.getElementById('weight-ok');
    const cancelBtn = document.getElementById('weight-cancel');

    const close = (value) => { overlay.remove(); callback(value); };

    okBtn.addEventListener('click', () => {
        let val = parseFloat(input.value.trim());
        if (isNaN(val)) val = 0; 
        close(val);
    });
    cancelBtn.addEventListener('click', () => close(null));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') okBtn.click();
        if (e.key === 'Escape') cancelBtn.click();
    });
    input.focus(); input.select();
}

function initNetwork() {
    const container = document.getElementById('network-container');
    network = new vis.Network(container, { nodes: nodesDataSet, edges: edgesDataSet }, {
        physics: { enabled: true, solver: 'repulsion' },
        nodes: { shape: 'circle', borderWidth: 2, font: { size: 16, face: 'Be Vietnam Pro', weight: 'bold' } },
        edges: {
            smooth: { type: 'continuous' },
            font: { align: 'middle', background: '#ffffff', strokeWidth: 1.5, strokeColor: '#004ac6', size: 14, color: '#191c1e', weight: 'bold' }
        },
        interaction: { hover: true, selectConnectedEdges: false }
    });

    network.on("click", function (params) {
        const nodeId = params.nodes.length > 0 ? params.nodes[0] : null;
        const edgeId = params.edges.length > 0 ? params.edges[0] : null;
        const canvasCoord = params.pointer.canvas;

        if (edgeId !== null) {
            if (currentMode === 'delete') { edgesDataSet.remove(edgeId); updateMatrixFromUI(); }
            return;
        }

        if (nodeId === null) {
            if (currentMode === 'node') {
                const currentIds = nodesDataSet.getIds().map(Number);
                const nextId = currentIds.length > 0 ? Math.max(...currentIds) + 1 : 1;
                nodesDataSet.add({ id: nextId, label: formatNodeLabel(nextId), x: canvasCoord.x, y: canvasCoord.y, color: { background: '#ffffff', border: '#004ac6' } });
                updateMatrixFromUI();
            }
            return;
        }

        if (currentMode === 'edge' || currentMode === 'arc') {
            if (edgeStartNodeId === null) {
                edgeStartNodeId = nodeId;
                nodesDataSet.update({ id: nodeId, color: { background: '#ffebee', border: '#e53935' } });
            } else {
                const fromNode = edgeStartNodeId;
                const toNode = nodeId;
                nodesDataSet.update({ id: fromNode, color: { background: '#ffffff', border: '#004ac6' } });

                if (fromNode === toNode) { edgeStartNodeId = null; return; }

                const existing = edgesDataSet.get({
                    filter: item => (item.from === fromNode && item.to === toNode) || 
                                   (item.type === 'edge' && item.from === toNode && item.to === fromNode)
                });

                if (existing.length === 0) {
                    let labelText = currentMode === 'edge' ? 
                        `Nhập trọng số cạnh vô hướng (${formatNodeLabel(fromNode)}, ${formatNodeLabel(toNode)})` : 
                        `Nhập trọng số cung có hướng (${formatNodeLabel(fromNode)} &rarr; ${formatNodeLabel(toNode)})`;
                        
                    showWeightInputDialog(labelText, "1", (weight) => {
                        if (weight !== null) {
                            edgesDataSet.add({
                                id: currentMode === 'edge' ? `${Math.min(fromNode, toNode)}-${Math.max(fromNode, toNode)}` : `${fromNode}->${toNode}`,
                                from: fromNode, to: toNode, weight: weight, label: String(weight), 
                                color: '#737686', width: 2, type: currentMode, arrows: currentMode === 'arc' ? 'to' : ''
                            });
                            updateMatrixFromUI();
                        }
                    });
                }
                edgeStartNodeId = null;
            }
        } else if (currentMode === 'delete') {
            const edgesToRemove = edgesDataSet.get({ filter: edge => edge.from === nodeId || edge.to === nodeId }).map(e => e.id);
            if (edgesToRemove.length > 0) edgesDataSet.remove(edgesToRemove);
            nodesDataSet.remove(nodeId);
            updateMatrixFromUI();
        }
    });

    network.on("doubleClick", function (params) {
        const edgeId = params.edges.length > 0 ? params.edges[0] : null;
        if (edgeId === null) return;
        const edge = edgesDataSet.get(edgeId);
        if (!edge) return;

        showWeightInputDialog(`Sửa trọng số (${formatNodeLabel(edge.from)} ${edge.type === 'arc' ? '&rarr;' : '-'} ${formatNodeLabel(edge.to)})`, String(edge.weight), (newWeight) => {
            if (newWeight !== null) {
                edgesDataSet.update({ id: edgeId, weight: newWeight, label: String(newWeight) });
                updateMatrixFromUI();
            }
        });
    });

    const resizeObserver = new ResizeObserver(() => { if (network) network.fit(); });
    resizeObserver.observe(document.getElementById('resize-container'));
}

function renderMatrixHTML(title, matrix, nodesList, kIdx = -1) {
    let html = `<div class="flex flex-col items-center">
                    <div class="font-bold text-gray-700 text-sm mb-1">${title}</div>
                    <table class="matrix-table font-mono">
                        <thead>
                            <tr><th></th>`;
    nodesList.forEach(id => html += `<th>${formatNodeLabel(id)}</th>`);
    html += `</tr></thead><tbody>`;
    nodesList.forEach((i) => {
        html += `<tr><td class="font-bold bg-gray-50">${formatNodeLabel(i)}</td>`;
        nodesList.forEach((j) => {
            let val = matrix[i][j];
            let valStr = "";
            if (title.includes("P")) {
                valStr = (val === 0 || val === null) ? "-" : formatNodeLabel(val);
            } else {
                valStr = val === Infinity ? "&infin;" : String(val);
            }
            let cellClass = "";
            if (kIdx !== -1 && (i === kIdx || j === kIdx)) {
                cellClass = `class="matrix-highlight-rc"`;
            }
            html += `<td ${cellClass}>${valStr}</td>`;
        });
        html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
}

function runFloydAlgorithm() {
    drawGraph();
    const activeIds = nodesDataSet.getIds().map(Number).sort((a,b)=>a-b);
    const n = activeIds.length;
    if (n === 0) return;

    const startVertex = parseNodeInput(document.getElementById('start-vertex').value) || 1;
    let skipStr = document.getElementById('skip-vertices').value.trim();
    let skipNodes = skipStr ? skipStr.split(/[\s,]+/).map(parseNodeInput).filter(n => n !== null) : [];
    let mustPass = parseNodeInput(document.getElementById('must-pass-vertex').value);

    let displayNodes = activeIds.filter(id => !skipNodes.includes(id));

    // Reset màu sắc cung/cạnh về trạng thái mặc định ban đầu
    edgesDataSet.get().forEach(e => {
        edgesDataSet.update({ id: e.id, color: '#737686', width: 2 });
    });

    let D = {}, P = {};
    activeIds.forEach(i => {
        D[i] = {}; P[i] = {};
        activeIds.forEach(j => {
            if (i === j) { D[i][j] = 0; P[i][j] = i; }
            else { D[i][j] = Infinity; P[i][j] = i; }
        });
    });

    let rawMatrix = parseMatrix();
    activeIds.forEach((i, rIdx) => {
        activeIds.forEach((j, cIdx) => {
            if (rawMatrix[rIdx] && rawMatrix[rIdx][cIdx] !== Infinity) {
                if (i === j) return;
                D[i][j] = rawMatrix[rIdx][cIdx];
            }
        });
    });

    let condText = `• Đồ thị gồm <span class="font-bold text-primary">${displayNodes.length}</span> đỉnh hoạt động.`;
    if(skipNodes.length > 0) condText += ` (Đã loại bỏ: <span class="text-red-600 font-bold">${skipNodes.map(formatNodeLabel).join(', ')}</span>)`;
    if(mustPass && displayNodes.includes(mustPass)) condText += ` (Truy vết ràng buộc qua đỉnh: <span class="text-green-700 font-bold">${formatNodeLabel(mustPass)}</span>)`;
    document.getElementById('floyd-condition-info').innerHTML = condText;

    let stepsContainer = document.getElementById('matrices-steps-container');
    stepsContainer.innerHTML = "";

    let stepHtml = `<div class="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div class="text-base font-bold text-primary border-b pb-2 mb-3">Bước khởi tạo (k = 0)</div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${renderMatrixHTML("Ma trận khoảng cách D<sup>(0)</sup>", D, displayNodes)}
                            ${renderMatrixHTML("Ma trận vết P<sup>(0)</sup>", P, displayNodes)}
                        </div>
                    </div>`;
    stepsContainer.innerHTML += stepHtml;

    displayNodes.forEach(k => {
        displayNodes.forEach(i => {
            displayNodes.forEach(j => {
                if (D[i][k] + D[k][j] < D[i][j]) {
                    D[i][j] = D[i][k] + D[k][j];
                    P[i][j] = P[k][j];
                }
            });
        });

        let kLabel = formatNodeLabel(k);
        let currentStepHtml = `
            <div class="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
                <div class="text-base font-bold text-primary border-b pb-2 mb-3 flex justify-between">
                    <span>Xét trạm trung chuyển k = ${kLabel} (D<sup>(${kLabel})</sup> và P<sup>(${kLabel})</sup>)</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${renderMatrixHTML(`Ma trận khoảng cách D<sup>(${kLabel})</sup>`, D, displayNodes, k)}
                    ${renderMatrixHTML(`Ma trận vết P<sup>(${kLabel})</sup>`, P, displayNodes, k)}
                </div>
            </div>`;
        stepsContainer.innerHTML += currentStepHtml;
    });

    let hasNegativeCycle = false;
    displayNodes.forEach(i => {
        if (D[i][i] < 0) hasNegativeCycle = true;
    });

    if (hasNegativeCycle) {
        document.getElementById('paths-summary-output').innerHTML = `<div class="col-span-2 text-red-600 font-bold p-3 bg-red-50 rounded border border-red-200 text-center">Phát hiện chu trình âm trên đồ thị! Thuật toán Floyd không thể đưa ra kết quả đường đi ngắn nhất hợp lệ.</div>`;
        document.getElementById('output-section').classList.remove('hidden');
        return;
    }

    let summaryHtml = "";
    let edgesToColor = new Set();

    displayNodes.forEach(target => {
        if (target === startVertex) {
            summaryHtml += `<div class="border-b pb-1">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)}) = 0 &xrArr; Đường đi: <span class="font-bold text-green-700">${formatNodeLabel(startVertex)}</span></div>`;
            return;
        }

        let finalCost = D[startVertex][target];
        if (mustPass && displayNodes.includes(mustPass)) {
            finalCost = D[startVertex][mustPass] + D[mustPass][target];
        }

        if (finalCost === Infinity) {
            summaryHtml += `<div class="border-b pb-1 text-gray-400">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)}) = &infin; &xrArr; <span class="italic text-red-500">Không có đường đi</span></div>`;
            return;
        }

        let loopGuard = 0;
        if (mustPass && displayNodes.includes(mustPass) && startVertex !== mustPass && target !== mustPass) {
            let p1 = [mustPass], p2 = [target];
            
            let curr = mustPass;
            while (curr !== startVertex && P[startVertex][curr] !== curr && P[startVertex][curr] !== null && loopGuard++ < n) {
                let prev = P[startVertex][curr];
                if (prev !== null) {
                    edgesToColor.add(`${prev}->${curr}`);
                    edgesToColor.add(`${Math.min(prev, curr)}-${Math.max(prev, curr)}`);
                }
                curr = prev; p1.push(curr);
            }
            p1.reverse();
            
            curr = target;
            while (curr !== mustPass && P[mustPass][curr] !== curr && P[mustPass][curr] !== null && loopGuard++ < n) {
                let prev = P[mustPass][curr];
                if (prev !== null) {
                    edgesToColor.add(`${prev}->${curr}`);
                    edgesToColor.add(`${Math.min(prev, curr)}-${Math.max(prev, curr)}`);
                }
                curr = prev; p2.push(curr);
            }
            p2.reverse();
            
            let fullPath = [...p1, ...p2.slice(1)].map(formatNodeLabel).join('&rarr;');
            summaryHtml += `<div class="border-b pb-1">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)}) [qua ${formatNodeLabel(mustPass)}] = <span class="font-bold text-primary">${finalCost}</span> &xrArr; Đường đi: <span class="font-bold text-green-700">${fullPath}</span></div>`;
        } else {
            let path = [target];
            let curr = target;
            while (curr !== startVertex && P[startVertex][curr] !== curr && P[startVertex][curr] !== null && loopGuard++ < n) {
                let prev = P[startVertex][curr];
                if (prev !== null) {
                    edgesToColor.add(`${prev}->${curr}`);
                    edgesToColor.add(`${Math.min(prev, curr)}-${Math.max(prev, curr)}`);
                }
                curr = prev;
                path.push(curr);
            }
            path.reverse();
            summaryHtml += `<div class="border-b pb-1">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)}) = <span class="font-bold text-primary">${finalCost}</span> &xrArr; Đường đi: <span class="font-bold text-green-700">${path.map(formatNodeLabel).join('&rarr;')}</span></div>`;
        }
    });

    // Thực hiện tô màu xanh lá cây đậm cho các cung thuộc lộ trình tìm được
    edgesToColor.forEach(edgeId => {
        if (edgesDataSet.get(edgeId)) {
            edgesDataSet.update({ id: edgeId, color: '#16a34a', width: 4 });
        }
    });

    document.getElementById('paths-summary-output').innerHTML = summaryHtml;
    document.getElementById('output-section').classList.remove('hidden');
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById("btn-draw").addEventListener("click", drawGraph);
document.getElementById("btn-run").addEventListener("click", runFloydAlgorithm);

window.addEventListener("load", () => {
    drawGraph();
    changeMode('node');
});