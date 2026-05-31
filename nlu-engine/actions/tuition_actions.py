from typing import Any, Dict, List, Text

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import FollowupAction

from .common import normalize_text, build_general_buttons, build_major_buttons
from .repository import REPO


class ActionFetchTuition(Action):
    def name(self) -> Text:
        return "action_fetch_tuition"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        major_value = normalize_text(tracker.get_slot("major"))

        if not major_value:
            dispatcher.utter_message(
                text="Mình cần tên ngành học để tra cứu học phí. Bạn hãy chọn một trong các ngành của UET dưới đây:",
                buttons=build_major_buttons()
            )
            return [FollowupAction("tuition_form")]

        try:
            major = REPO.find_major_by_code(major_value) or REPO.find_major_by_name_or_code(
                major_value
            )
            if not major:
                dispatcher.utter_message(
                    text="Mình chưa tìm thấy ngành học tương thích để tra cứu học phí. Vui lòng chọn một ngành học:",
                    buttons=build_major_buttons()
                )
                return [FollowupAction("tuition_form")]

            tuition_fee = major.get("tuition_fee")
            if tuition_fee is None:
                dispatcher.utter_message(
                    text=f"Hiện tại mình chưa có học phí tham khảo cho ngành {major['name']}.",
                    buttons=build_general_buttons()
                )
                return []

            fee_value = float(tuition_fee)
            dispatcher.utter_message(
                text=f"Học phí tham khảo của ngành {major['name']} là {fee_value:.2f} triệu VNĐ/năm.",
                buttons=build_general_buttons()
            )
            return []
        except Exception as exc:
            print(f"[action_fetch_tuition] error: {exc}")
            dispatcher.utter_message(
                text="Mình đang gặp lỗi khi tra cứu học phí. Bạn thử lại sau nhé.",
                buttons=build_general_buttons()
            )
            return []
