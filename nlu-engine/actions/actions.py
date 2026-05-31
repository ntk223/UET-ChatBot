from typing import Any, Dict, List, Text

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

from .admission_actions import ActionCheckSuitability, ActionFetchScore
from .tuition_actions import ActionFetchTuition
from .common import normalize_text, build_general_buttons
from .repository import REPO

# Hardcoded fallback for IELTS Score conversion
IELTS_CONVERSION_FALLBACK = {
    5.5: 8.00,
    6.0: 8.50,
    6.5: 9.00,
    7.0: 9.50,
    7.5: 10.00,
    8.0: 10.00,
    8.5: 10.00,
    9.0: 10.00
}


def get_matched_major_key(major_name: str) -> str:
    """Chuẩn hóa dữ liệu đầu vào tự do khớp với mã ngành nội bộ bằng cách truy vấn DB."""
    if not major_name:
        return "CN1"
    
    norm = normalize_text(major_name).lower()
    
    # Try finding in the database first
    major = REPO.find_major_by_name_or_code(norm)
    if major:
        return major["code"]
        
    # Standard fallback patterns
    if any(x in norm for x in ["cn8", "khoa hoc may tinh", "khmt", "may tinh"]):
        return "CN8"
    if any(x in norm for x in ["cn1", "cong nghe thong tin", "cntt", "thong tin"]):
        return "CN1"
    if any(x in norm for x in ["cn12", "tri tue", "ai"]):
        return "CN12"
    if any(x in norm for x in ["cn11", "tu dong hoa", "tđh"]):
        return "CN11"
    if any(x in norm for x in ["cn20", "khoa hoc du lieu", "khdl"]):
        return "CN20"
        
    return "CN1"


def get_ielts_converted_score(ielts_val: float) -> float:
    """Quy đổi điểm IELTS sang hệ 10 dựa trên CSDL hoặc fallback."""
    try:
        # Query certificate_conversion from Postgres
        with REPO._connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT converted_score FROM certificate_conversion WHERE cert_type = 'IELTS' AND original_score <= %s ORDER BY original_score DESC LIMIT 1",
                    [ielts_val]
                )
                row = cursor.fetchone()
                if row:
                    return float(row[0])
    except Exception as exc:
        print(f"[get_ielts_converted_score] DB error, using fallback: {exc}")
        
    # Fallback to hardcoded table
    matched_key = 5.5
    for k in sorted(IELTS_CONVERSION_FALLBACK.keys()):
        if ielts_val >= k:
            matched_key = k
    return IELTS_CONVERSION_FALLBACK.get(matched_key, 8.0)


class ActionExplainMajorAndCTA(Action):
    def name(self) -> Text:
        return "action_explain_major_and_cta"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        # Retrieve major from slots or entities
        major_value = tracker.get_slot("selected_major") or tracker.get_slot("major")

        if not major_value:
            for ent in tracker.latest_message.get("entities", []):
                if ent.get("entity") == "major":
                    major_value = ent.get("value")
                    break

        if not major_value:
            dispatcher.utter_message(
                text="UET hiện đang đào tạo các ngành Công nghệ thông tin (CN1), Khoa học máy tính (CN8) và nhiều ngành khác. Bạn muốn tìm hiểu ngành nào?"
            )
            return []

        key = get_matched_major_key(str(major_value))
        major_details = REPO.get_major_details_by_code(key)

        if not major_details:
            dispatcher.utter_message(
                text=f"Hiện tại mình chưa tìm thấy thông tin chi tiết cho ngành '{major_value}'."
            )
            return []

        name = major_details["name"]
        intro = major_details["introduction"] or "Đang cập nhật giới thiệu..."
        duration = f"{major_details['duration']:.1f} năm" if major_details["duration"] else "4 năm"
        fee = f"{major_details['tuition_fee']:.2f} triệu VNĐ/năm" if major_details["tuition_fee"] else "Đang cập nhật"

        message = (
            f"Ngành {name} ({key}):\n"
            f"- Mô tả: {intro}\n"
            f"- Thời gian đào tạo: {duration}\n"
            f"- Học phí dự kiến: {fee}\n\n"
            f"Bạn có muốn kiểm tra thử cơ hội trúng tuyển vào ngành này không?"
        )

        buttons = [
            {"title": "Xét học bạ THPT 📝", "payload": "/xet_hocba"},
            {"title": "Xét kết hợp IELTS 🇬🇧", "payload": "/xet_ket_hop"},
            {"title": "Tìm hiểu chi tiết ngành 🔍", "payload": "/ask_detailed_major"},
            {"title": "Không, cảm ơn ❌", "payload": "/deny"}
        ]

        dispatcher.utter_message(text=message, buttons=buttons)

        # Set slot selected_major to key to preserve context
        return [SlotSet("selected_major", key)]


