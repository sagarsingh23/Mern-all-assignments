const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken')
const path = require('path')
const app = express();

app.use(express.json());

app.use(authenticateJWT)


const SECRET_KEY = "My_App_Secret";
const EXPIRATION_TIME = "1h";
let ADMINS = [];
let USERS = [];
let COURSES = [];
let PURCHASED_COURSES = {};



function readAllFiles() {

  fs.readFile(path.join(__dirname, "/files/admin.json"), 'utf-8', (err, contents) => {
    if (err) {
      console.log("error: file error");
    }
    ADMINS = JSON.parse(contents);
  })


  fs.readFile(path.join(__dirname, "/files/courses.json"), 'utf-8', (err, contents) => {
    if (err) {
      res.status(500).json({ error: "file error" })
    }
    COURSES = JSON.parse(contents);
  })


  fs.readFile(path.join(__dirname, "/files/users.json"), 'utf-8', (err, contents) => {
    if (err) {
      res.status(500).json({ error: "file error" })
    }
    USERS = JSON.parse(contents);
  })

  fs.readFile(path.join(__dirname, "/files/purchase.json"), 'utf-8', (err, contents) => {
    if (err) {
      res.status(500).json({ error: "file error" })
    }
    PURCHASED_COURSES = JSON.parse(contents);
  })

}

readAllFiles();


function writeInAdminFile(data) {
  fs.writeFile(path.join(__dirname, "/files/admin.json"), data, () => {
    console.log("Writing in Admin.json File")
  })
}


function writeInCourseFile(data) {
  fs.writeFile(path.join(__dirname, "/files/courses.json"), data, () => {
    console.log("Writing in Course.json File")
  });
}

function writeInUserFile(data) {
  fs.writeFile(path.join(__dirname, "/files/users.json"), data, () => {
    console.log("Writing in Users.json File")
  });
}

function writeInPurchaseFile(data) {
  fs.writeFile(path.join(__dirname, "/files/purchase.json"), data, () => {
    console.log("Writing in Purchase.json File")
  });
}



function authenticateJWT(req, res, next) {
  const openRoutes = ['/admin/signup', '/admin/login', '/users/signup', '/users/signup']

  if (openRoutes.includes(req.path)) {
    return next();
  }

  const token = req.headers.authorization;

  if (token && token.includes("Bearer ")) {
    jwt.verify(token.substring(7), SECRET_KEY, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(403).json({ error: 'JWT has Expired' })
        } else {
          return res.status(403).json({ error: 'JWT verification failed' })
        }
      }
      req.tokenDetails = decoded;
      next();
    })
  } else {
    res.status(401).json({ error: 'No jwt found or Bearer missing in jwt' });
  }
}

function signJwt(username) {
  const token = jwt.sign({ username: username }, SECRET_KEY, { expiresIn: EXPIRATION_TIME });
  return token;
}


function checkAdminExist(admin) {
  for (var i = 0; i < ADMINS.length; i++) {
    if (ADMINS[i].username === admin.username && ADMINS[i].password === admin.password) {
      return true;
    }
  }
  return false;
}



function checkUserExist(user) {
  for (var i = 0; i < USERS.length; i++) {
    if (USERS[i].username === user.username && USERS[i].password === user.password) {
      return true;
    }
  }
  return false;
}

// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  let adminCred = {
    username: req.body.username,
    password: req.body.password
  }
  if (!checkAdminExist(adminCred)) {
    let token = signJwt(adminCred.username);
    ADMINS.push({ username: adminCred.username, password: adminCred.password })
    writeInAdminFile(JSON.stringify(ADMINS));
    res.status(201).json({ message: 'Admin created successfully', token: token })
  } else {
    res.status(400).json({ error: "Admin Already Exist With This Username" })
  }
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  let adminCred = {
    username: req.headers.username,
    password: req.headers.password
  }
  if (checkAdminExist(adminCred)) {
    let token = signJwt(adminCred.username);
    res.json({ message: 'Logged in successfully', token: token })
  } else {
    res.status(404).json("Wrong Admin Credentials");
  }
});

app.post('/admin/courses', (req, res) => {
  // logic to create a course
  let courseBody = req.body;
  let course = {
    title: courseBody.title,
    description: courseBody.description,
    price: courseBody.price,
    image: courseBody.image,
    published: courseBody.published,
    courseId: Math.floor(Math.random() * 100000)
  }
  COURSES.push(course)
  writeInCourseFile(JSON.stringify(COURSES));
  res.status(201).json({ message: 'Course created successfully', courseId: course.courseId })
});

app.put('/admin/courses/:courseId', (req, res) => {
  // logic to edit a course
  let adminId = COURSES.findIndex(a => a.courseId === parseInt(req.params.courseId));
  if (adminId === -1) {
    res.status(404).json({
      message: "No Course Found"
    })
  } else {
    COURSES[adminId] = { ...COURSES[adminId], ...req.body };
    res.json({ message: 'Course updated successfully' })
  }
});

app.get('/admin/courses', (req, res) => {
  // logic to get all courses
  res.json(COURSES);
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  let userCred = {
    username: req.body.username,
    password: req.body.password
  }
  if (!checkUserExist(userCred)) {
    let token = signJwt(userCred.username);
    USERS.push({ username: userCred.username, password: userCred.password })
    writeInUserFile(JSON.stringify(USERS));
    res.status(201).json({ message: 'User created successfully', token: token })
  } else {
    res.status(400).json({ error: "User Already Exist With This Username" })
  }
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  let userCred = {
    username: req.headers.username,
    password: req.headers.password
  }
  if (checkUserExist(userCred)) {
    let token = signJwt(userCred.username);
    res.json({ message: 'Logged in successfully', token: token })
  } else {
    res.status(404).json("Wrong User Credentials");
  }
});

app.get('/users/courses', (req, res) => {
  // logic to list all courses
  res.json(COURSES);
});

app.post('/users/courses/:courseId', (req, res) => {
  // logic to purchase a course
  let courseIndex = COURSES.findIndex(c => c.courseId === parseInt(req.params.courseId));
  if (courseIndex === -1) {
    res.status(404).json({
      message: "No Course Found"
    })
  } else {
    if (!PURCHASED_COURSES.hasOwnProperty(req.tokenDetails.username)) {
      PURCHASED_COURSES[req.tokenDetails.username] = [COURSES[courseIndex]];
    } else {
      PURCHASED_COURSES[req.tokenDetails.username] = [...PURCHASED_COURSES[req.tokenDetails.username], COURSES[courseIndex]];
    }
    writeInPurchaseFile(JSON.stringify(PURCHASED_COURSES));
    res.json({ message: 'Course purchased successfully' });
  }
});

app.get('/users/purchasedCourses', (req, res) => {
  // logic to view purchased courses
  res.json({ PURCHASED_COURSES: PURCHASED_COURSES[userCred.username] });
});


app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
