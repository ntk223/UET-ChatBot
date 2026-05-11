INSERT INTO majors (code, name, program_type, tuition_fee, curriculum_summary)
VALUES
  ('CN1', 'Công nghệ thông tin', 'Standard', 34.00, '145 tín chỉ, đào tạo 4 năm'),
  ('CN2', 'An toàn thông tin', 'DMKT', 40.00, '150 tín chỉ, đào tạo 4.5 năm')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  program_type = EXCLUDED.program_type,
  tuition_fee = EXCLUDED.tuition_fee,
  curriculum_summary = EXCLUDED.curriculum_summary;

INSERT INTO major_descriptions (major_id, introduction, duration, orientation)
VALUES
  (
    (SELECT id FROM majors WHERE code = 'CN1'),
    'Ngành học mũi nhọn về phần mềm và hệ thống.',
    4.0,
    'Lập trình viên, Kiến trúc sư hệ thống.'
  ),
  (
    (SELECT id FROM majors WHERE code = 'CN2'),
    'Chương trình đào tạo chuyên sâu về bảo mật.',
    4.5,
    'Chuyên gia bảo mật, Kỹ sư an ninh mạng.'
  )
ON CONFLICT (major_id) DO UPDATE
SET
  introduction = EXCLUDED.introduction,
  duration = EXCLUDED.duration,
  orientation = EXCLUDED.orientation;

INSERT INTO admission_methods (method_name, description)
VALUES
  ('THPTQG', 'Xét điểm thi tốt nghiệp THPT'),
  ('XetThang', 'Tuyển thẳng theo quy định Bộ GD&ĐT'),
  ('IELTS_Plus', 'Kết hợp chứng chỉ quốc tế và học bạ')
ON CONFLICT (method_name) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO admission_scores (major_id, method_id, year, score, subject_groups)
VALUES
  (
    (SELECT id FROM majors WHERE code = 'CN1'),
    (SELECT id FROM admission_methods WHERE method_name = 'THPTQG'),
    2024,
    26.50,
    'A00, A01'
  ),
  (
    (SELECT id FROM majors WHERE code = 'CN1'),
    (SELECT id FROM admission_methods WHERE method_name = 'THPTQG'),
    2025,
    27.25,
    'A00, A01'
  ),
  (
    (SELECT id FROM majors WHERE code = 'CN2'),
    (SELECT id FROM admission_methods WHERE method_name = 'THPTQG'),
    2025,
    25.00,
    'A00, D01'
  )
ON CONFLICT DO NOTHING;

INSERT INTO admission_quotas (major_id, method_id, year, quota, is_expected)
VALUES
  (
    (SELECT id FROM majors WHERE code = 'CN1'),
    (SELECT id FROM admission_methods WHERE method_name = 'THPTQG'),
    2025,
    200,
    FALSE
  ),
  (
    (SELECT id FROM majors WHERE code = 'CN1'),
    (SELECT id FROM admission_methods WHERE method_name = 'THPTQG'),
    2026,
    220,
    TRUE
  ),
  (
    (SELECT id FROM majors WHERE code = 'CN2'),
    (SELECT id FROM admission_methods WHERE method_name = 'IELTS_Plus'),
    2025,
    50,
    FALSE
  )
ON CONFLICT DO NOTHING;

INSERT INTO certificate_conversion (cert_type, original_score, converted_score)
VALUES
  ('IELTS', 6.5, 9.00),
  ('IELTS', 7.0, 9.50),
  ('IELTS', 7.5, 10.00)
ON CONFLICT (cert_type, original_score) DO UPDATE
SET converted_score = EXCLUDED.converted_score;

INSERT INTO scholarships_policies (category, name, description, major_id)
VALUES
  (
    'Scholarship',
    'Học bổng Tài năng trẻ',
    'Tặng 100% học phí cho SV đạt giải Quốc gia',
    (SELECT id FROM majors WHERE code = 'CN1')
  ),
  (
    'Policy',
    'Miễn giảm vùng khó khăn',
    'Giảm 20% học phí cho SV vùng sâu vùng xa',
    NULL
  )
ON CONFLICT DO NOTHING;
