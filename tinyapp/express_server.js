const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(cookieParser());

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

function generateRandomString() {
  // string of 6 random alphanumeric characters
  return Math.random().toString(36).substr(2, 6);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if(longURL) {
    res.redirect(longURL);
  }

  res.status(500);
  res.send();
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const { longURL } = req.body;
  const { shortURL } = req.params;

  if(shortURL && longURL) {
    urlDatabase[shortURL] = longURL;
    res.redirect("/urls/" + shortURL );
  }

  res.status(500);
  res.send();
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.params;
  if(shortURL) {
    delete urlDatabase[shortURL];
  }

  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const { longURL } = req.body;

  if (longURL) {
    const randomString = generateRandomString();
    const templateVars = { shortURL: randomString, longURL};
    urlDatabase[randomString] = longURL;
    res.redirect(`/urls/:${randomString}`, templateVars);
  }

});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { username: req.cookies["username"] ?? "", urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});