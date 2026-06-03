"""
validate_forms.py
=================
Validate đầu vào của người dùng cho 4 form xét tuyển UET.
Sử dụng FormValidationAction — Rasa sẽ tự gọi validate_<slot> trước
khi lưu slot. Nếu trả về None → giữ slot chưa điền → Rasa hỏi lại.
"""

import re
from typing import Any, Text, Dict, Optional
from rasa_sdk import Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.forms import FormValidationAction
from rasa_sdk.types import DomainDict


# ─────────────────────────────────────────────
#  Helper validators (dùng chung cho mọi form)
# ─────────────────────────────────────────────

VALID_MAJOR_CODES = {
    "CN1", "CN2", "CN3", "CN4", "CN5", "CN6", "CN7", "CN8", "CN9",
    "CN10", "CN11", "CN12", "CN13", "CN14", "CN15", "CN17", "CN18",
    "CN19", "CN20", "CN21",
}

VALID_THPTQG_BLOCKS = {"A00", "A01", "A02", "D01", "D07", "X06"}


def _validate_fullname(value: Optional[str], dispatcher: CollectingDispatcher) -> Optional[str]:
    """Họ tên: ít nhất 2 từ, chỉ chứa chữ cái tiếng Việt và dấu cách."""
    if not value:
        return None
    cleaned = value.strip()
    # Ít nhất 2 từ, không chứa số hoặc ký tự đặc biệt (ngoài dấu tiếng Việt)
    if len(cleaned.split()) < 2:
        dispatcher.utter_message(
            text="⚠️ Họ và tên phải có ít nhất 2 từ (họ và tên). "
                 "Ví dụ: **Nguyễn Văn An**. Vui lòng nhập lại:"
        )
        return None
    if re.search(r"[0-9@#$%^&*()_+=\[\]{};':\"\\|,.<>/?]", cleaned):
        dispatcher.utter_message(
            text="⚠️ Họ và tên không được chứa số hoặc ký tự đặc biệt. "
                 "Vui lòng nhập lại:"
        )
        return None
    return cleaned


def _validate_phone_number(value: Optional[str], dispatcher: CollectingDispatcher) -> Optional[str]:
    """Số điện thoại Việt Nam: 10 chữ số, bắt đầu bằng 0."""
    if not value:
        return None
    digits = re.sub(r"\s|-|\.", "", value.strip())
    if not re.fullmatch(r"0[0-9]{9}", digits):
        dispatcher.utter_message(
            text="⚠️ Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại "
                 "Việt Nam gồm **10 chữ số**, bắt đầu bằng **0**. "
                 "Ví dụ: **0912345678**"
        )
        return None
    return digits


def _validate_chosen_major(value: Optional[str], dispatcher: CollectingDispatcher) -> Optional[str]:
    """Ngành học: phải là mã CN hoặc tên ngành có trong danh sách."""
    if not value:
        return None
    cleaned = value.strip()
    # Kiểm tra nếu user nhập mã ngành trực tiếp
    upper = cleaned.upper()
    if upper in VALID_MAJOR_CODES:
        return cleaned
    # Nếu chuỗi quá ngắn hoặc chỉ có số thì không hợp lệ
    if len(cleaned) < 3 or cleaned.isdigit():
        dispatcher.utter_message(
            text="⚠️ Ngành học không hợp lệ. Vui lòng nhập **mã ngành** (VD: CN1, CN8, CN12) "
                 "hoặc **tên ngành đầy đủ** (VD: Khoa học máy tính, Trí tuệ nhân tạo)."
        )
        return None
    # Nếu dạng CN<số> nhưng không hợp lệ
    if re.fullmatch(r"(?i)cn\d+", cleaned) and upper not in VALID_MAJOR_CODES:
        dispatcher.utter_message(
            text=f"⚠️ Mã ngành **{cleaned.upper()}** không tồn tại trong danh mục UET. "
                 f"Các mã hợp lệ: CN1–CN21 (không có CN16). Vui lòng nhập lại:"
        )
        return None
    return cleaned


def _validate_evidence_url(value: Optional[str], dispatcher: CollectingDispatcher) -> Optional[str]:
    """URL minh chứng: phải bắt đầu bằng http:// hoặc https://."""
    if not value:
        return None
    cleaned = value.strip()
    if not re.match(r"https?://", cleaned, re.IGNORECASE):
        dispatcher.utter_message(
            text="⚠️ Đường link minh chứng không hợp lệ. Vui lòng dán **URL đầy đủ** "
                 "bắt đầu bằng **https://** hoặc **http://**.\n"
                 "Ví dụ: `https://drive.google.com/file/your_file`"
        )
        return None
    return cleaned


# ═══════════════════════════════════════════════════════════════
#  VALIDATE FORM: HSA
# ═══════════════════════════════════════════════════════════════

