const pool = require('../config/db');

// Soft Delete a student
const softDeleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('UPDATE students SET deleted_at = NOW() WHERE id = ? AND admin_id = ?', [id, req.user.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found or already deleted' });
    }
    
    res.json({ success: true, message: 'Student soft deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Recycle Bin (Soft deleted students)
const getRecycleBin = async (req, res) => {
  try {
    const [deletedStudents] = await pool.query('SELECT id, name, email, deleted_at FROM students WHERE admin_id = ? AND deleted_at IS NOT NULL', [req.user.id]);
    res.json({ deletedStudents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Restore a soft-deleted student
const restoreStudent = async (req, res) => {
  const { id } = req.body;
  try {
    const [result] = await pool.query('UPDATE students SET deleted_at = NULL WHERE id = ? AND admin_id = ?', [id, req.user.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found in recycle bin' });
    }
    
    res.json({ success: true, message: 'Student restored' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Hard Delete a student
const hardDeleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM students WHERE id = ? AND admin_id = ? AND deleted_at IS NOT NULL', [id, req.user.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found in recycle bin' });
    }
    
    res.json({ success: true, message: 'Student permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { softDeleteStudent, getRecycleBin, restoreStudent, hardDeleteStudent };
