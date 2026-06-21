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
        if (network) { network.destroy(); network = null; }
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
        const val = input.value.trim();
        if (val === '' || isNaN(val)) { alert('Vui lòng nhập một số hợp lệ.'); return; }
        close(parseFloat(val));
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
    const data = { nodes: nodesDataSet, edges: edgesDataSet };
    const options = {
        physics: { enabled: true, solver: 'repulsion' },
        nodes: { shape: 'circle', borderWidth: 2, font: { size: 16, face: 'Be Vietnam Pro', weight: 'bold' } },
        edges: {
            smooth: false,
            font: { align: 'middle', background: '#ffffff', strokeWidth: 1.5, strokeColor: '#004ac6', size: 14, color: '#191c1e', weight: 'bold' }
        },
        interaction: { hover: true, selectConnectedEdges: false }
    };

    network = new vis.Network(container, data, options);

    network.on("click", function (params) {
        const nodeId = params.nodes.length > 0 ? params.nodes[0] : null;
        const edgeId = params.edges.length > 0 ? params.edges[0] : null;
        const canvasCoord = params.pointer.canvas;

        if (edgeId !== null) {
            if (currentMode === 'delete') {
                edgesDataSet.remove(edgeId);
                updateMatrixFromUI();
            }
            return;
        }

        if (nodeId === null) {
            if (currentMode === 'node') {
                const currentIds = nodesDataSet.getIds().map(Number);
                const nextId = currentIds.length > 0 ? Math.max(...currentIds) + 1 : 1;
                nodesDataSet.add({ id: nextId, label: `${nextId}`, x: canvasCoord.x, y: canvasCoord.y, color: { background: '#ffffff', border: '#004ac6' } });
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
                    showWeightInputDialog(`Nhập trọng số cho cạnh (${fromNode}, ${toNode})`, "1", (weight) => {
                        if (weight !== null && !isNaN(weight)) {
                            edgesDataSet.add({
                                id: `${Math.min(fromNode, toNode)}-${Math.max(fromNode, toNode)}`,
                                from: fromNode, to: toNode, weight: weight, label: String(weight), color: '#737686', width: 2
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

        showWeightInputDialog(`Sửa trọng số cạnh (${edge.from}, ${edge.to})`, String(edge.weight), (newWeight) => {
            if (newWeight !== null && !isNaN(newWeight)) {
                edgesDataSet.update({ id: edgeId, weight: newWeight, label: String(newWeight) });
                updateMatrixFromUI();
            }
        });
    });

    const resizeObserver = new ResizeObserver(() => { if (network) network.fit(); });
    resizeObserver.observe(document.getElementById('resize-container'));
}

// ======================== CORE THUẬT TOÁN PRIM VÀ BIỆN LUẬN LỜI GIẢI ========================
function runPrim() {
    drawGraph(); // Tự động đồng bộ ma trận kề lên lưới trực quan

    const activeIds = nodesDataSet.getIds().map(Number);
    const n = activeIds.length;
    const startVertex = parseInt(document.getElementById('start-vertex').value);

    if (n === 0) { alert("Đồ thị trống. Vui lòng thêm đỉnh hoặc nhập ma trận."); return; }
    if (!activeIds.includes(startVertex)) { alert(`Đỉnh bắt đầu duyệt ${startVertex} không tồn tại trên đồ thị hiện tại!`); return; }

    // Reset toàn bộ màu sắc các cạnh về trạng thái ban đầu
    edgesDataSet.get().forEach(e => {
        edgesDataSet.update({ id: e.id, color: '#737686', width: 2, dashes: false });
    });

    // Gom dữ liệu danh sách kề để tính toán
    let adj = {};
    activeIds.forEach(id => adj[id] = []);
    edgesDataSet.get().forEach(e => {
        adj[e.from].push({ to: e.to, weight: e.weight, id: e.id });
        adj[e.to].push({ to: e.from, weight: e.weight, id: e.id });
    });

    let X = [startVertex];
    let visited = {};
    activeIds.forEach(id => visited[id] = false);
    visited[startVertex] = true;

    let mstEdges = [];
    let totalWeight = 0;
    let stepsHtml = `<div class="prim-step-box font-semibold text-primary">Khởi tạo: T = &empty;, X = {${startVertex}}</div>`;
    let stepCounter = 1;

    // Lặp loang tìm n - 1 cạnh bao trùm
    while (X.length < n) {
        let minW = Infinity;
        let chosenEdge = null;
        let edgeStrings = [];
        let weightNumbers = [];

        // Duyệt tìm tất cả các cạnh hợp lệ nối từ tập X ra ngoài tập các đỉnh chưa duyệt
        X.forEach(u => {
            adj[u].forEach(edge => {
                if (!visited[edge.to]) {
                    edgeStrings.push(`w(${u},${edge.to})`);
                    weightNumbers.push(edge.weight);
                    if (edge.weight < minW) {
                        minW = edge.weight;
                        chosenEdge = { from: u, to: edge.to, weight: edge.weight, id: edge.id };
                    }
                }
            });
        });

        // Nếu không tìm thấy cạnh nào chứng tỏ đồ thị bị cô lập (không liên thông)
        if (chosenEdge === null) break;

        // Cập nhật trạng thái loang đỉnh và cạnh
        X.push(chosenEdge.to);
        visited[chosenEdge.to] = true;
        mstEdges.push(chosenEdge);
        totalWeight += chosenEdge.weight;

        // In chuỗi biện luận toán học đúng chuẩn barem thi tự luận
        stepsHtml += `
            <div class="prim-step-box">
                <span class="font-bold text-gray-500">${stepCounter++}.</span> Do 
                <span class="font-semibold text-primary">min{w(X)}</span> = min{${edgeStrings.join('; ')}} = min{${weightNumbers.join(', ')}} = <span class="font-bold text-green-600">${minW}</span><br>
                &Rightarrow; Chọn cạnh <span class="font-bold text-red-600">(${chosenEdge.from}, ${chosenEdge.to})</span> 
                &Rightarrow; <span class="font-semibold">T = T &cup; {(${chosenEdge.from}, ${chosenEdge.to})}</span> ; 
                <span class="font-semibold">X = {${X.join(', ')}}</span>
            </div>`;

        // Đổi màu xanh cho cạnh được chọn trên Canvas
        edgesDataSet.update({ id: chosenEdge.id, color: '#22c55e', width: 4 });
    }

    // Hiển thị điều kiện dừng thuật toán
    if (mstEdges.length === n - 1) {
        stepsHtml += `<div class="prim-step-box font-bold text-red-600 bg-red-50 text-center">Vì đã đủ n - 1 = ${n - 1} cạnh, ta dừng thuật toán và thu được cây khung nhỏ nhất.</div>`;
    }

    document.getElementById('prim-steps-container').innerHTML = stepsHtml;

    // Xuất Kết luận cuối cùng
    let finalVText = `V = { ${activeIds.sort((a,b)=>a-b).join(', ')} }`;
    let finalFText = `F = { ${mstEdges.map(e => `(${e.from},${e.v || e.to})`).join(', ')} }`;
    document.getElementById('final-sequence').innerHTML = `<div>${finalVText}</div><div class="mt-1">${finalFText}</div>`;
    document.getElementById('final-weight').innerHTML = `Tổng trọng số cây khung tối thiểu W = ${totalWeight}`;

    if (mstEdges.length < n - 1) {
        document.getElementById('final-weight').innerHTML += `<br><span class="text-red-600 text-sm mt-2 font-normal block">Cảnh báo: Đồ thị không liên thông, không tìm thấy đủ cây khung bao trùm tất cả các đỉnh!</span>`;
    }

    document.getElementById('output-section').classList.remove('hidden');
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById("btn-draw").addEventListener("click", drawGraph);
document.getElementById("btn-run").addEventListener("click", runPrim);

window.addEventListener("load", () => {
    drawGraph();
    changeMode('node');
});