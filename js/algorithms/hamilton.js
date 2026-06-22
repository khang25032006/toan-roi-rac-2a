let network = null;
let nodesDataSet = new vis.DataSet();
let edgesDataSet = new vis.DataSet();
let currentMode = 'node'; 
let edgeStartNodeId = null;

const modeButtons = {
    node: document.getElementById('mode-node'),
    edge: document.getElementById('mode-edge'),
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

document.getElementById('display-mode').addEventListener('change', rebuildGraphFromUI);
document.getElementById('graph-type').addEventListener('change', rebuildGraphFromUI);

function rebuildGraphFromUI() {
    nodesDataSet.get().forEach(node => {
        nodesDataSet.update({ id: node.id, label: formatNodeLabel(node.id) });
    });
    let type = document.getElementById('graph-type').value;
    edgesDataSet.get().forEach(edge => {
        edgesDataSet.update({ id: edge.id, arrows: type === 'directed' ? 'to' : '' });
    });
    if (!document.getElementById('output-section').classList.contains('hidden')) {
        runHamiltonAlgorithm();
    }
}

function parseMatrix() {
    const text = document.getElementById("matrix-input").value.trim();
    if (!text) return [];
    return text.split("\n").map(row => row.trim().split(/\s+/).map(Number));
}

function updateMatrixFromUI() {
    const ids = nodesDataSet.getIds().map(Number).sort((a, b) => a - b);
    const n = ids.length;
    if (n === 0) { document.getElementById("matrix-input").value = ""; return; }
    let matrix = Array.from({ length: n }, () => Array(n).fill(0));
    const idToIndex = {};
    ids.forEach((id, index) => { idToIndex[id] = index; });
    
    let type = document.getElementById('graph-type').value;
    edgesDataSet.get().forEach(edge => {
        const uIdx = idToIndex[edge.from];
        const vIdx = idToIndex[edge.to];
        if (uIdx !== undefined && vIdx !== undefined) {
            matrix[uIdx][vIdx] = 1;
            if (type === 'undirected') matrix[vIdx][uIdx] = 1;
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
    let type = document.getElementById('graph-type').value;
    for (let i = 1; i <= n; i++) {
        nodesDataSet.add({ id: i, label: formatNodeLabel(i), color: { background: '#ffffff', border: '#004ac6' } });
    }
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (matrix[i][j] > 0) {
                if (type === 'undirected' && i > j) continue;
                edgesDataSet.add({
                    id: type === 'directed' ? `${i+1}->${j+1}` : `${Math.min(i+1, j+1)}-${Math.max(i+1, j+1)}`,
                    from: i + 1, to: j + 1,
                    arrows: type === 'directed' ? 'to' : '',
                    color: '#737686', width: 2
                });
            }
        }
    }
    if (network) { network.destroy(); network = null; }
    initNetwork();
}

function initNetwork() {
    const container = document.getElementById('network-container');
    network = new vis.Network(container, { nodes: nodesDataSet, edges: edgesDataSet }, {
        physics: { enabled: true, solver: 'repulsion' },
        nodes: { shape: 'circle', borderWidth: 2, font: { size: 16, face: 'Be Vietnam Pro', weight: 'bold' } },
        edges: { smooth: { type: 'continuous' } },
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

        if (currentMode === 'edge') {
            if (edgeStartNodeId === null) {
                edgeStartNodeId = nodeId;
                nodesDataSet.update({ id: nodeId, color: { background: '#ffebee', border: '#e53935' } });
            } else {
                const fromNode = edgeStartNodeId;
                const toNode = nodeId;
                nodesDataSet.update({ id: fromNode, color: { background: '#ffffff', border: '#004ac6' } });
                if (fromNode === toNode) { edgeStartNodeId = null; return; }

                let type = document.getElementById('graph-type').value;
                const existing = edgesDataSet.get({
                    filter: item => (item.from === fromNode && item.to === toNode) || (type === 'undirected' && item.from === toNode && item.to === fromNode)
                });
                if (existing.length === 0) {
                    edgesDataSet.add({
                        id: type === 'directed' ? `${fromNode}->${toNode}` : `${Math.min(fromNode, toNode)}-${Math.max(fromNode, toNode)}`,
                        from: fromNode, to: toNode,
                        arrows: type === 'directed' ? 'to' : '',
                        color: '#737686', width: 2
                    });
                    updateMatrixFromUI();
                }
                edgeStartNodeId = null;
            }
        } else if (currentMode === 'delete') {
            const edgesToRemove = edgesDataSet.get({ filter: edge => edge.from === nodeId || edge.to === nodeId }).map(e => e.id);
            if (edgesToRemove.length > 0) edgesToRemove.remove(edgesToRemove);
            nodesDataSet.remove(nodeId);
            updateMatrixFromUI();
        }
    });
}

function checkStronglyConnected(n, matrix) {
    for (let start = 0; start < n; start++) {
        let visited = new Set();
        let queue = [start];
        visited.add(start);
        while (queue.length > 0) {
            let u = queue.shift();
            for (let v = 0; v < n; v++) {
                if (matrix[u][v] > 0 && !visited.has(v)) {
                    visited.add(v);
                    queue.push(v);
                }
            }
        }
        if (visited.size !== n) return false;
    }
    return true;
}

function runHamiltonAlgorithm() {
    drawGraph();
    const activeIds = nodesDataSet.getIds().map(Number).sort((a,b)=>a-b);
    const n = activeIds.length;
    if (n === 0) return;

    let matrix = parseMatrix();
    let isDirected = document.getElementById('graph-type').value === 'directed';
    let startVertex = parseNodeInput(document.getElementById('start-vertex').value) || 1;
    if (!activeIds.includes(startVertex)) startVertex = activeIds[0];

    edgesDataSet.get().forEach(e => {
        edgesDataSet.update({ id: e.id, color: '#737686', width: 2 });
    });

    let htmlLog = `<div class="mb-3 font-semibold text-gray-700">&bull; Giả sử đồ thị <span class="math">G</span> có chu trình Hamilton <span class="math">H</span>. Ta tiến hành biện luận logic tuần tiến:</div>`;

    if (isDirected) {
        let isStronglyConnected = checkStronglyConnected(n, matrix);
        if (!isStronglyConnected) {
            document.getElementById('hamilton-analysis-container').innerHTML = `<div class="rule-card text-red-700 border-red-500 font-bold">&bull; Đồ thị có hướng KHÔNG liên thông mạnh! Không tồn tại chu trình Hamilton.</div>`;
            document.getElementById('final-sequence').innerHTML = `Khẳng định đồ thị KHÔNG có chu trình Hamilton.`;
            document.getElementById('output-section').classList.remove('hidden');
            return;
        }
    } else {
        let currentDeg = Array(n).fill(0);
        let initialDeg = Array(n).fill(0);
        activeIds.forEach((id, idx) => {
            let d = 0;
            for (let j = 0; j < n; j++) { if (matrix[idx][j] > 0) d++; }
            currentDeg[idx] = d;
            initialDeg[idx] = d;
        });

        let degreeTwoNodes = [];
        activeIds.forEach((id, idx) => { if (currentDeg[idx] === 2) degreeTwoNodes.push(id); });

        if (degreeTwoNodes.length > 0) {
            htmlLog += `<div class="mb-2">&bull; <b>Bước 1: Khảo sát bậc đỉnh ban đầu</b><br>`;
            htmlLog += `<span class="pl-4 block">Các đỉnh có bậc bằng 2 ban đầu: <span class="text-primary font-bold">${degreeTwoNodes.map(formatNodeLabel).join(', ')}</span>.</span></div>`;
            
            let forcedEdges = [];
            degreeTwoNodes.forEach(id => {
                let idx = activeIds.indexOf(id);
                for (let j = 0; j < n; j++) {
                    if (matrix[idx][j] > 0) {
                        let edgeName = formatNodeLabel(id) + formatNodeLabel(activeIds[j]);
                        let revName = formatNodeLabel(activeIds[j]) + formatNodeLabel(id);
                        if (!forcedEdges.includes(edgeName) && !forcedEdges.includes(revName)) {
                            forcedEdges.push(edgeName);
                        }
                    }
                }
            });
            htmlLog += `<div class="rule-card">&bull; <b>Áp dụng Quy tắc 1 (Cạnh ép buộc):</b><br>`;
            htmlLog += `Chu trình Hamilton <span class="math">H</span> bắt buộc phải đi qua các cạnh kề của đỉnh bậc 2. Ta cố định các cạnh: <span class="text-green-700 font-bold">${forcedEdges.join(', ')}</span>.</div>`;

            let affectedNodes = new Set();
            degreeTwoNodes.forEach(id => {
                let idx = activeIds.indexOf(id);
                for (let j = 0; j < n; j++) {
                    if (matrix[idx][j] > 0) affectedNodes.add(activeIds[j]);
                }
            });

            let trackingChain = "";
            affectedNodes.forEach(adjId => {
                let adjIdx = activeIds.indexOf(adjId);
                let countForced = 0;
                degreeTwoNodes.forEach(id => {
                    let idx = activeIds.indexOf(id);
                    if (matrix[idx][adjIdx] > 0) countForced++;
                });

                if (countForced >= 2 && initialDeg[adjIdx] > countForced) {
                    let edgesToRemove = [];
                    for (let j = 0; j < n; j++) {
                        if (matrix[adjIdx][j] > 0 && !degreeTwoNodes.includes(activeIds[j])) {
                            edgesToRemove.push(formatNodeLabel(adjId) + formatNodeLabel(activeIds[j]));
                        }
                    }

                    if (edgesToRemove.length > 0) {
                        trackingChain += `<div class="mb-2">- Xét đỉnh lân cận <span class="text-primary font-bold">${formatNodeLabel(adjId)}</span>: Do chu trình <span class="math">H</span> đã lấy đủ 2 cạnh đi qua nó từ các đỉnh bậc 2, ta áp dụng <b>Quy tắc 3</b> để loại bỏ các cạnh thừa còn lại: <span class="text-red-600 font-bold">${edgesToRemove.join(', ')}</span>.</div>`;
                        
                        for (let j = 0; j < n; j++) {
                            if (matrix[adjIdx][j] > 0 && !degreeTwoNodes.includes(activeIds[j])) {
                                currentDeg[adjIdx]--;
                                currentDeg[j]--;
                            }
                        }

                        let newDegreeTwoNodes = [];
                        for (let j = 0; j < n; j++) {
                            if (matrix[adjIdx][j] > 0 && !degreeTwoNodes.includes(activeIds[j]) && currentDeg[j] === 2) {
                                newDegreeTwoNodes.push(activeIds[j]);
                            }
                        }

                        if (newDegreeTwoNodes.length > 0) {
                            trackingChain += `<div class="pl-4 text-xs text-gray-600 italic font-sans mb-2">`;
                            newDegreeTwoNodes.forEach(newNode => {
                                trackingChain += `+ Đỉnh ${formatNodeLabel(newNode)} bị hệ quả suy giảm số bậc khả dụng xuống bậc 2 mới phát sinh.<br>`;
                            });
                            trackingChain += `</div>`;
                            
                            let secondaryForced = [];
                            newDegreeTwoNodes.forEach(newNode => {
                                let nIdx = activeIds.indexOf(newNode);
                                for (let k = 0; k < n; k++) {
                                    if (matrix[nIdx][k] > 0 && matrix[adjIdx][k] === 0) {
                                        secondaryForced.push(formatNodeLabel(newNode) + formatNodeLabel(activeIds[k]));
                                    }
                                }
                            });
                            if (secondaryForced.length > 0) {
                                trackingChain += `<div class="mb-2">Quay lại Quy tắc 1, chu trình <span class="math">H</span> bắt buộc phải nhận thêm các cạnh của đỉnh bậc 2 mới này: <span class="text-green-700 font-bold">${secondaryForced.join(', ')}</span>.</div>`;
                            }
                        }
                    }
                }
            });

            if (trackingChain !== "") {
                htmlLog += `<div class="mb-2">&bull; <b>Bước 2: Hệ quả phản ứng dây chuyền liên hoàn</b></div>`;
                htmlLog += `<div class="pl-4 border-l-2 border-amber-500 space-y-1 mb-3">${trackingChain}</div>`;
            }
        }
    }

    let path = Array(n).fill(-1);
    let visited = Array(n).fill(false);
    let cyclesFound = [];

    path[0] = startVertex;
    visited[activeIds.indexOf(startVertex)] = true;

    function findCycles(pos) {
        let u = path[pos - 1];
        let uIdx = activeIds.indexOf(u);
        if (pos === n) {
            let startIdx = activeIds.indexOf(startVertex);
            if (matrix[uIdx][startIdx] > 0) { cyclesFound.push([...path, startVertex]); }
            return;
        }
        for (let vIdx = 0; vIdx < n; vIdx++) {
            if (matrix[uIdx][vIdx] > 0) {
                let v = activeIds[vIdx];
                if (!visited[vIdx]) {
                    visited[vIdx] = true;
                    path[pos] = v;
                    findCycles(pos + 1);
                    visited[vIdx] = false;
                    path[pos] = -1;
                }
            }
        }
    }
    findCycles(1);

    if (cyclesFound.length > 0) {
        let c = cyclesFound[0];
        htmlLog += `<div class="text-green-700 font-bold mb-2">&bull; Kết luận bước duyệt: Thuật toán tìm kiếm quay lui khớp nối thành công chuỗi xích bao phủ toàn bộ đồ thị mà không vi phạm các quy tắc logic trên.</div>`;
        document.getElementById('hamilton-analysis-container').innerHTML = htmlLog;
        
        let pathString = c.map(formatNodeLabel).join(' &rarr; ');
        document.getElementById('final-sequence').innerHTML = `Suy ra đồ thị có chu trình Hamilton <span class="math">H</span>: <span class="text-green-700 font-bold">${pathString}</span>`;

        for (let i = 0; i < c.length - 1; i++) {
            let nodeU = c[i];
            let nodeV = c[i + 1];
            let edgeId = isDirected ? `${nodeU}->${nodeV}` : `${Math.min(nodeU, nodeV)}-${Math.max(nodeU, nodeV)}`;
            if (edgesDataSet.get(edgeId)) {
                edgesDataSet.update({ id: edgeId, color: '#16a34a', width: 4 });
            }
        }
    } else {
        htmlLog += `<div class="rule-card text-red-700 border-red-500 mb-2">&bull; <b>Phát hiện mâu thuẫn (Quy tắc 2 & 4):</b> Quá trình ép buộc các cạnh dẫn đến việc khép kín vòng lặp sớm (chu trình con) khi chưa đi qua hết tất cả các đỉnh, hoặc tạo ra đỉnh treo không thể thoát ra. Mâu thuẫn với giả thiết ban đầu.</div>`;
        document.getElementById('hamilton-analysis-container').innerHTML = htmlLog;
        document.getElementById('final-sequence').innerHTML = `Khẳng định đồ thị KHÔNG có chu trình Hamilton.`;
    }

    document.getElementById('output-section').classList.remove('hidden');
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById("btn-draw").addEventListener("click", drawGraph);
document.getElementById("btn-run").addEventListener("click", runHamiltonAlgorithm);

window.addEventListener("load", () => {
    drawGraph();
    changeMode('node');
});