class ActionProvideDetailedMajorInfo(Action):
    def name(self) -> Text:
        return "action_provide_detailed_major_info"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        major_value = tracker.get_slot("selected_major") or tracker.get_slot("major")

        if not major_value:
            for ent in tracker.latest_message.get("entities", []):
                if ent.get("entity") == "major":
                    major_value = ent.get("value")
                    break

        key = get_matched_major_key(str(major_value))
        major_details = REPO.get_major_details_by_code(key)

        if not major_details:
            dispatcher.utter_message(
                text=f"Hiện tại mình chưa tìm thấy thông tin chi tiết cho ngành '{major_value}'."
            )
            return []

        name = major_details["name"]
        careers = major_details["orientation"] or "Cơ hội việc làm rộng mở sau khi tốt nghiệp tại các tập đoàn công nghệ lớn."
        curriculum = major_details["curriculum_summary"] or "Đang cập nhật khung chương trình đào tạo..."

        message = (
            f"📚 **THÔNG TIN CHI TIẾT NGÀNH {name.upper()} ({key})**\n\n"
            f"💼 **Định hướng nghề nghiệp:**\n"
            f"{careers}\n\n"
            f"📖 **Khung chương trình đào tạo:**\n"
            f"{curriculum}\n\n"
            f"Bạn có muốn thử đánh giá cơ hội xét tuyển của mình vào ngành này không?"
        )

        buttons = [
            {"title": "Xét học bạ THPT 📝", "payload": "/xet_hocba"},
            {"title": "Xét kết hợp IELTS 🇬🇧", "payload": "/xet_ket_hop"},
            {"title": "Bắt đầu lại cuộc trò chuyện 🔄", "payload": "/restart"}
        ]

        dispatcher.utter_message(text=message, buttons=buttons)
        return [SlotSet("selected_major", key)]


