let currentVars = 4; 

const btnVars3 = document.getElementById('btn-vars-3');
const btnVars4 = document.getElementById('btn-vars-4');
const kmapWrapper = document.getElementById('kmap-wrapper');

btnVars3.addEventListener('click', () => { setVars(3); });
btnVars4.addEventListener('click', () => { setVars(4); });

function setVars(v) {
    currentVars = v;
    if(v === 3) {
        btnVars3.className = "flex-1 py-1.5 rounded bg-primary text-white shadow transition-all font-semibold text-sm";
        btnVars4.className = "flex-1 py-1.5 rounded text-gray-600 transition-all hover:bg-gray-200 font-semibold text-sm";
    } else {
        btnVars4.className = "flex-1 py-1.5 rounded bg-primary text-white shadow transition-all font-semibold text-sm";
        btnVars3.className = "flex-1 py-1.5 rounded text-gray-600 transition-all hover:bg-gray-200 font-semibold text-sm";
    }
    renderInteractiveMap();
    document.getElementById('solution-section').classList.add('hidden');
}

function renderInteractiveMap() {
    let html = '';
    if (currentVars === 3) {
        html = `
        <table class="k-map kmap-interactive font-mono">
            <tr>
                <td class="border-0"></td>
                <td class="border-0 text-red-600 font-bold">x</td>
                <td class="border-0 text-red-600 font-bold">x</td>
                <td class="border-0 text-red-600 font-bold"><span style="text-decoration: overline;">x</span></td>
                <td class="border-0 text-red-600 font-bold"><span style="text-decoration: overline;">x</span></td>
            </tr>
            <tr>
                <td class="border-0 text-red-600 font-bold pr-2 text-right">z</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="101">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="111">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="011">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="001">0</td>
            </tr>
            <tr>
                <td class="border-0 text-red-600 font-bold pr-2 text-right"><span style="text-decoration: overline;">z</span></td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="100">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="110">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="010">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="000">0</td>
            </tr>
            <tr>
                <td class="border-0"></td>
                <td class="border-0 text-red-600 font-bold"><span style="text-decoration: overline;">y</span></td>
                <td class="border-0 text-red-600 font-bold">y</td>
                <td class="border-0 text-red-600 font-bold">y</td>
                <td class="border-0 text-red-600 font-bold"><span style="text-decoration: overline;">y</span></td>
            </tr>
        </table>`;
    } else {
        html = `
        <table class="k-map kmap-interactive font-mono">
            <tr>
                <td class="border-0"></td>
                <td class="border-0 text-red-600 font-bold">x</td>
                <td class="border-0 text-red-600 font-bold">x</td>
                <td class="border-0 text-red-600 font-bold"><span style="text-decoration: overline;">x</span></td>
                <td class="border-0 text-red-600 font-bold"><span style="text-decoration: overline;">x</span></td>
                <td class="border-0"></td>
            </tr>
            <tr>
                <td class="border-0 text-red-600 font-bold pr-2 text-right">z</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="1010">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="1110">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="0110">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="0010">0</td>
                <td class="border-0 text-red-600 font-bold pl-2 text-left"><span style="text-decoration: overline;">t</span></td>
            </tr>
            <tr>
                <td class="border-0 text-red-600 font-bold pr-2 text-right">z</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="1011">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="1111">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="0111">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="0011">0</td>
                <td class="border-0 text-red-600 font-bold pl-2 text-left">t</td>
            </tr>
            <tr>
                <td class="border-0 text-red-600 font-bold pr-2 text-right"><span style="text-decoration: overline;">z</span></td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="1001">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="1101">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="0101">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="0001">0</td>
                <td class="border-0 text-red-600 font-bold pl-2 text-left">t</td>
            </tr>
            <tr>
                <td class="border-0 text-red-600 font-bold pr-2 text-right"><span style="text-decoration: overline;">z</span></td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="1000">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="1100">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="0100">0</td>
                <td class="cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100" data-coord="0000">0</td>
                <td class="border-0 text-red-600 font-bold pl-2 text-left"><span style="text-decoration: overline;">t</span></td>
            </tr>
            <tr>
                <td class="border-0"></td>
                <td class="border-0 text-red-600 font-bold"><span style="text-decoration: overline;">y</span></td>
                <td class="border-0 text-red-600 font-bold">y</td>
                <td class="border-0 text-red-600 font-bold">y</td>
                <td class="border-0 text-red-600 font-bold"><span style="text-decoration: overline;">y</span></td>
                <td class="border-0"></td>
            </tr>
        </table>`;
    }
    kmapWrapper.innerHTML = html;
    
    document.querySelectorAll('.cell-kmap').forEach(cell => {
        cell.addEventListener('click', () => {
            setCellState(cell, cell.textContent === '0' ? '1' : '0');
        });
    });
}

