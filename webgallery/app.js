/* jshint esversion: 6 */

const path = require("path");
const express = require("express");
const app = express();
const crypto = require("crypto");
const session = require("express-session");
const cookie = require("cookie");
const bodyParser = require("body-parser");

const Datastore = require("nedb"),
  images = new Datastore({
    filename: "db/images.db",
    autoload: true,
    timestampData: true,
  }),
  comments = new Datastore({
    filename: "db/comments.db",
    autoload: true,
    timestampData: true,
  }),
  users = new Datastore({
    filename: "db/users.db",
    autoload: true,
    timestampData: true,
  });

const Image = (function () {
  return function (image, imageFile) {
    this.title = image.title;
    this.author = image.author;
    this.imageFile = imageFile;
  };
})();

const Comment = (function () {
  return function (comment) {
    this.author = comment.author;
    this.content = comment.content;
    this.imageId = comment.imageId;
  };
})();

const isAuthenticated = function (req, res, next) {
  if (!req.username) return res.status(401).end("Access denied");
  next();
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("frontend"));

app.use(
  session({
    secret: "92th97g92c7ny99cn82275nc",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(function (req, res, next) {
  req.username = req.session ? req.session.username : null;
  console.log("HTTP request", req.username, req.method, req.url, req.body);
  next();
});

// curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/signup/
app.post("/signup/", function (req, res, next) {
  const username = req.body.username;
  const password = req.body.password;
  const salt = crypto.randomBytes(16).toString("base64");
  const hash = crypto.createHmac("sha512", salt);
  hash.update(password);
  const saltedHash = hash.digest("base64");

  users.findOne({ _id: username }, function (err, user) {
    if (err) return res.status(500).end(err);
    if (user)
      return res.status(409).end("Username " + username + " already exists");
    users.update(
      { _id: username },
      { _id: username, password: saltedHash, salt: salt },
      { upsert: true },
      function (err) {
        if (err) return res.status(500).end(err);
        req.session.username = req.body.username;
        // initialize cookie
        res.setHeader(
          "Set-Cookie",
          cookie.serialize("username", username, {
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
          })
        );
        return res.json("User " + username + " signed up");
      }
    );
  });
});

// curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/signin/
app.post("/signin/", function (req, res, next) {
  let username = req.body.username;
  const password = req.body.password;
  // retrieve user from the database
  users.findOne({ _id: username }, function (err, user) {
    if (err) return res.status(500).end(err);
    if (!user) return res.status(401).end("Username or password is incorrect");
    const hash = crypto.createHmac("sha512", user.salt);
    hash.update(password);
    const saltedHash = hash.digest("base64");
    if (user.password !== saltedHash)
      return res.status(401).end("Username or password is incorrect");
    req.session.username = req.body.username;
    username = req.session.username;
    // initialize cookie
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("username", username, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      })
    );
    return res.json("User " + username + " signed in");
  });
});

// curl -b cookie.txt -c cookie.txt localhost:3000/signout/
app.get("/signout/", isAuthenticated, function (req, res, next) {
  req.session.destroy();
  res.setHeader(
    "Set-Cookie",
    cookie.serialize("username", "", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week in number of seconds
    })
  );
  res.json("You have signed out");
});

// Create

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

app.post(
  "/api/images/",
  isAuthenticated,
  upload.single("imageFile"),
  function (req, res, next) {
    const image = new Image(
      { author: req.session.username, title: req.body.title },
      req.file
    );
    images.insert(
      new Image(
        { author: req.session.username, title: req.body.title },
        req.file
      ),
      function (err, image) {
        if (err) return res.status(500).end(err);
        return res.json({
          _id: image._id,
          title: image.title,
          author: image.author,
          date: image.createdAt,
        });
      }
    );
  }
);

app.post("/api/comments/", isAuthenticated, function (req, res, next) {
  images.findOne({ _id: req.body.imageId }, function (err, image) {
    if (err) return res.status(500).end(err);
    else if (!image) {
      return res
        .status(404)
        .end("Image ID: " + req.body.imageId + " does not exist");
    } else {
      comments.insert(
        new Comment({
          author: req.session.username,
          content: req.body.content,
          imageId: req.body.imageId,
        }),
        function (err, comment) {
          return res.json({
            _id: comment._id,
            imageId: comment.imageId,
            author: comment.author,
            content: comment.content,
            date: comment.createdAt,
          });
        }
      );
    }
  });
});

