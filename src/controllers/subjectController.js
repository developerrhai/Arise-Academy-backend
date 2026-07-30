const db = require("../config/db");

// CREATE
exports.createSubject = async (req, res) => {
  try {
    const { stand_id, name, teacher_id } = req.body;

    const [result] = await db.query(
      "INSERT INTO subjects (stand_id, name, teacher_id) VALUES (?, ?, ?)",
      [stand_id, name, teacher_id || null] // Handle optional teacher
    );

    res.json({ 
      success: true, 
      message: "Subject created", 
      sub_id: result.insertId 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET ALL (General)
exports.getSubjects = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * 
      FROM subjects
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE (Now includes teacher assignment)
exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, teacher_id } = req.body;

    await db.query(
      "UPDATE subjects SET name=?, teacher_id=? WHERE sub_id=?",
      [name, teacher_id || null, id]
    );

    res.json({ success: true, message: "Subject updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM subjects WHERE sub_id=?", [id]);
    res.json({ success: true, message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.getSubjectsFiltered = async (req, res) => {
  try {
    const { stand_id, branch_id, batch_id, board_id } = req.query;

    let sql = `
      SELECT 
        su.sub_id, 
        su.name, 
        su.teacher_id, 
        t.name as teacher_name 
      FROM subjects su
      LEFT JOIN teachers t ON su.teacher_id = t.id
      INNER JOIN standards st ON su.stand_id = st.stand_id
      INNER JOIN batches bt ON st.batch_id = bt.batch_id
      WHERE 1=1
    `;

    const params = [];

    if (stand_id) {
      sql += " AND su.stand_id = ?";
      params.push(stand_id);
    }
    if (board_id) {
      sql += " AND st.board_id = ?";
      params.push(board_id);
    }
    if (batch_id) {
      sql += " AND st.batch_id = ?";
      params.push(batch_id);
    }
    if (branch_id) {
      sql += " AND bt.branch_id = ?";
      params.push(branch_id);
    }

    sql += " ORDER BY su.name ASC";

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
/* ── GET SUBJECTS BY HIERARCHY (Includes Teacher Info) ── */
// exports.getSubjectsFiltered = async (req, res) => {
//   try {
//     const { stand_id, branch_id, batch_id, board_id } = req.query;

//     if (!stand_id) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "stand_id is required" 
//       });
//     }
//     if (!branch_id) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "branch_id is required" 
//       });
//     }
//     if (!batch_id) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "batch_id is required" 
//       });
//     }
//     if (!board_id) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "board_id is required" 
//       });
//     }
//     // JOIN with teachers table to get the name for the UI "meta" field
//     const [rows] = await db.query(
//       `SELECT s.sub_id, s.name, s.teacher_id, t.name as teacher_name 
//        FROM subjects s
//        LEFT JOIN teachers t ON s.teacher_id = t.id
//        WHERE s.stand_id = ? 
//        ORDER BY s.name ASC`,
//       [stand_id]
//     );

//     return res.json({
//       success: true,
//       count: rows.length,
//       data: rows
//     });

//   } catch (error) {
//     console.error("Fetch subjects error:", error);
//     res.status(500).json({ 
//       success: false, 
//       error: error.message 
//     });
//   }
// };
