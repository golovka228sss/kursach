// --- ПЕРЕМЕННЫЕ ИНТЕРФЕЙСА ---
const sizeInput = document.getElementById('array-size');
const sizeVal = document.getElementById('size-val');
const speedInput = document.getElementById('speed');
const fillMode = document.getElementById('fill-mode');
const manualInputBox = document.getElementById('manual-input-box');
const sizeControlBox = document.getElementById('size-control-box');
const generateBtn = document.getElementById('generate-btn');
const startBtn = document.getElementById('start-btn');
const nextStepBtn = document.getElementById('next-step-btn');
const stepModeCheck = document.getElementById('step-mode');

const toggleBtn = document.getElementById('toggle-split');
const wrapper = document.getElementById('vis-container2');
const panel2 = document.getElementById('panel-2');
const settings2 = document.getElementById('settings-view-2');

const algoSelect = document.getElementById('algo-select');
const algoSelect2 = document.getElementById('algo-select-2');
const complexityDisplay = document.getElementById('complexity-display');
const complexityDisplay2 = document.getElementById('complexity-display-2');

// --- СОСТОЯНИЕ ПРИЛОЖЕНИЯ ---
let algoData = {};
let stepResolver = null;

const state1 = {
    id: 's1',
    array: [],
    frames: [],
    currentFrameIndex: 0,
    isSorting: false,
    comparisons: 0,
    updates: 0,
    container: document.getElementById('container'),
    compDisplay: document.getElementById('comparisons-display'),
    swapDisplay: document.getElementById('swaps-display'),
    statusDisplay: document.getElementById('status-display')
};

const state2 = {
    id: 's2',
    array: [],
    frames: [],
    currentFrameIndex: 0,
    isSorting: false,
    comparisons: 0,
    updates: 0,
    container: document.getElementById('container-2'),
    compDisplay: document.getElementById('comparisons-display-2'),
    swapDisplay: document.getElementById('swaps-display-2'),
    statusDisplay: document.getElementById('status-display-2')
};

// --- ИНИЦИАЛИЗАЦИЯ ---
window.onload = async () => {
    await loadAlgorithms();
    generateArray1();
    generateArray2();
};

// --- ЗАГРУЗКА АЛГОРИТМОВ ---
async function loadAlgorithms() {
    try {
        const response = await fetch('./sort.json');
        algoData = await response.json();
        
        [algoSelect, algoSelect2].forEach(select => {
            select.innerHTML = '';
            Object.keys(algoData).forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = algoData[key].name || key;
                select.appendChild(option);
            });
        });
        updateAlgoInfo(state1, algoSelect, complexityDisplay);
        updateAlgoInfo(state2, algoSelect2, complexityDisplay2);
    } catch (err) {
        console.error("Ошибка загрузки sort.json:", err);
    }
}

function updateAlgoInfo(state, select, display) {
    const data = algoData[select.value];
    if (data) {
        display.innerText = data.complexity || "O(N²)";
        state.statusDisplay.innerText = "Готов";
    }
}

// --- УПРАВЛЕНИЕ ДАННЫМИ ---
async function loadData(state, dataFile) {
    if (state.isSorting) return;
    try {
        const [arrayRes, dataRes] = await Promise.all([
            fetch("array.json").then(res => res.json()),
            fetch(dataFile).then(res => res.json())
        ]);

        state.array = [...arrayRes.metadata.initial_array];
        state.frames = dataRes.frames || [];
        
        if (state === state1) {
            sizeInput.value = state.array.length;
            sizeVal.innerText = state.array.length;
        }

        renderArray(state);
        resetStats(state);
    } catch (err) {
        console.error(`Ошибка загрузки ${dataFile}:`, err);
    }
}

const generateArray1 = () => loadData(state1, "data1.json");
const generateArray2 = () => loadData(state2, "data2.json");

function renderArray(state) {
    state.container.innerHTML = '';
    const maxVal = Math.max(...state.array, 10);
    state.array.forEach((val, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-wrapper';
        wrapper.innerHTML = `
            <div class="bar" id="${state.id}-bar-${idx}" style="height: ${(val / maxVal) * 100}%"></div>
            <div class="bar-label" id="${state.id}-label-${idx}">${val}</div>
        `;
        state.container.appendChild(wrapper);
    });
}

function resetStats(state) {
    state.comparisons = 0;
    state.updates = 0;
    state.currentFrameIndex = 0;
    state.compDisplay.innerText = "0";
    state.swapDisplay.innerText = "0";
    state.statusDisplay.innerText = "Ожидание";
    state.container.querySelectorAll('.bar').forEach(b => b.style.backgroundColor = '');
}

