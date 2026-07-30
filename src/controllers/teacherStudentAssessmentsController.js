const db = require("../config/db");

/**
 * Ensure the table exists AND has the `total_marks` column
 * that the frontend relies on.  Safe to call on every request
 * (DDL IF NOT EXISTS / IF NOT EXISTS column check).
 */
async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS teacher_student_assessments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NOT NULL,
      student_id INT NOT NULL,
      subject VARCHAR(120) NOT NULL,
      marks DECIMAL(10,2) NOT NULL DEFAULT 0,
      total_marks DECIMAL(10,2) DEFAULT NULL,
      examination VARCHAR(150) NOT NULL,
      exam_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_admin_student (admin_id, student_id),
      INDEX idx_exam_date (exam_date)
    )
  `);

  // If the table existed before this code was deployed it won't have
  // `total_marks`. Add it idempotently.
  try {
    const [cols] = await db.query(`SHOW COLUMNS FROM teacher_student_assessments LIKE 'total_marks'`);
    if (cols.length === 0) {
      await db.query(
        `ALTER TABLE teacher_student_assessments
         ADD COLUMN total_marks DECIMAL(10,2) DEFAULT NULL AFTER marks`
      );
      console.log("✅ Added total_marks column to teacher_student_assessments");
    }
  } catch (err) {
    console.error("❌ Failed to add total_marks column:", err.message);
  }
}

/* ── GET /  ─  all assessment rows (not just latest) ────── */
exports.getLatestAll = async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await db.query(
      `SELECT *
       FROM teacher_student_assessments
       ORDER BY exam_date DESC, id DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET /:studentId ──────────────────────────────────────── */
exports.getByStudent = async (req, res) => {
  try {
    await ensureTable();
    const studentId = Number(req.params.studentId);
    if (!studentId) {
      return res.status(400).json({ success: false, message: "Valid student id is required" });
    }

    const [rows] = await db.query(
      `SELECT *
       FROM teacher_student_assessments
       WHERE student_id = ?
       ORDER BY exam_date DESC, id DESC`,
      [studentId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── POST /:studentId ─────────────────────────────────────── */
exports.createByStudent = async (req, res) => {
  try {
    await ensureTable();
    const studentId = Number(req.params.studentId);
    const { subject, marks, total_marks, examination, exam_date } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: "Valid student id is required" });
    }
    if (!subject || !examination || !exam_date) {
      return res.status(400).json({ success: false, message: "Subject, examination and date are required" });
    }
    const marksNum = Number(marks);
    if (Number.isNaN(marksNum) || marksNum < 0) {
      return res.status(400).json({ success: false, message: "Marks must be a valid non-negative number" });
    }

    const totalNum = total_marks !== undefined && total_marks !== null && total_marks !== ""
      ? Number(total_marks)
      : null;
    if (totalNum !== null && (Number.isNaN(totalNum) || totalNum < 0)) {
      return res.status(400).json({ success: false, message: "Total marks must be a valid non-negative number" });
    }

    const [studentRows] = await db.query(
      "SELECT id FROM students WHERE id = ?",
      [studentId]
    );
    if (!studentRows.length) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const [result] = await db.query(
      `INSERT INTO teacher_student_assessments
       (admin_id, student_id, subject, marks, total_marks, examination, exam_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.admin.id, studentId, String(subject).trim(), marksNum, totalNum, String(examination).trim(), exam_date]
    );
    res.status(201).json({ success: true, message: "Assessment added", id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── PUT /:id  ─  update an existing assessment row ───────── */
exports.update = async (req, res) => {
  try {
    await ensureTable();
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Valid assessment id is required" });
    }

    const { subject, marks, total_marks, examination, exam_date } = req.body;
    if (!subject || !examination || !exam_date) {
      return res.status(400).json({ success: false, message: "Subject, examination and date are required" });
    }
    const marksNum = Number(marks);
    if (Number.isNaN(marksNum) || marksNum < 0) {
      return res.status(400).json({ success: false, message: "Marks must be a valid non-negative number" });
    }

    const totalNum = total_marks !== undefined && total_marks !== null && total_marks !== ""
      ? Number(total_marks)
      : null;
    if (totalNum !== null && (Number.isNaN(totalNum) || totalNum < 0)) {
      return res.status(400).json({ success: false, message: "Total marks must be a valid non-negative number" });
    }

    const [result] = await db.query(
      `UPDATE teacher_student_assessments
       SET subject = ?, marks = ?, total_marks = ?, examination = ?, exam_date = ?
       WHERE id = ?`,
      [String(subject).trim(), marksNum, totalNum, String(examination).trim(), exam_date, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }

    res.json({ success: true, message: "Assessment updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── DELETE /:id  ─  remove an assessment row ─────────────── */
exports.remove = async (req, res) => {
  try {
    await ensureTable();
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Valid assessment id is required" });
    }

    const [result] = await db.query(
      `DELETE FROM teacher_student_assessments
       WHERE id = ?`,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }

    res.json({ success: true, message: "Assessment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