function setCellState(cell, state) {
    if (state === '1') {
        cell.textContent = '1';
        cell.className = "cell-kmap cursor-pointer text-green-700 font-bold text-lg transition-colors bg-blue-50";
    } else {
        cell.textContent = '0';
        cell.className = "cell-kmap cursor-pointer text-red-700 font-bold text-lg transition-colors hover:bg-gray-100";
    }
}

document.getElementById('btn-load-f1').addEventListener('click', () => {
    let terms = document.getElementById('input-f1').value.trim().split(/[\s,]+/).map(t => t.trim());
    document.querySelectorAll('.cell-kmap').forEach(c => {
        setCellState(c, terms.includes(c.getAttribute('data-coord')) ? '1' : '0');
    });
});

document.getElementById('btn-load-f0').addEventListener('click', () => {
    let terms = document.getElementById('input-f0').value.trim().split(/[\s,]+/).map(t => t.trim());
    document.querySelectorAll('.cell-kmap').forEach(c => {
        setCellState(c, terms.includes(c.getAttribute('data-coord')) ? '0' : '1');
    });
});

document.getElementById('btn-load-boolean').addEventListener('click', () => {
    let expr = document.getElementById('input-boolean').value.trim();
    if (!expr) return;
    document.querySelectorAll('.cell-kmap').forEach(c => setCellState(c, '0'));
    expr = expr.toLowerCase().replace(/\s+/g, '').replace(/\*/g, '').replace(/v/g, '+');

    function expandBrackets(input) {
        let regex = /([a-z_]+)\(([^)]+)\)/g;
        let match;
        while ((match = regex.exec(input)) !== null) {
            let prefix = match[1], inside = match[2], subTerms = inside.split('+');
            input = input.replace(match[0], subTerms.map(sub => prefix + sub).join('+'));
            regex.lastIndex = 0; 
        }
        return input;
    }
    const terms = expandBrackets(expr).split('+');
    document.querySelectorAll('.cell-kmap').forEach(cell => {
        const coord = cell.getAttribute('data-coord');
        const vX = coord[0], vY = coord[1], vZ = coord[2], vT = currentVars === 4 ? coord[3] : null;
        let match = terms.some(term => {
            if(!term) return false;
            if(term.includes('x_') && vX !== '0') return false;
            if(term.includes('x') && !term.includes('x_') && vX !== '1') return false;
            if(term.includes('y_') && vY !== '0') return false;
            if(term.includes('y') && !term.includes('y_') && vY !== '1') return false;
            if(term.includes('z_') && vZ !== '0') return false;
            if(term.includes('z') && !term.includes('z_') && vZ !== '1') return false;
            if(currentVars === 4) {
                if(term.includes('t_') && vT !== '0') return false;
                if(term.includes('t') && !term.includes('t_') && vT !== '1') return false;
            }
            return true;
        });
        if(match) setCellState(cell, '1');
    });
});

document.getElementById('btn-clear-map').addEventListener('click', () => {
    document.querySelectorAll('.cell-kmap').forEach(c => setCellState(c, '0'));
    document.getElementById('solution-section').classList.add('hidden');
});

document.getElementById('btn-solve-karnaugh').addEventListener('click', () => {
    let inputBoolean = document.getElementById('input-boolean').value.trim();
    let inputF1 = document.getElementById('input-f1').value.trim();
    let inputF0 = document.getElementById('input-f0').value.trim();

    // TỰ ĐỘNG KHỚP NẠP DỮ LIỆU ĐẦU VÀO THEO THỨ TỰ ƯU TIÊN
    if (inputBoolean) {
        document.getElementById('btn-load-boolean').click();
    } else if (inputF1) {
        document.getElementById('btn-load-f1').click();
    } else if (inputF0) {
        document.getElementById('btn-load-f0').click();
    }

    let minterms = [];
    document.querySelectorAll('.cell-kmap').forEach(c => {
        if (c.textContent === '1') {
            minterms.push(c.getAttribute('data-coord'));
        }
    });
    
    if (minterms.length === 0) {
        alert("Vui lòng nhập biểu thức, tập số ô nhị phân hoặc click chọn trực tiếp các ô trên bìa Karnaugh trước khi giải!");
        return;
    }

    let primes = findPrimeImplicants(minterms, currentVars);
    let essentials = findEssentialPrimes(primes, minterms);
    let covers = findMinimumCovers(minterms, primes, essentials);
    renderDetailedSolution(minterms, primes, essentials, covers.allCovers);
});