// Read

// get all image objects (title, author) without the file
app.get("/api/users/:user/images/", isAuthenticated, function (req, res, next) {
  images
    .find({ author: req.params.user })
    .sort({ createdAt: 1 })
    .exec(function (err, images) {
      if (err) return res.status(500).end(err);
      return res.json(
        images.map(function (image) {
          return {
            _id: image._id,
            title: image.title,
            author: image.author,
            date: image.createdAt,
          };
        })
      );
    });
});

// get single image (imageFile) with the file, by image id
app.get("/api/images/:id", isAuthenticated, function (req, res, next) {
  images.findOne({ _id: req.params.id }, function (err, image) {
    if (err) return res.status(500).end(err);
    else if (!image) {
      return res
        .status(404)
        .end("Image ID: " + req.params.id + " does not exist");
    } else {
      const imageFile = image.imageFile;
      res.setHeader("Content-Type", imageFile.mimetype);
      res.sendFile(__dirname + "\\" + imageFile.path);
    }
  });
});

// get comments by image id
app.get("/api/:id/comments/", isAuthenticated, function (req, res, next) {
  images.findOne({ _id: req.params.id }, function (err, image) {
    if (err) return res.status(500).end(err);
    else if (!image) {
      return res
        .status(404)
        .end("Image ID: " + req.params.id + " does not exist");
    } else {
      comments
        .find({ imageId: req.params.id })
        .sort({ createdAt: 1 })
        .exec(function (err, comments) {
          return res.json(
            comments.map(function (comment) {
              return {
                _id: comment._id,
                imageId: comment.imageId,
                author: comment.author,
                content: comment.content,
                date: comment.createdAt,
              };
            })
          );
        });
    }
  });
});

// get all users
app.get("/api/users/", isAuthenticated, function (req, res, next) {
  users
    .find({})
    .sort({ _id: 1 })
    .exec(function (err, users) {
      if (err) return res.status(500).end(err);
      return res.json(
        users.map(function (user) {
          return {
            _id: user._id,
          };
        })
      );
    });
});

// Delete

app.delete("/api/images/:id", isAuthenticated, function (req, res, next) {
  images.findOne({ _id: req.params.id }, function (err, image) {
    if (err) return res.status(500).end(err);
    if (!image)
      return res
        .status(404)
        .end("Image ID: " + req.params.id + " does not exist");
    if (image.author !== req.session.username)
      return res.status(403).end("Forbidden");
    images.remove({ _id: image._id }, { multi: false }, function (err, num) {
      if (err) return res.status(500).end(err);
      return res.json({
        _id: image._id,
        title: image.title,
        author: image.author,
        date: image.createdAt,
      });
    });
  });
});

app.delete("/api/comments/:id", isAuthenticated, function (req, res, next) {
  comments.findOne({ _id: req.params.id }, function (err, comment) {
    if (err) return res.status(500).end(err);
    if (!comment)
      return res
        .status(404)
        .end("Comment ID: " + req.params.id + " does not exist");
    images.findOne({ _id: comment.imageId }, function (err, image) {
      if (image.author === req.session.username) {
        comments.remove(
          { _id: comment._id },
          { multi: false },
          function (err, num) {
            if (err) return res.status(500).end(err);
            return res.json({
              _id: comment._id,
              imageId: comment.imageId,
              author: comment.author,
              content: comment.content,
              date: comment.createdAt,
            });
          }
        );
      } else if (image.author !== req.session.username) {
        if (comment.author === req.session.username) {
          comments.remove(
            { _id: comment._id },
            { multi: false },
            function (err, num) {
              if (err) return res.status(500).end(err);
              return res.json({
                _id: comment._id,
                imageId: comment.imageId,
                author: comment.author,
                content: comment.content,
                date: comment.createdAt,
              });
            }
          );
        } else {
          return res.status(403).end("Forbidden");
        }
      }
    });
  });
});

app.use("/", express.static(__dirname + "/frontend"));

const http = require("http");
const PORT = process.env.PORT;

http.createServer(app).listen(PORT, function (err) {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
