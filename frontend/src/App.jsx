
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const emptyForm = {
  name: "",
  course: "",
  age: ""
};

function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch students from the backend
  const fetchStudents = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await axios.get("/api/students");
      setStudents(response.data);
      setError("");
    } catch {
      setError("Unable to load students.");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  // Load students when the component mounts
  useEffect(() => {
    let cancelled = false;

    const loadStudents = async () => {
      try {
        const response = await axios.get("/api/students");

        if (!cancelled) {
          setStudents(response.data);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load students.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStudents();

    return () => {
      cancelled = true;
    };
  }, []);

  // Get unique courses
  const courses = useMemo(() => {
    return [...new Set(students.map((student) => student.course))];
  }, [students]);

  // Search and filter students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        student.name.toLowerCase().includes(searchText) ||
        student.course.toLowerCase().includes(searchText);

      const matchesCourse =
        courseFilter === "All" || student.course === courseFilter;

      return matchesSearch && matchesCourse;
    });
  }, [students, search, courseFilter]);

  // Calculate average age
  const averageAge =
    students.length > 0
      ? (
          students.reduce(
            (total, student) => total + Number(student.age),
            0
          ) / students.length
        ).toFixed(1)
      : "0";

  // Open the add student modal
  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  // Open the edit student modal
  const openEditModal = (student) => {
    setForm({
      name: student.name,
      course: student.course,
      age: String(student.age)
    });

    setEditingId(student._id);
    setError("");
    setShowModal(true);
  };

  // Close the modal
  const closeModal = () => {
    if (!saving) {
      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);
    }
  };

  // Handle form input changes
  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  // Add or update a student
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.course.trim() || !form.age) {
      setError("Please fill in all fields.");
      return;
    }

    if (Number(form.age) < 1 || Number(form.age) > 100) {
      setError("Age must be between 1 and 100.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const data = {
        name: form.name.trim(),
        course: form.course.trim(),
        age: Number(form.age)
      };

      if (editingId) {
        await axios.put(`/api/students/${editingId}`, data);
      } else {
        await axios.post("/api/students", data);
      }

      await fetchStudents(false);

      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete a student
  const deleteStudent = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this student?"
    );

    if (!confirmed) return;

    try {
      await axios.delete(`/api/students/${id}`);
      await fetchStudents(false);
    } catch {
      setError("Unable to delete student.");
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="brand">🎓 StudentHub Version 3</div>
          <p>Student Management System</p>
        </div>

        <button className="add-button" onClick={openAddModal}>
          + Add Student
        </button>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <span className="eyebrow">COLLEGE DATABASE</span>
            <h1>Manage your students.</h1>
            <p>
              Add, update, search and manage student records from one simple
              dashboard.
            </p>
          </div>
        </section>

        {error && !showModal && (
          <div className="error-banner">{error}</div>
        )}

        <section className="stats">
          <div className="stat-card">
            <span>Total Students</span>
            <strong>{students.length}</strong>
          </div>

          <div className="stat-card">
            <span>Courses</span>
            <strong>{courses.length}</strong>
          </div>

          <div className="stat-card">
            <span>Average Age</span>
            <strong>{averageAge}</strong>
          </div>
        </section>

        <section className="content-card">
          <div className="toolbar">
            <div className="search-box">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
            >
              <option value="All">All Courses</option>

              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="state">
              <div className="spinner"></div>
              <p>Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="state">
              <div className="empty-icon">📚</div>
              <h3>No students found</h3>
              <p>Try another search or add a new student.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Age</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student._id}>
                      <td>
                        <div className="student-info">
                          <div className="avatar">
                            {student.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <strong>{student.name}</strong>
                            <small>Student</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="course-badge">
                          {student.course}
                        </span>
                      </td>

                      <td>{student.age}</td>

                      <td>
                        <div className="actions">
                          <button
                            className="edit"
                            onClick={() => openEditModal(student)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete"
                            onClick={() => deleteStudent(student._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer>
        <span>StudentHub</span>
        <span>MERN Stack • Dockerized Application</span>
      </footer>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  {editingId ? "UPDATE RECORD" : "NEW RECORD"}
                </span>

                <h2>{editingId ? "Edit Student" : "Add Student"}</h2>
              </div>

              <button className="close" onClick={closeModal}>
                ×
              </button>
            </div>

            {error && <div className="modal-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <label>
                Student Name
                <input
                  name="name"
                  type="text"
                  placeholder="Enter student name"
                  value={form.name}
                  onChange={handleChange}
                />
              </label>

              <label>
                Course
                <input
                  name="course"
                  type="text"
                  placeholder="e.g. BCA"
                  value={form.course}
                  onChange={handleChange}
                />
              </label>

              <label>
                Age
                <input
                  name="age"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Enter age"
                  value={form.age}
                  onChange={handleChange}
                />
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Student"
                    : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
