
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Home route
app.get("/", (req, res) => {
  res.send("Digital Afterlife API is Running!");
});

// Authentication routes
app.use("/api/auth", require("./routes/authRoutes"));

// Knowledge routes
app.use("/api/knowledge", require("./routes/knowledgeRoutes"));

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
