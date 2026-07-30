const db = require("../config/db");

// ── CREATE / ASSIGN TEACHER ─────────────────────────────
exports.assignTeacher = async (req, res) => {
  try {
    const { teacher_id, branch_id, sub_id } = req.body;

    // Basic Validation
    if (!teacher_id || !branch_id || !sub_id) {
      return res.status(400).json({ 
        success: false, 
        message: "teacher_id, branch_id, and sub_id are all required" 
      });
    }

    const [result] = await db.query(
      "INSERT INTO teacher_assignments (teacher_id, branch_id, sub_id) VALUES (?, ?, ?)",
      [teacher_id, branch_id, sub_id]
    );

    res.status(201).json({
      success: true,
      message: "Teacher assigned to subject successfully",
      assignment_id: result.insertId
    });
  } catch (err) {
    // Handle Duplicate Entry (Unique Key constraint)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false, 
        message: "This subject in this branch already has a teacher assigned." 
      });
    }
    console.error("Assignment Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET ALL ASSIGNMENTS (With Details) ──────────────────
exports.getAllAssignments = async (req, res) => {
  try {
    // This query joins all tables to give a human-readable list for the UI
    const sql = `
      SELECT 
        ta.assignment_id,
        t.name AS teacher_name,
        b.branch_name,
        s.name AS subject_name,
        st.name AS standard_name,
        bt.batch_name
      FROM teacher_assignments ta
      JOIN teachers t ON ta.teacher_id = t.id
      JOIN branches b ON ta.branch_id = b.branch_id
      JOIN subjects s ON ta.sub_id = s.sub_id
      JOIN standards st ON s.stand_id = st.stand_id
      JOIN batches bt ON st.batch_id = bt.batch_id
      ORDER BY b.branch_name ASC, ta.assignment_id DESC
    `;

    const [rows] = await db.query(sql);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET ASSIGNMENTS BY BRANCH ───────────────────────────
exports.getAssignmentsByBranch = async (req, res) => {
  try {
    const { branch_id } = req.params;

    const [rows] = await db.query(
      `SELECT ta.*, t.name as teacher_name, s.name as subject_name 
       FROM teacher_assignments ta
       JOIN teachers t ON ta.teacher_id = t.id
       JOIN subjects s ON ta.sub_id = s.sub_id
       WHERE ta.branch_id = ?`,
      [branch_id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── UPDATE ASSIGNMENT (Change Teacher) ──────────────────
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params; // assignment_id
    const { teacher_id } = req.body;

    const [result] = await db.query(
      "UPDATE teacher_assignments SET teacher_id = ? WHERE assignment_id = ?",
      [teacher_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    res.json({ success: true, message: "Teacher updated for this assignment" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── REMOVE ASSIGNMENT ───────────────────────────────────
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM teacher_assignments WHERE assignment_id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    res.json({ success: true, message: "Assignment removed" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
