const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(bodyParser.json());
app.use(cors());

mongoose
  .connect("mongodb://localhost:27017/quizApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).send({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).send({ success: false, message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).send({ success: true, message: "User registered successfully" });
  } catch (err) {
    res.status(500).send({ success: false, message: "Error registering user", error: err });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).send({ success: false, message: "All fields are required" });
    }

    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ username }, "secretkey", { expiresIn: "1h" });
      res.send({ success: true, token });
    } else {
      res.status(401).send({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).send({ success: false, message: "Error during login", error: err });
  }
});

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answers: [
    {
      text: { type: String, required: true },
      correct: { type: Boolean, required: true },
    },
  ],
});

const Question = mongoose.model("Question", questionSchema);

app.post("/add-questions", async (req, res) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).send({ success: false, message: "Invalid questions data" });
    }

    await Question.insertMany(questions);
    res.status(201).send({ success: true, message: "Questions added successfully" });
  } catch (err) {
    res.status(500).send({ success: false, message: "Error adding questions", error: err });
  }
});

app.get("/questions", async (req, res) => {
  try {
    const questions = await Question.find();
    res.status(200).send(questions);
  } catch (err) {
    res.status(500).send({ success: false, message: "Error fetching questions", error: err });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
