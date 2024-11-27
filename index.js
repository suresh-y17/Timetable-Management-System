const conn = require('./mysqlconn.js');
const mysql = require('mysql2');
const express=require('express');
const app=express();
const bodyparser=require('body-parser');
app.set('view engine','ejs');
app.use(bodyparser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  const today = new Date;
  const day=today.toLocaleDateString('en-US',{weekday:'short'});
  const sql = 'SELECT * FROM timetable WHERE Day=?';
  conn.query(sql, [day], (err, result) => {
    if (err) throw err;
    const sql1 = 'SELECT fid,fname FROM faculty';
    conn.query(sql1, (err, result1) => {
      if (err) throw err;
      const currDayTT = [];
      var id;
      result1.forEach(row => {
        id = row['fid'];
        const temp = [];
        const periods = new Array(8).fill([0,0,' ']);
        temp.push(row['fname']);
        const promises = [];
        result.forEach(tt => {
          for (var i = 1; i < 9; i++) {
            const p=i;
            const sql2 = 'SELECT af.sid, s.sname FROM assignedfaculty af JOIN subjects s ON af.sid = s.sid WHERE af.fid=? and af.sid=? and af.year=? and af.section=?';
            const promise = new Promise((resolve, reject) => {
              conn.query(sql2, [id, tt['P' + i], tt['Year'], tt['Section']], (err, result2) => {
                if (err) reject(err);
                if (result2.length > 0) {
                  periods[p - 1] = [tt['Year'],tt['Section'],result2[0]['sname']];
                }
                resolve();
              });
            });
            promises.push(promise);
          }
        });
        Promise.all(promises).then(() => {
          temp.push(periods);
          currDayTT.push(temp);
          if (currDayTT.length === result1.length) {
            res.render('front', { currDayTT: currDayTT });
          }
        }).catch((err) => {
          console.error(err);
        });
      });
    });
  });
});
app.post('/front',(req,res)=>{
  res.render("start");
});
app.post('/start',(req,res)=>{
    if(req.body.admin==='admin'){
        res.render('adminlogin');
     }
    else if(req.body.teacher==='teacher'){
        res.render('login');
    }
    else if(req.body.student==='student'){
        res.render('student');
    }
});
app.get('/register',(req,res)=>{
  res.render('register');
});

