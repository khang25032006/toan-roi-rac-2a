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

function changeMode(mode) {
    currentMode = mode;
    if (edgeStartNodeId !== null) {
        nodesDataSet.update({id: edgeStartNodeId, color: {background: '#ffffff', border: '#004ac6'}});
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

document.getElementById('btn-reset-graph').addEventListener('click', () => {
    document.getElementById('vertex-count').value = 0;
    document.getElementById('matrix-input').value = "";
    nodesDataSet.clear();
    edgesDataSet.clear();
    document.getElementById('output-section').classList.add('hidden');
    edgeStartNodeId = null;
});

function parseMatrix() {
    const text = document.getElementById("matrix-input").value.trim();
    if (!text) return [];
    return text.split("\n").map(row => row.trim().split(/\s+/).map(Number));
}

function updateMatrixFromUI() {
    const ids = nodesDataSet.getIds().map(Number).sort((a,b) => a-b);
    const n = ids.length;
    document.getElementById('vertex-count').value = n;

    if (n === 0) {
        document.getElementById("matrix-input").value = "";
        return;
    }

    let matrix = Array.from({length: n}, () => Array(n).fill(0));
    const idToIndex = {};
    ids.forEach((id, index) => { idToIndex[id] = index; });

    const edges = edgesDataSet.get();
    edges.forEach(edge => {
        const uIdx = idToIndex[edge.from];
        const vIdx = idToIndex[edge.to];
        if(uIdx !== undefined && vIdx !== undefined) {
            matrix[uIdx][vIdx] = 1;
            if (edge.arrows !== 'to') {
                matrix[vIdx][uIdx] = 1;
            }
        }
    });

    document.getElementById("matrix-input").value = matrix.map(row => row.join(" ")).join("\n");
}

function drawGraph() {
    const matrix = parseMatrix();
    const n = matrix.length;
    
    if (n === 0) return;

    nodesDataSet.clear();
    edgesDataSet.clear();

    for (let i = 1; i <= n; i++) {
        nodesDataSet.add({ id: i, label: `${i}`, color: { background: '#ffffff', border: '#004ac6' } });
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (matrix[i][j] === 1) {
                const fromNode = i + 1;
                const toNode = j + 1;
                
                if (matrix[j][i] === 1) { 
                    if (fromNode <= toNode) {
                        const edgeId = `${fromNode}-${toNode}`;
                        if (!edgesDataSet.get(edgeId)) {
                            edgesDataSet.add({ id: edgeId, from: fromNode, to: toNode, color: '#737686', width: 2 });
                        }
                    }
                } else { 
                    edgesDataSet.add({ from: fromNode, to: toNode, arrows: 'to', color: '#737686', width: 2 });
                }
            }
        }
    }
    document.getElementById('vertex-count').value = n;
    initNetwork();
}

function initNetwork() {
    const container = document.getElementById('network-container');
    const data = { nodes: nodesDataSet, edges: edgesDataSet };
    const options = {
        physics: { enabled: true },
        nodes: { shape: 'circle', borderWidth: 2, font: { size: 16, face: 'Be Vietnam Pro', weight: 'bold' } },
        edges: { smooth: { type: 'continuous' } },
        interaction: { hover: true }
    };
    
    network = new vis.Network(container, data, options);

    network.on("click", function (params) {
        const { nodes, edges: clickedEdges, pointer } = params;
        const canvasCoord = pointer.canvas;

        if (currentMode === 'node') {
            if (nodes.length === 0) { 
                const currentIds = nodesDataSet.getIds().map(Number);
                const nextId = currentIds.length > 0 ? Math.max(...currentIds) + 1 : 1;
                nodesDataSet.add({ id: nextId, label: `${nextId}`, x: canvasCoord.x, y: canvasCoord.y, color: { background: '#ffffff', border: '#004ac6' } });
                updateMatrixFromUI();
            }
        } 
        else if (currentMode === 'edge' || currentMode === 'arc') {
            if (nodes.length > 0) {
                const nodeId = nodes[0];
                if (edgeStartNodeId === null) {
                    edgeStartNodeId = nodeId;
                    nodesDataSet.update({id: nodeId, color: {background: '#ffebee', border: '#e53935'}}); 
                } else {
                    const fromNode = edgeStartNodeId;
                    const toNode = nodeId;
                    
                    nodesDataSet.update({id: fromNode, color: {background: '#ffffff', border: '#004ac6'}});

                    if (fromNode !== toNode) {
                        if (currentMode === 'edge') {
                            edgesDataSet.add({ id: `${Math.min(fromNode, toNode)}-${Math.max(fromNode, toNode)}`, from: fromNode, to: toNode, color: '#737686', width: 2 });
                        } else {
                            edgesDataSet.add({ from: fromNode, to: toNode, arrows: 'to', color: '#737686', width: 2 });
                        }
                        updateMatrixFromUI();
                    }
                    edgeStartNodeId = null;
                }
            } else {
                if(edgeStartNodeId !== null) {
                    nodesDataSet.update({id: edgeStartNodeId, color: {background: '#ffffff', border: '#004ac6'}});
                    edgeStartNodeId = null;
                }
            }
        } 
        else if (currentMode === 'delete') {
            if (nodes.length > 0) {
                nodesDataSet.remove(nodes[0]);
                updateMatrixFromUI();
            } else if (clickedEdges.length > 0) {
                edgesDataSet.remove(clickedEdges[0]);
                updateMatrixFromUI();
            }
        }
    });
    // Thêm đoạn này vào dòng cuối cùng ngay trước dấu đóng } của hàm initNetwork()
    const resizeObserver = new ResizeObserver(() => {
        if (network) network.fit();
    });
    resizeObserver.observe(document.getElementById('resize-container'));
}

function runBFS() {
    const matrix = parseMatrix();
    const n = matrix.length;
    const start = Number(document.getElementById("start-vertex").value);

    const activeIds = nodesDataSet.getIds().map(Number).sort((a,b) => a-b);
    if (!activeIds.includes(start) || n === 0) {
        alert("Đỉnh bắt đầu không hợp lệ hoặc không tồn tại trên đồ thị!");
        return;
    }

    const idToIndex = {};
    activeIds.forEach((id, index) => { idToIndex[id] = index; });

    let adj = {};
    activeIds.forEach(id => adj[id] = []);

    const edges = edgesDataSet.get();
    edges.forEach(edge => {
        if(adj[edge.from] && adj[edge.to]) {
            adj[edge.from].push(edge.to);
            if (edge.arrows !== 'to') {
                adj[edge.to].push(edge.from); 
            }
        }
    });

    activeIds.forEach(id => {
        adj[id].sort((a, b) => a - b);
    });

    let visited = {};
    activeIds.forEach(id => visited[id] = false);

    let queue = [start];
    visited[start] = true;

    let bfsOrder = [];
    let spanningTree = [];
    let steps = [];
    let stepCounter = 1;

    steps.push({
        stt: stepCounter++,
        queueState: [start],
        visitedState: ["&empty;"]
    });

    while (queue.length > 0) {
        let u = queue.shift();
        bfsOrder.push(u);

        let neighbors = adj[u] || [];
        neighbors.forEach(v => {
            if (!visited[v]) {
                queue.push(v);
                visited[v] = true;
                spanningTree.push(`(${u}, ${v})`);
            }
        });

        steps.push({
            stt: stepCounter++,
            queueState: [...queue],
            visitedState: [...bfsOrder]
        });
    }

    renderResultToTable(steps, bfsOrder, spanningTree);
}

function renderResultToTable(steps, bfsOrder, spanningTree) {
    const tbody = document.getElementById('result-tbody');
    tbody.innerHTML = ''; 

    steps.forEach(step => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors text-on-surface";
        
        const tdStt = document.createElement('td');
        tdStt.className = "border border-outline-variant p-3 text-center font-semibold text-gray-500";
        tdStt.textContent = step.stt;
        
        const tdQueue = document.createElement('td');
        tdQueue.className = "border border-outline-variant p-3 font-mono text-primary font-bold";
        tdQueue.textContent = step.queueState.length === 0 ? '∅' : step.queueState.join(', ');
        
        const tdVisited = document.createElement('td');
        tdVisited.className = "border border-outline-variant p-3 font-mono font-semibold";
        if (Array.isArray(step.visitedState)) {
            tdVisited.textContent = step.visitedState.join(', ');
        } else {
            tdVisited.innerHTML = step.visitedState;
        }

        tr.appendChild(tdStt);
        tr.appendChild(tdQueue);
        tr.appendChild(tdVisited);
        tbody.appendChild(tr);
    });

    document.getElementById("bfs-output").innerText = bfsOrder.join(" → ");
    document.getElementById("final-sequence").innerText = bfsOrder.join(", ");
    document.getElementById("tree-output").innerText = spanningTree.length > 0 ? spanningTree.join(", ") : "Không có cạnh khung";
    
    document.getElementById('output-section').classList.remove('hidden');
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById("btn-draw").addEventListener("click", drawGraph);
document.getElementById("btn-run").addEventListener("click", runBFS);

window.addEventListener("load", () => {
    drawGraph();
    changeMode('node'); 
});