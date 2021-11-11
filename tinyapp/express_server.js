const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(cookieParser());

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

// Generates random string
const generateRandomString = () => {
  // string of 6 random alphanumeric characters
  return Math.random().toString(36).substr(2, 6);
};

// Main user
const users = {
  "asdff": {
    id: "asdff",
    email: "cayetanomarvin@gmail.com",
    password: "asd123",
  }
};

// Function that finds existing email
const findEmail = (email) => {
  for (const user in users) {
    console.log(user);
    if (users[user].email === email) {
      return true;
    }
  }

  return false;
};

// Function that finds existing email with password
const findEmailPassword = (email, password) => {
  for (const user in users) {
    if (users[user].email === email && users[user].password === password) {
      return users[user];
    }
  }

  return null;
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
    res.redirect(data.longURL);
  }

  res.status(500);
  res.send();
});

app.get("/register", (req, res) => {
  res.render('urls_register');
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const randomID = generateRandomString();

  if (email === "" || password === "" || findEmail(email)) {
    res.status(400);
    res.send();
  }

  console.log(findEmail(email));

  users[randomID] = {
    id: randomID,
    email,
    password
  };

  res.cookie('user_id', randomID);

  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render('urls_login');
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const foundUser = findEmailPassword(email, password);
  if (foundUser) {
    res.cookie("user_id", foundUser.id);
    res.redirect("/urls");
  }

  res.status(403);
  res.send();
});

app.post("/urls/:shortURL", (req, res) => {
  const { longURL } = req.body;
  const { shortURL } = req.params;
  const userID = req.cookies["user_id"];

  if (shortURL && longURL && userID === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL] = {
      longURL,
      shortURL,
      userID
    };
    res.redirect("/urls/" + shortURL);
  }

  res.status(500);
  res.send();
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.params;
  const userID = req.cookies["user_id"];

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
    const userID = req.cookies["user_id"];
    urlDatabase[randomString] = { longURL, shortURL: randomString, userID };

    console.log(urlDatabase);
    res.redirect(`/urls/${randomString}`);
  }


});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect('/login');
  }

  // eslint-disable-next-line
  let templateVars = {user_email: undefined, urls: urlDatabase};

  if (users[req.cookies["user_id"]]) {
    const { email } = users[req.cookies["user_id"]];
    templateVars["user_email"] = email;
  }

  res.render("urls_new", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  if (!userID) {
    res.redirect('/login');
  }

  const urls = [];
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === userID) {
      urls.push(urlDatabase[url]);
    }
  }

  // eslint-disable-next-line
  let templateVars = {user_email: undefined, urls};

  if (users[req.cookies["user_id"]]) {
    const { email } = users[req.cookies["user_id"]];
    templateVars["user_email"] = email;
  }

  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies["user_id"];
  if (!userID) {
    res.redirect('/login');
  }

  // Comparing the value from the DB userID to the cookies userID
  if (urlDatabase[req.params.shortURL].userID === userID) {
    const templateVars = { shortURL: req.params.shortURL, data: urlDatabase[req.params.shortURL] };
    res.render("urls_show", templateVars);
  }

  res.status(403);
  res.send();
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});