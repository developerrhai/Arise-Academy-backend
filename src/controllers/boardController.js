const db = require("../config/db");

/*
CREATE BOARD
*/
exports.createBoard = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Board name is required" });
    }

    const [result] = await db.execute(
      "INSERT INTO boards (name) VALUES (?)",
      [name]
    );
    res.status(201).json({
      message: "Board created successfully",
      board_id: result.insertId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/*
GET ALL BOARDS
*/
exports.getBoards = async (req, res) => {
  try {

    const [rows] = await db.execute(
      "SELECT * FROM boards"
    );

    res.json(rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/*
GET BOARD BY ID
*/
exports.getBoardById = async (req, res) => {
  try {

    const { id } = req.params;

    const [rows] = await db.execute(
      "SELECT * FROM boards WHERE board_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Board not found" });
    }

    res.json(rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/*
UPDATE BOARD
*/
exports.updateBoard = async (req, res) => {
  try {

    const { id } = req.params;
    const { name } = req.body;

    const [result] = await db.execute(
      "UPDATE boards SET name = ? WHERE board_id = ?",
      [name, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Board not found" });
    }

    res.json({ message: "Board updated successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/*
DELETE BOARD
*/
exports.deleteBoard = async (req, res) => {
  try {

    const { id } = req.params;

    const [result] = await db.execute(
      "DELETE FROM boards WHERE board_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Board not found" });
    }

    res.json({ message: "Board deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
