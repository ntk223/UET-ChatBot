from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from .db_helper import get_db_connection, get_db_cursor

class ActionQueryMajorInfo(Action):
    def name(self) -> Text:
        return "action_query_major_info"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        # Retrieve major from slot or entity
        nganh_hoc = next(tracker.get_latest_entity_values("nganh_hoc"), None)
        if not nganh_hoc:
            nganh_hoc = tracker.get_slot("chosen_major")

        if not nganh_hoc:
            dispatcher.utter_message(text="Bạn muốn hỏi về ngành cụ thể nào? Ví dụ: Khoa học máy tính (CN1).")
            return []

        try:
            conn, conn_type = get_db_connection()
            cursor = get_db_cursor(conn, conn_type)
            
            placeholder = "%s" if conn_type == "postgres" else "?"
            query = f"SELECT * FROM majors WHERE major_name LIKE {placeholder} OR major_code LIKE {placeholder}"
            cursor.execute(query, (f"%{nganh_hoc}%", f"%{nganh_hoc}%"))
            row = cursor.fetchone()
            
            if row:
                major = dict(row)
                response = (f"Ngành {major['major_name']} ({major['major_code']}):\n"
                            f"- Học phí dự kiến: {major['tuition_fee']} triệu VNĐ/năm.\n"
                            f"- Điểm chuẩn 2025: {major['benchmark_2025']}\n"
                            f"- Chỉ tiêu tuyển sinh: {major['quota']}\n"
                            f"- Giới thiệu: {major['description']}\n\n"
                            f"Bạn có muốn nộp hồ sơ xét tuyển trực tuyến ngay không?")
                dispatcher.utter_message(
                    text=response,
                    buttons=[{"title": "Đăng ký nguyện vọng 📝", "payload": "/dang_ky_nguyen_vong"}]
                )
            else:
                dispatcher.utter_message(text=f"Hiện tại mình chưa tìm thấy thông tin ngành {nganh_hoc} trong danh mục đào tạo của UET.")
            cursor.close()
            conn.close()
        except Exception as e:
            dispatcher.utter_message(text="Hệ thống tra cứu đang bận, vui lòng thử lại sau!")
            print(f"Error querying major info: {e}")
        return []

class ActionAskChosenMajor(Action):
    def name(self) -> Text:
        return "action_ask_chosen_major"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        try:
            conn, conn_type = get_db_connection()
            cursor = get_db_cursor(conn, conn_type)
            cursor.execute("SELECT major_code, major_name FROM majors ORDER BY major_code")
            rows = cursor.fetchall()
            
            buttons = []
            for row in rows:
                row_dict = dict(row) if not isinstance(row, dict) else row
                code = row_dict['major_code']
                name = row_dict['major_name']
                buttons.append({
                    "title": f"{name} ({code})",
                    "payload": f"{name} ({code})"
                })
            
            dispatcher.utter_message(
                text="Bạn muốn đặt nguyện vọng vào ngành nào? Vui lòng chọn một trong các ngành đào tạo chính thức của UET dưới đây:",
                buttons=buttons
            )
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error in ActionAskChosenMajor: {e}")
            fallback_buttons = [
                {"title": "Khoa học máy tính (CN1)", "payload": "Khoa học máy tính (CN1)"},
                {"title": "Kỹ thuật phần mềm (CN2)", "payload": "Kỹ thuật phần mềm (CN2)"},
                {"title": "Công nghệ thông tin (CN4)", "payload": "Công nghệ thông tin (CN4)"},
                {"title": "An toàn thông tin (CN11)", "payload": "An toàn thông tin (CN11)"},
            ]
            dispatcher.utter_message(
                text="Bạn muốn đặt nguyện vọng vào ngành nào? (Ví dụ: Khoa học máy tính):",
                buttons=fallback_buttons
            )
        return []

