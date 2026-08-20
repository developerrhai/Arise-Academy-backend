const db = require("../config/db");
const { s3 } = require("../config/s3");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

// ── 1. GET MESSAGE HISTORY ─────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { id: userId, role } = req.user;
    const { page = 1, limit = 50 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Check membership unless admin
    if (role !== 'ADMIN') {
      const [membership] = await db.query(
        `SELECT id FROM chat_group_members WHERE group_id = ? AND user_id = ? AND user_role = ? AND removed_at IS NULL`,
        [groupId, userId, role]
      );
      if (membership.length === 0) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    // Fetch messages (newest first, but we usually display oldest first, so frontend handles reverse)
    const [messages] = await db.query(
      `SELECT id, group_id, sender_id, sender_role, sender_name, message_text, attachment_url, attachment_name, attachment_type, created_at 
       FROM chat_messages 
       WHERE group_id = ? AND is_deleted = FALSE 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [groupId, parseInt(limit), offset]
    );

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error("Get Messages Error:", err);
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
};

// NOTE: Creating messages is primarily handled via Socket.io to ensure real-time broadcast.
// If a REST fallback is needed, it would look like this:
exports.createMessage = async (req, res) => {
  try {
    const { groupId, messageText } = req.body;
    const { id: userId, role, name } = req.user;

    // Check membership
    const [membership] = await db.query(
      `SELECT id FROM chat_group_members WHERE group_id = ? AND user_id = ? AND user_role = ? AND removed_at IS NULL`,
      [groupId, userId, role]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const [result] = await db.query(
      `INSERT INTO chat_messages (group_id, sender_id, sender_role, sender_name, message_text) 
       VALUES (?, ?, ?, ?, ?)`,
      [groupId, userId, role, name || 'Unknown', messageText]
    );

    res.status(201).json({ success: true, message: "Message sent", data: { id: result.insertId } });
  } catch (err) {
    console.error("Create Message Error:", err);
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
};

// ── 3. DELETE MESSAGE (ADMIN ONLY) ───────────────────────
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { role } = req.user;

    if (role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Only admins can delete messages" });
    }

    // Check if message exists and get attachment info
    const [rows] = await db.query(`SELECT group_id, attachment_url FROM chat_messages WHERE id = ?`, [messageId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const { group_id, attachment_url } = rows[0];

    // If there is an attachment, delete it from S3
    if (attachment_url) {
      try {
        // Extract the Key from the URL
        // URL format: https://[bucket].s3.[region].amazonaws.com/[key]
        const urlParts = attachment_url.split('.amazonaws.com/');
        if (urlParts.length > 1) {
          const key = decodeURIComponent(urlParts[1]);
          const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key
          });
          await s3.send(command);
        }
      } catch (s3Error) {
        console.error("Failed to delete from S3:", s3Error);
        // Continue to delete from DB even if S3 fails
      }
    }

    // Hard delete from DB
    await db.query(`DELETE FROM chat_messages WHERE id = ?`, [messageId]);

    // Emit socket event to all clients to remove the message
    const { getIO } = require("../config/socket");
    const io = getIO();
    io.to(`group_${group_id}`).emit("delete_message", { messageId: parseInt(messageId), groupId: group_id });

    res.json({ success: true, message: "Message deleted successfully" });
  } catch (err) {
    console.error("Delete Message Error:", err);
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
};