class ActionEvalHocbaAdmission(Action):
    def name(self) -> Text:
        return "action_eval_hocba_admission"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        major_val = tracker.get_slot("selected_major")
        block_val = tracker.get_slot("selected_block")
        gpa_val = tracker.get_slot("gpa_score")
        file_val = tracker.get_slot("transcript_file")

        if not major_val or not block_val or gpa_val is None:
            dispatcher.utter_message(
                text="Thiếu thông tin để thực hiện đánh giá học bạ. Vui lòng thực hiện lại."
            )
            return []

        key = get_matched_major_key(str(major_val))
        major_details = REPO.get_major_details_by_code(key)
        
        if not major_details:
            dispatcher.utter_message(
                text=f"Hiện tại mình chưa tìm thấy thông tin chi tiết cho ngành '{major_val}'."
            )
            return []
            
        major_name = major_details["name"]
        block = str(block_val).strip().upper()

        # Parse GPA score
        try:
            score = float(gpa_val)
        except (ValueError, TypeError):
            dispatcher.utter_message(text="Điểm số nhập vào không hợp lệ. Vui lòng nhập lại số thập phân.")
            return []

        # Standardize score scale (10 to 30)
        is_converted = False
        original_score = score
        if score <= 10.0:
            score = score * 3.0
            is_converted = True

        # Query benchmarks dynamically
        scores = REPO.get_latest_scores_for_major(major_details["id"])
        
        benchmark = 24.00  # default fallback
        for s in scores:
            if s["method_name"] == "THPTQG" and s["year"] == 2025:
                # check if subject_groups contains block
                if block in [g.strip().upper() for g in s["subject_groups"].split(",")]:
                    benchmark = float(s["score"])
                    break
                else:
                    benchmark = float(s["score"])

        if is_converted:
            dispatcher.utter_message(
                text=f"Hệ thống tự động quy đổi điểm trung bình học bạ {original_score:.2f}/10 sang thang điểm 30 là {score:.2f}."
            )

        if score >= benchmark:
            msg = (
                f"🎉 Chúc mừng bạn! Với mức điểm xét tuyển học bạ đạt {score:.2f}, bạn có cơ hội ĐỖ rất cao vào ngành {major_name} "
                f"(điểm chuẩn năm ngoái tổ hợp {block} là {benchmark:.2f}).\n"
                f"📂 Tệp tin học bạ đã tải lên: {file_val}\n\n"
                f"Để nhận tư vấn trực tiếp từ phòng tuyển sinh và hoàn tất hồ sơ chính thức, bạn có muốn đăng ký thông tin cá nhân ngay không?"
            )
        elif score >= benchmark - 1.0:
            msg = (
                f"⚖️ Cơ hội ở mức SÁT NÚT! Điểm học bạ của bạn ({score:.2f}) đang tiệm cận sát điểm chuẩn dự kiến ngành {major_name} "
                f"({benchmark:.2f} cho tổ hợp {block}).\n"
                f"📂 Tệp tin học bạ đã tải lên: {file_val}\n\n"
                f"Lời khuyên: Bạn nên đăng ký thông tin cá nhân dưới đây để nhận hướng dẫn nộp hồ sơ xét tuyển sớm đợt bổ sung hoặc gợi ý ngành gần."
            )
        else:
            msg = (
                f"📉 Điểm xét tuyển học bạ của bạn ({score:.2f}) thấp hơn điểm chuẩn dự kiến ngành {major_name} "
                f"({benchmark:.2f} cho tổ hợp {block}).\n"
                f"📂 Tệp tin học bạ đã tải lên: {file_val}\n\n"
                f"Lời khuyên: Bạn có thể đăng ký thông tin cá nhân dưới đây để được tư vấn lộ trình ôn thi tốt nghiệp THPTQG xét tuyển vào trường."
            )

        buttons = [
            {"title": "Đăng ký thông tin 📝", "payload": "/affirm"},
            {"title": "Để sau đi ❌", "payload": "/deny"}
        ]

        dispatcher.utter_message(text=msg, buttons=buttons)
        return []


