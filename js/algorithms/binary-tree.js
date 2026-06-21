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

const pythonCodes = {
    pre: `def pre_order(root):\n    if root is None: return\n    print(root.val)\n    for child in root.children:\n        pre_order(child)`,
    in: `def in_order(root):\n    if root is None: return\n    if len(root.children) > 0:\n        in_order(root.children[0])\n    print(root.val)\n    for child in root.children[1:]:\n        in_order(child)`,
    post: `def post_order(root):\n    if root is None: return\n    for child in root.children:\n        post_order(child)\n    print(root.val)`
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

function updatePythonCode() {
    const type = document.getElementById('traversal-type').value;
    document.getElementById('python-code-box').innerHTML = `<pre><code>${pythonCodes[type]}</code></pre>`;
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
    if (!document.getElementById('output-section').classList.contains('hidden')) { runTraversal(); }
});

document.getElementById('traversal-type').addEventListener('change', () => {
    updatePythonCode();
    if (!document.getElementById('output-section').classList.contains('hidden')) { runTraversal(); }
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
        if (uIdx !== undefined && vIdx !== undefined) { matrix[uIdx][vIdx] = 1; }
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
                edgesDataSet.add({ id: `${i+1}-${j+1}`, from: i + 1, to: j + 1, arrows: 'to', color: '#737686', width: 2 });
            }
        }
    }
    if (network) { network.destroy(); network = null; }
    initNetwork();
}

function initNetwork() {
    const container = document.getElementById('network-container');
    network = new vis.Network(container, { nodes: nodesDataSet, edges: edgesDataSet }, {
        layout: { hierarchical: { direction: 'UD', sortMethod: 'directed', nodeSpacing: 150, levelSeparation: 100 } },
        physics: false,
        nodes: { shape: 'circle', borderWidth: 2, font: { size: 16, face: 'Be Vietnam Pro', weight: 'bold' } },
        edges: { smooth: true }
    });

    network.on("click", function (params) {
        const nodeId = params.nodes.length > 0 ? params.nodes[0] : null;
        const edgeId = params.edges.length > 0 ? params.edges[0] : null;
        if (edgeId !== null && currentMode === 'delete') { edgesDataSet.remove(edgeId); updateMatrixFromUI(); return; }
        if (nodeId === null && currentMode === 'node') {
            const currentIds = nodesDataSet.getIds().map(Number);
            const nextId = currentIds.length > 0 ? Math.max(...currentIds) + 1 : 1;
            nodesDataSet.add({ id: nextId, label: formatNodeLabel(nextId), color: { background: '#ffffff', border: '#004ac6' } });
            updateMatrixFromUI();
            return;
        }
        if (currentMode === 'edge' && nodeId !== null) {
            if (edgeStartNodeId === null) {
                edgeStartNodeId = nodeId;
                nodesDataSet.update({ id: nodeId, color: { background: '#ffebee', border: '#e53935' } });
            } else {
                const fromNode = edgeStartNodeId;
                const toNode = nodeId;
                nodesDataSet.update({ id: fromNode, color: { background: '#ffffff', border: '#004ac6' } });
                if (fromNode !== toNode) {
                    edgesDataSet.add({ id: `${fromNode}-${toNode}`, from: fromNode, to: toNode, arrows: 'to', color: '#737686', width: 2 });
                    updateMatrixFromUI();
                }
                edgeStartNodeId = null;
            }
        } else if (currentMode === 'delete' && nodeId !== null) {
            const edgesToRemove = edgesDataSet.get({ filter: e => e.from === nodeId || e.to === nodeId }).map(e => e.id);
            if (edgesToRemove.length > 0) edgesToRemove.remove(edgesToRemove);
            nodesDataSet.remove(nodeId);
            updateMatrixFromUI();
        }
    });
}