class ValidateHsaForm(FormValidationAction):
    def name(self) -> Text:
        return "validate_hsa_form"

    def validate_fullname(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_fullname(slot_value, dispatcher)
        return {"fullname": result}

    def validate_phone_number(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_phone_number(slot_value, dispatcher)
        return {"phone_number": result}

    def validate_chosen_major(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_chosen_major(slot_value, dispatcher)
        return {"chosen_major": result}

    def validate_hsa_id(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Mã số HSA: dạng HSA-XXXXX (tối thiểu 5 ký tự sau dấu gạch)."""
        if not slot_value:
            return {"hsa_id": None}
        cleaned = slot_value.strip().upper()
        if not re.fullmatch(r"HSA-[A-Z0-9]{5,}", cleaned):
            dispatcher.utter_message(
                text="⚠️ Mã số báo danh HSA không hợp lệ. "
                     "Định dạng đúng là **HSA-XXXXX** (VD: HSA-12345, HSA-A1B2C). "
                     "Vui lòng nhập lại:"
            )
            return {"hsa_id": None}
        return {"hsa_id": cleaned}

    def validate_hsa_score(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Điểm HSA: số nguyên hoặc thực, từ 0 đến 150."""
        if not slot_value:
            return {"hsa_score": None}
        # Trích số từ chuỗi (người dùng có thể nhập "95 điểm" hoặc "95")
        numbers = re.findall(r"\d+(?:\.\d+)?", str(slot_value))
        if not numbers:
            dispatcher.utter_message(
                text="⚠️ Điểm HSA không hợp lệ. Vui lòng nhập **số điểm** trong khoảng **0 – 150**. "
                     "Ví dụ: **105** hoặc **98.5**"
            )
            return {"hsa_score": None}
        score = float(numbers[0])
        if not (0 <= score <= 150):
            dispatcher.utter_message(
                text=f"⚠️ Điểm HSA **{score}** nằm ngoài khoảng hợp lệ (0 – 150). "
                     f"Vui lòng nhập lại:"
            )
            return {"hsa_score": None}
        return {"hsa_score": str(score)}

    def validate_evidence_url(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_evidence_url(slot_value, dispatcher)
        return {"evidence_url": result}


# ═══════════════════════════════════════════════════════════════
#  VALIDATE FORM: IELTS
# ═══════════════════════════════════════════════════════════════

class ValidateIeltsForm(FormValidationAction):
    def name(self) -> Text:
        return "validate_ielts_form"

    def validate_fullname(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_fullname(slot_value, dispatcher)
        return {"fullname": result}

    def validate_phone_number(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_phone_number(slot_value, dispatcher)
        return {"phone_number": result}

    def validate_chosen_major(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_chosen_major(slot_value, dispatcher)
        return {"chosen_major": result}

    def validate_ielts_score(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Điểm IELTS: từ 0.0 đến 9.0, bước 0.5."""
        if not slot_value:
            return {"ielts_score": None}
        numbers = re.findall(r"\d+(?:[.,]\d+)?", str(slot_value))
        if not numbers:
            dispatcher.utter_message(
                text="⚠️ Điểm IELTS không hợp lệ. Vui lòng nhập điểm từ **0.0 đến 9.0** "
                     "(bước 0.5). Ví dụ: **6.5** hoặc **7.0**"
            )
            return {"ielts_score": None}
        score = float(numbers[0].replace(",", "."))
        # Chấp nhận bước 0.5
        valid_scores = [round(x * 0.5, 1) for x in range(0, 19)]  # 0.0 đến 9.0
        if score not in valid_scores:
            dispatcher.utter_message(
                text=f"⚠️ Điểm IELTS **{score}** không hợp lệ. "
                     f"IELTS chỉ có các mức: 0.0, 0.5, 1.0, ..., 9.0. "
                     f"Vui lòng nhập lại (ví dụ: **6.5**, **7.0**):"
            )
            return {"ielts_score": None}
        if score < 5.5:
            dispatcher.utter_message(
                text=f"⚠️ Điểm IELTS **{score}** thấp hơn mức tối thiểu để xét tuyển UET (**5.5**). "
                     f"Vui lòng nhập lại nếu bạn có điểm từ 5.5 trở lên, hoặc chọn phương thức xét tuyển khác."
            )
            return {"ielts_score": None}
        return {"ielts_score": str(score)}

    def validate_math_score(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Điểm toán kết hợp: từ 0 đến 10."""
        if not slot_value:
            return {"math_score": None}
        numbers = re.findall(r"\d+(?:[.,]\d+)?", str(slot_value))
        if not numbers:
            dispatcher.utter_message(
                text="⚠️ Điểm môn Toán không hợp lệ. Vui lòng nhập điểm từ **0 đến 10**. "
                     "Ví dụ: **8.5**"
            )
            return {"math_score": None}
        score = float(numbers[0].replace(",", "."))
        if not (0 <= score <= 10):
            dispatcher.utter_message(
                text=f"⚠️ Điểm môn Toán **{score}** nằm ngoài thang điểm 10. Vui lòng nhập lại:"
            )
            return {"math_score": None}
        return {"math_score": str(score)}

    def validate_evidence_url(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_evidence_url(slot_value, dispatcher)
        return {"evidence_url": result}


# ═══════════════════════════════════════════════════════════════
#  VALIDATE FORM: TUYỂN THẲNG (direct)
# ═══════════════════════════════════════════════════════════════

class ValidateDirectForm(FormValidationAction):
    def name(self) -> Text:
        return "validate_direct_form"

    def validate_fullname(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_fullname(slot_value, dispatcher)
        return {"fullname": result}

    def validate_phone_number(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_phone_number(slot_value, dispatcher)
        return {"phone_number": result}

    def validate_chosen_major(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_chosen_major(slot_value, dispatcher)
        return {"chosen_major": result}

    def validate_award_name(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Tên giải thưởng: ít nhất 5 ký tự, phải đề cập đến 'giải' hoặc 'olympic' hoặc 'huy chương'."""
        if not slot_value:
            return {"award_name": None}
        cleaned = slot_value.strip()
        if len(cleaned) < 5:
            dispatcher.utter_message(
                text="⚠️ Tên giải thưởng quá ngắn. Vui lòng ghi rõ tên giải thưởng đầy đủ. "
                     "Ví dụ: **Giải Nhất Tin học Quốc gia**, **Huy chương Vàng Olympic Vật lý**."
            )
            return {"award_name": None}
        keywords = ["giải", "olympic", "huy chương", "prize", "award", "hsg", "học sinh giỏi"]
        lower = cleaned.lower()
        if not any(kw in lower for kw in keywords):
            dispatcher.utter_message(
                text="⚠️ Tên giải thưởng chưa rõ ràng. Vui lòng ghi rõ loại giải và cấp độ. "
                     "Ví dụ: **Giải Ba Vật lý Quốc gia**, **Huy chương Vàng Olympic Tin học Quốc tế**."
            )
            return {"award_name": None}
        return {"award_name": cleaned}

    def validate_evidence_url(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_evidence_url(slot_value, dispatcher)
        return {"evidence_url": result}


# ═══════════════════════════════════════════════════════════════
#  VALIDATE FORM: THPTQG
# ═══════════════════════════════════════════════════════════════

class ValidateThptqgForm(FormValidationAction):
    def name(self) -> Text:
        return "validate_thptqg_form"

    def validate_fullname(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_fullname(slot_value, dispatcher)
        return {"fullname": result}

    def validate_phone_number(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_phone_number(slot_value, dispatcher)
        return {"phone_number": result}

    def validate_chosen_major(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_chosen_major(slot_value, dispatcher)
        return {"chosen_major": result}

    def validate_thptqg_block(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Tổ hợp xét tuyển: A00, A01, A02, D01, D07, X06."""
        if not slot_value:
            return {"thptqg_block": None}
        cleaned = slot_value.strip().upper()
        if cleaned not in VALID_THPTQG_BLOCKS:
            dispatcher.utter_message(
                text=f"⚠️ Tổ hợp **{cleaned}** không hợp lệ hoặc UET không sử dụng tổ hợp này. "
                     f"Các tổ hợp hợp lệ của UET: **A00, A01, A02, D01, D07, X06**. "
                     f"Vui lòng chọn lại:"
            )
            return {"thptqg_block": None}
        return {"thptqg_block": cleaned}

    def validate_thptqg_score(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Điểm thi THPTQG: tổng 3 môn, thang điểm 30, tối thiểu 15."""
        if not slot_value:
            return {"thptqg_score": None}
        numbers = re.findall(r"\d+(?:[.,]\d+)?", str(slot_value))
        if not numbers:
            dispatcher.utter_message(
                text="⚠️ Điểm thi THPTQG không hợp lệ. Nhập tổng điểm **3 môn** theo thang **30**. "
                     "Ví dụ: **27.5**"
            )
            return {"thptqg_score": None}
        score = float(numbers[0].replace(",", "."))
        if not (0 <= score <= 30):
            dispatcher.utter_message(
                text=f"⚠️ Tổng điểm **{score}** nằm ngoài thang điểm 30. "
                     f"Vui lòng nhập tổng điểm 3 môn trong khoảng **0 – 30**:"
            )
            return {"thptqg_score": None}
        if score < 15:
            dispatcher.utter_message(
                text=f"⚠️ Tổng điểm **{score}** thấp hơn ngưỡng xét tuyển tối thiểu của UET (**15 điểm**). "
                     f"Nếu đây là điểm đúng, bạn có thể không đủ điều kiện. "
                     f"Bạn muốn tiếp tục hay chọn phương thức khác?"
            )
            # Vẫn chấp nhận nhưng cảnh báo (không reset slot)
        return {"thptqg_score": str(score)}

    def validate_evidence_url(
        self, slot_value: Any, dispatcher: CollectingDispatcher,
        tracker: Tracker, domain: DomainDict,
    ) -> Dict[Text, Any]:
        result = _validate_evidence_url(slot_value, dispatcher)
        return {"evidence_url": result}