class ActionEvalCombinedAdmission(Action):
    def name(self) -> Text:
        return "action_eval_combined_admission"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        major_val = tracker.get_slot("selected_major")
        ielts_val = tracker.get_slot("ielts_score")
        gpa_val = tracker.get_slot("gpa_score")
        ielts_file = tracker.get_slot("ielts_file")
        transcript_file = tracker.get_slot("transcript_file")

        if not major_val or ielts_val is None or gpa_val is None:
            dispatcher.utter_message(
                text="Thiếu thông tin để thực hiện đánh giá xét tuyển kết hợp. Vui lòng thực hiện lại."
            )
            return []

        key = get_matched_major_key(str(major_val))
        major_details = REPO.get_major_details_by_code(key)
        
        if not major_details:
            dispatcher.utter_message(
                text=f"Hiện tại mình chưa tìm thấy thông tin chi tiết cho ngành '{major_val}'."
            )
            return []
            
        major_name = major_details["name"]

        try:
            ielts = float(ielts_val)
            gpa = float(gpa_val)
        except (ValueError, TypeError):
            dispatcher.utter_message(text="Điểm số nhập vào không hợp lệ. Vui lòng thử lại.")
            return []

        # Convert GPA to 10-point scale if entered on 30-point scale
        if gpa > 10.0:
            gpa = gpa / 3.0

        if ielts < 5.5:
            dispatcher.utter_message(
                text=(
                    f"Cảnh báo: Điểm IELTS {ielts:.1f} của bạn dưới mức yêu cầu tối thiểu (5.5) "
                    f"để xét tuyển kết hợp của UET.\n"
                    f"Hệ thống sẽ tạm tính điểm quy đổi quy chuẩn tối thiểu 8.0."
                )
            )
            converted_ielts = 8.0
        else:
            converted_ielts = get_ielts_converted_score(ielts)

        # Formula: Converted IELTS + GPA of 2 other subjects * 2 (GPA * 2)
        total_score = converted_ielts + gpa * 2
        
        # Query combined benchmark score from database
        scores = REPO.get_latest_scores_for_major(major_details["id"])
        benchmark = 25.00  # default fallback
        for s in scores:
            if s["method_name"] == "Combined":
                benchmark = float(s["score"])
                break

        dispatcher.utter_message(
            text=(
                f"📊 **KẾT QUẢ ĐÁNH GIÁ SƠ BỘ:**\n"
                f"- Điểm IELTS: {ielts:.1f} (Quy đổi sang hệ 10: {converted_ielts:.2f})\n"
                f"- Điểm trung bình học bạ: {gpa:.2f}/10 (Nhân hệ số 2: {gpa * 2:.2f})\n"
                f"- **Tổng điểm xét tuyển của bạn:** {total_score:.2f} / 30.00\n"
                f"- Điểm chuẩn xét tuyển kết hợp dự kiến: {benchmark:.2f}\n"
                f"- Tệp chứng chỉ IELTS: {ielts_file}\n"
                f"- Tệp học bạ: {transcript_file}\n"
            )
        )

        if total_score >= benchmark:
            msg = (
                f"🎉 Tuyệt vời! Bạn có cơ hội trúng tuyển xét kết hợp RẤT CAO vào ngành {major_name}.\n"
                f"Bạn có muốn đăng ký thông tin cá nhân ngay để Ban tuyển sinh hướng dẫn chuẩn bị hồ sơ gốc không?"
            )
        elif total_score >= benchmark - 1.0:
            msg = (
                f"⚖️ Cơ hội ở mức SÁT NÚT! Bạn đang tiệm cận sát điểm chuẩn dự kiến ngành {major_name}.\n"
                f"Để nhận hướng dẫn tối ưu hồ sơ, bạn có muốn đăng ký thông tin cá nhân ngay không?"
            )
        else:
            msg = (
                f"📉 Điểm xét tuyển kết hợp của bạn hiện thấp hơn điểm chuẩn dự kiến ngành {major_name}.\n"
                f"Lời khuyên: Bạn nên cân nhắc đổi sang xét tuyển bằng điểm học bạ thông thường hoặc điểm thi THPTQG.\n"
                f"Bạn có muốn đăng ký thông tin cá nhân để cán bộ tuyển sinh tư vấn định hướng ngành phù hợp hơn không?"
            )

        buttons = [
            {"title": "Đăng ký thông tin 📝", "payload": "/affirm"},
            {"title": "Để sau đi ❌", "payload": "/deny"}
        ]

        dispatcher.utter_message(text=msg, buttons=buttons)
        return []


