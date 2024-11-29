const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const port = 3001;
const { Server } = require("socket.io");
const server = http.createServer(app);

const route = require("./Router");
const Group = require("./Grouprouter");

app.use(express.static("public"));
app.use(express.json());
app.use(cors());
app.options("*", cors());
app.use("/router", route);
app.use("/Grouprouter", Group);


const { createPool } = require("mysql");

// Create a MySQL connection pool
const pool = createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "chat",
  connectionLimit: 10,
});


const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User connected ${socket.id}`);

  socket.on("join_room", (room, userId) => {
    socket.join(room);
    console.log(`User with ID: ${socket.id} joined room: ${room}`);

    io.to(room).emit("user_joined", userId);
    const selectQuery = "SELECT * FROM chat_messages WHERE room = ?";

    pool.query(selectQuery, [room], (err, res) => {
      if (!err) {
        console.log("SELECT QUERY:", JSON.stringify(res));
        socket.emit("receive_message", res);
      }
    });
  });

  socket.on("send_message", (data) => {
    console.log("Send message", data);
    const { room, username, message, time } = data;
    const dateTime = new Date(time);
    console.log(time, "This is the time");
    console.log(dateTime, "Date time");

    const insertQuery = `INSERT INTO chat_messages (room, username, message, time) VALUES (?, ?, ?, ?)`;

    pool.query(
      insertQuery,
      [room, username, message, dateTime],
      (error, result) => {
        if (error) {
          console.error("Error storing message in the database:", error);
        } else {
          console.log("Message stored in the database:", result);
        }
      }
    );
    io.to(data.room).emit("receive_message", data);

  });

  socket.on("disconnect", () => {
    console.log("User Disconnect", socket.id);
  });
});

const swaggerUi=require('swagger-ui-express')
const swaggerDocument=require('./swagger-output.json')

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
