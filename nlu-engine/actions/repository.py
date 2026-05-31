from typing import Any, Dict, List, Optional, Text

import os

import psycopg2
from psycopg2.extras import RealDictCursor


class PostgresRepository:
    def __init__(self) -> None:
        self._host = os.getenv("DB_HOST", "localhost")
        self._port = int(os.getenv("DB_PORT", "5432"))
        self._user = os.getenv("DB_USER", "root")
        self._password = os.getenv("DB_PASS", "root")
        self._database = os.getenv("DB_NAME", "uet_chatbot")

    def _connect(self):
        return psycopg2.connect(
            host=self._host,
            port=self._port,
            user=self._user,
            password=self._password,
            database=self._database,
        )

    def _fetch_one(self, query: Text, params: List[Any]) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                row = cursor.fetchone()
                return dict(row) if row else None

    def find_major_by_code(self, code: Text) -> Optional[Dict[str, Any]]:
        if not code:
            return None

        return self._fetch_one(
            """
            SELECT id, code, name, program_type, tuition_fee, curriculum_summary
            FROM majors
            WHERE UPPER(code) = UPPER(%s)
            LIMIT 1
            """,
            [code],
        )

    def find_major_by_name_or_code(self, search: Text) -> Optional[Dict[str, Any]]:
        if not search:
            return None

        return self._fetch_one(
            """
            SELECT id, code, name, program_type, tuition_fee, curriculum_summary
            FROM majors
            WHERE UPPER(code) = UPPER(%s)
               OR LOWER(name) = LOWER(%s)
               OR LOWER(name) LIKE LOWER(%s)
            ORDER BY CASE WHEN LOWER(name) = LOWER(%s) THEN 0 ELSE 1 END
            LIMIT 1
            """,
            [search, search, f"%{search}%", search],
        )

    def get_major_details_by_code(self, code: Text) -> Optional[Dict[str, Any]]:
        if not code:
            return None

        return self._fetch_one(
            """
            SELECT m.id, m.code, m.name, m.program_type, m.tuition_fee, m.curriculum_summary,
                   d.introduction, d.duration, d.orientation
            FROM majors m
            LEFT JOIN major_descriptions d ON m.id = d.major_id
            WHERE UPPER(m.code) = UPPER(%s)
            LIMIT 1
            """,
            [code]
        )

    def get_latest_scores_for_major(self, major_id: int) -> List[Dict[str, Any]]:
        if not major_id:
            return []

        try:
            with self._connect() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(
                        """
                        SELECT s.year, s.score, s.subject_groups, m.method_name
                        FROM admission_scores s
                        JOIN admission_methods m ON m.id = s.method_id
                        WHERE s.major_id = %s
                        ORDER BY s.year DESC, s.id DESC
                        """,
                        [major_id]
                    )
                    return [dict(row) for row in cursor.fetchall()]
        except Exception as exc:
            print(f"[get_latest_scores_for_major] error: {exc}")
            return []

    def find_admission_method_by_name(self, search: Text) -> Optional[Dict[str, Any]]:
        if not search:
            return None

        return self._fetch_one(
            """
            SELECT id, method_name, description
            FROM admission_methods
            WHERE LOWER(method_name) = LOWER(%s)
               OR LOWER(method_name) LIKE LOWER(%s)
            LIMIT 1
            """,
            [search, f"%{search}%"],
        )

    def find_latest_admission_score(
        self, major_id: int, method_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        if not major_id:
            return None

        params: List[Any] = [major_id]
        condition = ""

        if method_id:
            params.append(method_id)
            condition = "AND s.method_id = %s"

        return self._fetch_one(
            f"""
            SELECT s.year, s.score, s.subject_groups, m.method_name, mj.name AS major_name
            FROM admission_scores s
            JOIN admission_methods m ON m.id = s.method_id
            JOIN majors mj ON mj.id = s.major_id
            WHERE s.major_id = %s
            {condition}
            ORDER BY s.year DESC, s.id DESC
            LIMIT 1
            """,
            params,
        )

    def create_candidate_lead(
        self,
        name: Text,
        phone: Text,
        email: Text,
        major_code: Text,
        admission_type: Text,
        block: Optional[Text],
        gpa_score: Optional[float],
        ielts_score: Optional[float],
        transcript_file: Optional[Text],
        ielts_file: Optional[Text],
        evaluation_result: Optional[Text]
    ) -> bool:
        try:
            with self._connect() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        INSERT INTO candidate_leads (
                            name, phone, email, major_code, admission_type,
                            block, gpa_score, ielts_score, transcript_file,
                            ielts_file, evaluation_result
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        [
                            name, phone, email, major_code, admission_type,
                            block, gpa_score, ielts_score, transcript_file,
                            ielts_file, evaluation_result
                        ]
                    )
                    conn.commit()
                    return True
        except Exception as exc:
            print(f"[PostgresRepository.create_candidate_lead] error: {exc}")
            return False


REPO = PostgresRepository()
