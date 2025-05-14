import requests

url = "https://mmimio.onrender.com/solve-assignment"

data = {
    "matrix": [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
    ]
}

response = requests.post(url, json=data)
print(response.json())
