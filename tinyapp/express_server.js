const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
let cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { findEmail } = require('./helpers');

app.use(cookieSession({
  name: 'session',
  keys: ["ASDASDASDASD123123", "ASdkljhlawerlsadhfkj!@#"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

// Generates random string
const generateRandomString = () => {
  // string of 6 random alphanumeric characters
  return Math.random().toString(36).substr(2, 6);
};

// Function that finds existing email with password
const findEmailPassword = (email, password, dbUsers) => {
  for (const user in dbUsers) {
    if (dbUsers[user].email === email && bcrypt.compareSync(password, dbUsers[user].password)) {
      return dbUsers[user];
    }
  }

  return undefined;
};

// Main user
const users = {
  "asdff": {
    id: "asdff",
    email: "cayetanomarvin@gmail.com",
    password: bcrypt.hashSync("asd123", saltRounds),
  }
};

// Database
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    shortURL: "b2xVn2",
    userID: "asdff"
  },
  "b2xdn2": {
    longURL: "http://www.facebook.ca",
    shortURL: "b2xdn2",
    userID: "asdfi"
  },
};

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/u/:shortURL", (req, res) => {
  const data = urlDatabase[req.params.shortURL];
  if (data) {
    return res.redirect(data.longURL);
  }

  res.status(500);
  res.send();
});

app.get("/register", (req, res) => {
  res.render('urls_register', { error: { emailPassword: false, emailExists: false }});
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const randomID = generateRandomString();

  if (email === "" || password === "") {
    return res.render('urls_register', { error: { emailPassword: true }});
  } else if (findEmail(email, users)) {
    return res.render('urls_register', { error: { emailExists: true }});
  }

  users[randomID] = {
    id: randomID,
    email,
    password: bcrypt.hashSync(password, saltRounds)
  };

  // eslint-disable-next-line
  req.session.user_id = randomID;

  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  if(req.session.user_id) {
    res.redirect('/urls');
  }

  res.render('urls_login', { error: false });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const foundUser = findEmailPassword(email, password, users);

  if (foundUser) {
    // eslint-disable-next-line
    req.session.user_id = foundUser.id;
    res.redirect('/urls');
  }

  res.render('urls_login', { error: { invalidUser: true } })
});

app.post("/urls/:shortURL", (req, res) => {
  const { longURL } = req.body;
  const { shortURL } = req.params;
  const userID = req.session.user_id;

  if (shortURL && longURL && userID === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL] = {
      longURL,
      shortURL,
      userID
    };
    return res.redirect("/urls/" + shortURL);
  }

  res.render('urls_index', { error: true })
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.params;
  const userID = req.session.user_id;

  if (shortURL && userID) {
    if (userID === urlDatabase[shortURL].userID) {
      delete urlDatabase[shortURL];
    }
  }

  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const { longURL } = req.body;

  if (longURL) {
    const randomString = generateRandomString();
    const userID = req.session.user_id;
    urlDatabase[randomString] = { longURL, shortURL: randomString, userID };

    return res.redirect(`/urls/${randomString}`);
  }


});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.render('urls_login', { error: { invalidAccess: true } });
  }

  // eslint-disable-next-line
  let templateVars = {user_email: undefined, urls: urlDatabase};

  if (users[req.session.user_id]) {
    const { email } = users[req.session.user_id];
    templateVars["user_email"] = email;
  }

  res.render("urls_new", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.render('urls_login', { error: { invalidAccess: true } });
  }

  const urls = [];
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === userID) {
      urls.push(urlDatabase[url]);
    }
  }

  // eslint-disable-next-line
  let templateVars = {user_email: undefined, urls, error: false};

  if (users[req.session.user_id]) {
    const { email } = users[req.session.user_id];
    templateVars["user_email"] = email;
  }

  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.render('urls_login', { error: { invalidAccess: true }});
  }

  let templateVars = { user_email: users[userID].email };
  // Comparing the value from the DB userID to the cookies userID
  const { shortURL } = req.params;

  if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
    // eslint-disable-next-line
    templateVars = { ...templateVars, shortURL: req.params.shortURL, data: urlDatabase[req.params.shortURL] };
    res.render("urls_show", templateVars);
  } else {
    res.render('urls_index', { ...templateVars, error: true })
  }
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});