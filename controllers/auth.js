const User = require("../models/user");

exports.getLogin = (req, res, next) => {
  // recupera o valor do cookie
  const isLoggedIn = req.get("Cookie").split("=")[1];
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: isLoggedIn
  });
};

exports.postLogin = (req, res, next) => {
  // método que salva um cookie para o usuário logado
  // res.setHeader("Set-Cookie", "loggedIn=true");

  User.findById("5dc3613fec95612d546e2182")
    .then(user => {
      console.log(user);
      req.session.isLoggedIn = true;
      req.session.user = user;
      res.redirect("/");
    })
    .catch(err => console.log(err));
};