function findPrimeImplicants(minterms, nVars) {
    let implicants = minterms.map(m => ({term: m, used: false, covers: [m]}));
    let primes = [];
    let changed = true;
    while(changed) {
        changed = false;
        let nextMap = new Map();
        for(let i=0; i<implicants.length; i++) {
            for(let j=i+1; j<implicants.length; j++) {
                let t1 = implicants[i].term, t2 = implicants[j].term;
                let diff = 0, diffIdx = -1;
                for(let k=0; k<nVars; k++) { if(t1[k] !== t2[k]) { diff++; diffIdx = k; } }
                if(diff === 1) {
                    implicants[i].used = true; implicants[j].used = true; changed = true;
                    let newTerm = t1.substring(0, diffIdx) + '-' + t1.substring(diffIdx+1);
                    if(!nextMap.has(newTerm)) {
                        let combined = Array.from(new Set([...implicants[i].covers, ...implicants[j].covers])).sort();
                        nextMap.set(newTerm, {term: newTerm, used: false, covers: combined});
                    }
                }
            }
        }
        implicants.forEach(imp => { if(!imp.used) primes.push(imp); });
        implicants = Array.from(nextMap.values());
    }
    let uniquePrimes = [];
    let seen = new Set();
    primes.forEach(p => { if(!seen.has(p.term)) { seen.add(p.term); uniquePrimes.push(p); }});
    return uniquePrimes.sort((a,b) => b.covers.length - a.covers.length);
}

function findEssentialPrimes(primes, minterms) {
    let mintermCount = {};
    minterms.forEach(m => mintermCount[m] = []);
    primes.forEach((p, idx) => { p.covers.forEach(m => { if(mintermCount[m]) mintermCount[m].push(idx); }); });
    let essentials = new Set();
    Object.values(mintermCount).forEach(arr => { if(arr.length === 1) essentials.add(arr[0]); });
    return Array.from(essentials);
}

function findMinimumCovers(minterms, primes, essentials) {
    let coveredSet = new Set();
    let currentCover = [];
    essentials.forEach(idx => {
        currentCover.push(idx);
        primes[idx].covers.forEach(m => coveredSet.add(m));
    });

    let remainingMinterms = minterms.filter(m => !coveredSet.has(m));
    if(remainingMinterms.length === 0) return { allCovers: [currentCover.sort((a,b)=>a-b)] };

    let remainingPrimes = [];
    primes.forEach((p, idx) => {
        if(!essentials.includes(idx) && p.covers.some(m => remainingMinterms.includes(m))) remainingPrimes.push(idx);
    });

    let validCovers = [];
    let minLen = Infinity;

    function backtrack(idx, path, covSet) {
        if(covSet.size === minterms.length) {
            if(path.length < minLen) { minLen = path.length; validCovers = [[...path]]; }
            else if(path.length === minLen) { validCovers.push([...path]); }
            return;
        }
        if(idx >= remainingPrimes.length) return;

        let pIdx = remainingPrimes[idx];
        let nextCov = new Set(covSet);
        primes[pIdx].covers.forEach(m => nextCov.add(m));
        
        path.push(pIdx);
        backtrack(idx + 1, path, nextCov);
        path.pop();

        backtrack(idx + 1, path, covSet);
    }

    backtrack(0, currentCover, coveredSet);

    let uniqueStr = new Set();
    let uniqueCovers = [];
    validCovers.forEach(c => {
        let str = c.sort((a,b)=>a-b).join(',');
        if(!uniqueStr.has(str)) { uniqueStr.add(str); uniqueCovers.push(c); }
    });
    return { allCovers: uniqueCovers };
}

function termToAlg(term) {
    let vars = currentVars === 3 ? ['x','y','z'] : ['x','y','z','t'];
    let res = "";
    for(let i=0; i<term.length; i++) {
        if(term[i] === '1') res += `<span style="font-style: italic;">${vars[i]}</span>`;
        if(term[i] === '0') res += `<span style="text-decoration: overline; font-style: italic;">${vars[i]}</span>`;
    }
    return res || "1";
}

