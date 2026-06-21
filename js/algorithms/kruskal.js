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
    if (n === 0) {
        document.getElementById("matrix-input").value = "";
        return;
    }
    let matrix = Array.from({ length: n }, () => Array(n).fill(0));
    const idToIndex = {};
    ids.forEach((id, index) => { idToIndex[id] = index; });
    const edges = edgesDataSet.get();
    edges.forEach(edge => {
        const uIdx = idToIndex[edge.from];
        const vIdx = idToIndex[edge.to];
        if (uIdx !== undefined && vIdx !== undefined) {
            matrix[uIdx][vIdx] = edge.weight;
            matrix[vIdx][uIdx] = edge.weight;
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
        if (network) {
            network.destroy();
            network = null;
        }
        initNetwork();
        return;
    }
    for (let i = 1; i <= n; i++) {
        nodesDataSet.add({ id: i, label: `${i}`, color: { background: '#ffffff', border: '#004ac6' } });
    }
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (matrix[i][j] !== 0) {
                const fromNode = i + 1;
                const toNode = j + 1;
                const edgeId = `${Math.min(fromNode, toNode)}-${Math.max(fromNode, toNode)}`;
                edgesDataSet.add({
                    id: edgeId,
                    from: fromNode,
                    to: toNode,
                    weight: matrix[i][j],
                    label: String(matrix[i][j]),
                    color: '#737686',
                    width: 2
                });
            }
        }
    }
    if (network) {
        network.destroy();
        network = null;
    }
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
        <p class="text-xs text-gray-500 mb-2">Nhập số bất kỳ (kể cả số âm, 0 được coi là không có cạnh)</p>
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

    const close = (value) => {
        overlay.remove();
        callback(value);
    };

    okBtn.addEventListener('click', () => {
        const val = input.value.trim();
        if (val === '' || isNaN(val)) {
            alert('Vui lòng nhập một số hợp lệ.');
            return;
        }
        close(parseFloat(val));
    });
    cancelBtn.addEventListener('click', () => close(null));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') okBtn.click();
        if (e.key === 'Escape') cancelBtn.click();
    });
    input.focus();
    input.select();
}

