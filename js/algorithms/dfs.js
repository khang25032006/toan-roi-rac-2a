let network = null;
let nodesDataSet = new vis.DataSet();
let edgesDataSet = new vis.DataSet();
let currentMode = 'node'; 
let edgeStartNodeId = null;
let currentExecutionMode = 'dequy';

const btnModeDeQuy = document.getElementById('algo-mode-dequy');
const btnModeNganXep = document.getElementById('algo-mode-nganxep');

btnModeDeQuy.addEventListener('click', () => {
    currentExecutionMode = 'dequy';
    btnModeDeQuy.classList.add('bg-primary', 'text-white');
    btnModeDeQuy.classList.remove('text-on-surface-variant');
    btnModeNganXep.classList.remove('bg-primary', 'text-white');
    btnModeNganXep.classList.add('text-on-surface-variant');
});

btnModeNganXep.addEventListener('click', () => {
    currentExecutionMode = 'nganxep';
    btnModeNganXep.classList.add('bg-primary', 'text-white');
    btnModeNganXep.classList.remove('text-on-surface-variant');
    btnModeDeQuy.classList.remove('bg-primary', 'text-white');
    btnModeDeQuy.classList.add('text-on-surface-variant');
});

const tabDeQuy = document.getElementById('tab-dequy');
const tabNganXep = document.getElementById('tab-nganxep');
const codeBlock = document.getElementById('code-block').querySelector('code');

const codeDeQuy = `def dfs_de_quy(graph, u, visited, dfs_order):
    visited[u] = True
    dfs_order.append(u)
    for v in range(1, len(graph) + 1):
        if graph[u-1][v-1] == 1 and not visited[v]:
            dfs_de_quy(graph, v, visited, dfs_order)`;

const codeNganXep = `def dfs_ngan_xep(graph, start):
    visited = [False] * (len(graph) + 1)
    stack = [start]
    dfs_order = []
    
    while stack:
        u = stack.pop()
        if not visited[u]:
            visited[u] = True
            dfs_order.append(u)
            for v in range(len(graph), 0, -1):
                if graph[u-1][v-1] == 1 and not visited[v]:
                    stack.append(v)
    return dfs_order`;

tabDeQuy.addEventListener('click', () => {
    tabDeQuy.classList.add('bg-white', 'shadow', 'text-primary');
    tabNganXep.classList.remove('bg-white', 'shadow', 'text-primary');
    codeBlock.textContent = codeDeQuy;
});

