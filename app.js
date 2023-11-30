const path = require("path");
const fs = require("fs");
const https = require("https");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression")
const morgan = require("morgan");
require("dotenv").config();

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const errorControllers = require("./controllers/errors");
const User = require("./models/user");

const rootDir = require("./util/path");

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@nodejs-shop.hxqr4qd.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const app = express();

const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: "sessions"
});
const csrfProtection = csrf();

// # SSL Server Setup (for https)
// const privateKey = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");

const fileStorage = multer.diskStorage({
    destination: './images/',
    filename: function (req, file, cb) {
        cb(
            null,
            file.fieldname + '-' + Date.now() + path.extname(file.originalname)
        );
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
        cb(null, true);    
    } else {
        cb(null, false);
    }
};

const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), 
    {flags: 'a'}
);

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

app.use(express.static(path.join(rootDir, "public")));
app.use('/images', express.static(path.join(rootDir, "images")));

app.use(session({
    secret: "my secret", 
    resave: false, 
    saveUninitialized: false,
    store: store
}));
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    };
    User.findById(req.session.user._id)
    .then((user => {
        if (!user) {
            return next();
        }
        req.user = user;
        next();
    }))
    .catch(err => {
        throw new Error(err);
    });
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

//app.get("/500", errorControllers.get500);

app.use((error, req, res, next) => {
    console.log(error)
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn
  });
});

app.use(errorControllers.getPageNotFound);

app.use((error, req, res, next) => {
    res.redirect("/500");
})

mongoose.connect(MONGODB_URI) 
.then( result => {
    
    // # Usually set up by hosting provider and usually do not have to write this code yourself.
    // https.createServer({ key: privateKey, cert: certificate}, app)
    //      .listen(process.env.PORT || 3000, () => {
    //          console.log("Server started!")
    //      })
    
    app.listen(process.env.PORT || 3000, () => {
        console.log("Server started!")
    });   ;    
}).catch( err => {
    console.log(err)
});

