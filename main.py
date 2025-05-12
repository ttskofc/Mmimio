from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from methodVetvei import branch_and_bound
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/solve-assignment")
async def solve_assignment(data: dict):
    try:
        matrix = data.get("matrix")
        
        # if not matrix:
        #     raise HTTPException(status_code=400, detail="Matrix is required")
            
        # if not all(len(row) == len(matrix) for row in matrix):
        #     raise HTTPException(status_code=400, detail="Matrix must be square")
            
        result = branch_and_bound(matrix)
        return {"status": "success", "result": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
