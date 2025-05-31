// matrix.js

document.addEventListener("DOMContentLoaded", function () {
    const initialSize = 5;
    createMatrix(initialSize);
    setupKeyboardNavigation();

    document
        .getElementById("update-size")
        .addEventListener("click", updateMatrixSize);
    document
        .getElementById("submit-matrix")
        .addEventListener("click", submitMatrix);
    document
        .getElementById("matrix-size")
        .addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                updateMatrixSize();
            }
        });
});

// Создание матрицы
function createMatrix(size) {
    const table = document.getElementById("matrix-table");
    table.innerHTML = "";

    for (let i = 0; i < size; i++) {
        const row = document.createElement("tr");

        for (let j = 0; j < size; j++) {
            const cell = document.createElement("td");
            const input = document.createElement("input");
            input.type = "number";
            input.className = "matrix-input";
            input.placeholder = "0"; 
            input.value = ""; 
            input.dataset.row = i;
            input.dataset.col = j;

            input.addEventListener("blur", function () {
                if (this.value === "") {
                    this.placeholder = "0";
                }
            });

            cell.appendChild(input);
            row.appendChild(cell);
        }

        table.appendChild(row);
    }

    const firstInput = document.querySelector(".matrix-input");
    if (firstInput) {
        firstInput.focus();
    }
}

// Стрелочки?
function setupKeyboardNavigation() {
    const table = document.getElementById("matrix-table");

    table.addEventListener("keydown", function (e) {
        if (
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
            handleArrowNavigation(e);
        }
    });
}
function handleArrowNavigation(e) {
    e.preventDefault();
    const currentInput = e.target;
    if (!currentInput.classList.contains("matrix-input")) return;

    const row = parseInt(currentInput.dataset.row);
    const col = parseInt(currentInput.dataset.col);
    const size = document.querySelectorAll("#matrix-table tr").length;
    let nextRow = row,
        nextCol = col;

    switch (e.key) {
        case "ArrowUp":
            nextRow = Math.max(0, row - 1);
            break;
        case "ArrowDown":
            nextRow = Math.min(size - 1, row + 1);
            break;
        case "ArrowLeft":
            nextCol = Math.max(0, col - 1);
            break;
        case "ArrowRight":
            nextCol = Math.min(size - 1, col + 1);
            break;
    }

    const nextInput = document.querySelector(
        `.matrix-input[data-row="${nextRow}"][data-col="${nextCol}"]`
    );

    if (nextInput) {
        nextInput.focus();
        nextInput.select();
    }
}

// Обновлялка размера
function updateMatrixSize() {
    const newSize = parseInt(document.getElementById("matrix-size").value);
    createMatrix(newSize);
}

// Отправлялка
async function submitMatrix() {
    try {
        const matrixData = getMatrixData();
        const matrix = matrixData.matrix;
        console.log("Проверка matrix:", matrix);
        console.log("JSON:", JSON.stringify({ matrix }));

        const response = await fetch(
            "https://mmimio.onrender.com/solve-assignment",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matrix }),
            }
        );

        if (!response.ok) {
            // Обработка 422 и других ошибок
            let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMsg += ` - ${JSON.stringify(errorData.detail || errorData)}`;
            } catch {
                const text = await response.text();
                errorMsg += ` - ${text}`;
            }
            throw new Error(errorMsg);
        }

        const result = await response.json();
        displayResult(result.result);
        
    } catch (error) {
        console.error("Ошибка:", error);
        const outputDiv = document.getElementById("output");
        outputDiv.innerHTML = `<div class="error">${error.message}</div>`;
    }
}



function renderStep(step, index) {
    const stepCard = document.createElement('div');
    stepCard.className = 'step-card';

    const title = `<h4>Шаг ${index + 1} — нижняя граница: ${step.bound}</h4>`;
    const matrixHTML = renderStepMatrix(
        step.matrix,
        step.remaining_rows,
        step.remaining_cols,
        step.choice 
    );

    stepCard.innerHTML = title + matrixHTML;
    return stepCard;
}



//  функция для отображения матрицы шага
function renderStepMatrix(matrix, remaining_rows, remaining_cols, choice) {
    if (!matrix || matrix.length === 0) return '';
    
    let fullMatrix = [];
    for (let i = 0; i < remaining_rows.length; i++) {
        fullMatrix[i] = [];
        for (let j = 0; j < remaining_cols.length; j++) {
            fullMatrix[i][j] = matrix[i][j];
        }
    }
    
    let tableHTML = '<table class="step-matrix">';
    fullMatrix.forEach((row, i) => {
        tableHTML += '<tr>';
        row.forEach((cell, j) => {
            let isChosen = false;
            if (choice && remaining_rows[i] === choice[0] && remaining_cols[j] === choice[1]) {
                isChosen = true;
            }
            const cellClass = isChosen ? 'chosen' : '';
            tableHTML += `<td class="${cellClass}">${cell === null ? '∞' : cell}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</table>';
    return tableHTML;
}




function formatAssignments(assignments) {
    if (!assignments || assignments.length === 0) return 'нет';
    return assignments.map(a => `(${a[0] + 1},${a[1] + 1})`).join(', ');
}



function displayResult(result) {
    const outputDiv = document.getElementById("output");
    
    const assignmentsHTML = result.assignments.map(a => `
        <div class="assignment-item">
            <span class="worker">Работник ${a.worker}</span>
            <span class="arrow">→</span>
            <span class="task">Задача ${a.job}</span>
        </div>
    `).join('');

    let stepsHTML = '<div class="steps-container"><h3>Шаги решения:</h3>';
    result.steps.forEach((step, index) => {
        stepsHTML += `
        <div class="step-card">
            <h4>Шаг ${index + 1}</h4>
            <p><strong>Текущие назначения:</strong> ${formatAssignments(step.assigned)}</p>
            <p><strong>Нижняя граница:</strong> ${step.bound}</p>
            ${step.choice ? `<p><strong>Выбранный ноль:</strong> (${step.choice[0] + 1}, ${step.choice[1] + 1})</p>` : ''}
            ${step.matrix ? `
                <div class="matrix-wrapper">${
                    renderStepMatrix(
                        step.matrix, 
                        step.remaining_rows, 
                        step.remaining_cols, 
                        step.choice
                    )
                }</div>
            ` : ''}
        </div>`;
    });
    stepsHTML += '</div>';

    outputDiv.innerHTML = `
        <div class="result-section">
            <h3>Оптимальное назначение:</h3>
            <div class="assignments-list">
                ${assignmentsHTML}
            </div>
            <div class="total-cost">
                Общие затраты: <strong>${result.total_cost}</strong>
            </div>
        </div>
        ${stepsHTML}
    `;
}

// данные матрицы
function getMatrixData() {
    const size = document.querySelectorAll("#matrix-table tr").length;
    const matrix = [];

    for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j < size; j++) {
            const input = document.querySelector(
                `.matrix-input[data-row="${i}"][data-col="${j}"]`
            );
            // Явное преобразование в число
            const value = input.value.trim();
            matrix[i][j] = value === "" ? 0 : Number(value);
            
            // Проверка на NaN
            if (isNaN(matrix[i][j])) {
                throw new Error(`Некорректное значение в строке ${i+1}, столбце ${j+1}: "${input.value}"`);
            }
        }
    }

    return { matrix };
}