tabNganXep.addEventListener('click', () => {
    tabNganXep.classList.add('bg-white', 'shadow', 'text-primary');
    tabDeQuy.classList.remove('bg-white', 'shadow', 'text-primary');
    codeBlock.textContent = codeNganXep;
});

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
                    edgesDataSet.add({ id: `${fromNode}->${toNode}`, from: fromNode, to: toNode, arrows: 'to', color: '#737686', width: 2 });
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
                            edgesDataSet.add({ id: `${fromNode}->${toNode}`, from: fromNode, to: toNode, arrows: 'to', color: '#737686', width: 2 });
                        }
                        updateMatrixFromUI();
                    }
                    edgeStartNodeId = null;
                }
            } else {
                if (edgeStartNodeId !== null) {
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

    const resizeObserver = new ResizeObserver(() => {
        if (network) network.fit();
    });
    resizeObserver.observe(document.getElementById('resize-container'));
}

function runDFS() {
    const matrix = parseMatrix();
    const n = matrix.length;
    const start = Number(document.getElementById("start-vertex").value);

    const activeIds = nodesDataSet.getIds().map(Number).sort((a,b) => a-b);
    if (!activeIds.includes(start) || n === 0) {
        alert("Đỉnh bắt đầu không hợp lệ hoặc không tồn tại trên đồ thị!");
        return;
    }

    // Khôi phục trạng thái màu sắc và độ dày ban đầu của toàn bộ các cạnh
    edgesDataSet.get().forEach(e => {
        edgesDataSet.update({ id: e.id, color: '#737686', width: 2 });
    });

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

    let spanningTree = [];
    let visitedTree = {};
    let edgesToColor = [];
    activeIds.forEach(id => visitedTree[id] = false);
    
    function dfsTree(u) {
        visitedTree[u] = true;
        let neighbors = adj[u] || [];
        neighbors.forEach(v => {
            if (!visitedTree[v]) {
                spanningTree.push(`(${u}, ${v})`);
                
                // Định danh ID cạnh kết quả để tô màu trực quan
                edgesToColor.push(`${u}->${v}`);
                edgesToColor.push(`${Math.min(u, v)}-${Math.max(u, v)}`);
                
                dfsTree(v);
            }
        });
    }
    dfsTree(start);

    // Tiến hành cập nhật màu xanh lá cây đậm cho các cạnh thuộc cây khung DFS
    edgesToColor.forEach(edgeId => {
        if (edgesDataSet.get(edgeId)) {
            edgesDataSet.update({ id: edgeId, color: '#16a34a', width: 4 });
        }
    });

    if (currentExecutionMode === 'dequy') {
        runDFSDeQuyLogic(adj, activeIds, start, spanningTree);
    } else {
        runDFSNganXepLogic(adj, activeIds, start, spanningTree);
    }
}

function runDFSDeQuyLogic(adj, activeIds, start, spanningTree) {
    let visited = {};
    activeIds.forEach(id => visited[id] = false);
    let dfsOrder = [];
    let steps = [];

    function dfs(u) {
        visited[u] = true;
        dfsOrder.push(u);

        let currentVisited = [...dfsOrder];
        let currentUnvisited = activeIds.filter(id => !visited[id]);

        steps.push({
            call: `DFS(${u})`,
            visitedState: currentVisited.join(', '),
            unvisitedState: currentUnvisited.length === 0 ? 'Ø' : currentUnvisited.join(', ')
        });

        let neighbors = adj[u] || [];
        neighbors.forEach(v => {
            if (!visited[v]) {
                dfs(v);
            }
        });
    }
    
    dfs(start);
    renderTableDeQuy(steps, dfsOrder, spanningTree);
}

function runDFSNganXepLogic(adj, activeIds, start, spanningTree) {
    let visited = {};
    activeIds.forEach(id => visited[id] = false);

    let stack = [start];
    let dfsOrder = [start];
    visited[start] = true;

    let steps = [];
    let stepCounter = 1;

    steps.push({
        stt: stepCounter++,
        stackState: [...stack].join(', '),
        visitedState: [...dfsOrder],
        highlightNode: start
    });

    while (stack.length > 0) {
        let u = stack[stack.length - 1];
        let neighbors = adj[u] || [];
        let unvisitedNeighbors = neighbors.filter(v => !visited[v]);

        if (unvisitedNeighbors.length > 0) {
            let nextNode = unvisitedNeighbors[0];

            stack.push(nextNode);
            visited[nextNode] = true;
            dfsOrder.push(nextNode);

            steps.push({
                stt: stepCounter++,
                stackState: [...stack].join(', '),
                visitedState: [...dfsOrder],
                highlightNode: nextNode
            });
        } else {
            stack.pop();
            if (stack.length > 0) {
                steps.push({
                    stt: stepCounter++,
                    stackState: [...stack].join(', '),
                    visitedState: [...dfsOrder],
                    highlightNode: null
                });
            }
        }
    }

    steps.push({
        stt: stepCounter,
        stackState: '∅',
        visitedState: [...dfsOrder],
        highlightNode: null
    });

    renderTableNganXep(steps, dfsOrder, spanningTree);
}

function renderTableDeQuy(steps, dfsOrder, spanningTree) {
    document.getElementById('table-title').innerHTML = '<span class="material-symbols-outlined">table_view</span> THUẬT TOÁN TÌM KIẾM THEO CHIỀU SÂU (DẠNG CÀI ĐẶT ĐỆ QUY)';
    
    const thead = document.getElementById('result-thead');
    thead.innerHTML = `
        <tr class="bg-primary text-white text-left font-bold">
            <th class="border border-outline-variant p-3 w-3/12">Đỉnh bắt đầu duyệt</th>
            <th class="border border-outline-variant p-3 w-4/12">Các đỉnh đã duyệt:<br><code class="text-xs bg-blue-700 px-1 rounded text-white font-mono">chuaxet[u] = false</code></th>
            <th class="border border-outline-variant p-3 w-5/12">Các đỉnh chưa duyệt:<br><code class="text-xs bg-blue-700 px-1 rounded text-white font-mono">chuaxet[u] = true</code></th>
        </tr>`;

    const tbody = document.getElementById('result-tbody');
    tbody.innerHTML = '';

    steps.forEach(step => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors text-on-surface font-medium";

        const tdCall = document.createElement('td');
        tdCall.className = "border border-outline-variant p-3 font-mono font-bold text-primary";
        tdCall.textContent = step.call;

        const tdVisited = document.createElement('td');
        tdVisited.className = "border border-outline-variant p-3 font-mono";
        tdVisited.textContent = step.visitedState;

        const tdUnvisited = document.createElement('td');
        tdUnvisited.className = "border border-outline-variant p-3 font-mono text-gray-500";
        tdUnvisited.textContent = step.unvisitedState;

        tr.appendChild(tdCall);
        tr.appendChild(tdVisited);
        tr.appendChild(tdUnvisited);
        tbody.appendChild(tr);
    });

    showFinalOutput(dfsOrder, spanningTree);
}

