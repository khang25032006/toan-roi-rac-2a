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
    const outputSection = document.getElementById('output-section');
    if (!outputSection.classList.contains('hidden')) {
        runDijkstra();
    }
});

document.getElementById('btn-reset-graph').addEventListener('click', () => {
    document.getElementById('matrix-input').value = "";
    nodesDataSet.clear();
    edgesDataSet.clear();
    document.getElementById('output-section').classList.add('hidden');
    edgeStartNodeId = null;
    if (network) { 
        network.destroy(); 
        network = null; 
    }
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
        <input id="weight-input" type="number" min="0" value="${defaultValue}" 
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
        if (isNaN(val) || val < 0) val = 0; 
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
                        `Nhập trọng số cạnh (${formatNodeLabel(fromNode)}, ${formatNodeLabel(toNode)})` : 
                        `Nhập trọng số cung (${formatNodeLabel(fromNode)} &rarr; ${formatNodeLabel(toNode)})`;
                        
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

function solveDijkstraEngine(start, end, skipNodes, activeIds, matrixMap) {
    let dist = {}, trace = {}, finalized = {};
    activeIds.forEach(id => {
        dist[id] = Infinity;
        trace[id] = null;
        finalized[id] = false;
    });

    skipNodes.forEach(id => { finalized[id] = true; });
    dist[start] = 0;
    trace[start] = start;

    let tableRows = [];
    let stepCount = 1;

    let initRow = { step: "Bước khởi tạo", chosen: "-", states: {}, currentStarred: null };
    activeIds.forEach(id => {
        initRow.states[id] = { d: dist[id], p: trace[id], showDash: false, hasStar: false };
    });
    tableRows.push(initRow);

    let currentOpen = new Set(activeIds.filter(id => !skipNodes.includes(id)));

    while (currentOpen.size > 0) {
        let u = -1, minD = Infinity;
        currentOpen.forEach(id => {
            if (dist[id] < minD) { minD = dist[id]; u = id; }
        });

        if (u === -1) break;

        let lastRow = tableRows[tableRows.length - 1];
        lastRow.chosen = formatNodeLabel(u);
        lastRow.currentStarred = u;
        if (lastRow.states[u]) lastRow.states[u].hasStar = true;

        currentOpen.delete(u);
        finalized[u] = true;

        if (u === end) break;

        activeIds.forEach(v => {
            if (!finalized[v] && matrixMap[u] && matrixMap[u][v] !== undefined && matrixMap[u][v] !== Infinity) {
                let cost = matrixMap[u][v];
                if (dist[u] + cost < dist[v]) {
                    dist[v] = dist[u] + cost;
                    trace[v] = u;
                }
            }
        });

        let rowState = { step: String(stepCount++), chosen: "-", states: {}, currentStarred: null };
        activeIds.forEach(id => {
            let isAlreadyClosed = finalized[id];
            rowState.states[id] = { 
                d: dist[id], 
                p: trace[id], 
                showDash: isAlreadyClosed, 
                hasStar: false 
            };
        });
        tableRows.push(rowState);
    }

    if (tableRows.length > 1 && tableRows[tableRows.length - 1].chosen === "-") {
        tableRows.pop();
    }

    return { dist, trace, tableRows };
}

function runDijkstra() {
    drawGraph();

    const activeIds = nodesDataSet.getIds().map(Number).sort((a,b)=>a-b);
    if(activeIds.length === 0) return;

    const startVertex = parseNodeInput(document.getElementById('start-vertex').value) || 1;
    const mustPass = parseNodeInput(document.getElementById('must-pass-vertex').value);
    
    let skipStr = document.getElementById('skip-vertices').value.trim();
    let skipNodes = skipStr ? skipStr.split(/[\s,]+/).map(parseNodeInput).filter(n => n !== null) : [];

    let displayNodes = activeIds.filter(id => !skipNodes.includes(id));

    if (!activeIds.includes(startVertex) || skipNodes.includes(startVertex)) {
        alert("Đỉnh xuất phát không hợp lệ hoặc nằm trong danh sách bỏ qua!");
        return;
    }

    // Reset lại toàn bộ màu và độ dày của các cạnh về mặc định trước khi tô màu lộ trình mới
    edgesDataSet.get().forEach(e => {
        edgesDataSet.update({ id: e.id, color: '#737686', width: 2 });
    });

    let matrixMap = {};
    activeIds.forEach(id => matrixMap[id] = {});
    
    let matrix = parseMatrix();
    activeIds.forEach((i, rIdx) => {
        activeIds.forEach((j, cIdx) => {
            if (matrix[rIdx] && matrix[rIdx][cIdx] !== Infinity) {
                matrixMap[i][j] = matrix[rIdx][cIdx];
            } else {
                matrixMap[i][j] = Infinity;
            }
        });
    });

    document.getElementById('start-node-info').innerHTML = `.Đỉnh bắt đầu: <span class="text-primary font-bold">${formatNodeLabel(startVertex)}</span>`;
    if (skipNodes.length > 0) {
        document.getElementById('start-node-info').innerHTML += ` (Bỏ qua đỉnh: <span class="text-red-600 font-bold">${skipNodes.map(formatNodeLabel).join(', ')}</span>)`;
    }

    let theadHtml = `<tr><th class="p-3 w-32">Bước</th><th class="p-3 w-32">Đỉnh chọn</th>`;
    displayNodes.forEach(id => {
        theadHtml += `<th class="p-3">(d(${formatNodeLabel(id)}), đỉnh trước)</th>`;
    });
    theadHtml += `</tr>`;
    document.getElementById('result-thead').innerHTML = theadHtml;

    let finalRows = [];
    let pathResults = [];
    let edgesToColor = new Set();

    if (isNaN(mustPass) || mustPass === null || !activeIds.includes(mustPass) || skipNodes.includes(mustPass)) {
        let res = solveDijkstraEngine(startVertex, -1, skipNodes, activeIds, matrixMap);
        finalRows = res.tableRows;

        displayNodes.forEach(target => {
            if (target === startVertex) {
                pathResults.push(`<div><span class="math font-bold">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)})</span> = 0 &xrArr; Đường đi: <span class="font-bold text-green-700">${formatNodeLabel(startVertex)}</span></div>`);
                return;
            }
            if (res.dist[target] === Infinity) {
                pathResults.push(`<div><span class="math font-bold">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)})</span> = &infin; &xrArr; <span class="text-red-500 italic">Không có đường đi</span></div>`);
                return;
            }
            let path = [];
            let curr = target;
            while (curr !== startVertex && curr !== null) {
                path.push(curr);
                let prev = res.trace[curr];
                if (prev !== null) {
                    edgesToColor.add(`${prev}->${curr}`);
                    edgesToColor.add(`${Math.min(prev, curr)}-${Math.max(prev, curr)}`);
                }
                curr = prev;
            }
            path.push(startVertex);
            path.reverse();
            let formatPath = path.map(formatNodeLabel).join(' &rarr; ');
            pathResults.push(`<div><span class="math font-bold">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)})</span> = <span class="font-bold text-primary">${res.dist[target]}</span> &xrArr; Đường đi: <span class="font-bold text-green-700">${formatPath}</span></div>`);
        });
    } else {
        let res1 = solveDijkstraEngine(startVertex, mustPass, skipNodes, activeIds, matrixMap);
        let res2 = solveDijkstraEngine(mustPass, -1, skipNodes, activeIds, matrixMap);

        finalRows = [...res1.tableRows];
        res2.tableRows.forEach((row, i) => {
            if (i > 0) {
                row.step = `Chặng 2 - Bước ${row.step}`;
                finalRows.push(row);
            }
        });

        displayNodes.forEach(target => {
            if (target === startVertex) {
                pathResults.push(`<div><span class="math font-bold">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)})</span> = 0 &xrArr; Đường đi: <span class="font-bold text-green-700">${formatNodeLabel(startVertex)}</span></div>`);
                return;
            }
            let d1 = res1.dist[mustPass];
            let d2 = res2.dist[target];

            if (d1 === Infinity || d2 === Infinity) {
                pathResults.push(`<div><span class="math font-bold">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)})</span> = &infin; &xrArr; <span class="text-red-500 italic">Không có đường đi qua đỉnh ${formatNodeLabel(mustPass)}</span></div>`);
                return;
            }

            let p1 = [];
            let curr = mustPass;
            while(curr !== startVertex && curr !== null) { 
                p1.push(curr); 
                let prev = res1.trace[curr];
                if (prev !== null) {
                    edgesToColor.add(`${prev}->${curr}`);
                    edgesToColor.add(`${Math.min(prev, curr)}-${Math.max(prev, curr)}`);
                }
                curr = prev; 
            }
            p1.push(startVertex); p1.reverse();

            let p2 = [];
            curr = target;
            while(curr !== mustPass && curr !== null) { 
                p2.push(curr); 
                let prev = res2.trace[curr];
                if (prev !== null) {
                    edgesToColor.add(`${prev}->${curr}`);
                    edgesToColor.add(`${Math.min(prev, curr)}-${Math.max(prev, curr)}`);
                }
                curr = prev; 
            }
            p2.reverse();

            let fullPath = [...p1, ...p2].map(formatNodeLabel);
            pathResults.push(`<div><span class="math font-bold">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)})</span> = <span class="font-bold text-primary">${d1 + d2}</span> &xrArr; Đường đi bắt buộc qua ${formatNodeLabel(mustPass)}: <span class="font-bold text-green-700">${fullPath.join(' &rarr; ')}</span></div>`);
        });
    }

    // THỰC HIỆN TÔ MÀU CÁC CẠNH THUỘC ĐƯỜNG ĐI KẾT QUẢ ĐÃ TÌM ĐƯỢC
    edgesToColor.forEach(edgeId => {
        if (edgesDataSet.get(edgeId)) {
            edgesDataSet.update({ id: edgeId, color: '#16a34a', width: 4 });
        }
    });

    let tbodyHtml = "";
    finalRows.forEach(row => {
        tbodyHtml += `<tr class="hover:bg-gray-50 transition-colors">`;
        tbodyHtml += `<td class="p-3 font-bold text-gray-500 border border-gray-200">${row.step}</td>`;
        tbodyHtml += `<td class="p-3 font-bold text-primary border border-gray-200 uppercase">${row.chosen}</td>`;
        
        displayNodes.forEach(id => {
            let st = row.states[id];
            if (st) {
                if (st.showDash) {
                    tbodyHtml += `<td class="p-3 text-gray-400 border border-gray-200 text-center">_</td>`;
                } else {
                    let valStr = st.d === Infinity ? "&infin;" : String(st.d);
                    let prevStr = st.p === null ? "-" : formatNodeLabel(st.p);
                    let cellContent = `(${valStr}, ${prevStr})`;
                    if (st.hasStar) {
                        cellContent = `<span class="text-red-600 font-bold">${cellContent}*</span>`;
                    }
                    tbodyHtml += `<td class="p-3 border border-gray-200 text-center">${cellContent}</td>`;
                }
            } else {
                tbodyHtml += `<td class="p-3 border border-gray-200 text-center">_</td>`;
            }
        });
        tbodyHtml += `</tr>`;
    });

    document.getElementById('result-tbody').innerHTML = tbodyHtml;
    document.getElementById('paths-output').innerHTML = pathResults.join('');
    document.getElementById('output-section').classList.remove('hidden');
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById("btn-draw").addEventListener("click", drawGraph);
document.getElementById("btn-run").addEventListener("click", runDijkstra);

window.addEventListener("load", () => {
    drawGraph();
    changeMode('node');
});