const pool = require('../config/db');

const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // Fetch profile with strict column scoping
    const [teachers] = await pool.query(
      'SELECT id, name, email, phone as contact, location, biometric_code FROM teachers WHERE id = ? LIMIT 1',
      [teacherId]
    );
    
    if (teachers.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
    }
    const profile = teachers[0];

    // Support page and limit query params for class updates pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Fetch teacher updates (class updates/teaching logs)
    let classUpdates = [];
    let classUpdatesTotal = 0;
    try {
      const [countResult] = await pool.query(
        "SELECT COUNT(*) as total FROM teaching_logs WHERE teacher_id = ?",
        [teacherId]
      );
      classUpdatesTotal = countResult[0]?.total || 0;

      const [updates] = await pool.query(
        `SELECT id, class_date, subject, notes as chapter, topic, batch 
         FROM teaching_logs 
         WHERE teacher_id = ? 
         ORDER BY class_date DESC, id DESC 
         LIMIT ? OFFSET ?`,
        [teacherId, limit, offset]
      );
      classUpdates = updates;
    } catch (err) {
      console.error("Error fetching class updates from teaching_logs:", err);
    }
    
    res.json({
      success: true,
      profile,
      classUpdates,
      classUpdatesTotal,
    });
  } catch (error) {
    console.error("Teacher Dashboard Error:", error);
    res.status(500).json({ success: false, message: 'An internal error occurred while fetching the dashboard.' });
  }
};

module.exports = { getTeacherDashboard };
