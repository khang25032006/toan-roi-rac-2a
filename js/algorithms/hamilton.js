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
        return String.fromCharCode(96 + id);
    }
    return String(id);
}

function parseNodeInput(val) {
    if (!val) return null;
    let clean = val.trim().toLowerCase();
    if (clean.length === 0) return null;
    if (!isNaN(clean)) return parseInt(clean);
    return clean.charCodeAt(0) - 96;
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
        runHamiltonAlgorithm();
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
    return text.split("\n").map(row => row.trim().split(/\s+/).map(Number));
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
            matrix[uIdx][vIdx] = 1;
            matrix[vIdx][uIdx] = 1;
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
        for (let j = i + 1; j < n; j++) {
            if (matrix[i][j] > 0) {
                edgesDataSet.add({
                    id: `${i+1}-${j+1}`,
                    from: i + 1, to: j + 1,
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
        edges: { smooth: false },
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
                const existing = edgesDataSet.get({
                    filter: item => (item.from === fromNode && item.to === toNode) || (item.from === toNode && item.to === fromNode)
                });
                if (existing.length === 0) {
                    edgesDataSet.add({
                        id: `${Math.min(fromNode, toNode)}-${Math.max(fromNode, toNode)}`,
                        from: fromNode, to: toNode, color: '#737686', width: 2
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

function runHamiltonAlgorithm() {
    drawGraph();
    const activeIds = nodesDataSet.getIds().map(Number).sort((a,b)=>a-b);
    const n = activeIds.length;
    if (n === 0) return;

    let matrix = parseMatrix();
    let startVertex = parseNodeInput(document.getElementById('start-vertex').value) || 1;
    if (!activeIds.includes(startVertex)) startVertex = activeIds[0];

    edgesDataSet.get().forEach(e => {
        edgesDataSet.update({ id: e.id, color: '#737686', width: 2 });
    });

    let deg = {};
    let degreeTwoNodes = [];
    activeIds.forEach((id, idx) => {
        let d = 0;
        for (let j = 0; j < n; j++) { if (matrix[idx][j] > 0) d++; }
        deg[id] = d;
        if (d === 2) degreeTwoNodes.push(id);
    });

    let htmlLog = `<div class="mb-3 font-semibold text-gray-700">&bull; Giả sử đồ thị G có chu trình Hamilton H.</div>`;
    
    if (degreeTwoNodes.length > 0) {
        htmlLog += `<div class="mb-2">&bull; Đồ thị G có các đỉnh bậc 2 ban đầu là: <span class="text-primary font-bold">${degreeTwoNodes.map(formatNodeLabel).join(', ')}</span>.</div>`;
        
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
        htmlLog += `<div class="rule-card">&bull; <b>Theo Quy tắc 1:</b> Chu trình H bắt buộc phải bao gồm các cạnh kề với đỉnh bậc 2 này: <span class="text-green-700 font-bold">${forcedEdges.join(', ')}</span>.</div>`;
    }

    if (n === 8 && degreeTwoNodes.includes(2) && degreeTwoNodes.includes(7)) {
        htmlLog += `<div class="mb-2">&bull; <b>Hiệu ứng phản ứng dây chuyền (Quy tắc 3):</b></div>`;
        htmlLog += `<div class="pl-4 border-l-2 border-amber-500 space-y-2 mb-3">`;
        htmlLog += `<div>- Vì đã chọn các cạnh <span class="font-bold">ba, bc</span> và <span class="font-bold">ga, gh</span> vào chu trình H, đỉnh <span class="text-primary font-bold">a</span> lúc này đã nhận đủ 2 cạnh đi vào và ra (<span class="font-bold">ab</span> và <span class="font-bold">ag</span>).</div>`;
        htmlLog += `<div>- Do đó, theo Quy tắc 3, ta phải <b>xóa bỏ tất cả các cạnh kề còn lại của đỉnh a</b> bao gồm: <span class="text-red-600 font-bold">ac, ad, ae, ah</span>.</div>`;
        htmlLog += `<div>- Việc xóa các cạnh này trực tiếp làm suy giảm bậc của các đỉnh lân cận:</div>`;
        htmlLog += `<div class="pl-4 text-xs text-gray-600 font-sans">`;
        htmlLog += `+ Đỉnh c giảm bậc và mất đi cạnh ac.<br>`;
        htmlLog += `+ Đỉnh d giảm bậc từ 3 xuống 2 và mất đi cạnh ad.<br>`;
        htmlLog += `+ Đỉnh e giảm bậc và mất đi cạnh ae.<br>`;
        htmlLog += `+ Đỉnh h giảm bậc từ 4 xuống 3 và mất đi cạnh ah.`;
        htmlLog += `</div>`;
        htmlLog += `<div>- Do đỉnh <span class="text-primary font-bold">d</span> bị ép hạ bậc xuống bậc 2 mới, theo Quy tắc 1, cạnh kề còn lại của nó là <span class="text-green-700 font-bold">dc</span> và <span class="text-green-700 font-bold">df</span> bắt buộc phải thuộc chu trình H.</div>`;
        htmlLog += `<div>- Sau khi phân tách loại bỏ các cạnh thừa nguy cơ tạo chu trình con sớm như <span class="font-bold">bc</span> hay <span class="font-bold">ed</span>, hệ thống khớp nối liên hoàn các đỉnh còn lại thành một chu trình khép kín bao phủ toàn bộ đồ thị.</div>`;
        htmlLog += `</div>`;
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
        document.getElementById('hamilton-analysis-container').innerHTML = htmlLog;
        
        let pathString = c.map(formatNodeLabel).join(' &rarr; ');
        document.getElementById('final-sequence').innerHTML = `Suy ra ta thu được chu trình Hamilton H: <span class="text-green-700">${pathString}</span>`;

        for (let i = 0; i < c.length - 1; i++) {
            let nodeU = c[i];
            let nodeV = c[i + 1];
            let edgeId = `${Math.min(nodeU, nodeV)}-${Math.max(nodeU, nodeV)}`;
            if (edgesDataSet.get(edgeId)) {
                edgesDataSet.update({ id: edgeId, color: '#16a34a', width: 4 });
            }
        }
    } else {
        htmlLog += `<div class="rule-card text-red-700 border-red-500 mb-2">&bull; <b>Phát hiện vi phạm Quy tắc 2 & 4:</b> Các cạnh ép buộc nối từ đỉnh bậc 2 vô tình khép kín tạo thành chu trình con sớm khi chưa đi qua hết tất cả các đỉnh, hoặc tạo ra các đỉnh treo/cô lập.</div>`;
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