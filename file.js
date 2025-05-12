// TransportTask class solves the transportation problem using
// the Minimum Cost (least element) method for initial solution
// and the Potential (MODI) method for optimization.
class TransportTask {
    constructor(A, B, C) {
        // A: array of supply (length m)
        // B: array of demand (length n)
        // C: cost matrix (m x n array of arrays)
        this.A = A.slice(); // copy of supply
        this.B = B.slice(); // copy of demand
        this.C = C.map((row) => row.slice()); // copy of cost matrix

        // Dimensions
        this.m = this.A.length;
        this.n = this.B.length;

        // Solution matrix X (m x n) initialized to -1 (no shipment)
        this.X = Array.from({ length: this.m }, () => Array(this.n).fill(-1));

        // Check if balanced (sum of supply equals sum of demand)
        const totalSupply = this.A.reduce((s, v) => s + v, 0);
        const totalDemand = this.B.reduce((s, v) => s + v, 0);
        this.solvable = totalSupply === totalDemand;
        if (!this.solvable) {
            console.error(
                "Supply and demand do not balance. Problem is unsolvable."
            );
        }
    }

    // Finds an initial feasible solution using the Minimum Cost (least element) method.
    minElementMethod() {
        if (!this.solvable) {
            return;
        }

        // Working copies of supplies and demands
        let Arem = this.A.slice();
        let Brem = this.B.slice();

        // Copy of cost matrix to mark used rows/columns (use Infinity)
        let tempo = this.C.map((row) => row.slice());

        // Assign shipments until all supplies/demands are exhausted
        while (true) {
            // Find the minimum cost cell in tempo
            let minVal = Infinity;
            let minI = -1,
                minJ = -1;
            for (let i = 0; i < this.m; i++) {
                for (let j = 0; j < this.n; j++) {
                    if (tempo[i][j] < minVal) {
                        minVal = tempo[i][j];
                        minI = i;
                        minJ = j;
                    }
                }
            }
            // If no finite cost remains, we are done
            if (minVal === Infinity) break;

            // Assign as much as possible to cell (minI, minJ)
            if (Arem[minI] > Brem[minJ]) {
                // Demand is smaller, fill the demand
                this.X[minI][minJ] = Brem[minJ];
                Arem[minI] -= Brem[minJ];
                Brem[minJ] = 0;
                // Mark this column as done
                for (let i = 0; i < this.m; i++) {
                    tempo[i][minJ] = Infinity;
                }
            } else {
                // Supply is smaller or equal, fill the supply
                this.X[minI][minJ] = Arem[minI];
                Brem[minJ] -= Arem[minI];
                Arem[minI] = 0;
                // Mark this row as done
                for (let j = 0; j < this.n; j++) {
                    tempo[minI][j] = Infinity;
                }
            }
        }
        // At this point, X contains the initial shipments (>=0) and -1 for empty.
    }

