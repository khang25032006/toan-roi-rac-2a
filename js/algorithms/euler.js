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
        return String.fromCharCode(64 + id); // 1 -> 'A', 2 -> 'B'
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
        runEulerAlgorithm();
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
                    id: `${i+1}-${j+1}`,
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
    const options = {
        physics: { enabled: true, solver: 'repulsion' },
        nodes: { shape: 'circle', borderWidth: 2, font: { size: 16, face: 'Be Vietnam Pro', weight: 'bold' } },
        edges: { smooth: { type: 'continuous' } },
        interaction: { hover: true, selectConnectedEdges: false }
    };
    network = new vis.Network(container, { nodes: nodesDataSet, edges: edgesDataSet }, options);

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
                    filter: item => (item.from === fromNode && item.to === toNode) || 
                                   (type === 'undirected' && item.from === toNode && item.to === fromNode)
                });

                if (existing.length === 0) {
                    edgesDataSet.add({
                        id: `${fromNode}-${toNode}`,
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
            if (edgesToRemove.length > 0) edgesDataSet.remove(edgesToRemove);
            nodesDataSet.remove(nodeId);
            updateMatrixFromUI();
        }
    });
}

function runEulerAlgorithm() {
    let matrix = parseMatrix();
    const n = matrix.length;
    if (n === 0) return;

    const activeIds = [];
    for (let i = 1; i <= n; i++) activeIds.push(i);

    let isDirected = document.getElementById('graph-type').value === 'directed';
    let startInput = parseNodeInput(document.getElementById('start-vertex').value);

    let inDeg = {}, outDeg = {}, deg = {};
    activeIds.forEach(id => { inDeg[id] = 0; outDeg[id] = 0; deg[id] = 0; });

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (matrix[i][j] > 0) {
                outDeg[i + 1] += matrix[i][j];
                inDeg[j + 1] += matrix[i][j];
                deg[i + 1] += matrix[i][j];
            }
        }
    }

    let degHtml = "";
    if (!isDirected) {
        activeIds.forEach(id => {
            degHtml += `<div class="p-2 border border-gray-200 rounded bg-white text-center">deg(${formatNodeLabel(id)}) = <span class="font-bold text-primary">${deg[id]}</span></div>`;
        });
    } else {
        activeIds.forEach(id => {
            degHtml += `<div class="p-2 border border-gray-200 rounded bg-white text-center">deg<sup>+</sup>(${formatNodeLabel(id)})=${outDeg[id]} / deg<sup>-</sup>(${formatNodeLabel(id)})=${inDeg[id]}</div>`;
        });
    }
    document.getElementById('degree-analysis').innerHTML = degHtml;

    let isEulerian = true, isSemiEulerian = false;
    let oddNodes = [];
    let startNodesDirected = [], endNodesDirected = [];

    if (!isDirected) {
        activeIds.forEach(id => { if (deg[id] % 2 !== 0) oddNodes.push(id); });
        if (oddNodes.length === 0) {
            isEulerian = true;
            document.getElementById('euler-condition-result').className = "mt-3 text-base font-bold text-green-900 bg-green-50 p-3 rounded-lg border border-green-200";
            document.getElementById('euler-condition-result').innerHTML = "Mọi đỉnh đều có bậc chẵn &rArr; Đồ thị có Chu trình Euler.";
        } else if (oddNodes.length === 2) {
            isSemiEulerian = true;
            document.getElementById('euler-condition-result').className = "mt-3 text-base font-bold text-amber-900 bg-amber-50 p-3 rounded-lg border border-amber-200";
            document.getElementById('euler-condition-result').innerHTML = `Có chính xác 2 đỉnh bậc lẻ là {${oddNodes.map(formatNodeLabel).join(', ')}} &rArr; Đồ thị có Đường đi Euler (Nửa Euler).`;
        } else {
            isEulerian = false;
            document.getElementById('euler-condition-result').className = "mt-3 text-base font-bold text-red-900 bg-red-50 p-3 rounded-lg border border-red-200";
            document.getElementById('euler-condition-result').innerHTML = `Số đỉnh bậc lẻ bằng ${oddNodes.length} (khác 0 và 2) &rArr; Đồ thị không phải Euler. Dừng thuật toán.`;
        }
    } else {
        let badCount = 0;
        activeIds.forEach(id => {
            let diff = outDeg[id] - inDeg[id];
            if (diff === 1) startNodesDirected.push(id);
            else if (diff === -1) endNodesDirected.push(id);
            else if (diff !== 0) badCount++;
        });

        if (startNodesDirected.length === 0 && endNodesDirected.length === 0 && badCount === 0) {
            isEulerian = true;
            document.getElementById('euler-condition-result').className = "mt-3 text-base font-bold text-green-900 bg-green-50 p-3 rounded-lg border border-green-200";
            document.getElementById('euler-condition-result').innerHTML = "Mọi đỉnh có bán bậc ra bằng bán bậc vào &rArr; Đồ thị có Chu trình Euler có hướng.";
        } else if (startNodesDirected.length === 1 && endNodesDirected.length === 1 && badCount === 0) {
            isSemiEulerian = true;
            document.getElementById('euler-condition-result').className = "mt-3 text-base font-bold text-amber-900 bg-amber-50 p-3 rounded-lg border border-amber-200";
            document.getElementById('euler-condition-result').innerHTML = `Tồn tại duy nhất đỉnh phát ${formatNodeLabel(startNodesDirected[0])} (deg<sup>+</sup> - deg<sup>-</sup> = 1) và đỉnh thu ${formatNodeLabel(endNodesDirected[0])} &rArr; Đồ thị có Đường đi Euler.`;
        } else {
            isEulerian = false;
            document.getElementById('euler-condition-result').className = "mt-3 text-base font-bold text-red-900 bg-red-50 p-3 rounded-lg border border-red-200";
            document.getElementById('euler-condition-result').innerHTML = "Cấu hình bán bậc không thỏa mãn &rArr; Đồ thị không có lộ trình Euler. Dừng thuật toán.";
        }
    }

    if (!isEulerian && !isSemiEulerian) {
        document.getElementById('algo-process-block').classList.add('hidden');
        document.getElementById('final-sequence').innerHTML = "<span class='text-red-600'>Không tồn tại lộ trình Euler cho cấu hình đồ thị này!</span>";
        document.getElementById('output-section').classList.remove('hidden');
        return;
    }

    document.getElementById('algo-process-block').classList.remove('hidden');

    let startNode = 1; 
    if (!isDirected) {
        if (isSemiEulerian) startNode = oddNodes[0]; 
        if (startInput && startInput <= n) {
            if (!isSemiEulerian || oddNodes.includes(startInput)) startNode = startInput;
        }
    } else {
        if (isSemiEulerian) startNode = startNodesDirected[0]; 
        if (startInput && startInput <= n) {
            if (!isSemiEulerian || startNodesDirected.includes(startInput)) startNode = startInput;
        }
    }

    let graphCopy = Array.from({length: n}, (_, i) => [...matrix[i]]);
    let stack = [startNode];
    let CE = [];
    let tbodyHtml = "";
    let step = 1;

    // Khởi tạo dòng đầu tiên
    tbodyHtml += `
        <tr class="bg-gray-100 font-semibold">
            <td class="p-3 text-center border border-gray-200 text-gray-500">Khởi tạo</td>
            <td class="p-3 text-center border border-gray-200">-</td>
            <td class="p-3 text-center border border-gray-200 text-gray-500">-</td>
            <td class="p-3 border border-gray-200 text-purple-700 font-mono">[${stack.map(formatNodeLabel).join(', ')}]</td>
            <td class="p-3 border border-gray-200 text-green-700">[]</td>
        </tr>`;

    // VÒNG LẶP THEO MÃ GIẢ CHUẨN ĐƯỢC PHÂN TÁCH LỆNH XUẤT UI CHẶT CHẼ
    while (stack.length > 0) {
        let s = stack[stack.length - 1]; // s = get(stack);
        let sIdx = s - 1;
        let hasNeighbor = false;
        let actionCell = "";
        let nextNode = null;

        for (let vIdx = 0; vIdx < n; vIdx++) {
            if (graphCopy[sIdx][vIdx] > 0) {
                nextNode = vIdx + 1;
                hasNeighbor = true;
                
                // Nhánh IF: Tiến hành đi tiếp và xóa cạnh
                actionCell = `(${formatNodeLabel(s)}, ${formatNodeLabel(nextNode)})`;
                graphCopy[sIdx][vIdx]--; 
                if (!isDirected) graphCopy[vIdx][sIdx]--; 
                
                stack.push(nextNode); // push(stack, t);
                break;
            }
        }

        // Nhánh ELSE: Đỉnh s bị cụt đường
        if (!hasNeighbor) {
            actionCell = `<span class="text-red-600 font-bold">Cụt đường!</span>`;
            let popped = stack.pop(); // s = pop(stack);
            CE.push(popped); // s => CE;
        }

        let displayStack = stack.map(formatNodeLabel).join(', ');
        let displayCE = [...CE].map(formatNodeLabel).join(', ');

        tbodyHtml += `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="p-3 text-center border border-gray-200 font-bold text-gray-400">${step++}</td>
                <td class="p-3 text-center border border-gray-200 font-bold text-primary">${formatNodeLabel(s)}</td>
                <td class="p-3 text-center border border-gray-200 font-semibold text-amber-700">${actionCell}</td>
                <td class="p-3 border border-gray-200 font-bold text-purple-700 font-mono">[${displayStack || '&empty;'}]</td>
                <td class="p-3 border border-gray-200 text-green-700 font-semibold">[${displayCE || '&empty;'}]</td>
            </tr>`;
    }

    document.getElementById('result-tbody').innerHTML = tbodyHtml;

    // Lật ngược CE để thu được chu trình Euler cuối cùng
    let finalPath = [...CE].reverse().map(formatNodeLabel).join(' &rarr; ');
    document.getElementById('final-sequence').innerHTML = finalPath;

    document.getElementById('output-section').classList.remove('hidden');
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById("btn-draw").addEventListener("click", drawGraph);
document.getElementById("btn-run").addEventListener("click", runEulerAlgorithm);

window.addEventListener("load", () => {
    drawGraph();
    changeMode('node');
});