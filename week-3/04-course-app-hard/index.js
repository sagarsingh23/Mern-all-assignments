
const express = require('express');
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const app = express();

app.use(express.json());
app.use(authenticateJWT)

const SECRET = 'SECe3t'
const EXPIRATION_TIME = "1h";
let ADMINS = [];
let USERS = [];
let COURSES = [];
let PURCHASED_COURSES = {};


//Define mongoose schema

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
})

const adminSchema = new mongoose.Schema({
  username: String,
  password: String
})

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageLink: String,
  published: Boolean
})

//Define mongoose models

const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema)
const Course = mongoose.model('Course', courseSchema)


//Connect to MongoDb
mongoose.connect('mongodb+srv://sagarssn23:sagar1231@cluster0.47rzlvp.mongodb.net/course-selling-app', { useNewUrlParser: true, useUnifiedTopology: true, dbName: "course-selling-app" })


function authenticateJWT(req, res, next) {
  const openRoutes = ['/admin/signup', '/admin/login', '/users/signup', '/users/signup']

  if (openRoutes.includes(req.path)) {
    return next();
  }

  const token = req.headers.authorization;

  if (token && token.includes("Bearer ")) {
    jwt.verify(token.substring(7), SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(403).json({ error: 'JWT has Expired' })
        } else {
          return res.status(403).json({ error: 'JWT verification failed' })
        }
      }
      req.user = decoded;
      next();
    })
  } else {
    res.status(401).json({ error: 'No jwt found or Bearer missing in jwt' });
  }
}

function signJwt(username) {
  const token = jwt.sign({ username: username }, SECRET, { expiresIn: EXPIRATION_TIME });
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
app.post('/admin/signup', async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (admin) {
    res.status(403).json({ message: 'Admin Already Exists' })
  } else {
    const newAdmin = new Admin({ username, password })
    await newAdmin.save();
    const token = jwt.sign({ username, role: 'admin' }, SECRET, { expiresIn: '1h' })
    res.json({ message: "Admin created successfully", token })
  }
});

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.headers;
  const admin = await Admin.findOne({ username, password })

  if (!admin) {
    res.status(403).json({ message: 'Invalid username or password' });
  } else {
    const token = jwt.sign({ username, role: 'admin' }, SECRET, { expiresIn: '1h' })
    res.json({ message: "Logged in successfully", token })
  }
});

app.post('/admin/courses', async (req, res) => {
  // logic to create a course
  const course = new Course(req.body);
  await course.save();
  res.json({ message: 'Course created successfully', courseId: course.id });
});


app.put('/admin/courses/:courseId', async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, { news: true })
  if (course) {
    res.json({ message: 'Course updated successfully' });
  } else {
    res.status(404).json({ message: 'Course not found' })
  }
});

app.get('/admin/courses', async (req, res) => {
  const courses = await Course.find({})
  res.json(courses);
});



// User routes
app.post('/users/signup', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });

  if (user) {
    res.status(403).json({ message: "User Already Exists" })
  } else {
    const newUser = new User({
      username,
      password
    })
    await newUser.save();
    const token = jwt.sign({ username, role: "User" }, SECRET, { expiresIn: '1h' })
    res.status(201).json({ message: 'User created successfully', token: token })
  }
});

app.post('/users/login', (req, res) => {
  const { username, password } = req.headers;
  const user = User.findOne({ username, password });

  if (user) {
    const token = jwt.sign({ username, role: "User" }, SECRET, { expiresIn: '1h' })
    res.json({ message: 'Logged in successfully', token: token })
  } else {
    res.status(403).json({ message: 'Invalid username or password' });
  }
});

app.get('/users/courses', async (req, res) => {
  const courses = await Course.find({});
  res.json(courses);
});

app.post('/users/courses/:courseId', async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (course) {
    const user = await User.findOne({ username: req.user.username });
    if (user) {
      user.purchasedCourses.push(course);
      await user.save();
      res.json({ message: 'Course purchased successfully' });
    } else {
      res.status(403).json({ message: 'User not found' });
    }
  } else {
    res.status(403).json({ message: 'Course not found' });
  }
});

app.get('/users/purchasedCourses', async (req, res) => {
  // logic to view purchased courses
  const user = await User.findOne({ username: req.user.username });
  if (user) {
    res.json({ purchasedCourses: user.purchasedCourses || [] });
  } else {
    res.status(403).json({ message: 'User not found' });
  }
});


app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
