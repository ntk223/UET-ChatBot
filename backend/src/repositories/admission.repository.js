const { query } = require("../config/postgres");

async function findMajorByCode(code) {
  if (!code) {
    return null;
  }

  const result = await query(
    `
      SELECT id, code, name, program_type, tuition_fee, curriculum_summary
      FROM majors
      WHERE UPPER(code) = UPPER($1)
      LIMIT 1
    `,
    [code]
  );
  return result.rows[0] || null;
}

async function findMajorByNameOrCode(search) {
  if (!search) {
    return null;
  }

  const result = await query(
    `
      SELECT id, code, name, program_type, tuition_fee, curriculum_summary
      FROM majors
      WHERE UPPER(code) = UPPER($1)
         OR LOWER(name) = LOWER($1)
         OR LOWER(name) LIKE LOWER($2)
      ORDER BY CASE WHEN LOWER(name) = LOWER($1) THEN 0 ELSE 1 END
      LIMIT 1
    `,
    [search, `%${search}%`]
  );

  return result.rows[0] || null;
}

async function findAdmissionMethodByName(search) {
  if (!search) {
    return null;
  }

  const result = await query(
    `
      SELECT id, method_name, description
      FROM admission_methods
      WHERE LOWER(method_name) = LOWER($1)
         OR LOWER(method_name) LIKE LOWER($2)
      LIMIT 1
    `,
    [search, `%${search}%`]
  );

  return result.rows[0] || null;
}

async function findLatestAdmissionScore(majorId, methodId = null) {
  if (!majorId) {
    return null;
  }

  const params = [majorId];
  let condition = "";

  if (methodId) {
    params.push(methodId);
    condition = "AND s.method_id = $2";
  }

  const result = await query(
    `
      SELECT s.year, s.score, s.subject_groups, m.method_name, mj.name AS major_name
      FROM admission_scores s
      JOIN admission_methods m ON m.id = s.method_id
      JOIN majors mj ON mj.id = s.major_id
      WHERE s.major_id = $1
      ${condition}
      ORDER BY s.year DESC, s.id DESC
      LIMIT 1
    `,
    params
  );

  return result.rows[0] || null;
}

module.exports = {
  findMajorByCode,
  findMajorByNameOrCode,
  findAdmissionMethodByName,
  findLatestAdmissionScore,
};
