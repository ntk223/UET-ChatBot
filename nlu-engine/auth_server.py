from sanic import Sanic
from sanic.response import json
from sanic_cors import CORS
import sys
import os

# Add actions to path so we can import db_helper
sys.path.append(os.path.join(os.path.dirname(__file__), "actions"))
from db_helper import register_user_db, login_user_db, get_candidate_aspirations, verify_candidate_profile

app = Sanic("AuthServer")
CORS(app)

@app.post("/api/register")
async def register(request):
    data = request.json
    email = data.get("email")
    fullname = data.get("fullname")
    password = data.get("password")
    if not email or not fullname or not password:
        return json({"status": "error", "message": "Thiếu thông tin đăng ký (email, họ tên, mật khẩu)"}, status=400)
    
    success = register_user_db(email, fullname, password)
    if success:
        user = login_user_db(email, password)
        if user:
            return json({
                "status": "success",
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "fullname": user["fullname"]
                }
            })
    return json({"status": "error", "message": "Email đã tồn tại hoặc đăng ký thất bại"}, status=400)

@app.post("/api/login")
async def login(request):
    data = request.json
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return json({"status": "error", "message": "Thiếu email hoặc mật khẩu"}, status=400)
    
    user = login_user_db(email, password)
    if user:
        aspirations = get_candidate_aspirations(email)
        return json({
            "status": "success",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "fullname": user["fullname"]
            },
            "aspirations": aspirations
        })
    else:
        return json({"status": "error", "message": "Email hoặc mật khẩu không chính xác"}, status=401)

@app.post("/api/verify")
async def verify(request):
    data = request.json
    candidate_id = data.get("candidate_id")
    if not candidate_id:
        return json({"status": "error", "message": "Thiếu mã hồ sơ"}, status=400)
    
    try:
        db_id = int(str(candidate_id).replace("UET-", "").strip())
    except ValueError:
        return json({"status": "error", "message": "Mã hồ sơ không hợp lệ"}, status=400)
        
    success = verify_candidate_profile(db_id)
    if success:
        return json({"status": "success"})
    else:
        return json({"status": "error", "message": "Xác minh thất bại"}, status=500)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5006)
