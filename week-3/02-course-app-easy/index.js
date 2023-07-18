const express = require('express');
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];
let PURCHASED_COURSES = {};


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
    ADMINS.push({ username: adminCred.username, password: adminCred.password })
    res.status(201).json({ message: 'Admin created successfully' })
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
    res.json({ message: 'Logged in successfully' })
  } else {
    res.status(404).json("Wrong Admin Credentials");
  }
});

app.post('/admin/courses', (req, res) => {
  // logic to create a course
  let adminCred = {
    username: req.headers.username,
    password: req.headers.password
  }
  let courseBody = req.body;
  if (checkAdminExist(adminCred)) {
    let course = {
      title: courseBody.title,
      description: courseBody.description,
      price: courseBody.price,
      image: courseBody.image,
      published: courseBody.published,
      courseId: Math.floor(Math.random() * 100000)
    }
    COURSES.push(course)
    res.status(201).json({ message: 'Course created successfully', courseId: course.courseId })
  } else {
    res.status(404).json("Wrong Admin Credentials");
  }
});

app.put('/admin/courses/:courseId', (req, res) => {
  // logic to edit a course
  let adminCred = {
    username: req.headers.username,
    password: req.headers.password
  }
  if (!checkAdminExist(adminCred))
    res.status(404).json("Wrong Admin Credentials");

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
  let adminCred = {
    username: req.headers.username,
    password: req.headers.password
  }
  if (checkAdminExist(adminCred)) {
    res.json(COURSES);
  } else {
    res.status(404).json("Wrong Admin Credentials");
  }
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  let userCred = {
    username: req.body.username,
    password: req.body.password
  }
  if (!checkUserExist(userCred)) {
    USERS.push({ username: userCred.username, password: userCred.password })
    res.status(201).json({ message: 'User created successfully' })
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
    res.json({ message: 'Logged in successfully' })
  } else {
    res.status(404).json("Wrong User Credentials");
  }
});

app.get('/users/courses', (req, res) => {
  // logic to list all courses
  let userCred = {
    username: req.headers.username,
    password: req.headers.password
  }
  if (checkUserExist(userCred)) {
    res.json(COURSES);
  } else {
    res.status(404).json("Wrong User Credentials");
  }
});

app.post('/users/courses/:courseId', (req, res) => {
  // logic to purchase a course
  let userCred = {
    username: req.headers.username,
    password: req.headers.password
  }
  if (!checkUserExist(userCred))
    res.status(404).json("Wrong User Credentials");
  else {
    let courseIndex = COURSES.findIndex(c => c.courseId === parseInt(req.params.courseId));
    if (courseIndex === -1) {
      res.status(404).json({
        message: "No Course Found"
      })
    } else {
      if (!PURCHASED_COURSES.hasOwnProperty(userCred.username)) {
        PURCHASED_COURSES[userCred.username] = [COURSES[courseIndex]];
      } else {
        PURCHASED_COURSES[userCred.username] = [...PURCHASED_COURSES[userCred.username], COURSES[courseIndex]];
      }
      res.json({ message: 'Course purchased successfully' });
    }
  }
});

app.get('/users/purchasedCourses', (req, res) => {
  // logic to view purchased courses
  let userCred = {
    username: req.headers.username,
    password: req.headers.password
  }
  if (!checkUserExist(userCred))
    res.status(404).json("Wrong User Credentials");
  else {
    res.json({ PURCHASED_COURSES: PURCHASED_COURSES[userCred.username] });
  }

});


app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