function initNetwork() {
    const container = document.getElementById('network-container');
    if (network) {
        network.destroy();
        network = null;
    }

    const data = { nodes: nodesDataSet, edges: edgesDataSet };
    const options = {
        physics: { enabled: true, solver: 'repulsion' },
        nodes: {
            shape: 'circle',
            borderWidth: 2,
            font: { size: 16, face: 'Be Vietnam Pro', weight: 'bold' }
        },
        edges: {
            smooth: false,
            font: {
                align: 'middle',
                background: '#ffffff',
                strokeWidth: 1.5,
                strokeColor: '#004ac6',
                size: 14,
                color: '#191c1e',
                weight: 'bold'
            }
        },
        interaction: { hover: true, selectConnectedEdges: false }
    };

    network = new vis.Network(container, data, options);

    // ---------- SỰ KIỆN CLICK ----------
    network.on("click", function (params) {
        const nodeId = params.nodes.length > 0 ? params.nodes[0] : null;
        const edgeId = params.edges.length > 0 ? params.edges[0] : null;
        const canvasCoord = params.pointer.canvas;

        console.log("Click - mode:", currentMode, "nodeId:", nodeId, "edgeId:", edgeId);

        // 1. Click vào cạnh
        if (edgeId !== null) {
            if (currentMode === 'delete') {
                edgesDataSet.remove(edgeId);
                updateMatrixFromUI();
                return;
            }
            if (currentMode === 'edge' && edgeStartNodeId !== null) {
                nodesDataSet.update({ id: edgeStartNodeId, color: { background: '#ffffff', border: '#004ac6' } });
                edgeStartNodeId = null;
            }
            return;
        }

        // 2. Click vào nền (không có đỉnh và cạnh)
        if (nodeId === null) {
            if (currentMode === 'node') {
                const currentIds = nodesDataSet.getIds().map(Number);
                const nextId = currentIds.length > 0 ? Math.max(...currentIds) + 1 : 1;
                nodesDataSet.add({
                    id: nextId,
                    label: `${nextId}`,
                    x: canvasCoord.x,
                    y: canvasCoord.y,
                    color: { background: '#ffffff', border: '#004ac6' }
                });
                updateMatrixFromUI();
                console.log("Đã thêm đỉnh", nextId);
            } else if (currentMode === 'edge') {
                if (edgeStartNodeId !== null) {
                    nodesDataSet.update({ id: edgeStartNodeId, color: { background: '#ffffff', border: '#004ac6' } });
                    edgeStartNodeId = null;
                }
            }
            return;
        }

        // 3. Click vào đỉnh
        if (currentMode === 'node') {
            // Ở chế độ node, click vào đỉnh không làm gì (chỉ thêm khi click nền)
        } else if (currentMode === 'edge') {
            if (edgeStartNodeId === null) {
                edgeStartNodeId = nodeId;
                nodesDataSet.update({ id: nodeId, color: { background: '#ffebee', border: '#e53935' } });
                console.log("Chọn đỉnh đầu:", nodeId);
            } else {
                const fromNode = edgeStartNodeId;
                const toNode = nodeId;
                nodesDataSet.update({ id: fromNode, color: { background: '#ffffff', border: '#004ac6' } });

                if (fromNode === toNode) {
                    edgeStartNodeId = null;
                    console.log("Hủy chọn (cùng đỉnh)");
                    return;
                }

                const existing = edgesDataSet.get({
                    filter: item =>
                        (item.from === fromNode && item.to === toNode) ||
                        (item.from === toNode && item.to === fromNode)
                });

                if (existing.length === 0) {
                    showWeightInputDialog(
                        `Nhập trọng số cho cạnh (${fromNode}, ${toNode})`,
                        "1",
                        (weight) => {
                            if (weight !== null && !isNaN(weight)) {
                                const edgeId = `${Math.min(fromNode, toNode)}-${Math.max(fromNode, toNode)}`;
                                edgesDataSet.add({
                                    id: edgeId,
                                    from: fromNode,
                                    to: toNode,
                                    weight: weight,
                                    label: String(weight),
                                    color: '#737686',
                                    width: 2
                                });
                                updateMatrixFromUI();
                                console.log("Đã thêm cạnh", edgeId);
                            }
                        }
                    );
                } else {
                    alert("Cạnh này đã tồn tại!");
                }
                edgeStartNodeId = null;
            }
        } else if (currentMode === 'delete') {
            const edgesToRemove = edgesDataSet.get({
                filter: edge => edge.from === nodeId || edge.to === nodeId
            }).map(e => e.id);
            if (edgesToRemove.length > 0) {
                edgesDataSet.remove(edgesToRemove);
            }
            nodesDataSet.remove(nodeId);
            updateMatrixFromUI();
            console.log("Đã xóa đỉnh", nodeId);
        }
    });

    // ---------- DOUBLE CLICK (sửa trọng số) ----------
    network.on("doubleClick", function (params) {
        const edgeId = params.edges.length > 0 ? params.edges[0] : null;
        if (edgeId === null) return;

        const edge = edgesDataSet.get(edgeId);
        if (!edge) return;

        showWeightInputDialog(
            `Sửa trọng số cạnh (${edge.from}, ${edge.to})`,
            String(edge.weight),
            (newWeight) => {
                if (newWeight !== null && !isNaN(newWeight)) {
                    edgesDataSet.update({
                        id: edgeId,
                        weight: newWeight,
                        label: String(newWeight)
                    });
                    updateMatrixFromUI();
                    console.log("Đã sửa trọng số cạnh", edgeId);
                }
            }
        );
    });

    // ---------- RESIZE ----------
    const resizeObserver = new ResizeObserver(() => {
        if (network) network.fit();
    });
    resizeObserver.observe(document.getElementById('resize-container'));
}

