from typing import Dict, List, Optional, Text

import re
import unicodedata


def normalize_text(value: Optional[Text]) -> Text:
    if value is None:
        return ""

    normalized = unicodedata.normalize("NFD", str(value).strip())
    normalized = "".join(
        char for char in normalized if unicodedata.category(char) != "Mn"
    )
    normalized = re.sub(r"[^a-zA-Z0-9\s]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def build_score_buttons() -> List[Dict[Text, Text]]:
    return [
        {"title": "Xem học phí 💸", "payload": "/ask_tuition"},
        {"title": "Đánh giá phù hợp 🎯", "payload": "/confirm_suitable"},
        {"title": "Về trang chủ 🏠", "payload": "/restart"}
    ]


def build_curriculum_buttons() -> List[Dict[Text, Text]]:
    return [
        {"title": "Cơ hội việc làm 💼", "payload": "/ask_career"},
        {"title": "Học tiếp lên cao 🎓", "payload": "/ask_higher_edu"},
        {"title": "Bắt đầu lại 🏠", "payload": "/restart"}
    ]


def build_general_buttons() -> List[Dict[Text, Text]]:
    return [
        {"title": "Tư vấn tuyển sinh 📝", "payload": "/ask_admission"},
        {"title": "Tìm hiểu ngành học 📚", "payload": "/inform_major"},
        {"title": "Xem thông tin UET 🏫", "payload": "/uet_info"}
    ]


def build_major_buttons() -> List[Dict[Text, Text]]:
    return [
        {"title": "Công nghệ thông tin 💻", "payload": '/inform_major{"major": "CN1"}'},
        {"title": "Khoa học máy tính 🤖", "payload": '/inform_major{"major": "CN8"}'},
        {"title": "Trí tuệ nhân tạo 🧠", "payload": '/inform_major{"major": "CN12"}'},
        {"title": "Khoa học dữ liệu 📊", "payload": '/inform_major{"major": "CN20"}'},
        {"title": "Kỹ thuật Máy tính 🔌", "payload": '/inform_major{"major": "CN2"}'},
    ]

