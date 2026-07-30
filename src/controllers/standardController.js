const db = require("../config/db");

// ── CREATE STANDARD ────────────────────────────────────────
// Now requires both board_id and batch_id
exports.createStandard = async (req, res) => {
  try {
    const { board_id, batch_id, name } = req.body;

    if (!board_id || !batch_id || !name) {
      return res.status(400).json({ success: false, message: "board_id, batch_id, and name are required" });
    }

    const [result] = await db.query(
      "INSERT INTO standards (board_id, batch_id, name) VALUES (?, ?, ?)",
      [board_id, batch_id, name]
    );

    res.status(201).json({ 
      success: true, 
      message: "Standard created", 
      stand_id: result.insertId 
    });
  } catch (err) {
    console.error("Create Standard Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET ALL (With Optional Join for Clarity) ───────────────
exports.getStandards = async (req, res) => {
  try {
    // Joining with boards and batches makes the response much more useful for the UI
    const sql = `
      SELECT * 
      FROM standards
    `;
    const [rows] = await db.query(sql);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET BY BOARD AND BATCH (Hierarchy Filtering) ───────────

exports.getStandardsFiltered = async (req, res) => {
  try {
    const { board_id, batch_id, branch_id } = req.query;

    // We select s.* and join bt to filter by branch_id
    let sql = `
      SELECT 
        s.stand_id, 
        s.name, 
        s.board_id, 
        s.batch_id,
        b.name AS board_name, 
        bt.batch_name 
      FROM standards s
      INNER JOIN batches bt ON s.batch_id = bt.batch_id
      INNER JOIN boards b ON s.board_id = b.board_id
      WHERE 1=1
    `;
    
    const params = [];

    if (board_id) {
      sql += " AND s.board_id = ?";
      params.push(board_id);
    }

    if (batch_id) {
      sql += " AND s.batch_id = ?";
      params.push(batch_id);
    }

    // This now works because of the INNER JOIN batches bt
    if (branch_id) {
      sql += " AND bt.branch_id = ?";
      params.push(branch_id);
    }

    sql += " ORDER BY s.stand_id DESC";

    const [rows] = await db.query(sql, params);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── UPDATE ──────────────────────────────────────────────────
exports.updateStandard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, board_id, batch_id } = req.body;

    const [result] = await db.query(
      "UPDATE standards SET name=?, board_id=?, batch_id=? WHERE stand_id=?",
      [name, board_id, batch_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Standard not found" });
    }

    res.json({ success: true, message: "Standard updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── DELETE ──────────────────────────────────────────────────
exports.deleteStandard = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM standards WHERE stand_id=?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Standard not found" });
    }

    res.json({ success: true, message: "Standard deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
