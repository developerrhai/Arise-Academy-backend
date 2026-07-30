const pool = require('./db');

async function migrate() {
  console.log("Starting migrations...");
  try {
    // 1. Create homework table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homework (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        subject VARCHAR(100) NOT NULL,
        batch VARCHAR(100) NOT NULL,
        teacher_id INT UNSIGNED NOT NULL,
        due_date DATETIME NOT NULL,
        attachment_url VARCHAR(255) NULL,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log("homework table verified/created.");

    // Ensure new fields exist on homework table
    try {
      const [cols] = await pool.query("SHOW COLUMNS FROM homework LIKE 'branch'");
      if (cols.length === 0) {
        await pool.query("ALTER TABLE homework ADD COLUMN branch VARCHAR(100) NULL AFTER batch");
        await pool.query("ALTER TABLE homework ADD COLUMN board VARCHAR(100) NULL AFTER branch");
        await pool.query("ALTER TABLE homework ADD COLUMN standard VARCHAR(100) NULL AFTER board");
        await pool.query("ALTER TABLE homework ADD COLUMN chapter VARCHAR(255) NULL AFTER standard");
        await pool.query("ALTER TABLE homework ADD COLUMN topic VARCHAR(255) NULL AFTER chapter");
        console.log("Added branch, board, standard, chapter, topic columns to homework table.");
      }
    } catch (e) {
      console.warn("Could not alter homework table:", e.message);
    }

    // 2. Create homework_status table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homework_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        homework_id INT NOT NULL,
        student_id INT UNSIGNED NOT NULL,
        status ENUM('Pending', 'Completed', 'Late') DEFAULT 'Completed',
        feedback TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY unique_student_homework (homework_id, student_id)
      ) ENGINE=InnoDB;
    `);
    console.log("homework_status table verified/created.");

    // 3. Create teaching_logs table (expanding teacher_updates logic if needed, or separate table)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teaching_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_date DATE NOT NULL,
        subject VARCHAR(100) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        notes TEXT NULL,
        batch VARCHAR(100) NOT NULL,
        teacher_id INT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
        UNIQUE KEY unique_daily_log (class_date, batch, subject, teacher_id)
      ) ENGINE=InnoDB;
    `);
    console.log("teaching_logs table verified/created.");

    // 4. Create teacher_batches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher_batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT UNSIGNED NOT NULL,
        batch VARCHAR(100) NOT NULL,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
        UNIQUE KEY unique_teacher_batch (teacher_id, batch)
      ) ENGINE=InnoDB;
    `);
    console.log("teacher_batches table verified/created.");

    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

migrate();
