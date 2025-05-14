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
            input.value = "";
            input.placeholder = "0";
            input.dataset.row = i;
            input.dataset.col = j;
            cell.appendChild(input);
            row.appendChild(cell);
        }

        input.addEventListener("blur", function () {
            if (this.value === "") {
                this.placeholder = "0";
            }
        });

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
    const matrixData = getMatrixData();
    const matrix = matrixData.matrix;

    try {
        const response = await fetch(
            "https://mmimio.onrender.com/solve-assignment",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ matrix }),
            }
        );

        // alert(JSON.stringify( matrix ))
        const result = await response.json();

        if (result.status === "success") {
            displayResult(result.result);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("Ошибка:", error);
        const outputDiv = document.getElementById("output");
        outputDiv.innerHTML = `
            <div class="error-message">
                Ошибка: ${error.message}
            </div>
        `;
    }
}

function displayResult(result) {
    const outputDiv = document.getElementById("output");

    const assignmentsHTML = result.assignments
        .map(
            (a) => `
        <div class="assignment-item">
            <span class="worker">Работник ${a.worker}</span>
            <span class="arrow">→</span>
            <span class="task">Задача ${a.job}</span>
        </div>
    `
        )
        .join("");

    outputDiv.innerHTML = `
        <h3>Результат: </h3>
        <div class="result-card">
            <div class="assignments-list">
                ${assignmentsHTML}
            </div>
            <div class="total-cost">
                Общие затраты: <strong>${result.total_cost}</strong>
            </div>
        </div>
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
            matrix[i][j] = parseFloat(input.value) || 0;
        }
    }

    return {
        matrix: matrix,
    };
}
