const db = require("../config/db");

function normalizeNotes(value) {
  if (value === undefined || value === null) return null;
  const txt = String(value).trim();
  return txt.length ? txt : null;
}

async function resolveTeacherName(adminId, teacherId, teacherName) {
  if (!teacherId) return (teacherName || "").trim();
  const [rows] = await db.query(
    "SELECT name FROM teachers WHERE id = ? AND (admin_id = ? OR admin_id = 8)",
    [teacherId, adminId]
  );
  if (!rows.length) return "";
  return rows[0].name;
}

exports.getAll = async (req, res) => {
  try {
    const { teacher_id, teacher_name, branch, subject, date_from, date_to, page = "1", limit = "10" } = req.query;
    
    let filterTeacherName = (teacher_name || "").trim();
    if (!filterTeacherName && teacher_id) {
      filterTeacherName = await resolveTeacherName(req.admin.id, Number(teacher_id), ""); 
      if (!filterTeacherName) {
        return res.json({ success: true, updates: [], total: 0, totalPages: 1, page: Number(page) || 1 });
      }
    } 


 
    let whereSql = " FROM teacher_updates WHERE (admin_id = ? OR admin_id = 8)";
    const params = [req.admin.id];
    if (filterTeacherName) {
      whereSql += " AND teacher_name = ?";
      params.push(filterTeacherName);
    }
    if (branch && branch !== "all") {
      whereSql += " AND branch = ?";
      params.push(branch);
    }
    if (subject && subject !== "all") {
      whereSql += " AND subject = ?";
      params.push(subject);
    }
    if (date_from) {
      whereSql += " AND class_date >= ?";
      params.push(date_from);
    }
    if (date_to) {
      whereSql += " AND class_date <= ?";
      params.push(date_to);
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const offset = (pageNum - 1) * limitNum;

    const [countRows] = await db.query(`SELECT COUNT(*) AS total${whereSql}`, params);
    const total = countRows[0]?.total || 0;
    const totalPages = Math.max(Math.ceil(total / limitNum), 1);

    const [rows] = await db.query(
      `SELECT id, teacher_name, batch, subject, chapter, topic, branch, class_date, class_time, remarks
       ${whereSql}
       ORDER BY class_date DESC, class_time DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    const updates = rows.map((r) => ({
      ...r,
      teacher_id: null,
      notes: r.remarks || "",
    }));

    res.json({ success: true, updates, total, totalPages, page: pageNum });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      teacher_id,
      teacher_name,
      batch,
      subject,
      chapter,
      topic,
      branch,
      class_date,
      class_time,
      notes,
      remarks,
    } = req.body;

    const resolvedTeacherName = await resolveTeacherName(req.admin.id, Number(teacher_id) || null, teacher_name);

    if (!resolvedTeacherName || !batch || !subject || !chapter || !topic || !branch || !class_date || !class_time) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    const [result] = await db.query(
      `INSERT INTO teacher_updates
       (admin_id, teacher_name, batch, subject, chapter, topic, branch, class_date, class_time, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.admin.id,
        resolvedTeacherName.trim(),
        batch,
        subject,
        chapter,
        topic,
        branch,
        class_date,
        class_time,
        normalizeNotes(notes !== undefined ? notes : remarks),
      ]
    );

    res.status(201).json({ success: true, message: "Teacher update created", id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      teacher_id,
      teacher_name,
      batch,
      subject,
      chapter,
      topic,
      branch,
      class_date,
      class_time,
      notes,
      remarks,
    } = req.body;

    const resolvedTeacherName = await resolveTeacherName(req.admin.id, Number(teacher_id) || null, teacher_name);
    if (!resolvedTeacherName || !batch || !subject || !chapter || !topic || !branch || !class_date || !class_time) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    const [result] = await db.query(
      `UPDATE teacher_updates
       SET teacher_name=?, batch=?, subject=?, chapter=?, topic=?, branch=?, class_date=?, class_time=?, remarks=?
       WHERE id=? AND (admin_id=? OR admin_id=8)`,
      [
        resolvedTeacherName.trim(),
        batch,
        subject,
        chapter,
        topic,
        branch,
        class_date,
        class_time,
        normalizeNotes(notes !== undefined ? notes : remarks),
        req.params.id,
        req.admin.id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Teacher update not found" });
    }

    res.json({ success: true, message: "Teacher update updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM teacher_updates WHERE id = ? AND (admin_id = ? OR admin_id = 8)",
      [req.params.id, req.admin.id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Teacher update not found" });
    }
    res.json({ success: true, message: "Teacher update deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

