class Node:
    """Класс задачи. Храним частичное решение и его информацию

    """
    def __init__(self, matrix, assigned, bound, path_cost):
        self.matrix = matrix #текущая, приведенная матрица
        self.assigned = assigned #список включенных в решение пар работрик - работа
        self.bound = bound #нижняя оценка стоимости, path_cost + цена после приведения
        self.path_cost = path_cost #суммарная стоимость включенных в ответ пар

# --------------------------

def privedeniye_matrix(matrix):
    """Приведение матрицы. принимаем матрицу, и вычетаем минимальные элементы из строк и столбцов, 
    так же возвращаем нижнюю оценку стоимости решения."""
    n = len(matrix)
    prived = [row[:] for row in matrix]
    row_mins = []

    for i in range(n):
        min_val = min(prived[i])
        if min_val == float('inf'):
            row_mins.append(0)
        else:
            row_mins.append(min_val)
            if min_val > 0:
                for j in range(n):
                    if prived[i][j] != float('inf'):
                        prived[i][j] -= min_val
    col_mins = []

    for j in range(n):
        column = [prived[i][j] for i in range(n)]
        min_val = min(column)
        if min_val == float('inf'):
            col_mins.append(0)
        else:
            col_mins.append(min_val)
            if min_val > 0:
                for i in range(n):
                    if prived[i][j] != float('inf'):
                        prived[i][j] -= min_val
    total = sum(row_mins) + sum(col_mins)
    return prived, total

# matrix = [[3, 0, 4, 1],
#           [3, 4, 2, 4],
#           [3, 2, 2, 4],
#           [3, 4, 2, 4]]

# print(privedeniye_matrix(matrix))

# --------------------------

def calculate_teta(matrix, i, j):
    """Вычислет оценку. передается претендент а возвращается его оценка"""
    n = len(matrix)
    row = [matrix[i][col] for col in range(n) if col != j]
    col = [matrix[row][j] for row in range(n) if row != i]
    min_row = min(row) if row else 0
    min_col = min(col) if col else 0
    return min_row + min_col

# --------------------------


def method_vetvei_i_granic(original_matrix):

    n = len(original_matrix)

    initial_prived, initial_cost = privedeniye_matrix(original_matrix)     # приведение матрицы и её оценка

    nodes = [Node(initial_prived, [], initial_cost, 0)]


    best_cost = float('inf')
    best_assign = []


    #цикл пока очередь есть, извлекаем current с наименьшим bound 
    while nodes:


        # Выбираем узел с минимальным bound
        current = min(nodes, key=lambda node: node.bound)
        nodes.remove(current)

        if current.bound >= best_cost: #если выполняеться, то ветвь уже не может улучшить найденное решение и переходим к следующему узлу
            continue

        if len(current.assigned) == n - 1:   # если назначены все, кроме одного работника, завершаем решение
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


        zeros = [(i, j) for i in range(n) for j in range(n) #составляяем список адрессов где получили 0 после приведения
                 if current.matrix[i][j] == 0]
        if not zeros:
            continue


        # Вычисляем тету для каждого нуля и выбираем клетку с максимальной 
        theta_vals = []
        for (i, j) in zeros:
            theta_vals.append((calculate_teta(current.matrix, i, j), i, j))
        _, i, j = max(theta_vals, key=lambda x: x[0])


        # =============
        
        # Ветка - включаем пару. назначаем пару и приводим матрицу
        new_assigned = current.assigned + [(i, j)]
        new_path_cost = current.path_cost + original_matrix[i][j]
        include_matrix = [row[:] for row in current.matrix]

        # Запрещаем всю строку и столбец 
        for k in range(n):
            include_matrix[i][k] = float('inf')
            include_matrix[k][j] = float('inf')
        include_matrix[i][j] = float('inf')

        prived_inc, cost_inc = privedeniye_matrix(include_matrix)
        inc_bound = new_path_cost + cost_inc
        if inc_bound < best_cost:                       #приводим матрицу и смотрим ее оценку, если она меньше, то помещаем в очередь
            nodes.append(Node(prived_inc, new_assigned, inc_bound, new_path_cost))


        # ===============

        # Ветка исключаем пару. помечаем клетку как недоступную и приводим
        exclude_matrix = [row[:] for row in current.matrix]
        exclude_matrix[i][j] = float('inf')
        prived_exc, cost_exc = privedeniye_matrix(exclude_matrix)
        exc_bound = current.path_cost + cost_exc

        if exc_bound < best_cost: #приводим матрицу, смотрим оценку, если меньше, помещай в очередь, если больше, отбрасываем эту ветвь
            nodes.append(Node(prived_exc, list(current.assigned), exc_bound, current.path_cost))




    # Сортируем назначения по номеру работника
    best_assign.sort(key=lambda x: x[0])


    return {
        "assignments": [{"worker": i+1, "job": j+1} for i, j in best_assign],
        "total_cost": best_cost
    }


# # Проверка:

a = [[1, 3, 5],
     [2, 1, 7], 
     [4, 5, 2]]
print(method_vetvei_i_granic(a))