// ============ DSU & KRUSKAL ===================================
class DSU {
    constructor(n) {
        this.parent = Array.from({ length: n + 1 }, (_, i) => i);
    }
    find(i) {
        if (this.parent[i] === i) return i;
        return this.parent[i] = this.find(this.parent[i]);
    }
    union(i, j) {
        let rootI = this.find(i);
        let rootJ = this.find(j);
        if (rootI !== rootJ) {
            this.parent[rootI] = rootJ;
            return true;
        }
        return false;
    }
}

function runKruskal() {
    drawGraph(); // tự động đồng bộ từ ma trận

    const activeIds = nodesDataSet.getIds().map(Number);
    const n = activeIds.length;
    if (n === 0) {
        alert("Đồ thị trống. Vui lòng thêm đỉnh hoặc nhập ma trận.");
        return;
    }

    edgesDataSet.get().forEach(e => {
        edgesDataSet.update({ id: e.id, color: '#737686', width: 2, dashes: false });
    });

    let edgeList = edgesDataSet.get().map(e => ({
        id: e.id,
        u: e.from,
        v: e.to,
        w: e.weight
    }));

    if (edgeList.length === 0) {
        alert("Đồ thị không có cạnh nào.");
        return;
    }

    edgeList.sort((a, b) => a.w - b.w);

    let step1Html = '';
    edgeList.forEach((e, idx) => {
        e.name = `e<sub>${idx + 1}</sub>`;
        step1Html += `<div><span class="text-primary font-bold">${e.name}</span> = {${e.u}, ${e.v}} &Rightarrow; w(${e.name}) = ${e.w}</div>`;
    });
    document.getElementById('step1-output').innerHTML = step1Html;

    let maxId = Math.max(...activeIds);
    let dsu = new DSU(maxId);
    let mstEdges = [];
    let currentWeight = 0;
    let step2Html = '';
    let stt = 1;
    let nEdgesSelected = 0;

    for (let i = 0; i < edgeList.length; i++) {
        let e = edgeList[i];

        if (dsu.union(e.u, e.v)) {
            mstEdges.push(e);
            currentWeight += e.w;
            nEdgesSelected++;

            step2Html += `
                <tr class="transition-colors hover:bg-blue-50">
                    <td class="text-center font-bold text-gray-500">${stt++}</td>
                    <td class="text-primary font-semibold">E = E \\ {${e.name}}</td>
                    <td class="text-green-700 font-bold">
                        T = T &cup; {${e.name}} &Rightarrow; w(T) = w(T) + ${e.w} = ${currentWeight}
                    </td>
                </tr>`;

            edgesDataSet.update({ id: e.id, color: '#22c55e', width: 4 });

            if (nEdgesSelected === n - 1) {
                step2Html += `
                <tr>
                    <td class="text-center font-bold text-red-600">${stt}</td>
                    <td colspan="2" class="font-bold text-red-600 text-center py-3 bg-red-50">
                        Đã đủ n - 1 = ${n - 1} cạnh. Dừng thuật toán.
                    </td>
                </tr>`;
                break;
            }
        } else {
            step2Html += `
                <tr class="text-gray-400">
                    <td class="text-center">${stt++}</td>
                    <td>Bỏ đi ${e.name} vì tạo chu trình</td>
                    <td>T = T</td>
                </tr>`;
            edgesDataSet.update({ id: e.id, color: '#ef4444', dashes: true, width: 1 });
        }
    }

    document.getElementById('result-tbody').innerHTML = step2Html;

    let edgePairs = mstEdges.map(e => `{${e.u},${e.v}}`).join(', ');
    document.getElementById('final-sequence').innerHTML = `T = { ${edgePairs} }`;
    document.getElementById('final-weight').innerHTML = `W = ${currentWeight}`;

    if (nEdgesSelected < n - 1) {
        document.getElementById('final-weight').innerHTML += `<br><span class="text-red-600 text-sm mt-2 font-normal block">Cảnh báo: Đồ thị không liên thông!</span>`;
    }

    document.getElementById('output-section').classList.remove('hidden');
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById("btn-draw").addEventListener("click", drawGraph);
document.getElementById("btn-run").addEventListener("click", runKruskal);

window.addEventListener("load", () => {
    drawGraph();
    changeMode('node');
});