    // Optimizes the current solution using the Potential (MODI) method.
    potentialMethod() {
        if (!this.solvable) {
            return;
        }

        // Repeat until optimal solution is found
        while (true) {
            // 1. Compute potentials u (for rows) and v (for columns)
            let u = Array(this.m).fill(null);
            let v = Array(this.n).fill(null);
            u[0] = 0; // Fix one potential (e.g., u[0] = 0)

            // Collect basic variables (cells with X >= 0)
            let basicCells = [];
            for (let i = 0; i < this.m; i++) {
                for (let j = 0; j < this.n; j++) {
                    if (this.X[i][j] >= 0) {
                        basicCells.push([i, j]);
                    }
                }
            }

            // Solve u[i] + v[j] = C[i][j] for basic cells
            let changed;
            do {
                changed = false;
                for (const [i, j] of basicCells) {
                    if (u[i] !== null && v[j] === null) {
                        v[j] = this.C[i][j] - u[i];
                        changed = true;
                    }
                    if (u[i] === null && v[j] !== null) {
                        u[i] = this.C[i][j] - v[j];
                        changed = true;
                    }
                }
            } while (changed);

            // 2. Compute reduced costs for all cells: r[i][j] = C[i][j] - (u[i] + v[j])
            let minRate = Infinity;
            let enterCell = [-1, -1];
            for (let i = 0; i < this.m; i++) {
                for (let j = 0; j < this.n; j++) {
                    // Use 0 for any undetermined potential (should not happen if basis is connected)
                    let ui = u[i] !== null ? u[i] : 0;
                    let vj = v[j] !== null ? v[j] : 0;
                    let costDiff = this.C[i][j] - (ui + vj);
                    if (costDiff < minRate) {
                        minRate = costDiff;
                        enterCell = [i, j];
                    }
                }
            }

            // If all reduced costs are non-negative, the solution is optimal
            if (minRate >= 0) {
                // Replace remaining -1 with 0 for the final plan
                for (let i = 0; i < this.m; i++) {
                    for (let j = 0; j < this.n; j++) {
                        if (this.X[i][j] < 0) {
                            this.X[i][j] = 0;
                        }
                    }
                }
                break;
            }

            // 3. There is a negative reduced cost: find a loop and adjust flows
            const [ei, ej] = enterCell;
            // Copy current solution to build a cycle
            let cycle = this.X.map((row) => row.slice());
            cycle[ei][ej] = 0; // include the entering cell in the cycle

            // Remove any cell from the cycle that cannot be part of a closed loop
            let removed;
            do {
                removed = false;
                for (const [i, j] of basicCells) {
                    // Count how many non -1 entries are in row i and column j of cycle
                    let rowCount = cycle[i].filter((v) => v !== -1).length;
                    let colCount = cycle
                        .map((row) => row[j])
                        .filter((v) => v !== -1).length;
                    if (
                        (rowCount === 1 || colCount === 1) &&
                        cycle[i][j] !== -1
                    ) {
                        cycle[i][j] = -1;
                        removed = true;
                    }
                }
            } while (removed);

            // 4. Mark a loop of plus/minus signs in the remaining cycle positions
            let sign = Array.from({ length: this.m }, () =>
                Array(this.n).fill(-1)
            );
            sign[ei][ej] = 0; // entering cell is a plus (marked 0 => plus)
            // Make a working copy to traverse the loop
            let tempo = cycle.map((row) => row.slice());
            // Increase all non -1 values (so we can use argmax logic)
            for (let i = 0; i < this.m; i++) {
                for (let j = 0; j < this.n; j++) {
                    if (tempo[i][j] !== -1) tempo[i][j] += 2;
                }
            }
            tempo[ei][ej] = -1; // mark starting cell as visited
            let current = [ei, ej];

            // Loop through the cycle, alternating row/column moves
            let countCells = 0;
            for (let i = 0; i < this.m; i++) {
                for (let j = 0; j < this.n; j++) {
                    if (cycle[i][j] !== -1) countCells++;
                }
            }
            // There are countCells cells in cycle; we need countCells - 1 moves (we started at one)
            for (let k = 0; k < countCells - 1; k++) {
                const [ci, cj] = current;
                if (k % 2 === 0) {
                    // Move horizontally (same row), pick the remaining largest entry
                    let maxVal = -Infinity,
                        nextJ = -1;
                    for (let col = 0; col < this.n; col++) {
                        if (tempo[ci][col] > maxVal) {
                            maxVal = tempo[ci][col];
                            nextJ = col;
                        }
                    }
                    sign[ci][nextJ] = 1; // mark minus
                    current = [ci, nextJ];
                } else {
                    // Move vertically (same column)
                    let maxVal = -Infinity,
                        nextI = -1;
                    for (let row = 0; row < this.m; row++) {
                        if (tempo[row][cj] > maxVal) {
                            maxVal = tempo[row][cj];
                            nextI = row;
                        }
                    }
                    sign[nextI][cj] = 0; // mark plus
                    current = [nextI, cj];
                }
                tempo[current[0]][current[1]] = -1; // mark visited
            }

            // 5. Find the smallest shipment in the minus-marked positions
            let minFlow = Infinity;
            let leaveCell = null;
            for (let i = 0; i < this.m; i++) {
                for (let j = 0; j < this.n; j++) {
                    if (sign[i][j] === 1 && cycle[i][j] !== -1) {
                        if (cycle[i][j] < minFlow) {
                            minFlow = cycle[i][j];
                            leaveCell = [i, j];
                        }
                    }
                }
            }
            if (leaveCell === null) {
                console.error("Failed to find leaving cell in cycle.");
                break;
            }
            const [li, lj] = leaveCell;

            // 6. Adjust the flows along the loop: plus positions += minFlow, minus positions -= minFlow
            for (let i = 0; i < this.m; i++) {
                for (let j = 0; j < this.n; j++) {
                    if (cycle[i][j] !== -1) {
                        if (sign[i][j] === 0) {
                            this.X[i][j] += minFlow;
                        } else if (sign[i][j] === 1) {
                            this.X[i][j] -= minFlow;
                        }
                    }
                }
            }
            // Remove the leaving cell from the basis (it becomes -1)
            this.X[li][lj] = -1;
            // Repeat optimization with the updated plan
        }
    }

    // (Optional) Compute the total transportation cost of current plan
    getCost() {
        let total = 0;
        for (let i = 0; i < this.m; i++) {
            for (let j = 0; j < this.n; j++) {
                total += this.X[i][j] * this.C[i][j];
            }
        }
        return total;
    }
}

// Example usage:

let A = [18, 9, 13, 30];
let B = [8, 24, 8, 23, 7];
let C = [
    [10, 15, 13, 9, 18],
    [7, 12, 13, 5, 12],
    [8, 9, 9, 5, 6],
    [1, 8, 7, 8, 6],
];

let task = new TransportTask(A, B, C);
task.minElementMethod();
task.potentialMethod();
console.log("Optimal shipping plan X:");
console.table(task.X);
console.log("Minimum cost =", task.getCost());