function renderTableNganXep(steps, dfsOrder, spanningTree) {
    document.getElementById('table-title').innerHTML = '<span class="material-symbols-outlined">table_view</span> THUẬT TOÁN TÌM KIẾM THEO CHIỀU SÂU (DẠNG KHÔNG CÀI ĐẶT ĐỆ QUY - NGĂN XẾP)';
    
    const thead = document.getElementById('result-thead');
    thead.innerHTML = `
        <tr class="bg-primary text-white text-left font-bold">
            <th class="border border-outline-variant p-3 w-16 text-center">STT</th>
            <th class="border border-outline-variant p-3 w-5/12">Trạng thái ngăn xếp</th>
            <th class="border border-outline-variant p-3 w-6/12">Danh sách đỉnh được duyệt</th>
        </tr>`;

    const tbody = document.getElementById('result-tbody');
    tbody.innerHTML = '';

    steps.forEach((step, index) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors text-on-surface";

        const tdStt = document.createElement('td');
        tdStt.className = "border border-outline-variant p-3 text-center font-semibold text-gray-500";
        tdStt.textContent = step.stt;

        const tdStack = document.createElement('td');
        tdStack.className = "border border-outline-variant p-3 font-mono text-primary font-bold";
        tdStack.textContent = step.stackState;

        const tdVisited = document.createElement('td');
        tdVisited.className = "border border-outline-variant p-3 font-mono font-semibold";
        
        if (index === steps.length - 1) {
            tdVisited.textContent = dfsOrder.join(', ');
        } else {
            let visitedContent = [];
            step.visitedState.forEach(node => {
                if (node === step.highlightNode) {
                    visitedContent.push(`<span class="text-red-600 font-bold">${node}</span>`);
                } else {
                    visitedContent.push(node);
                }
            });
            tdVisited.innerHTML = visitedContent.join(', ');
        }

        tr.appendChild(tdStt);
        tr.appendChild(tdStack);
        tr.appendChild(tdVisited);
        tbody.appendChild(tr);
    });

    showFinalOutput(dfsOrder, spanningTree);
}

function showFinalOutput(dfsOrder, spanningTree) {
    document.getElementById("dfs-output").innerText = dfsOrder.join(" → ");
    document.getElementById("final-sequence").innerText = dfsOrder.join(", ");
    document.getElementById("tree-output").innerText = spanningTree.length > 0 ? spanningTree.join(", ") : "Không có cạnh khung";
    
    document.getElementById('output-section').classList.remove('hidden');
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById("btn-draw").addEventListener("click", drawGraph);
document.getElementById("btn-run").addEventListener("click", runDFS);

window.addEventListener("load", () => {
    drawGraph();
    changeMode('node'); 
});