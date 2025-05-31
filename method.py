class Node:
    def __init__(self, matrix, assigned, bound, path_cost, trace, remaining_rows=None, remaining_cols=None):
        self.matrix = matrix
        self.assigned = assigned
        self.bound = bound
        self.path_cost = path_cost
        self.trace = trace
        self.remaining_rows = remaining_rows if remaining_rows is not None else []
        self.remaining_cols = remaining_cols if remaining_cols is not None else []


def privedeniye_matrix(matrix):
    n = len(matrix)
    prived = [row[:] for row in matrix]
    row_mins = []

    for i in range(n):
        min_val = min(prived[i])
        min_val = min_val if min_val != float('inf') else 0
        row_mins.append(min_val)
        for j in range(n):
            if prived[i][j] != float('inf'):
                prived[i][j] -= min_val

    col_mins = []
    for j in range(n):
        column = [prived[i][j] for i in range(n)]
        min_val = min(column)
        min_val = min_val if min_val != float('inf') else 0
        col_mins.append(min_val)
        for i in range(n):
            if prived[i][j] != float('inf'):
                prived[i][j] -= min_val

    total = sum(row_mins) + sum(col_mins)
    return prived, total


def calculate_teta(matrix, i, j):
    n = len(matrix)
    row = [matrix[i][col] for col in range(n) if col != j]
    col = [matrix[row][j] for row in range(n) if row != i]
    min_row = min(row) if row else 0
    min_col = min(col) if col else 0
    return min_row + min_col


def remove_inf_row_col(matrix, row_idx, col_idx):
    # Корректное удаление строки и столбца
    return [
        [matrix[i][j] for j in range(len(matrix[i])) if j != col_idx
        ] for i in range(len(matrix)) if i != row_idx
    ]

def replace_inf(matrix):
    return [
        [None if x == float('inf') else x for x in row]
        for row in matrix
    ]

def filter_null_rows_cols(matrix):
    # Удаляем строки, полностью состоящие из None
    filtered_rows = []
    for i in range(len(matrix)):
        if any(cell is not None for cell in matrix[i]):
            filtered_rows.append(matrix[i])
    
    # Удаляем столбцы, полностью состоящие из None
    if not filtered_rows:
        return [], [], []
    
    filtered_cols = []
    for j in range(len(filtered_rows[0])):
        if any(filtered_rows[i][j] is not None for i in range(len(filtered_rows))):
            filtered_cols.append(j)
    
    result = []
    for row in filtered_rows:
        result.append([row[j] for j in filtered_cols])
    
    return result



def method_vetvei_i_granic(original_matrix):
    n = len(original_matrix)
    initial_prived, initial_cost = privedeniye_matrix(original_matrix)
    root_trace = [{
        "assigned": [],
        "matrix": [row[:] for row in initial_prived],
        "bound": initial_cost,
        "choice": None,
        "remaining_rows": list(range(n)),
        "remaining_cols": list(range(n))
    }]
    
    # Инициализируем корневой узел с remaining_rows и remaining_cols
    nodes = [Node(
        initial_prived, 
        [], 
        initial_cost, 
        0, 
        root_trace,
        remaining_rows=list(range(n)),
        remaining_cols=list(range(n))
    )]

    best_cost = float('inf')
    best_assign = []
    best_trace = []

    while nodes:
        current = min(nodes, key=lambda node: node.bound)
        nodes.remove(current)

        if current.bound >= best_cost:
            continue

        if len(current.assigned) == n - 1:
            remaining_rows = [r for r in range(n) if r not in [a[0] for a in current.assigned]]
            remaining_cols = [c for c in range(n) if c not in [a[1] for a in current.assigned]]
            if remaining_rows and remaining_cols:
                i0 = remaining_rows[0]
                j0 = remaining_cols[0]
                final_cost = current.path_cost + original_matrix[i0][j0]
                if final_cost < best_cost:
                    best_cost = final_cost
                    best_assign = current.assigned + [(i0, j0)]
                    best_trace = current.trace + [{
                        "assigned": best_assign[:],
                        "matrix": None,
                        "bound": final_cost,
                        "choice": (i0, j0),
                        "remaining_rows": remaining_rows,
                        "remaining_cols": remaining_cols
                    }]
            continue

        zeros = [(i, j) for i in range(n) for j in range(n) if current.matrix[i][j] == 0]
        if not zeros:
            continue

        theta_vals = [(calculate_teta(current.matrix, i, j), i, j) for i, j in zeros]
        _, i, j = max(theta_vals, key=lambda x: x[0])

        # Ветка включения
        new_assigned = current.assigned + [(i, j)]
        new_path_cost = current.path_cost + original_matrix[i][j]
        include_matrix = [row[:] for row in current.matrix]
        for k in range(n):
            include_matrix[i][k] = float('inf')
            include_matrix[k][j] = float('inf')
        include_matrix[i][j] = float('inf')

        prived_inc, cost_inc = privedeniye_matrix(include_matrix)
        inc_bound = new_path_cost + cost_inc

        if inc_bound < best_cost:
            # Обновляем оставшиеся строки/столбцы
            new_remaining_rows = [r for r in current.remaining_rows if r != i]
            new_remaining_cols = [c for c in current.remaining_cols if c != j]
            
            trimmed_matrix = remove_inf_row_col(prived_inc, i, j)
            trace_step = {
                "assigned": new_assigned[:],
                "matrix": trimmed_matrix,
                "bound": inc_bound,
                "choice": (i, j),
                "remaining_rows": new_remaining_rows,
                "remaining_cols": new_remaining_cols
            }
            nodes.append(Node(
                prived_inc, 
                new_assigned, 
                inc_bound, 
                new_path_cost, 
                current.trace + [trace_step],
                remaining_rows=new_remaining_rows,
                remaining_cols=new_remaining_cols
            ))

        # Ветка исключения
        exclude_matrix = [row[:] for row in current.matrix]
        exclude_matrix[i][j] = float('inf')
        prived_exc, cost_exc = privedeniye_matrix(exclude_matrix)
        exc_bound = current.path_cost + cost_exc

        if exc_bound < best_cost:
            # При исключении строки/столбцы не меняются
            nodes.append(Node(
                prived_exc, 
                list(current.assigned), 
                exc_bound, 
                current.path_cost, 
                list(current.trace),
                remaining_rows=current.remaining_rows,
                remaining_cols=current.remaining_cols
            ))

    for step in best_trace:
        if step["matrix"] is not None:
            step["matrix"] = replace_inf(step["matrix"])
    
    best_assign.sort(key=lambda x: x[0])
    return {
        "assignments": [{"worker": i + 1, "job": j + 1} for i, j in best_assign],
        "total_cost": best_cost,
        "steps": best_trace
    }