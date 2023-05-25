const express = require("express");
const errorHandler = require("./middleware/errorHandler");
const connectDb = require("./config/dbConnection");
const dotenv = require("dotenv").config();
const cors = require("cors");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("./models/userModel");

connectDb();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use("/api/users", require("./routes/userRoutes"));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server Running on ${PORT}`);
});

app.set("view engine", "ejs");

app.get("/home", (req, res) => {
  res.render("home");
});

// Socket.IO integration

const server = require("http").createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server);

server.listen(4444, () => {
  console.log("SOCKET SERVER RUNNING");
});

io.use((socket, next) => {
  const authHeader = socket.request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("Authorization token missing");
    error.status = 401;
    return next(error);
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      const error = new Error("User is not authorized");
      error.status = 401;
      return next(error);
    }

    const currentUser = await User.findById(decoded.user.id);
    if (!currentUser) {
      const error = new Error("User not found");
      error.status = 401;
      return next(error);
    }
    socket.user = currentUser;
    next();
  });
});

io.on("connection", (socket) => {
  console.log(socket.id);
  console.log("Connected...");

  socket.on("message", (msg) => {
    console.log(msg);
    socket.broadcast.emit("message", msg);
  });

});