function runTraversal() {
    const activeIds = nodesDataSet.getIds().map(Number).sort((a,b)=>a-b);
    const n = activeIds.length;
    if (n === 0) return;

    let startInput = parseNodeInput(document.getElementById('root-vertex').value) || activeIds[0];
    if (!activeIds.includes(startInput)) startInput = activeIds[0];

    let adj = {};
    activeIds.forEach(id => adj[id] = []);
    
    let matrix = parseMatrix();
    activeIds.forEach((i, rIdx) => {
        activeIds.forEach((j, cIdx) => {
            if (matrix[rIdx] && matrix[rIdx][cIdx] > 0) { adj[i].push(j); }
        });
    });

    activeIds.forEach(id => adj[id].sort((a, b) => a - b));

    const type = document.getElementById('traversal-type').value;
    let logLines = [];
    let sequence = [];

    function buildPrefix(depth, indexStr) {
        return " ".repeat(depth * 5) + indexStr + " ";
    }

    if (type === 'pre') {
        document.getElementById('traversal-title').innerHTML = `TIẾN TRÌNH DUYỆT TRƯỚC T(${formatNodeLabel(startInput).toUpperCase()}) - (Gốc &rarr; Các cây con từ trái sang phải)`;
        
        function preOrder(u, depth, prefix) {
            let label = formatNodeLabel(u);
            let children = adj[u];
            let subCounter = 1;

            sequence.push(label);
            logLines.push(buildPrefix(depth, prefix + `${subCounter++}.`) + `Thăm ${label}`);

            children.forEach(v => {
                let nextPrefix = prefix + `${subCounter++}.`;
                logLines.push(buildPrefix(depth, nextPrefix) + `Duyettruoc(T(${formatNodeLabel(v)}))`);
                preOrder(v, depth + 1, nextPrefix);
            });
        }
        logLines.push(`* Duyệt trước T(${formatNodeLabel(startInput)})`);
        
        let rootCounter = 1;
        sequence.push(formatNodeLabel(startInput));
        logLines.push(buildPrefix(0, `${rootCounter++}.`) + `Thăm gốc ${formatNodeLabel(startInput)}`);
        
        adj[startInput].forEach(v => {
            let nextPrefix = `${rootCounter++}.`;
            logLines.push(buildPrefix(0, nextPrefix) + `Duyettruoc(T(${formatNodeLabel(v)}))`);
            preOrder(v, 1, nextPrefix);
        });

    } else if (type === 'post') {
        document.getElementById('traversal-title').innerHTML = `TIẾN TRÌNH DUYỆT SAU T(${formatNodeLabel(startInput).toUpperCase()}) - (Các cây con từ trái sang phải &rarr; Gốc)`;
        
        function postOrder(u, depth, prefix) {
            let label = formatNodeLabel(u);
            let children = adj[u];
            let subCounter = 1;

            children.forEach(v => {
                let nextPrefix = prefix + `${subCounter++}.`;
                logLines.push(buildPrefix(depth, nextPrefix) + `Duyetsau(T(${formatNodeLabel(v)}))`);
                postOrder(v, depth + 1, nextPrefix);
            });

            sequence.push(label);
            logLines.push(buildPrefix(depth, prefix + `${subCounter++}.`) + `Thăm ${label}`);
        }
        logLines.push(`* Duyệt sau T(${formatNodeLabel(startInput)})`);
        
        let rootCounter = 1;
        adj[startInput].forEach(v => {
            let nextPrefix = `${rootCounter++}.`;
            logLines.push(buildPrefix(0, nextPrefix) + `Duyetsau(T(${formatNodeLabel(v)}))`);
            postOrder(v, 1, nextPrefix);
        });
        
        sequence.push(formatNodeLabel(startInput));
        logLines.push(buildPrefix(0, `${rootCounter++}.`) + `Thăm gốc ${formatNodeLabel(startInput)}`);

    } else if (type === 'in') {
        document.getElementById('traversal-title').innerHTML = `TIẾN TRÌNH DUYỆT TRONG T(${formatNodeLabel(startInput).toUpperCase()}) - (Cây con trái &rarr; Gốc &rarr; Các cây con còn lại)`;
        
        function inOrder(u, depth, prefix) {
            let label = formatNodeLabel(u);
            let children = adj[u];
            let subCounter = 1;

            if (children.length > 0) {
                let nextPrefix = prefix + `${subCounter++}.`;
                logLines.push(buildPrefix(depth, nextPrefix) + `DuyetTrong(T(${formatNodeLabel(children[0])}))`);
                inOrder(children[0], depth + 1, nextPrefix);
            }

            sequence.push(label);
            logLines.push(buildPrefix(depth, prefix + `${subCounter++}.`) + `Thăm ${label}`);

            for (let i = 1; i < children.length; i++) {
                let nextPrefix = prefix + `${subCounter++}.`;
                logLines.push(buildPrefix(depth, nextPrefix) + `DuyetTrong(T(${formatNodeLabel(children[i])}))`);
                inOrder(children[i], depth + 1, nextPrefix);
            }
        }
        logLines.push(`* Duyệt trong T(${formatNodeLabel(startInput)})`);
        
        let rootCounter = 1;
        let rootChildren = adj[startInput];
        
        if (rootChildren.length > 0) {
            let nextPrefix = `${rootCounter++}.`;
            logLines.push(buildPrefix(0, nextPrefix) + `DuyetTrong(T(${formatNodeLabel(rootChildren[0])}))`);
            inOrder(rootChildren[0], 1, nextPrefix);
        }
        
        sequence.push(formatNodeLabel(startInput));
        logLines.push(buildPrefix(0, `${rootCounter++}.`) + `Thăm gốc ${formatNodeLabel(startInput)}`);
        
        for (let i = 1; i < rootChildren.length; i++) {
            let nextPrefix = `${rootCounter++}.`;
            logLines.push(buildPrefix(0, nextPrefix) + `DuyetTrong(T(${formatNodeLabel(rootChildren[i])}))`);
            inOrder(rootChildren[i], 1, nextPrefix);
        }
    }

    let finalLogHtml = logLines.map(line => `<div class="log-line">${line}</div>`).join('');
    document.getElementById('traversal-log-box').innerHTML = finalLogHtml;
    document.getElementById('final-sequence').innerHTML = `{ ${sequence.join(', ')} }`;
    document.getElementById('output-section').classList.remove('hidden');
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById("btn-draw").addEventListener("click", drawGraph);
document.getElementById("btn-run").addEventListener("click", runTraversal);

window.addEventListener("load", () => {
    drawGraph();
    updatePythonCode();
    changeMode('node');
});