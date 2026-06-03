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


class ActionQueryTuitionByMajor(Action):
    """Tra cứu học phí (tuition_fee) của một ngành cụ thể từ database."""

    def name(self) -> Text:
        return "action_query_tuition_by_major"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        # Ưu tiên lấy entity 'major' (dùng trong file nlu_hoc_phi_diem_chuan.yml)
        # Fallback về entity 'nganh_hoc' hoặc slot chosen_major
        major_raw = (
            next(tracker.get_latest_entity_values("major"), None)
            or next(tracker.get_latest_entity_values("nganh_hoc"), None)
            or tracker.get_slot("chosen_major")
        )

        if not major_raw:
            dispatcher.utter_message(
                text="Bạn muốn hỏi học phí ngành nào? Ví dụ: Khoa học máy tính, CN8, Trí tuệ nhân tạo..."
            )
            return []

        try:
            conn, conn_type = get_db_connection()
            cursor = get_db_cursor(conn, conn_type)
            placeholder = "%s" if conn_type == "postgres" else "?"
            query = (
                f"SELECT major_code, major_name, tuition_fee "
                f"FROM majors "
                f"WHERE LOWER(major_name) LIKE LOWER({placeholder}) "
                f"   OR LOWER(major_code) LIKE LOWER({placeholder})"
            )
            like_term = f"%{major_raw}%"
            cursor.execute(query, (like_term, like_term))
            rows = cursor.fetchall()
            cursor.close()
            conn.close()

            if not rows:
                dispatcher.utter_message(
                    text=f"Mình chưa tìm thấy ngành **{major_raw}** trong danh mục. "
                         f"Bạn có thể thử lại với tên đầy đủ hoặc mã ngành (VD: CN8, Khoa học máy tính)."
                )
                return []

            if len(rows) == 1:
                row = dict(rows[0])
                fee = row["tuition_fee"]
                fee_str = f"{fee:,.0f} triệu VNĐ/năm" if fee else "Đang cập nhật"
                msg = (
                    f"💰 **Học phí ngành {row['major_name']} ({row['major_code']})**\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"• Học phí dự kiến: **{fee_str}**\n\n"
                    f"_Mức học phí có thể điều chỉnh theo từng năm học. "
                    f"Vui lòng xác nhận với trang tuyển sinh chính thức của UET._\n\n"
                    f"Bạn có muốn đăng ký xét tuyển ngành này không?"
                )
                dispatcher.utter_message(
                    text=msg,
                    buttons=[{"title": "Đăng ký nguyện vọng 📝", "payload": "/dang_ky_nguyen_vong"}]
                )
            else:
                # Nhiều kết quả — liệt kê danh sách
                lines = [f"🔍 Tìm thấy nhiều ngành phù hợp với **\"{major_raw}\"**:\n"]
                for r in rows:
                    rd = dict(r)
                    fee = rd["tuition_fee"]
                    fee_str = f"{fee:,.0f} triệu VNĐ/năm" if fee else "Đang cập nhật"
                    lines.append(f"• **{rd['major_name']} ({rd['major_code']})**: {fee_str}")
                dispatcher.utter_message(text="\n".join(lines))

        except Exception as e:
            print(f"Error in ActionQueryTuitionByMajor: {e}")
            dispatcher.utter_message(text="Hệ thống tra cứu đang bận, vui lòng thử lại sau!")

        return []


class ActionQueryBenchmarkByMajor(Action):
    """Tra cứu điểm chuẩn 2025 (benchmark_2025) của một ngành cụ thể từ database."""

    def name(self) -> Text:
        return "action_query_benchmark_by_major"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        major_raw = (
            next(tracker.get_latest_entity_values("major"), None)
            or next(tracker.get_latest_entity_values("nganh_hoc"), None)
            or tracker.get_slot("chosen_major")
        )

        if not major_raw:
            dispatcher.utter_message(
                text="Bạn muốn hỏi điểm chuẩn ngành nào? Ví dụ: Trí tuệ nhân tạo, CN12, Khoa học máy tính..."
            )
            return []

        try:
            conn, conn_type = get_db_connection()
            cursor = get_db_cursor(conn, conn_type)
            placeholder = "%s" if conn_type == "postgres" else "?"
            query = (
                f"SELECT major_code, major_name, benchmark_2025, quota "
                f"FROM majors "
                f"WHERE LOWER(major_name) LIKE LOWER({placeholder}) "
                f"   OR LOWER(major_code) LIKE LOWER({placeholder})"
            )
            like_term = f"%{major_raw}%"
            cursor.execute(query, (like_term, like_term))
            rows = cursor.fetchall()
            cursor.close()
            conn.close()

            if not rows:
                dispatcher.utter_message(
                    text=f"Mình chưa tìm thấy ngành **{major_raw}** trong danh mục. "
                         f"Bạn có thể thử lại với tên đầy đủ hoặc mã ngành (VD: CN12, Trí tuệ nhân tạo)."
                )
                return []

            if len(rows) == 1:
                row = dict(rows[0])
                score = row["benchmark_2025"]
                quota = row["quota"]
                score_str = str(score) if score else "Chưa có dữ liệu"
                quota_str = f"{quota:,} chỉ tiêu" if quota else "Đang cập nhật"
                msg = (
                    f"📊 **Điểm chuẩn 2025 — {row['major_name']} ({row['major_code']})**\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"• Điểm chuẩn năm 2025: **{score_str}**\n"
                    f"• Chỉ tiêu tuyển sinh: {quota_str}\n\n"
                    f"_Điểm chuẩn có thể thay đổi theo phương thức xét tuyển (HSA, THPT, SAT…). "
                    f"Tham khảo thêm tại trang tuyển sinh chính thức của UET._\n\n"
                    f"Bạn có muốn đăng ký xét tuyển ngành này không?"
                )
                dispatcher.utter_message(
                    text=msg,
                    buttons=[{"title": "Đăng ký nguyện vọng 📝", "payload": "/dang_ky_nguyen_vong"}]
                )
            else:
                # Nhiều kết quả
                lines = [f"🔍 Điểm chuẩn 2025 các ngành phù hợp với **\"{major_raw}\"**:\n"]
                for r in rows:
                    rd = dict(r)
                    score = rd["benchmark_2025"]
                    score_str = str(score) if score else "Chưa có dữ liệu"
                    lines.append(f"• **{rd['major_name']} ({rd['major_code']})**: {score_str}")
                dispatcher.utter_message(text="\n".join(lines))

        except Exception as e:
            print(f"Error in ActionQueryBenchmarkByMajor: {e}")
            dispatcher.utter_message(text="Hệ thống tra cứu đang bận, vui lòng thử lại sau!")

        return []

