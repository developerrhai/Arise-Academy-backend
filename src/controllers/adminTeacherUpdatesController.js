const db = require("../config/db");

exports.getFullSchedule = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      teacher_name, 
      branch_name, 
      subject_name, 
      standard_name, 
      board_name,    
      start_date,    
      end_date      
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const countParams = [];

    // 1. Build Dynamic WHERE Clause
    let filterSql = " WHERE 1=1";

    if (teacher_name) {
      filterSql += " AND t.name LIKE ?";
      const val = `%${teacher_name}%`;
      params.push(val);
      countParams.push(val);
    }
    if (branch_name) {
      filterSql += " AND br.branch_name LIKE ?";
      const val = `%${branch_name}%`;
      params.push(val);
      countParams.push(val);
    }
    if (subject_name) {
      filterSql += " AND su.name LIKE ?";
      const val = `%${subject_name}%`;
      params.push(val);
      countParams.push(val);
    }
    if (standard_name) {
      filterSql += " AND st.name LIKE ?";
      const val = `%${standard_name}%`;
      params.push(val);
      countParams.push(val);
    }
    if (board_name) {
      filterSql += " AND bo.name LIKE ?";
      const val = `%${board_name}%`;
      params.push(val);
      countParams.push(val);
    }
    if (start_date) {
      filterSql += " AND ba.batch_start_date >= ?";
      params.push(start_date);
      countParams.push(start_date);
    }
    if (end_date) {
      filterSql += " AND ba.batch_end_date <= ?";
      params.push(end_date);
      countParams.push(end_date);
    }

    // 2. Count Query 
    // Simplified joins to ensure we count the primary "Leaf" nodes (Subjects/Chapters) 
    // or the primary mapping nodes (Standards/Batches)
    const countSql = `
      SELECT COUNT(*) as total 
      FROM branches br
      LEFT JOIN batches ba ON br.branch_id = ba.branch_id
      LEFT JOIN standards st ON ba.batch_id = st.batch_id
      LEFT JOIN boards bo ON st.board_id = bo.board_id
      LEFT JOIN subjects su ON st.stand_id = su.stand_id
      LEFT JOIN teachers t ON su.teacher_id = t.id
      ${filterSql}
    `;
    const [countRows] = await db.query(countSql, countParams);
    const totalItems = countRows[0].total;

    // 3. Main Query
    const mainSql = `
      SELECT 
        br.branch_name,
        CASE 
          WHEN ba.batch_id IS NOT NULL THEN
            JSON_OBJECT(
              'name', ba.batch_name, 
              'start_time', ba.start_time, 
              'end_time', ba.end_time, 
              'start_date', ba.batch_start_date, 
              'end_date', ba.batch_end_date
            )
          ELSE NULL 
        END AS batch,
        COALESCE(bo.name, 'No Board Assigned') AS board_name,
        COALESCE(st.name, 'No Standard Assigned') AS standard_name,
        su.name AS subject_name,
        t.name AS teacher_name,
        CASE 
          WHEN ch.chap_id IS NOT NULL THEN 
            JSON_OBJECT(
              'name', ch.name,
              'description', ch.description,
              'topics', (
                  SELECT JSON_ARRAYAGG(
                    JSON_OBJECT('name', tp.topic_name, 'start_date', tp.start_date, 'end_date', tp.end_date)
                  ) FROM topics tp WHERE tp.chap_id = ch.chap_id
              )
            )
          ELSE NULL 
        END AS chapter,
        COALESCE(
          (SELECT JSON_ARRAYAGG(
            JSON_OBJECT('title', n.title, 'fileUrl', n.file_url)
          ) FROM notes n WHERE n.chap_id = ch.chap_id),
          JSON_ARRAY()
        ) AS notes
      FROM branches br
      LEFT JOIN batches ba ON br.branch_id = ba.branch_id
      LEFT JOIN standards st ON ba.batch_id = st.batch_id
      LEFT JOIN boards bo ON st.board_id = bo.board_id
      LEFT JOIN subjects su ON st.stand_id = su.stand_id
      LEFT JOIN teachers t ON su.teacher_id = t.id
      LEFT JOIN chapters ch ON su.sub_id = ch.sub_id
      ${filterSql}
      ORDER BY bo.name DESC, br.branch_name ASC, ba.batch_name ASC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);
    const [rows] = await db.query(mainSql, params);

    const formattedData = rows.map(row => ({
      ...row,
      batch: typeof row.batch === 'string' ? JSON.parse(row.batch) : row.batch,
      chapter: typeof row.chapter === 'string' ? JSON.parse(row.chapter) : row.chapter,
      notes: typeof row.notes === 'string' ? JSON.parse(row.notes) : (row.notes || [])
    }));

    res.json({
      success: true,
      data: formattedData,
      pagination: {
        totalItems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error("Filtered Schedule Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
