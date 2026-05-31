from typing import Any, Dict, List, Text

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import FollowupAction

from .common import build_curriculum_buttons, build_score_buttons, normalize_text, build_major_buttons
from .repository import REPO


class ActionFetchScore(Action):
    def name(self) -> Text:
        return "action_fetch_score"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        major_value = normalize_text(tracker.get_slot("major"))
        method_value = normalize_text(tracker.get_slot("admission_method"))

        if not major_value:
            dispatcher.utter_message(response="utter_ask_major")
            return [FollowupAction("admission_form")]

        if not method_value:
            dispatcher.utter_message(response="utter_ask_admission_method")
            return [FollowupAction("admission_form")]

        try:
            major = REPO.find_major_by_code(major_value) or REPO.find_major_by_name_or_code(
                major_value
            )
            if not major:
                dispatcher.utter_message(
                    text="Mình chưa xác định được ngành học. Bạn hãy chọn một trong các ngành của UET dưới đây để mình tra cứu điểm chuẩn:",
                    buttons=build_major_buttons()
                )
                return [FollowupAction("admission_form")]

            method = REPO.find_admission_method_by_name(method_value)
            score_info = REPO.find_latest_admission_score(
                major["id"], method["id"] if method else None
            )

            if not score_info or score_info.get("score") is None:
                dispatcher.utter_message(
                    text=(
                        f"Hiện tại mình chưa có điểm chuẩn phù hợp cho ngành {major['name']}."
                    ),
                    buttons=build_score_buttons(),
                )
                return []

            subject_groups = score_info.get("subject_groups") or "đang cập nhật"
            score_value = float(score_info["score"])
            message = (
                f"Điểm chuẩn gần nhất của ngành {score_info['major_name']} "
                f"({score_info['method_name']}) là {score_value:.2f} vào năm "
                f"{score_info['year']}. Tổ hợp: {subject_groups}."
            )

            dispatcher.utter_message(text=message, buttons=build_score_buttons())
            return []
        except Exception as exc:
            print(f"[action_fetch_score] error: {exc}")
            dispatcher.utter_message(
                text="Mình đang gặp lỗi khi tra cứu điểm chuẩn. Bạn thử lại sau nhé."
            )
            return []


class ActionCheckSuitability(Action):
    def name(self) -> Text:
        return "action_check_suitability"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        major_value = normalize_text(tracker.get_slot("major"))
        method_value = normalize_text(tracker.get_slot("admission_method"))

        if not major_value or not method_value:
            dispatcher.utter_message(
                text="Mình cần biết ngành học và phương thức xét tuyển trước khi tư vấn tiếp."
            )
            return [FollowupAction("admission_form")]

        dispatcher.utter_message(
            text="Mình gửi bạn tóm tắt chương trình đào tạo của ngành.",
            buttons=build_curriculum_buttons(),
        )
        return []
