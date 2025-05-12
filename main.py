from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from methodVetvei import method_vetvei_i_granic
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
async def solve_assignment(data: dict = Body(...)):
    try:
        matrix = data.get("matrix")
        
        result = method_vetvei_i_granic(matrix)
        return {"status": "success", "result": result}
        
    except Exception as e:
        print("Ошибка на сервере:", str(e)) 
        raise HTTPException(status_code=500, detail=str(e))
# uvicorn main:app --reload --host 0.0.0.0 --port 8000