// --- ЛОГИКА СОРТИРОВКИ ---
async function startSorting(state) {
    if (state.isSorting || state.frames.length === 0) return;
    state.isSorting = true;
    updateControls();

    while (state.currentFrameIndex < state.frames.length) {
        const frame = state.frames[state.currentFrameIndex];

        if (frame.type === "update") {
            playFrame(state, frame);
            let nextIdx = state.currentFrameIndex + 1;
            if (nextIdx < state.frames.length && state.frames[nextIdx].type === "update") {
                state.currentFrameIndex++;
                playFrame(state, state.frames[state.currentFrameIndex]);
            }
        } else {
            playFrame(state, frame);
        }

        state.currentFrameIndex++;
        if (state.currentFrameIndex < state.frames.length) await wait(state);
    }

    state.statusDisplay.innerText = "Готово!";
    state.isSorting = false;
    updateControls();
}

function playFrame(state, frame) {
    if (frame.type === "compare") {
        state.container.querySelectorAll('.bar').forEach(b => b.style.backgroundColor = '');
        state.statusDisplay.innerText = "Сравнение...";
        state.comparisons++;
        state.compDisplay.innerText = state.comparisons;
        frame.indexes.forEach(idx => {
            const bar = document.getElementById(`${state.id}-bar-${idx}`);
            if (bar) bar.style.backgroundColor = "#ff4757";
        });
    } else if (frame.type === "update") {
        state.statusDisplay.innerText = "Перестановка...";
        state.updates++;
        state.swapDisplay.innerText = Math.floor(state.updates / 2);
        state.array[frame.index] = frame.value;
        
        const bar = document.getElementById(`${state.id}-bar-${frame.index}`);
        const label = document.getElementById(`${state.id}-label-${frame.index}`);
        const maxVal = Math.max(...state.array, 10);
        
        if (bar) {
            bar.style.height = `${(frame.value / maxVal) * 100}%`;
            bar.style.backgroundColor = "#d5ae2e";
        }
        if (label) label.innerText = frame.value;
    }
}

async function wait(state) {
    if (stepModeCheck.checked) {
        state.statusDisplay.innerText = "Пауза (шаг)";
        return new Promise(resolve => { stepResolver = resolve; });
    } else {
        let delay = Math.max(5, parseInt(speedInput.value));
        return new Promise(resolve => setTimeout(resolve, delay));
    }
}

function updateControls() {
    const isAnySorting = state1.isSorting || state2.isSorting;
    const controls = [sizeInput, generateBtn, fillMode, startBtn, algoSelect, algoSelect2];
    controls.forEach(el => el.disabled = isAnySorting);
    startBtn.style.opacity = isAnySorting ? "0.5" : "1";
    nextStepBtn.disabled = !isAnySorting;
}

// --- СОБЫТИЯ ---
startBtn.onclick = () => {
    startSorting(state1);
    if (wrapper.classList.contains('split-mode')) {
        startSorting(state2);
    }
};

generateBtn.onclick = () => {
    generateArray1();
    if (wrapper.classList.contains('split-mode')) generateArray2();
};

algoSelect.onchange = () => updateAlgoInfo(state1, algoSelect, complexityDisplay);
algoSelect2.onchange = () => updateAlgoInfo(state2, algoSelect2, complexityDisplay2);

nextStepBtn.onclick = () => {
    if (stepResolver) {
        stepResolver();
        stepResolver = null;
    }
};

toggleBtn.addEventListener('click', () => {
    const isSplit = wrapper.classList.contains('split-mode');

    if (!isSplit) {
        // ВКЛЮЧАЕМ РАЗДЕЛЕНИЕ
        wrapper.classList.remove('single-mode');
        wrapper.classList.add('split-mode');
        panel2.style.display = 'grid';
        wrapper.style.display = 'flex';
        settings2.style.display = 'block';
        toggleBtn.innerText = 'Объединить окна';
        toggleBtn.style.backgroundColor = 'var(--color-swap)'; // Опционально: меняем цвет
        
        // Инициализируем данные для второго окна
        generateArray('view2'); 
    } else {
        // ВЫКЛЮЧАЕМ РАЗДЕЛЕНИЕ
        wrapper.classList.remove('split-mode');
        wrapper.classList.add('single-mode');
        wrapper.style.display = 'none';
        panel2.style.display = 'none';
        settings2.style.display = 'none';
        toggleBtn.innerText = 'Разделить окно';
        toggleBtn.style.backgroundColor = 'var(--color-bar)';
    }
});
