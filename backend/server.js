const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    course: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    }
  },
  {
    timestamps: true
  }
);

const Student = mongoose.model("Student", studentSchema, "students");


// GET - Read all students
app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});


// GET - Read single student
app.get("/api/students/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        error: "Student not found"
      });
    }

    res.json(student);
  } catch (error) {
    res.status(400).json({
      error: "Invalid student ID"
    });
  }
});


// POST - Create student
app.post("/api/students", async (req, res) => {
  try {
    const { name, course, age } = req.body;

    if (!name || !course || age === undefined) {
      return res.status(400).json({
        error: "Name, course and age are required"
      });
    }

    const student = await Student.create({
      name,
      course,
      age
    });

    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});


// PUT - Update student
app.put("/api/students/:id", async (req, res) => {
  try {
    const { name, course, age } = req.body;

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name,
        course,
        age
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!student) {
      return res.status(404).json({
        error: "Student not found"
      });
    }

    res.json(student);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});


// DELETE - Delete student
app.delete("/api/students/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        error: "Student not found"
      });
    }

    res.json({
      message: "Student deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      error: "Invalid student ID"
    });
  }
});


// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "student-backend"
  });
});


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
  });
