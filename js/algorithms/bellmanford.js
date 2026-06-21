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
        runBellmanFord();
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
    return text.split("\n").map(row => 
        row.trim().split(/\s+/).map(num => {
            const val = parseFloat(num);
            return isNaN(val) ? 0 : val;
        })
    );
}

function updateMatrixFromUI() {
    const ids = nodesDataSet.getIds().map(Number).sort((a, b) => a - b);
    const n = ids.length;
    if (n === 0) { document.getElementById("matrix-input").value = ""; return; }
    
    let matrix = Array.from({ length: n }, () => Array(n).fill(0));
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
            if (matrix[i][j] !== 0) {
                if (matrix[j][i] === matrix[i][j] && i < j) {
                    edgesDataSet.add({
                        id: `${i+1}-${j+1}`,
                        from: i + 1, to: j + 1,
                        weight: matrix[i][j], label: String(matrix[i][j]),
                        color: '#737686', width: 2, type: 'edge', arrows: ''
                    });
                } else {
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

// ======================== LOÀI GIẢI BELLMAN-FORD VÀ KẾT XUẤT TIẾN TRÌNH ========================
function runBellmanFord() {
    drawGraph();

    const activeIds = nodesDataSet.getIds().map(Number).sort((a,b)=>a-b);
    const n = activeIds.length;
    if(n === 0) return;

    const startVertex = parseNodeInput(document.getElementById('start-vertex').value) || 1;
    const mustPass = parseNodeInput(document.getElementById('must-pass-vertex').value);
    
    let skipStr = document.getElementById('skip-vertices').value.trim();
    let skipNodes = skipStr ? skipStr.split(/[\s,]+/).map(parseNodeInput).filter(n => n !== null) : [];

    let displayNodes = activeIds.filter(id => !skipNodes.includes(id));

    if (!activeIds.includes(startVertex) || skipNodes.includes(startVertex)) {
        alert("Đỉnh xuất phát không hợp lệ hoặc nằm trong danh sách bỏ qua!");
        return;
    }

    // Tổ chức danh sách cạnh kề có hướng từ ma trận nhị phân gốc
    let edgeList = [];
    let matrix = parseMatrix();
    activeIds.forEach((i, rIdx) => {
        activeIds.forEach((j, cIdx) => {
            if (matrix[rIdx] && matrix[rIdx][cIdx] !== 0) {
                if (!skipNodes.includes(i) && !skipNodes.includes(j)) {
                    edgeList.push({ from: i, to: j, weight: matrix[rIdx][cIdx] });
                }
            }
        });
    });

    document.getElementById('start-node-info').innerHTML = `.Đỉnh bắt đầu: <span class="text-primary font-bold">${formatNodeLabel(startVertex)}</span>`;
    if (skipNodes.length > 0) {
        document.getElementById('start-node-info').innerHTML += ` (Bỏ qua đỉnh: <span class="text-red-600 font-bold">${skipNodes.map(formatNodeLabel).join(', ')}</span>)`;
    }

    // Sinh cột bảng tự luận động
    let theadHtml = `<tr><th class="p-3 w-32">Vòng lặp k</th>`;
    displayNodes.forEach(id => {
        theadHtml += `<th class="p-3">Đỉnh ${formatNodeLabel(id)} (d/p)</th>`;
    });
    theadHtml += `</tr>`;
    document.getElementById('result-thead').innerHTML = theadHtml;

    // Tiến trình lõi Bellman-Ford đa điều kiện loang chặng liên hoàn
    function solveCoreBF(startNode) {
        let dist = {}, trace = {};
        activeIds.forEach(id => { dist[id] = Infinity; trace[id] = null; });
        dist[startNode] = 0;
        trace[startNode] = startNode;

        let rowsHistory = [];

        // Bước 1: Trạng thái khởi tạo (k = 0)
        let stepZero = { step: "Khởi tạo (k=0)", states: {} };
        activeIds.forEach(id => { stepZero.states[id] = { d: dist[id], p: trace[id] }; });
        rowsHistory.push(stepZero);

        // Bước 2: Lặp n - 1 vòng tối ưu hạ nhãn dần đều
        for (let k = 1; k <= n - 1; k++) {
            let changed = false;
            let currentDistCopy = { ...dist };
            let currentTraceCopy = { ...trace };

            edgeList.forEach(edge => {
                if (currentDistCopy[edge.from] !== Infinity && currentDistCopy[edge.from] + edge.weight < currentDistCopy[edge.to]) {
                    currentDistCopy[edge.to] = currentDistCopy[edge.from] + edge.weight;
                    currentTraceCopy[edge.to] = edge.from;
                    changed = true;
                }
            });

            dist = currentDistCopy;
            trace = currentTraceCopy;

            let stepRecord = { step: `Vòng lặp ${k}`, states: {} };
            activeIds.forEach(id => { stepRecord.states[id] = { d: dist[id], p: trace[id] }; });
            rowsHistory.push(stepRecord);
        }

        // Bước 3: Chạy vòng lặp thứ n để bắt lỗi chu trình âm độc hại
        let hasNegativeCycle = false;
        edgeList.forEach(edge => {
            if (dist[edge.from] !== Infinity && dist[edge.from] + edge.weight < dist[edge.to]) {
                hasNegativeCycle = true;
            }
        });

        return { dist, trace, rowsHistory, hasNegativeCycle };
    }

    let mainRes = solveCoreBF(startVertex);

    if (mainRes.hasNegativeCycle) {
        document.getElementById('result-tbody').innerHTML = `<tr><td colspan="${displayNodes.length + 1}" class="p-4 text-center font-bold text-red-600 bg-red-50">Phát hiện chu trình âm trên đồ thị! Thuật toán Bellman-Ford dừng chạy để bảo toàn tài nguyên bộ nhớ.</td></tr>`;
        document.getElementById('paths-output').innerHTML = `<span class="text-red-600 font-bold">Không thể kết luận đường đi do tồn tại chu trình trọng số âm vô hạn.</span>`;
        document.getElementById('output-section').classList.remove('hidden');
        return;
    }

    // Render nội dung bảng tự luận dạng d/p hạ nhãn tuần tiến
    let tbodyHtml = "";
    mainRes.rowsHistory.forEach(row => {
        tbodyHtml += `<tr class="hover:bg-gray-50 transition-colors">`;
        tbodyHtml += `<td class="p-3 font-bold text-gray-500 border border-gray-200">${row.step}</td>`;
        
        displayNodes.forEach(id => {
            let st = row.states[id];
            if (st) {
                let dStr = st.d === Infinity ? "&infin;" : String(st.d);
                let pStr = st.p === null ? "-" : formatNodeLabel(st.p);
                tbodyHtml += `<td class="p-3 border border-gray-200 text-center font-semibold text-gray-700">${dStr} / ${pStr}</td>`;
            } else {
                tbodyHtml += `<td class="p-3 border border-gray-200 text-center text-gray-400">_</td>`;
            }
        });
        tbodyHtml += `</tr>`;
    });
    document.getElementById('result-tbody').innerHTML = tbodyHtml;

    // Kết luận truy vết đa điều kiện mở rộng
    let pathResults = [];
    if (isNaN(mustPass) || mustPass === null || !activeIds.includes(mustPass) || skipNodes.includes(mustPass)) {
        displayNodes.forEach(target => {
            if (target === startVertex) {
                pathResults.push(`<div><span class="math font-bold">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)})</span> = 0 &xrArr; Lộ trình: <span class="font-bold text-green-700">${formatNodeLabel(startVertex)}</span></div>`);
                return;
            }
            if (mainRes.dist[target] === Infinity) {
                pathResults.push(`<div><span class="math font-bold">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)})</span> = &infin; &xrArr; <span class="text-red-500 italic">Không có đường đi liên thông</span></div>`);
                return;
            }
            let path = [];
            let curr = target;
            let guard = 0;
            while (curr !== startVertex && curr !== null && guard++ < n) {
                path.push(formatNodeLabel(curr));
                curr = mainRes.trace[curr];
            }
            path.push(formatNodeLabel(startVertex));
            path.reverse();
            pathResults.push(`<div><span class="math font-bold">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)})</span> = <span class="font-bold text-primary">${mainRes.dist[target]}</span> &xrArr; Đường đi: <span class="font-bold text-green-700">${path.join(' &rarr; ')}</span></div>`);
        });
    } else {
        // Hỗ trợ loang ghép vết 2 chặng liên hoàn cho điều kiện bắt buộc qua đỉnh K
        document.getElementById('start-node-info').innerHTML += ` <span class="text-green-700 font-bold">[Bắt buộc đi qua đỉnh ${formatNodeLabel(mustPass)}]</span>`;
        let res1 = solveCoreBF(startVertex);
        let res2 = solveCoreBF(mustPass);

        displayNodes.forEach(target => {
            if (target === startVertex) {
                pathResults.push(`<div><span class="math font-bold">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)})</span> = 0 &xrArr; Lộ trình: <span class="font-bold text-green-700">${formatNodeLabel(startVertex)}</span></div>`);
                return;
            }
            let d1 = res1.dist[mustPass];
            let d2 = res2.dist[target];

            if (d1 === Infinity || d2 === Infinity) {
                pathResults.push(`<div><span class="math font-bold">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)})</span> = &infin; &xrArr; <span class="text-red-500 italic">Không có đường đi qua trạm ${formatNodeLabel(mustPass)}</span></div>`);
                return;
            }

            let p1 = [];
            let curr = mustPass;
            let guard = 0;
            while(curr !== startVertex && curr !== null && guard++ < n) { p1.push(formatNodeLabel(curr)); curr = res1.trace[curr]; }
            p1.push(formatNodeLabel(startVertex)); p1.reverse();

            let p2 = [];
            curr = target;
            guard = 0;
            while(curr !== mustPass && curr !== null && guard++ < n) { p2.push(formatNodeLabel(curr)); curr = res2.trace[curr]; }
            p2.reverse();

            let fullPath = [...p1, ...p2];
            pathResults.push(`<div><span class="math font-bold">d(${formatNodeLabel(startVertex)}, ${formatNodeLabel(target)})</span> = <span class="font-bold text-primary">${d1 + d2}</span> &xrArr; Đường đi: <span class="font-bold text-green-700">${fullPath.join(' &rarr; ')}</span></div>`);
        });
    }

    document.getElementById('paths-output').innerHTML = pathResults.join('');
    document.getElementById('output-section').classList.remove('hidden');
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById("btn-draw").addEventListener("click", drawGraph);
document.getElementById("btn-run").addEventListener("click", runBellmanFord);

window.addEventListener("load", () => {
    drawGraph();
    changeMode('node');
});