class ActionSaveCandidateInfo(Action):
    def name(self) -> Text:
        return "action_save_candidate_info"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        name = tracker.get_slot("candidate_name")
        phone = tracker.get_slot("candidate_phone")
        email = tracker.get_slot("candidate_email")
        major = tracker.get_slot("selected_major")
        block = tracker.get_slot("selected_block")
        gpa = tracker.get_slot("gpa_score")
        ielts = tracker.get_slot("ielts_score")
        t_file = tracker.get_slot("transcript_file")
        i_file = tracker.get_slot("ielts_file")

        key = get_matched_major_key(major)
        major_details = REPO.get_major_details_by_code(key)
        major_name = major_details["name"] if major_details else "Đang cập nhật"

        # Determine evaluation result for database storage
        evaluation_result = "Pass"
        if ielts and major_details:
            try:
                ielts_val = float(ielts)
                gpa_val = float(gpa)
                if gpa_val > 10.0:
                    gpa_val = gpa_val / 3.0
                converted_ielts = get_ielts_converted_score(ielts_val)
                total = converted_ielts + gpa_val * 2
                
                # Combined benchmark from DB
                scores = REPO.get_latest_scores_for_major(major_details["id"])
                benchmark = 25.00  # default fallback
                for s in scores:
                    if s["method_name"] == "Combined":
                        benchmark = float(s["score"])
                        break
                        
                if total >= benchmark:
                    evaluation_result = "Pass"
                elif total >= benchmark - 1.0:
                    evaluation_result = "Borderline"
                else:
                    evaluation_result = "Fail"
            except Exception:
                evaluation_result = "Undetermined"
        elif major_details:
            try:
                gpa_val = float(gpa)
                if gpa_val <= 10.0:
                    gpa_val = gpa_val * 3.0
                
                scores = REPO.get_latest_scores_for_major(major_details["id"])
                block_clean = str(block).strip().upper() if block else "default"
                benchmark = 24.00  # default fallback
                for s in scores:
                    if s["method_name"] == "THPTQG" and s["year"] == 2025:
                        if block_clean in [g.strip().upper() for g in s["subject_groups"].split(",")]:
                            benchmark = float(s["score"])
                            break
                        else:
                            benchmark = float(s["score"])
                            
                if gpa_val >= benchmark:
                    evaluation_result = "Pass"
                elif gpa_val >= benchmark - 1.0:
                    evaluation_result = "Borderline"
                else:
                    evaluation_result = "Fail"
            except Exception:
                evaluation_result = "Undetermined"
        else:
            evaluation_result = "Undetermined"

        # Insert lead into database
        REPO.create_candidate_lead(
            name=str(name),
            phone=str(phone),
            email=str(email),
            major_code=key,
            admission_type="combined" if ielts else "hocba",
            block=str(block) if block else None,
            gpa_score=float(gpa) if gpa else None,
            ielts_score=float(ielts) if ielts else None,
            transcript_file=str(t_file) if t_file else None,
            ielts_file=str(i_file) if i_file else None,
            evaluation_result=evaluation_result
        )

        msg = (
            f"✅ **ĐĂNG KÝ HỒ SƠ THÀNH CÔNG!**\n\n"
            f"Cảm ơn bạn **{name}** đã hoàn tất đăng ký thông tin xét tuyển.\n"
            f"📌 **Thông tin tuyển sinh đã nhận:**\n"
            f"- Ngành đăng ký: {major_name}\n"
            f"- Phương thức: {'Xét tuyển kết hợp IELTS' if ielts else 'Xét tuyển học bạ'}\n"
            f"- Điểm học bạ (GPA): {gpa if gpa else 'Không'}\n"
            f"- Tổ hợp môn: {block if block else 'Không'}\n"
            f"- Điểm IELTS: {ielts if ielts else 'Không'}\n"
            f"- Đường dẫn học bạ: {t_file if t_file else 'Không'}\n"
            f"- Đường dẫn IELTS: {i_file if i_file else 'Không'}\n\n"
            f"📞 **Thông tin liên lạc:**\n"
            f"- Số điện thoại: {phone}\n"
            f"- Email: {email}\n\n"
            f"Cán bộ tuyển sinh UET sẽ liên hệ lại với bạn qua Số điện thoại hoặc Email trên sớm nhất để kiểm tra hồ sơ và hướng dẫn các bước tiếp theo!"
        )

        dispatcher.utter_message(text=msg, buttons=build_general_buttons())

        # Reset all slots to prevent dialogue state pollution
        return [
            SlotSet("selected_major", None),
            SlotSet("selected_block", None),
            SlotSet("gpa_score", None),
            SlotSet("transcript_file", None),
            SlotSet("ielts_score", None),
            SlotSet("ielts_file", None),
            SlotSet("candidate_name", None),
            SlotSet("candidate_phone", None),
            SlotSet("candidate_email", None)
        ]


class ActionCancelHocbaAdmission(Action):
    def name(self) -> Text:
        return "action_cancel_hocba_admission"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        dispatcher.utter_message(response="utter_cancel_admission")
        # Clean flowchart slots
        return [
            SlotSet("selected_major", None),
            SlotSet("selected_block", None),
            SlotSet("gpa_score", None),
            SlotSet("transcript_file", None),
            SlotSet("ielts_score", None),
            SlotSet("ielts_file", None),
            SlotSet("candidate_name", None),
            SlotSet("candidate_phone", None),
            SlotSet("candidate_email", None)
        ]


__all__ = [
    "ActionFetchScore",
    "ActionFetchTuition",
    "ActionCheckSuitability",
    "ActionExplainMajorAndCTA",
    "ActionProvideDetailedMajorInfo",
    "ActionEvalHocbaAdmission",
    "ActionEvalCombinedAdmission",
    "ActionSaveCandidateInfo",
    "ActionCancelHocbaAdmission"
]