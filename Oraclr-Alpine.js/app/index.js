const express = require("express"),
  path = require("path"),
  oracledb = require("oracledb"),
  dbConfig = require("./dbconfig.js"),
  app = express();

const PORT = process.env.PORT || 5001;

app.use(express.static(path.join(__dirname, "public")))
  .use(async (req, res, next) => {
    req.conn = await oracledb.getConnection(dbConfig);
    next();
  })
  .set("views", path.join(__dirname, "views"))
  .engine("html", require("ejs").renderFile)
  .set("view engine", "html")
  .get("/", async (req, res) => {
    const result = await req.conn.execute(`SELECT * FROM student`);
    res.render("index");
  })
  .get("/data/:page", async (req, res) => {
    const page = req.params.page;
    console.log("page >> ", page);
    let sql = ``;
    switch (page) {
      case "1":
        sql = `SELECT DISTINCT(Faculty) FROM recap`;
        break;
      case "2":
        sql = `SELECT DISTINCT(Year) FROM recap ORDER BY year`;
        break;
      case "3":
        sql = `SELECT SID, NAME AS STUDENT_NAME, ROUND(SUM(TOTAL_CREDIT_HOURS * GPA) / SUM(TOTAL_CREDIT_HOURS), 2) AS SURVIVAL_CGPA
                FROM (
                    SELECT RE.SID,R.COURSENAME,S.NAME,
                           CASE
                             WHEN R.COURSENAME NOT LIKE '%Lab%' AND TO_NUMBER(SUBSTR(COURSENAME, -5, 1)) = 0 THEN TO_NUMBER(SUBSTR(COURSENAME, -2, 1))
                             WHEN R.COURSENAME LIKE '%Lab%' THEN TO_NUMBER(SUBSTR(R.COURSENAME, -2, 1))
                             WHEN R.COURSENAME NOT LIKE '%Lab%' THEN TO_NUMBER(SUBSTR(R.COURSENAME, -5, 1))
                           END AS TOTAL_CREDIT_HOURS,
                           SUM(RE.OBTAIN) AS OBTAIN_SUM,
                           CASE
                               WHEN SUM(RE.OBTAIN) >= 95 THEN 4.0
                               WHEN SUM(RE.OBTAIN) >= 91 THEN 3.75
                               WHEN SUM(RE.OBTAIN) >= 87 THEN 3.5
                               WHEN SUM(RE.OBTAIN) >= 83 THEN 3.25
                               WHEN SUM(RE.OBTAIN) >= 79 THEN 3.0
                               WHEN SUM(RE.OBTAIN) >= 75 THEN 2.75
                               WHEN SUM(RE.OBTAIN) >= 72 THEN 2.75
                               WHEN SUM(RE.OBTAIN) >= 69 THEN 2.25
                               WHEN SUM(RE.OBTAIN) >= 66 THEN 2.0
                               WHEN SUM(RE.OBTAIN) >= 64 THEN 1.75
                               WHEN SUM(RE.OBTAIN) >= 62 THEN 1.5
                               WHEN SUM(RE.OBTAIN) >= 60 THEN 1.25
                               ELSE 0.0
                           END AS GPA
                    FROM HEADS H
                    JOIN RECAP R ON R.RECAPID = H.RECAPID
                    JOIN RESULT RE ON RE.HID = H.HID
                    JOIN STUDENT S ON RE.SID = S.SID
                        AND RE.RECAPID = R.RECAPID
                        AND H.HEADER = 'Total'
                        AND RE.OBTAIN >=60
                    GROUP BY RE.SID, R.COURSENAME, S.NAME
                )
                GROUP BY SID, NAME
                ORDER BY SID`;
        break;
      case "4":
        sql = `SELECT SID, NAME AS STUDENT_NAME, ROUND(SUM(TOTAL_CREDIT_HOURS * GPA) / SUM(TOTAL_CREDIT_HOURS), 2) AS CGPA
                FROM ( SELECT RE.SID,R.COURSENAME,S.NAME,
                        CASE
                            WHEN R.COURSENAME NOT LIKE '%Lab%' AND TO_NUMBER(SUBSTR(COURSENAME, -5, 1)) = 0 THEN TO_NUMBER(SUBSTR(COURSENAME, -2, 1))
                            WHEN R.COURSENAME LIKE '%Lab%' THEN TO_NUMBER(SUBSTR(R.COURSENAME, -2, 1))
                            WHEN R.COURSENAME NOT LIKE '%Lab%' THEN TO_NUMBER(SUBSTR(R.COURSENAME, -5, 1))
                        END AS TOTAL_CREDIT_HOURS,
                        SUM(RE.OBTAIN) AS OBTAIN_SUM,
                         CASE
                            WHEN SUM(RE.OBTAIN) >= 95 THEN 4.0
                            WHEN SUM(RE.OBTAIN) >= 91 THEN 3.75
                            WHEN SUM(RE.OBTAIN) >= 87 THEN 3.5
                            WHEN SUM(RE.OBTAIN) >= 83 THEN 3.25
                            WHEN SUM(RE.OBTAIN) >= 79 THEN 3.0
                            WHEN SUM(RE.OBTAIN) >= 75 THEN 2.75
                            WHEN SUM(RE.OBTAIN) >= 72 THEN 2.75
                            WHEN SUM(RE.OBTAIN) >= 69 THEN 2.25
                            WHEN SUM(RE.OBTAIN) >= 66 THEN 2.0
                            WHEN SUM(RE.OBTAIN) >= 64 THEN 1.75
                            WHEN SUM(RE.OBTAIN) >= 62 THEN 1.5
                            WHEN SUM(RE.OBTAIN) >= 60 THEN 1.25
                            ELSE 0.0
                        END AS GPA
                        FROM HEADS H
                        JOIN RECAP R ON R.RECAPID = H.RECAPID
                        JOIN RESULT RE ON RE.HID = H.HID
                        JOIN STUDENT S ON RE.SID = S.SID
                        AND RE.RECAPID = R.RECAPID
                        AND H.HEADER = 'Total'
                        GROUP BY RE.SID, R.COURSENAME, S.NAME
                        )
        GROUP BY SID, NAME
        ORDER BY SID`;
        break;
    }
    console.log("sql >>", sql);
    const result = await req.conn.execute(sql);
    res.status(200).json(result);
  })


  .get("/student", async (req, res) => {
    const result = await req.conn.execute(`SELECT sid,name FROM student`);
    res.status(200).json(result);
  })

  .get("/sidDetail/:sid", async (req, res) => {
    const sid = req.params.sid;
    const result = await req.conn.execute(
      `select s.sid,r.coursename,r.semester,r.year,re.obtain
          FROM Heads H
          JOIN Recap R ON R.recapID = H.recapID
          JOIN Result Re ON Re.HID = H.HID
          join student s on re.sid=s.sid
              AND Re.recapid = R.recapID
              AND H.Header = 'Total'
              AND s.sid = :sid
          GROUP BY s.sid,r.year,r.coursename,re.obtain,r.semester
          order by r.coursename`,
      [sid] // bind value for :sid
    );
    res.status(200).json(result);
  })

  .get("/courseDetail/:sid/:coursename/:semester/:year", async (req, res) => {
    const sid = req.params.sid;
    const coursename = req.params.coursename;
    const semester = req.params.semester;
    const year = req.params.year;
    const result = await req.conn.execute(
      `select s.sid,r.coursename,r.semester,r.year,re.obtain
          FROM Heads H
          JOIN Recap R ON R.recapID = H.recapID
          JOIN Result Re ON Re.HID = H.HID
          join student s on re.sid=s.sid
              AND Re.recapid = R.recapID
              AND H.Header = 'Total'
              AND s.sid = :sid
              AND r.coursename = :coursename
              AND r.semester = :semester
              AND r.year = :year
          GROUP BY s.sid,r.year,r.coursename,re.obtain,r.semester
          order by r.coursename`,
      [sid, coursename, semester, year] // bind value for :sid
    );
    res.status(200).json(result);
  })
  




  // .get("/change/:sid/:coursename/:year/:semester", async (req, res) => {
  //   const sid = req.params.sid;
  //   const coursename = req.params.coursename;
  //   const year = req.params.year;
  //    const semester = req.params.semester;
  //   const result = await req.conn.execute(
  //   `UPDATE Result re
      //   SET re.obtain = 88
      //   WHERE re.recapID = (
      //     SELECT r.recapID
      //     FROM Recap r
      //     JOIN Heads h ON r.recapID = h.recapID
      //     WHERE r.coursename = :coursename
      //     AND h.Header = 'Total'
      //     AND re.recapID = r.recapID
      //     AND r.year = :year
      //     AND r.semester= :semester
      //   )
      //   AND re.sid =:sid`,
      //   [sid,coursename,year,semester]
      //   );
      //   res.status(200).json(result);
      // })

      .post("/saveMark", async (req, res) => {
        //0 sid,1 coursename,2 year,3 semester 4 obtain             
        let col = req.body;
        const result = await req.conn.execute(
          `UPDATE Result re
        SET re.obtain = :obtain WHERE re.recapID = (
          SELECT r.recapID
          FROM Recap r
          JOIN Heads h ON r.recapID = h.recapID
          WHERE r.coursename = :coursename
          AND h.Header = 'Total'
          AND re.recapID = r.recapID
          AND r.year = :year
          AND r.semester= :semester
        ) AND re.sid =:sid`,
          [col[0], col[1], col[2], col[3], col[4]]
        );
        res.status(200).json(result);
      })






      .listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));

















