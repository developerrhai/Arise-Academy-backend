const db = require("../config/db");

// ── CREATE CHAPTER WITH TOPICS ──────────────────────────
exports.createChapter = async (req, res) => {
  const connection = await db.getConnection(); // Use connection for transaction
  try {
    await connection.beginTransaction();
    const { sub_id, name, description, topics } = req.body; 
    // topics expected as: [{ name: "Topic 1", start: "2024-01-01", end: "2024-01-05" }]

    // 1. Insert Chapter
    const [chapResult] = await connection.query(
      "INSERT INTO chapters (sub_id, name, description) VALUES (?, ?, ?)",
      [sub_id, name, description]
    );
    const newChapId = chapResult.insertId;

    // 2. Insert Topics if they exist
    if (topics && topics.length > 0) {
      const topicValues = topics.map(t => [newChapId, t.topic_name, t.start_date, t.end_date]);
      await connection.query(
        "INSERT INTO topics (chap_id, topic_name, start_date, end_date) VALUES ?",
        [topicValues]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, message: "Chapter and Topics created", chap_id: newChapId });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    connection.release();
  }
};

// ── GET CHAPTERS BY HIERARCHY (Includes Topics) ──────────
exports.getChaptersByHierarchy = async (req, res) => {
  try {
    const { sub_id, stand_id, branch_id, batch_id, board_id } = req.query;

    // Base query joining the full hierarchy
    let sql = `
      SELECT 
        c.chap_id, 
        c.name as chapter_name, 
        c.description,
        t.topic_id, 
        t.topic_name, 
        t.start_date, 
        t.end_date
      FROM chapters c
      LEFT JOIN topics t ON c.chap_id = t.chap_id
      INNER JOIN subjects su ON c.sub_id = su.sub_id
      INNER JOIN standards st ON su.stand_id = st.stand_id
      INNER JOIN batches bt ON st.batch_id = bt.batch_id
      WHERE 1=1
    `;

    const params = [];

    // Dynamic Filtering
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

    sql += " ORDER BY c.name ASC, t.start_date ASC";

    const [rows] = await db.query(sql, params);

    // Grouping logic (Topics inside Chapters)
    const chaptersMap = {};
    
    rows.forEach(row => {
      if (!chaptersMap[row.chap_id]) {
        chaptersMap[row.chap_id] = {
          chap_id: row.chap_id,
          name: row.chapter_name,
          description: row.description,
          topics: []
        };
      }
      if (row.topic_id) {
        chaptersMap[row.chap_id].topics.push({
          topic_id: row.topic_id,
          name: row.topic_name,
          start_date: row.start_date,
          end_date: row.end_date
        });
      }
    });

    return res.json({
      success: true,
      count: Object.values(chaptersMap).length,
      data: Object.values(chaptersMap)
    });

  } catch (error) {
    console.error("Fetch chapters hierarchy error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ── UPDATE CHAPTER ──────────────────────────────────────
exports.updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    await db.query(
      "UPDATE chapters SET name=?, description=? WHERE chap_id=?",
      [name, description, id]
    );

    res.json({ success: true, message: "Chapter updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── DELETE CHAPTER ──────────────────────────────────────
exports.deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;
    // Foreign Key ON DELETE CASCADE will handle deleting topics automatically
    await db.query("DELETE FROM chapters WHERE chap_id=?", [id]);
    res.json({ success: true, message: "Chapter and associated topics deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
