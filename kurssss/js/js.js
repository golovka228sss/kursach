// ПЕРЕМЕННЫЕ
const container = document.getElementById('container');
const sizeInput = document.getElementById('array-size');
const sizeVal = document.getElementById('size-val');
const speedInput = document.getElementById('speed');
const algoSelect = document.getElementById('algo-select');
const fillMode = document.getElementById('fill-mode');
const manualInputBox = document.getElementById('manual-input-box');
const sizeControlBox = document.getElementById('size-control-box');
const manualDataInput = document.getElementById('manual-data');
const applyManualBtn = document.getElementById('apply-manual');
const generateBtn = document.getElementById('generate-btn');
const startBtn = document.getElementById('start-btn');
const nextStepBtn = document.getElementById('next-step-btn');
const stepModeCheck = document.getElementById('step-mode');

// Статистика
const compDisplay = document.getElementById('comparisons-display');
const swapDisplay = document.getElementById('swaps-display');
const statusDisplay = document.getElementById('status-display');
const complexityDisplay = document.getElementById('complexity-display');

let array = [];
let isSorting = false;
let stepResolver = null; // Промис для шага

const complexities = {
    bubble: "O(N²)",
    insertion: "O(N²)",
    selection: "O(N²)"
};

// ИНИЦИАЛИЗАЦИЯ
window.onload = generateArray;

// СОБЫТИЯ

// Изменение размера слайдера
sizeInput.oninput = function() {
    sizeVal.innerText = this.value;
    if (fillMode.value === 'random') generateArray();
};

// Переключение режима ввода (Рандом / Вручную)
fillMode.onchange = function() {
    if (this.value === 'manual') {
        manualInputBox.style.display = 'block';
        sizeControlBox.style.display = 'none';
    } else {
        manualInputBox.style.display = 'none';
        sizeControlBox.style.display = 'block';
        generateArray();
    }
};

// Кнопка применения ручного ввода
applyManualBtn.onclick = function() {
    const text = manualDataInput.value;
    const nums = text.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    if (nums.length > 1) {
        //ограничим кол-во.
        array = nums.slice(0, 40);
        renderArray();
        resetStats();
    } else {
        alert("Введите минимум 2 числа через запятую.");
    }
};


algoSelect.onchange = function() {
    complexityDisplay.innerText = complexities[this.value];
    resetStats();
};


// ФУНКЦИИ

function updateControls() {
    sizeInput.disabled = isSorting;
    generateBtn.disabled = isSorting;
    fillMode.disabled = isSorting;
    startBtn.disabled = isSorting;
    startBtn.style.opacity = isSorting ? "0.5" : "1";
    
    // Кнопка шага активна только если идет сортировка И включен пошаговый режим
    nextStepBtn.disabled = !(isSorting && stepModeCheck.checked);
}

function resetStats() {
    compDisplay.innerText = "0";
    swapDisplay.innerText = "0";
    statusDisplay.innerText = "Ожидание";
    statusDisplay.style.color = "var(--text-main)";
}

function generateArray() {
    if (isSorting) return;

    // Загружаем JSON
    fetch("data.json")
        .then(res => res.json())
        .then(jsonData => {
            if (!jsonData || !jsonData.metadata || !Array.isArray(jsonData.metadata.initial_array)) {
                console.error("Некорректный формат JSON");
                return;
            }

            // Берём массив из JSON
            array = [...jsonData.metadata.initial_array];

            // Рендерим
            renderArray();
            resetStats();
        })
        .catch(err => console.error("Ошибка загрузки JSON:", err));
}

function renderArray() {
    container.innerHTML = '';
    // Найдем макс значение для расчета высоты в %
    const maxVal = Math.max(...array, 10); 

    array.forEach((val, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-wrapper';
        
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.id = `bar-${idx}`;
        // Высота = (значение / макс) * 50
        bar.style.height = `${(val / maxVal) * 50}%`;
        
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.id = `label-${idx}`;
        label.innerText = val;

        wrapper.appendChild(bar);
        wrapper.appendChild(label);
        container.appendChild(wrapper);
    });
}


// АНИМАЦИЯ И ЦВЕТА

async function wait() {
    if (stepModeCheck.checked) {
        statusDisplay.innerText = "Пауза (Шаг)";
        return new Promise(resolve => {
            stepResolver = resolve;
        }).then(() => {
            statusDisplay.innerText = "Сортировка...";
        });
    } else {
        // Значение слайдера: 10 (быстро) -> 1000 (медленно)
        const ms = parseInt(speedInput.value);
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}


// загрузка JSON-файла
fetch("data.json")
    .then(res => res.json())
    .then(json => {
        arr = loadArrayFromJson(json);
        frames = json.frames;
        i = 0;                  // сброс шага
        renderBarsFromArray(arr);
    })
    .catch(err => console.error("Ошибка загрузки JSON:", err));

document.getElementById("next-step-btns").addEventListener("click", playNextFrame);