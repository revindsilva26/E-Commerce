if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const mysql = require("mysql");
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "project"
});
db.connect(err => {
  if (err) {
    throw err;
  }
  console.log("Mysql Connected");
});

const initializePassport = require("./passport-config");
var result1 = [];
initializePassport(
  passport,
  email => result1.find(user => user.email === email),

  customerid => result1.find(user => user.customerid === customerid)
);

app.set("view-engine", "ejs");
app.use(express.static("css"));
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.get("/beforelogin", (req, res) => {
  let sql = "SELECT * FROM customer";
  db.query(sql, async (err, result) => {
    if (err) throw err;
    result1 = await result;
    console.log(result1);
    res.render("beforelogin.ejs");
  });
});

app.get("/dashboard", checkAuthenticated, (req, res) => {
  res.render("dashboard.ejs");
});

app.get("/sp", (req, res) => {
  let sql = `CALL filterTodo()`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send("DONE AND DUSTED");
  });
});

app.get("/phones", checkAuthenticated, (req, res) => {
  let sql = "SELECT productname,unitprice FROM product";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("Phones.ejs", {
      name1: result[0].productname,
      name2: result[1].productname,
      name3: result[2].productname,
      price1: result[0].unitprice,
      price2: result[1].unitprice,
      price3: result[2].unitprice
    });
    console.log(result[0]);
  });
});
app.get("/laptops", checkAuthenticated, (req, res) => {
  let sql = "SELECT productname,unitprice FROM product";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("Laptops.ejs", {
      name1: result[4].productname,
      name2: result[5].productname,
      name3: result[6].productname,
      price1: result[4].unitprice,
      price2: result[5].unitprice,
      price3: result[6].unitprice
    });
    console.log(result[0]);
  });
});
app.post("/phones", checkAuthenticated, (req, res) => {
  console.log(req.body.price);
  let post = {
    totalprice: req.body.price
  };
  let sql = "INSERT INTO cart SET ?";
  let query = db.query(sql, post, (err, result) => {
    if (err) throw err;
    console.log(result);
  });
  res.redirect("/phones");
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  checkNotAuthenticated,

  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true
  })
);
app.get("/", checkNotAuthenticated, (req, res) => {
  res.render("index.ejs");
});

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 5);
    let post = {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    };
    let sql = "INSERT INTO customer SET ?";
    let query = db.query(sql, post, (err, result) => {
      if (err) throw err;
      console.log(result);
    });
    res.redirect("/beforelogin");
  } catch (e) {
    res.redirect("/register");
  }
});

app.delete("/logout", (req, res) => {
  req.logOut();
  res.redirect("/login");
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/dashboard");
  }
  next();
}

app.listen(3000);