function getCellCoordText(mintermBinary) {
    let orderCols = ['10', '11', '01', '00'];
    let orderRows = currentVars === 3 ? ['1', '0'] : ['10', '11', '01', '00'];
    let cBin = mintermBinary.substring(0, 2);
    let rBin = currentVars === 3 ? mintermBinary.substring(2, 3) : mintermBinary.substring(2, 4);
    return `(${orderRows.indexOf(rBin)+1},${orderCols.indexOf(cBin)+1})`;
}

function generateKMapHTML(minterms, activePrimes = [], tagMap = {}) {
    let orderCols = ['10', '11', '01', '00'];
    let orderRows = currentVars === 3 ? ['1', '0'] : ['10', '11', '01', '00'];
    
    let it = `style="font-style: italic;"`;
    let ov = `style="text-decoration: overline; font-style: italic;"`;

    let rowLabels = currentVars === 3 ? 
        [`<span ${it}>z</span>`, `<span ${ov}>z</span>`] : 
        [`<span ${it}>z</span>`, `<span ${it}>z</span>`, `<span ${ov}>z</span>`, `<span ${ov}>z</span>`];
    let rowLabelsT = currentVars === 4 ? 
        [`<span ${ov}>t</span>`, `<span ${it}>t</span>`, `<span ${it}>t</span>`, `<span ${ov}>t</span>`] : [];

    let html = `<div class="kmap-layout"><div class="kmap-grid-wrapper">`;
    html += `<div class="labels-row"><div><span ${it}>x</span></div><div><span ${it}>x</span></div><div><span ${ov}>x</span></div><div><span ${ov}>x</span></div></div>`;
    html += `<div class="kmap-middle-row">`;
    html += `<div class="labels-column ${currentVars===3?'row-2':''} left">${rowLabels.map(l => `<div>${l}</div>`).join('')}</div>`;
    
    html += `<table class="k-map font-mono">`;
    for(let r=0; r<orderRows.length; r++) {
        html += `<tr>`;
        for(let c=0; c<4; c++) {
            let coord = orderCols[c] + orderRows[r];
            let isFilled = minterms.includes(coord);
            let tagsHtml = (tagMap[coord] || []).map(t => `<span class="cell-tag ${t.cls}">${t.txt}</span>`).join('');
            html += `<td class="${isFilled ? 'filled' : ''}">${isFilled && !tagsHtml ? '1' : tagsHtml}</td>`;
        }
        html += `</tr>`;
    }
    html += `</table>`;

    if(currentVars === 4) {
        html += `<div class="labels-column right">${rowLabelsT.map(l => `<div>${l}</div>`).join('')}</div>`;
    }
    html += `</div>`;
    html += `<div class="labels-row bottom"><div><span ${ov}>y</span></div><div><span ${it}>y</span></div><div><span ${it}>y</span></div><div><span ${ov}>y</span></div></div>`;
    html += `</div></div>`;
    return html;
}

function buildDecisionTreeData(minterms, primes, essentials) {
    let initialCovered = new Set();
    essentials.forEach(idx => primes[idx].covers.forEach(m => initialCovered.add(m)));
    let remainingMinterms = minterms.filter(m => !initialCovered.has(m));

    let rootLabel = essentials.length > 0 ? essentials.map(x => `TB ${x+1}`).join(', ') : "Gốc";
    let leavesCount = 0;

    function buildNode(currentCovered, mintermIdx) {
        while (mintermIdx < remainingMinterms.length && currentCovered.has(remainingMinterms[mintermIdx])) {
            mintermIdx++;
        }
        if (mintermIdx >= remainingMinterms.length) {
            leavesCount++;
            return null; 
        }

        let targetMinterm = remainingMinterms[mintermIdx];
        let branches = [];

        primes.forEach((p, idx) => {
            if (p.covers.includes(targetMinterm)) {
                let nextCovered = new Set(currentCovered);
                p.covers.forEach(m => nextCovered.add(m));
                
                let childNode = buildNode(nextCovered, mintermIdx + 1);
                branches.push({
                    cellLabel: `Ô ${getCellCoordText(targetMinterm)}`,
                    nodeLabel: `TB ${idx + 1}`,
                    child: childNode
                });
            }
        });

        return { branches: branches };
    }

    let treeStructure = buildNode(initialCovered, 0);
    return { rootLabel, treeStructure, leavesCount };
}