// // myscript.js
// // This example uses Node 8's async/await syntax.

// const oracledb = require('oracledb');

// oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// //const mypw = "hr"  // set mypw to the hr schema password

// async function run() {
//     let connection;

//     try {
//         connection = await oracledb.getConnection({
//             user: "hr",
//             password: "hr",
//             connectString: "localhost/XE",
//         });

//         const result = await connection.execute(
//             `SELECT manager_id, department_id, department_name
//        FROM departments
//        WHERE manager_id = :id`,
//             [103] // bind value for :id
//         );
//         console.log(result.rows);
//     } catch (err) {
//         console.error(err);
//     } finally {
//         if (connection) {
//             try {
//                 await connection.close();
//             } catch (err) {
//                 console.error(err);
//             }
//         }
//     }
// }

//run();

/*
    let sql, binds, options, result;

    connection = await oracledb.getConnection(dbConfig);

    //
    // Create a table
    //

    const stmts = [
      `DROP TABLE no_example`,

      `CREATE TABLE no_example (id NUMBER, data VARCHAR2(20))`
    ];

    for (const s of stmts) {
      try {
        await connection.execute(s);
      } catch (e) {
        if (e.errorNum != 942)
          console.error(e);
      }
    }

    //
    // Insert three rows
    //

    sql = `INSERT INTO no_example VALUES (:1, :2)`;

    binds = [
      [101, "Alpha" ],
      [102, "Beta" ],
      [103, "Gamma" ]
    ];

    // For a complete list of options see the documentation.
    options = {
      autoCommit: true,
      // batchErrors: true,  // continue processing even if there are data errors
      bindDefs: [
        { type: oracledb.NUMBER },
        { type: oracledb.STRING, maxSize: 20 }
      ]
    };

    result = await connection.executeMany(sql, binds, options);

    console.log("Number of rows inserted:", result.rowsAffected);

    //
    // Query the data
    //

    sql = `SELECT * FROM no_example`;

    binds = {};

    // For a complete list of options see the documentation.
    options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,   // query result format
      // extendedMetaData: true,               // get extra metadata
      // prefetchRows:     100,                // internal buffer allocation size for tuning
      // fetchArraySize:   100                 // internal buffer allocation size for tuning
    };

    result = await connection.execute(sql, binds, options);

    console.log("Metadata: ");
    console.dir(result.metaData, { depth: null });
    console.log("Query results: ");
    console.dir(result.rows, { depth: null });
*/
