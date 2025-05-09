// matrix.js

document.addEventListener('DOMContentLoaded', function() {
    const initialSize = 5;
    createMatrix(initialSize);
    setupKeyboardNavigation();
    
    document.getElementById('update-size').addEventListener('click', updateMatrixSize);
    document.getElementById('submit-matrix').addEventListener('click', submitMatrix);
    document.getElementById('matrix-size').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            updateMatrixSize();
        }
    });
});

// Создание матрицы
function createMatrix(size) {
    const table = document.getElementById('matrix-table');
    table.innerHTML = '';
    
    for (let i = 0; i < size; i++) {
        const row = document.createElement('tr');
        
        for (let j = 0; j < size; j++) {
            const cell = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'matrix-input';
            input.value = '0';
            input.dataset.row = i;
            input.dataset.col = j;
            cell.appendChild(input);
            row.appendChild(cell);
        }
        
        table.appendChild(row);
    }
    
    const firstInput = document.querySelector('.matrix-input');
    if (firstInput) {
        firstInput.focus();
    }
}


// Стрелочки?
function setupKeyboardNavigation() {
    const table = document.getElementById('matrix-table');
    
    table.addEventListener('keydown', function(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            handleArrowNavigation(e);
        }
    });
}
function handleArrowNavigation(e) {
    e.preventDefault();
    const currentInput = e.target;
    if (!currentInput.classList.contains('matrix-input')) return;
    
    const row = parseInt(currentInput.dataset.row);
    const col = parseInt(currentInput.dataset.col);
    const size = document.querySelectorAll('#matrix-table tr').length;
    let nextRow = row, nextCol = col;
    
    switch(e.key) {
        case 'ArrowUp':
            nextRow = Math.max(0, row - 1);
            break;
        case 'ArrowDown':
            nextRow = Math.min(size - 1, row + 1);
            break;
        case 'ArrowLeft':
            nextCol = Math.max(0, col - 1);
            break;
        case 'ArrowRight':
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
    const newSize = parseInt(document.getElementById('matrix-size').value);
    createMatrix(newSize);

}

// Отправлялка
function submitMatrix() {
    const matrix = getMatrixData();
    console.log('Матрица для Python:', matrix);
    
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '<h3>Результат:</h3>' + 
                         '<pre>' + JSON.stringify(matrix, null, 2) + '</pre>';
}

// данные матрицы
function getMatrixData() {
    const size = document.querySelectorAll('#matrix-table tr').length;
    const matrix = [];
    
    for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j < size; j++) {
            const input = document.querySelector(`.matrix-input[data-row="${i}"][data-col="${j}"]`);
            matrix[i][j] = parseFloat(input.value) || 0;
        }
    }
    
    return {
        size: size,
        matrix: matrix
    };
}