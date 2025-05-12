import heapq

class Node:
    def __init__(self, matrix, assigned, bound, path_cost, n):
        self.matrix = matrix
        self.assigned = assigned
        self.bound = bound
        self.path_cost = path_cost
        self.n = n
    def __lt__(self, other):
        return self.bound < other.bound


def reduce_matrix(matrix): 
    """Редукция матрицы. принимаем матрицу, и вычетаем минимальные элементы из строк и столбцов, 
    так же возвращаем нижнюю оценку стоимости решения."""
    n = len(matrix)
    reduced = [row[:] for row in matrix]
    row_mins = []
    for i in range(n):
        row = reduced[i]
        min_val = min(row)
        if min_val == float('inf'):
            row_mins.append(0)
        else:
            row_mins.append(min_val)
            if min_val > 0:
                for j in range(n):
                    if reduced[i][j] != float('inf'):
                        reduced[i][j] -= min_val

    col_mins = []
    for j in range(n):
        col_vals = [reduced[i][j] for i in range(n)]
        min_val = min(col_vals)
        if min_val == float('inf'):
            col_mins.append(0)
        else:
            col_mins.append(min_val)
            if min_val > 0:

                for i in range(n):
                    if reduced[i][j] != float('inf'):
                        reduced[i][j] -= min_val
    total = sum(row_mins) + sum(col_mins)
    return reduced, total


# ----------------------------------------


def calculate_teta(matrix, i, j):
    """Вычислет оценку. передается претендент и возвращается его оценка"""
    n = len(matrix)
    row = [matrix[i][col] for col in range(n) if col != j]
    col_vals = [matrix[row][j] for row in range(n) if row != i]
    return (min(row) if row else 0) + (min(col_vals) if col_vals else 0)



def branch_and_bound(original_matrix):
    n = len(original_matrix)
    initial_reduced, initial_cost = reduce_matrix(original_matrix)
    heap = []
    heapq.heappush(heap, Node(initial_reduced, [], initial_cost, 0, n))
    best_cost = float('inf')
    best_assign = []
    while heap:

        current = heapq.heappop(heap)
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
            continue

        zeros = [(i, j) for i in range(n) for j in range(n) if current.matrix[i][j] == 0]
        if not zeros:
            continue
        teta_vals = []

        for (i, j) in zeros:
            teta_vals.append((calculate_teta(current.matrix, i, j), i, j))
        _, i, j = max(teta_vals, key=lambda x: x[0])
        # Ветвь "включить (i,j)"
        new_assigned = current.assigned + [(i, j)]
        new_path_cost = current.path_cost + original_matrix[i][j]
        include_matrix = [row[:] for row in current.matrix]
        for k in range(n):
            include_matrix[i][k] = float('inf')
            include_matrix[k][j] = float('inf')

        include_matrix[i][j] = float('inf')
        reduced_inc, cost_inc = reduce_matrix(include_matrix)
        inc_bound = new_path_cost + cost_inc

        if inc_bound < best_cost:
            heapq.heappush(heap, Node(reduced_inc, new_assigned, inc_bound, new_path_cost, n))
        # Ветвь "исключить (i,j)"
        exclude_matrix = [row[:] for row in current.matrix]
        exclude_matrix[i][j] = float('inf')
        reduced_exc, cost_exc = reduce_matrix(exclude_matrix)
        exc_bound = current.path_cost + cost_exc
        if exc_bound < best_cost:

            heapq.heappush(heap, Node(reduced_exc, list(current.assigned), exc_bound, current.path_cost, n))
    best_assign.sort(key=lambda x: x[0])
    return {
        "assignments": [{"worker": i+1, "task": j+1} for i, j in best_assign],
        "total_cost": best_cost
    }


