const db = require("../config/db");


// CREATE
exports.createNote = async (req, res) => {
  try {
    const { chap_id, title, file_url } = req.body;

    const [result] = await db.query(
      "INSERT INTO notes (chap_id, title, file_url) VALUES (?, ?, ?)",
      [chap_id, title, file_url]
    );

    res.json({ message: "Note created", note_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL
exports.getNotes = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM notes");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, file_url } = req.body;

    await db.query(
      "UPDATE notes SET title=?, file_url=? WHERE note_id=?",
      [title, file_url, id]
    );

    res.json({ message: "Note updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM notes WHERE note_id=?", [id]);

    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.getNotesByHierarchy = async (req, res) => {
  try {
    // Using req.query is usually better for filters than req.params
    const { chap_id, sub_id, stand_id, branch_id, batch_id, board_id } = req.query;

    let sql = `
      SELECT 
        n.note_id,
        n.title,
        n.file_url,
        n.created_at,
        c.name as chapter_name,
        su.name as subject_name
      FROM notes n
      INNER JOIN chapters c ON n.chap_id = c.chap_id
      INNER JOIN subjects su ON c.sub_id = su.sub_id
      INNER JOIN standards st ON su.stand_id = st.stand_id
      INNER JOIN batches bt ON st.batch_id = bt.batch_id
      WHERE 1=1
    `;

    const params = [];

    // Apply dynamic filters based on provided IDs
    if (chap_id) {
      sql += " AND n.chap_id = ?";
      params.push(chap_id);
    }
    if (sub_id) {
      sql += " AND c.sub_id = ?";
      params.push(sub_id);
    }
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

    sql += " ORDER BY n.created_at DESC";

    const [rows] = await db.execute(sql, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });

  } catch (error) {
    console.error("Fetch notes error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
