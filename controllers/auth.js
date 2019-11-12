// para o armazenamento de senha
const bcrypt = require("bcryptjs");
// para gerar o token de reset
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const User = require("../models/user");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        "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"
    }
  })
);

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        req.flash("error", "Invalid email or password.");
        return res.redirect("/login");
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect("/");
            });
          }
          req.flash("error", "Invalid email or password.");
          res.redirect("/login");
        })
        .catch(err => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  User.findOne({ email: email })
    .then(userDoc => {
      if (userDoc) {
        req.flash("error", "E-mail in use");
        return res.redirect("/signup");
      }
      return bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] }
          });
          return user.save();
        })
        .then(result => {
          res.redirect("/login");
          return transporter.sendMail({
            to: email,
            from: "shop@node-complete.com",
            subject: "Signup ok!",
            html: "<h1>You are top top!</h1>"
          });
        })
        .catch(err => console.log(err));
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  // cria um hash aleatório de 32 bytes
  crypto.randomBytes(32, (err, buffer) => {
    // caso tenha erro
    if (err) {
      console.log(`ERROR IN POST RESET::: ${err}`);
      return res.redirect("/reset");
    }
    // caso tenha sucesso
    // converte os 32 bytes aleatórios em hexa para string
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          res.flash("error", "User not found");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        transporter.sendMail({
          to: req.body.email,
          from: "shop@node-complete.com",
          subject: "Password Reset",
          html: `
            <p>Password Reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link!</a></p>

          `
        });
        return res.redirect("/login");
      })
      .catch(err => console.log(`ERROR IN POST RESET::: ${err}`));
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  // $gt == greater then (data de expiração maior do que a data de agora)
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      if (!user) {
        res.flash("error", "Invalid Token");
        return res.redirect("/reset");
      }
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        userID: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => console.log(`ERROR IN GET NEW PASSWORD::: ${err}`));
};

exports.postNewPassword = (req, res, next) => {
  const { password, userID, passwordToken } = req.body;

  User.findOne({
    _id: userID,
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() }
  })
    .then(user => {
      if (!user) {
        res.flash("error", "Invalid Token or user");
        return res.redirect("/reset");
      }
      bcrypt.hash(password, 12).then(hashedPassword => {
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;
        return user.save();
      });
    })
    .then(result => {
      res.redirect("/login");
    })
    .catch(err => console.log(`ERROR IN POST NEW PASSWORD::: ${err}`));
};
