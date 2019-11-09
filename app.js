const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// importa a funcionalidade de session do express
const session = require("express-session");
// conecta a session com o mongo
const mongoDBstore = require("connect-mongodb-session")(session);

const errorController = require("./controllers/error");
const User = require("./models/user");

const MONGO_DB_URI =
  "mongodb+srv://mnikkel-mongo:0204@cluster0-ob6d3.mongodb.net/shop";

const app = express();
const store = new mongoDBstore({
  uri: MONGO_DB_URI,
  collection: "sessions"
});

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
// consfigura a session, evitando que seja salvo sem necessidade (por isso dos false)
app.use(
  session({
    secret: "alguma string longa",
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(MONGO_DB_URI)
  .then(result => {
    User.findOne().then(user => {
      if (!user) {
        const user = new User({
          name: "Max",
          email: "max@test.com",
          cart: {
            items: []
          }
        });
        user.save();
      }
    });
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
