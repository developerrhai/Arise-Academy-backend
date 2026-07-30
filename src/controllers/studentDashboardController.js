const pool = require('../config/db');

const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Fetch profile with strict column scoping
    const [students] = await pool.query(
      'SELECT id, name, email, phone, course, standard, board, fee, paid_fee FROM students WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [studentId]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }
    const profile = students[0];

    // Fetch related invoices explicitly ordered
    const [invoices] = await pool.query(
      'SELECT id, amount, status, created_at FROM invoices WHERE student_id = ? ORDER BY created_at DESC', 
      [studentId]
    );
    
    // Support page and limit query params for class updates pagination (BUG-08)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Fetch teacher updates (class updates/attendance) securely
    let classUpdates = [];
    let classUpdatesTotal = 0;
    try {
      let batchStr = profile.standard || "";
      if (profile.course) {
        batchStr += " " + profile.course;
      }
      batchStr = batchStr.trim();
      
      if (batchStr) {
        // Count query for pagination info
        const [countResult] = await pool.query(
          "SELECT COUNT(*) as total FROM teaching_logs WHERE batch = ? OR batch LIKE ? OR batch LIKE ? OR batch LIKE ?",
          [batchStr, `${batchStr},%`, `%,${batchStr},%`, `%,${batchStr}`]
        );
        classUpdatesTotal = countResult[0]?.total || 0;

        // Replaced implicit LIKE with robust pattern binding to prevent false positives (e.g. "10" matching "110")
        // Mapping notes to chapter so the UI table renders it correctly
        const [updates] = await pool.query(
          `SELECT tl.id, tl.class_date, 'N/A' as class_time, tl.subject, tl.notes as chapter, tl.topic, t.name as teacher_name 
           FROM teaching_logs tl
           JOIN teachers t ON tl.teacher_id = t.id
           WHERE tl.batch = ? OR tl.batch LIKE ? OR tl.batch LIKE ? OR tl.batch LIKE ? 
           ORDER BY tl.class_date DESC, tl.id DESC 
           LIMIT ? OFFSET ?`,
          [batchStr, `${batchStr},%`, `%,${batchStr},%`, `%,${batchStr}`, limit, offset]
        );
        classUpdates = updates;
      }
    } catch (err) {
      // Log server error, do not expose to client
      console.error("Error fetching class updates from teaching_logs:", err);
    }
    
    res.json({
      profile,
      invoices,
      classUpdates,
      classUpdatesTotal,
    });
  } catch (error) {
    console.error("Student Dashboard Error:", error);
    res.status(500).json({ message: 'An internal error occurred while fetching the dashboard.' });
  }
};

module.exports = { getStudentDashboard };
