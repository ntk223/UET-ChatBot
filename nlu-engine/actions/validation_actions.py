import re
from typing import Any, Dict, List, Text

from rasa_sdk import FormValidationAction, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.types import DomainDict

from .common import normalize_text
from .repository import REPO


def match_major(major_name: str) -> str:
    if not major_name:
        return None
    norm = normalize_text(major_name).lower()
    major = REPO.find_major_by_name_or_code(norm)
    if major:
        return major["code"]
    
    # Fallback mappings for common names/synonyms
    if any(x in norm for x in ["cn8", "khoa hoc may tinh", "khmt", "may tinh"]):
        return "CN8"
    if any(x in norm for x in ["cn1", "cong nghe thong tin", "cntt", "thong tin"]):
        return "CN1"
    if any(x in norm for x in ["cn12", "tri tue", "ai"]):
        return "CN12"
    if any(x in norm for x in ["cn11", "tu dong hoa", "tdh"]):
        return "CN11"
    if any(x in norm for x in ["cn20", "khoa hoc du lieu", "khdl"]):
        return "CN20"
    return None


def get_major_buttons() -> List[Dict[Text, Text]]:
    return [
        {"title": "Công nghệ thông tin (CN1) 💻", "payload": "Công nghệ thông tin"},
        {"title": "Khoa học máy tính (CN8) 🤖", "payload": "Khoa học máy tính"},
        {"title": "Trí tuệ nhân tạo (CN12) 🧠", "payload": "Trí tuệ nhân tạo"},
        {"title": "Khoa học dữ liệu (CN20) 📊", "payload": "Khoa học dữ liệu"},
        {"title": "Kỹ thuật Máy tính (CN2) 🔌", "payload": "Kỹ thuật Máy tính"},
    ]


class ValidateHocbaAdmissionForm(FormValidationAction):
    def name(self) -> Text:
        return "validate_hocba_admission_form"

    def validate_selected_major(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate selected_major."""
        code = match_major(str(slot_value))
        if code:
            return {"selected_major": code}

        dispatcher.utter_message(
            text=f"Hiện tại mình chưa tìm thấy thông tin cho ngành '{slot_value}'. Vui lòng chọn một trong các ngành của UET dưới đây hoặc nhập lại đúng tên ngành:",
            buttons=get_major_buttons()
        )
        return {"selected_major": None}

    def validate_selected_block(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate selected_block."""
        cleaned = str(slot_value).strip().upper()
        # Basic validation for standard Vietnamese admission blocks (e.g., A00, A01, D01, D07, X06)
        if re.match(r"^[A-Z]\d{2}$", cleaned):
            return {"selected_block": cleaned}

        dispatcher.utter_message(
            text=f"Tổ hợp môn/Khối xét tuyển '{slot_value}' không đúng định dạng (Ví dụ đúng: A00, A01, D01, D07, X06). Vui lòng chọn khối hoặc nhập lại:",
            buttons=[
                {"title": "A00 (Toán, Lý, Hóa) 📝", "payload": "A00"},
                {"title": "A01 (Toán, Lý, Anh) 📝", "payload": "A01"},
                {"title": "D01 (Toán, Văn, Anh) 📝", "payload": "D01"},
                {"title": "D07 (Toán, Hóa, Anh) 📝", "payload": "D07"},
            ]
        )
        return {"selected_block": None}

    def validate_gpa_score(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate gpa_score."""
        try:
            score = float(slot_value)
        except (ValueError, TypeError):
            dispatcher.utter_message(
                text=f"Điểm số '{slot_value}' không hợp lệ. Vui lòng nhập một số thập phân (ví dụ: 8.5 hoặc 25.5):"
            )
            return {"gpa_score": None}

        # Check valid ranges: [0.0, 10.0] or [10.0, 30.0]
        if score < 0.0 or score > 30.0:
            dispatcher.utter_message(
                text="Điểm trung bình học bạ phải nằm trong khoảng từ 0.0 đến 10.0 (thang 10) hoặc từ 10.0 đến 30.0 (thang 30). Vui lòng nhập lại:"
            )
            return {"gpa_score": None}

        return {"gpa_score": score}


class ValidateCombinedAdmissionForm(FormValidationAction):
    def name(self) -> Text:
        return "validate_combined_admission_form"

    def validate_selected_major(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate selected_major."""
        code = match_major(str(slot_value))
        if code:
            return {"selected_major": code}

        dispatcher.utter_message(
            text=f"Hiện tại mình chưa tìm thấy thông tin cho ngành '{slot_value}'. Vui lòng chọn một trong các ngành của UET dưới đây hoặc nhập lại đúng tên ngành:",
            buttons=get_major_buttons()
        )
        return {"selected_major": None}

    def validate_ielts_score(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate ielts_score."""
        try:
            score = float(slot_value)
        except (ValueError, TypeError):
            dispatcher.utter_message(
                text=f"Điểm IELTS '{slot_value}' không hợp lệ. Vui lòng nhập điểm IELTS hợp lệ (ví dụ: 6.5):"
            )
            return {"ielts_score": None}

        # Check range [0.0, 9.0] and multiple of 0.5
        if score < 0.0 or score > 9.0:
            dispatcher.utter_message(
                text="Điểm IELTS phải nằm trong khoảng từ 0.0 đến 9.0. Vui lòng nhập lại:"
            )
            return {"ielts_score": None}

        # Check multiple of 0.5
        if (score * 2) % 1 != 0:
            dispatcher.utter_message(
                text="Điểm IELTS phải là bội số của 0.5 (ví dụ: 5.5, 6.0, 6.5). Vui lòng nhập lại:"
            )
            return {"ielts_score": None}

        return {"ielts_score": score}

    def validate_gpa_score(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate gpa_score."""
        try:
            score = float(slot_value)
        except (ValueError, TypeError):
            dispatcher.utter_message(
                text=f"Điểm số '{slot_value}' không hợp lệ. Vui lòng nhập một số thập phân (ví dụ: 8.5 hoặc 25.5):"
            )
            return {"gpa_score": None}

        if score < 0.0 or score > 30.0:
            dispatcher.utter_message(
                text="Điểm trung bình học bạ phải nằm trong khoảng từ 0.0 đến 10.0 (thang 10) hoặc từ 10.0 đến 30.0 (thang 30). Vui lòng nhập lại:"
            )
            return {"gpa_score": None}

        return {"gpa_score": score}


class ValidatePersonalInfoForm(FormValidationAction):
    def name(self) -> Text:
        return "validate_personal_info_form"

    def validate_candidate_phone(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate candidate_phone."""
        cleaned = re.sub(r"\s+", "", str(slot_value))
        # Match standard Vietnamese phone formats (10 digits, starts with 0)
        if re.match(r"^0\d{9}$", cleaned):
            return {"candidate_phone": cleaned}

        dispatcher.utter_message(
            text=f"Số điện thoại '{slot_value}' không hợp lệ. Vui lòng nhập lại số điện thoại gồm 10 chữ số bắt đầu bằng số 0 (ví dụ: 0912345678):"
        )
        return {"candidate_phone": None}

    def validate_candidate_email(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate candidate_email."""
        cleaned = str(slot_value).strip()
        # Basic email check regex
        if re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", cleaned):
            return {"candidate_email": cleaned}

        dispatcher.utter_message(
            text=f"Địa chỉ email '{slot_value}' không hợp lệ. Vui lòng nhập lại đúng định dạng email (ví dụ: candidate@gmail.com):"
        )
        return {"candidate_email": None}