function renderDetailedSolution(minterms, primes, essentials, allCovers) {
    let html = "";
    let numSol = allCovers.length;
    let typeText = numSol === 1 ? '1 ĐA THỨC' : (numSol === 2 ? '2 ĐA THỨC' : `NHIỀU (${numSol}) ĐA THỨC`);
    document.getElementById('solution-header').innerText = `DẠNG BÀI: TÌM ${typeText} TỐI TIỂU`;

    html += `<div class="step-title">Bước 1. Vẽ biểu đồ <span style="font-style: italic;">Kar(f)</span></div>`;
    html += generateKMapHTML(minterms);

    let tagClasses = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'];
    let tagMap = {};
    primes.forEach((p, idx) => {
        p.covers.forEach(m => {
            if(!tagMap[m]) tagMap[m] = [];
            tagMap[m].push({ txt: idx + 1, cls: tagClasses[idx % tagClasses.length] });
        });
    });

    html += `<div class="step-title">Bước 2. Xác định các tế bào lớn của <span style="font-style: italic;">Kar(f)</span></div>`;
    html += `<div class="flex items-center justify-center gap-10 flex-wrap">`;
    html += generateKMapHTML(minterms, primes, tagMap);
    
    html += `<div class="text-base" style="width: 45%; min-width: 280px;"><p class="mb-3">Bằng cách đánh số các tế bào lớn, ta có <span style="font-style: italic;">kar(f)</span> có <strong>${primes.length}</strong> tế bào lớn là:</p><ul class="styled-list">`;
    primes.forEach((p, idx) => {
        html += `<li>Tế bào ${idx + 1}: <span class="math font-bold text-blue-900">${termToAlg(p.term)}</span></li>`;
    });
    html += `</ul></div></div>`;

    html += `<div class="step-title">Bước 3. Lựa chọn các tế bào lớn cốt yếu</div>`;
    if(essentials.length > 0) {
        html += `<ul class="styled-list">`;
        essentials.forEach(idx => {
            let uniqueMinterm = primes[idx].covers.find(m => tagMap[m].length === 1);
            let dispC = uniqueMinterm ? getCellCoordText(uniqueMinterm) : "Chung";
            html += `<li>Ô ${dispC} chỉ nằm trong tế bào lớn ${idx + 1}. Ta phải chọn tế bào ${idx + 1}.</li>`;
        });
        html += `</ul>`;
    } else {
        html += `<p class="italic text-gray-600 ml-4">Không có tế bào lớn cốt yếu nào (Mọi ô đều bị phủ bởi từ 2 tế bào trở lên).</p>`;
    }

    html += `<div class="step-title">Bước 4 & 5. Phủ các ô còn lại và Kết luận đa thức tối tiểu</div>`;
    
    if(numSol === 1) {
        let finalAlg = allCovers[0].map(idx => termToAlg(primes[idx].term)).join(' &or; ');
        html += `<p class="text-lg">Ta được duy nhất một phủ tối tiểu gồm các tế bào lớn của <span style="font-style: italic;">kar(f)</span> là ${finalAlg}.</p>`;
        html += `<p class="text-lg mt-4">Vậy công thức đa thức tối tiểu của f là:</p>`;
        html += `<div class="text-center font-bold text-2xl text-primary my-6 bg-blue-50 py-4 rounded border-2 border-primary border-dashed">f = ${finalAlg}</div>`;
    } else {
        let uncovered = minterms.filter(m => !essentials.some(idx => primes[idx].covers.includes(m)));
        html += `<p class="text-lg mb-3">Như vậy còn các ô nhị phân chưa được phủ hoàn toàn là: <strong>${uncovered.map(getCellCoordText).join(', ')}</strong>. Để phủ các ô này ta có cây rẽ nhánh quyết định sau:</p>`;
        
        let treeData = buildDecisionTreeData(minterms, primes, essentials);
        
        let svgWidth = 980;
        let totalLeaves = treeData.leavesCount;
        let svgHeight = Math.max(totalLeaves * 85, 260);

        let svgElements = [];
        let htmlElements = [];
        let leafIndex = 0;

        function traverseAndDraw(node, startX, startY, parentNodeX, parentNodeY, incomingEdgeLabel) {
            if (!node) {
                let endY = 40 + leafIndex * 85;
                svgElements.push(`<line x1="${parentNodeX + 45}" y1="${parentNodeY}" x2="${svgWidth - 140}" y2="${endY}" stroke="#38a169" stroke-width="1.5" stroke-dasharray="4"/>`);
                
                let leafCov = allCovers[leafIndex % allCovers.length];
                htmlElements.push(`<div class="tree-node-box font-mono" style="left: ${svgWidth - 80}px; top: ${endY}px; background: #ebf8ff; border-color: #3182ce; color: #2b6cb0; width: 120px; font-weight: bold;">{${leafCov.map(x => x+1).join(',')}}</div>`);
                leafIndex++;
                return parentNodeY;
            }

            let bCount = node.branches.length;
            let firstLeafY = 40 + leafIndex * 85;
            let nodeY = firstLeafY + ((bCount - 1) * 85) / 2;

            node.branches.forEach((branch, bIdx) => {
                let childY = 40 + leafIndex * 85;
                if (branch.child) {
                    let childLeaves = 0;
                    function countLeaves(n) {
                        if(!n) { childLeaves++; return; }
                        n.branches.forEach(b => countLeaves(b.child));
                    }
                    countLeaves(branch.child);
                    childY = childY + ((childLeaves - 1) * 85) / 2;
                }
                
                svgElements.push(`<path d="M ${startX + 45} ${startY} C ${startX + 100} ${startY}, ${startX + 90} ${childY}, ${startX + 140} ${childY}" stroke="#0c1f4d" stroke-width="2" fill="none" />`);
                svgElements.push(`<polygon points="${startX + 140},${childY} ${startX + 132},${childY-4} ${startX + 132},${childY+4}" fill="#0c1f4d" />`);
                
                htmlElements.push(`<div class="tree-edge-label" style="left: ${startX + 95}px; top: ${(startY + childY)/2}px;">${branch.cellLabel}</div>`);
                htmlElements.push(`<div class="tree-node-box" style="left: ${startX + 185}px; top: ${childY}px; width: 90px; text-align: center;">${branch.nodeLabel}</div>`);
                
                traverseAndDraw(branch.child, startX + 180, childY, startX + 185, childY, branch.cellLabel);
            });

            return nodeY;
        }

        let rootY = svgHeight / 2;
        htmlElements.push(`<div class="tree-node-box" style="left: 60px; top: ${rootY}px; width: 110px; text-align: center;">${treeData.rootLabel}</div>`);
        
        if (treeData.treeStructure) {
            traverseAndDraw(treeData.treeStructure, 60, rootY, 60, rootY, '');
        }

        let svgContent = `<div class="tree-container overflow-x-auto my-4 relative bg-gray-50 border border-gray-200 rounded-2xl" style="height: ${svgHeight + 50}px; min-width: 100%;">`;
        svgContent += `<svg width="${svgWidth}" height="${svgHeight}" style="position: absolute; left:0; top:0; z-index:10;">`;
        svgContent += svgElements.join('');
        svgContent += `</svg>`;
        svgContent += htmlElements.join('');
        svgContent += `</div>`;
        
        html += svgContent;

        html += `<p class="text-lg mt-6">Như vậy, từ cây rẽ nhánh trên ta thu được tất cả <strong>${numSol}</strong> tập phủ tối giản là:</p>`;
        html += `<div class="solution-sets">`;
        allCovers.forEach((cov, i) => {
            html += `<div class="solution-group text-blue-900">${i + 1}). {${cov.map(x => x+1).join(',')}}</div>`;
        });
        html += `</div>`;

        html += `<ul class="formula-list">`;
        allCovers.forEach((cov, i) => {
            let finalAlg = cov.map(idx => termToAlg(primes[idx].term)).join(' &or; ');
            html += `<li><strong>Cách ${i + 1}. Chọn tập phủ {${cov.map(x=>x+1).join(',')}}, ta có:</strong><br><span class="math text-red-600 font-bold tracking-wider text-xl">f = ${finalAlg}</span></li>`;
        });
        html += `</ul>`;
        
        html += `<div class="highlight-box">Các công thức này có độ phức tạp và độ đơn giản hoàn toàn như nhau, vì vậy ta lựa chọn cả ${numSol} đa thức tối tiểu này làm lời giải chính xác.</div>`;
    }

    document.getElementById('solution-content').innerHTML = html;
    document.getElementById('solution-section').classList.remove('hidden');
    document.getElementById('solution-section').scrollIntoView({ behavior: 'smooth' });
}

window.addEventListener('load', () => setVars(4));