app.post('/login',(req,res) => {
  const email = req.body.email;
  const password = req.body.password;
  const sql = 'SELECT fid, year, section FROM faculty WHERE emailid = ? AND password = ?';
  conn.query(sql, [email, password], (err, result) => {
  if (err) {
    res.send("An error occurred");
  }
  else if (result.length==1){
    const fid = result[0].fid;
    const year = result[0].year;
    const section = result[0].section;
    let classTeacher;
    if (year && section){
      classTeacher=true;
      const sql = `SELECT t.Day, t.Year, t.Section, s1.sname AS P1, s2.sname AS P2, s3.sname AS P3, s4.sname AS P4, s5.sname AS P5, s6.sname AS P6, s7.sname AS P7, s8.sname AS P8 FROM timetable t LEFT JOIN subjects s1 ON t.P1 = s1.sid LEFT JOIN subjects s2 ON t.P2 = s2.sid LEFT JOIN subjects s3 ON t.P3 = s3.sid LEFT JOIN subjects s4 ON t.P4 = s4.sid LEFT JOIN subjects s5 ON t.P5 = s5.sid LEFT JOIN subjects s6 ON t.P6 = s6.sid LEFT JOIN subjects s7 ON t.P7 = s7.sid LEFT JOIN subjects s8 ON t.P8 = s8.sid WHERE t.Year = ? AND t.Section = ?ORDER BY CASE t.Day WHEN "Mon" THEN 1 WHEN "Tue" THEN 2 WHEN "Wed" THEN 3 WHEN "Thu" THEN 4 WHEN "Fri" THEN 5 WHEN "Sat" THEN 6 ELSE 7 END;`;
      conn.query(sql, [year, section], (err, result) => {
        if (err) throw err;
        const sql1 = 'SELECT sid,year,section FROM assignedfaculty WHERE fid=?';
        conn.query(sql1, [fid], (err, result1) => {
          if (err) throw err;
          const sec = [];
          const sub = [];
          const sid = [];
          result1.forEach(row => {
            const tuple = [row['year'], row['section']];
            if (!sec.some(item => JSON.stringify(item) === JSON.stringify(tuple))) {
              sec.push(tuple);
            }
            const tuple1 = [row['year'], row['section'],row['sid']];
            if (!sub.some(item => JSON.stringify(item) === JSON.stringify(tuple1))) {
              sub.push(tuple1);
            }
            const tuple2 = [row['sid']];
            if (!sid.some(item => JSON.stringify(item) === JSON.stringify(tuple1))){
              sid.push(tuple2)
            }
          });
          const sql2 = 'SELECT * FROM timetable WHERE (year, section) IN (?)';
          conn.query(sql2, [sec], (err, result3) => {
            if (err) throw err;
            const sql3 = 'SELECT * FROM subjects WHERE (sid) IN (?)';
            conn.query(sql3, [sid], (err,result4) => {
            res.render('display',{
              cT:classTeacher,
              year: year, 
              section: section,
              timetable:result,
              timetable2:result3,
              subj:sub,
              subid:result4
            });
            });
          });
        });
      });
    }
    else{
      classTeacher=false;
      const sql1 = 'SELECT sid,year,section FROM assignedfaculty WHERE fid=?';
      conn.query(sql1, [fid], (err, result1) => {
        if (err) throw err;
        const sec = [];
        const sub = [];
        const sid = [];
        result1.forEach(row => {
          const tuple = [row['year'], row['section']];
          if (!sec.some(item => JSON.stringify(item) === JSON.stringify(tuple))) {
            
            sec.push(tuple);
          }
          const tuple1 = [row['year'], row['section'],row['sid']];
          if (!sub.some(item => JSON.stringify(item) === JSON.stringify(tuple1))) {
           
            sub.push(tuple1);
          }
          const tuple2 = [row['sid']];
          if (!sid.some(item => JSON.stringify(item) === JSON.stringify(tuple1))){
            sid.push(tuple2)
          }
        });
        const sql2 = 'SELECT * FROM timetable WHERE (year, section) IN (?)';
        conn.query(sql2, [sec], (err, result3) => {
          if (err) throw err;
          const sql3 = 'SELECT * FROM subjects WHERE (sid) IN (?)';
          conn.query(sql3, [sid], (err,result4) => {
          res.render('display',{
            cT:classTeacher,
            timetable2:result3,
            subj:sub,
            subid:result4
          });
          });
        });
      });
    }
  }
  else{
    res.send('Invalid email/password');
  }
  });
});
app.post('/student', (req, res) => {
  const year = req.body.year;
  const section = req.body.section;
  
  const sql = 'SELECT t.Day, t.Year, t.Section, s1.sname AS P1, s2.sname AS P2, s3.sname AS P3, s4.sname AS P4, s5.sname AS P5, s6.sname AS P6, s7.sname AS P7, s8.sname AS P8 FROM timetable t LEFT JOIN subjects s1 ON t.P1 = s1.sid LEFT JOIN subjects s2 ON t.P2 = s2.sid LEFT JOIN subjects s3 ON t.P3 = s3.sid LEFT JOIN subjects s4 ON t.P4 = s4.sid LEFT JOIN subjects s5 ON t.P5 = s5.sid LEFT JOIN subjects s6 ON t.P6 = s6.sid LEFT JOIN subjects s7 ON t.P7 = s7.sid LEFT JOIN subjects s8 ON t.P8 = s8.sid WHERE t.Year = ? AND t.Section = ?ORDER BY CASE t.Day WHEN "Mon" THEN 1 WHEN "Tue" THEN 2 WHEN "Wed" THEN 3 WHEN "Thu" THEN 4 WHEN "Fri" THEN 5 WHEN "Sat" THEN 6 ELSE 7 END;';
  conn.query(sql, [year, section], (err, result) => {
    if (err) throw err;
    res.render('view', {
        year: year, 
        section: section, 
        timetable: result });
  });
});
app.post('/register', (req, res) => {
  const name = req.body.name;
  const yrsec = req.body.section;
  const email = req.body.email;
  const pwd = req.body.password;
  
  let year;
  let section;

  if (yrsec === '3A') {
    year = 3;
    section = 'A';
  } else if (yrsec === '3B') {
    year = 3;
    section = 'B';
  } else if (yrsec === '3C') {
    year = 3;
    section = 'C';
  }else{
      year = null;
      section=null;
  }
  const sql = 'INSERT INTO teacher (fname, emailid, password, year, section) VALUES (?, ?, ?, ?, ?)';
  const values = [name, email, pwd, year, section];
  conn.query(sql, values, (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.render('login',{});
    }
  });
});
  app.post('/view', (req, res) => {
        const year = req.body.year;
        const section = req.body.section;
        
        const sql = 'SELECT t.Day, t.Year, t.Section, s1.sname AS P1, s2.sname AS P2, s3.sname AS P3, s4.sname AS P4, s5.sname AS P5, s6.sname AS P6, s7.sname AS P7, s8.sname AS P8 FROM timetable t LEFT JOIN subjects s1 ON t.P1 = s1.sid LEFT JOIN subjects s2 ON t.P2 = s2.sid LEFT JOIN subjects s3 ON t.P3 = s3.sid LEFT JOIN subjects s4 ON t.P4 = s4.sid LEFT JOIN subjects s5 ON t.P5 = s5.sid LEFT JOIN subjects s6 ON t.P6 = s6.sid LEFT JOIN subjects s7 ON t.P7 = s7.sid LEFT JOIN subjects s8 ON t.P8 = s8.sid WHERE t.Year = ? AND t.Section = ?ORDER BY CASE t.Day WHEN "Mon" THEN 1 WHEN "Tue" THEN 2 WHEN "Wed" THEN 3 WHEN "Thu" THEN 4 WHEN "Fri" THEN 5 WHEN "Sat" THEN 6 ELSE 7 END;';
  conn.query(sql, [year, section], (err, result) => {
    if (err) throw err;
    res.render('view', {
        year: year, 
        section: section, 
        timetable: result });
  });
      });
      app.post('/edit', (req, res) => {
        const day = req.body.day;
        if (day) {
          const year = req.body.year;
          const section = req.body.section;
          
          const period = req.body.period;
          const changeTo = req.body.changeTo;
          const sql = `UPDATE timetable SET ${period} = ? WHERE Year = ? AND Section = ? AND Day = ?`;
            conn.query(sql, [changeTo, year, section, day], (err, result) => {
              if (err) throw err;
              
              const getSql = 'SELECT t.Day, t.Year, t.Section, s1.sname AS P1, s2.sname AS P2, s3.sname AS P3, s4.sname AS P4, s5.sname AS P5, s6.sname AS P6, s7.sname AS P7, s8.sname AS P8 FROM timetable t LEFT JOIN subjects s1 ON t.P1 = s1.sid LEFT JOIN subjects s2 ON t.P2 = s2.sid LEFT JOIN subjects s3 ON t.P3 = s3.sid LEFT JOIN subjects s4 ON t.P4 = s4.sid LEFT JOIN subjects s5 ON t.P5 = s5.sid LEFT JOIN subjects s6 ON t.P6 = s6.sid LEFT JOIN subjects s7 ON t.P7 = s7.sid LEFT JOIN subjects s8 ON t.P8 = s8.sid WHERE t.Year = ? AND t.Section = ? ORDER BY CASE t.Day WHEN "Mon" THEN 1 WHEN "Tue" THEN 2 WHEN "Wed" THEN 3 WHEN "Thu" THEN 4 WHEN "Fri" THEN 5 WHEN "Sat" THEN 6 ELSE 7 END;'; // your SQL query
              conn.query(getSql, [year, section], (err, result) => {
               if (err) throw err;
               res.render('edit', {
                   year: year,
                  section: section,
                   timetable: result
                   });
              });
            });      
        } else {
          const year = req.body.year;
          const section = req.body.section;
          
          const getSql = 'SELECT t.Day, t.Year, t.Section, s1.sname AS P1, s2.sname AS P2, s3.sname AS P3, s4.sname AS P4, s5.sname AS P5, s6.sname AS P6, s7.sname AS P7, s8.sname AS P8 FROM timetable t LEFT JOIN subjects s1 ON t.P1 = s1.sid LEFT JOIN subjects s2 ON t.P2 = s2.sid LEFT JOIN subjects s3 ON t.P3 = s3.sid LEFT JOIN subjects s4 ON t.P4 = s4.sid LEFT JOIN subjects s5 ON t.P5 = s5.sid LEFT JOIN subjects s6 ON t.P6 = s6.sid LEFT JOIN subjects s7 ON t.P7 = s7.sid LEFT JOIN subjects s8 ON t.P8 = s8.sid WHERE t.Year = ? AND t.Section = ?ORDER BY CASE t.Day WHEN "Mon" THEN 1 WHEN "Tue" THEN 2 WHEN "Wed" THEN 3 WHEN "Thu" THEN 4 WHEN "Fri" THEN 5 WHEN "Sat" THEN 6 ELSE 7 END;'; // your SQL query
          conn.query(getSql, [year, section], (err, result) => {
            if (err) throw err;
            res.render('edit', {
              year: year,
              section: section,
              timetable: result
            });
          });
        }
      });
        app.post('/admin',(req,res)=>{
          if(req.body.adminid=== '123' && req.body.password==="admin")
          {
            res.render('admin');
          }
          else{
            res.send('Invalid admin');
          }
          });
app.listen(3000,()=>{console.log("server is running")});