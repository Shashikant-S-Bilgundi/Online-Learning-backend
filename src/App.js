// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

import Header from "./components/Header.js";
import Footer from "./components/Footer.js";
import { Classes } from "./components/Classes.js";
import { Courses } from "./components/Courses.js";
import { Feedback } from "./components/Feedback.js";
import { Mentor } from "./components/Mentor.js";
import { MyProgress } from "./components/MyProgress.js";
import { Opportunities } from "./components/Opportunities.js";
import { Quizzes } from "./components/Quizzes.js";
import { Resources } from "./components/Resources.js";
import { StudentRegister } from "./components/student-register.js";
import { Dashboard } from "./components/Dashboard.js";
import { Grants } from "./components/Grants.js";
import { StudentLogin } from "./components/StudentLogin.js";
import AITeacher from "./components/AITeacher.js";
import { Toaster } from "react-hot-toast";

function App() {
  const [currentStudent, setCurrentStudent] = useState(null);
  const [authReady, setAuthReady] = useState(false); // ✅ new flag

  useEffect(() => {
    try {
      const raw = localStorage.getItem("student");
      if (raw) {
        const parsed = JSON.parse(raw);
        setCurrentStudent(parsed);
      }

      const token = localStorage.getItem("token");
      if (token) {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
    } catch {
      localStorage.removeItem("student");
      localStorage.removeItem("token");
    } finally {
      setAuthReady(true); // ✅ we have finished checking auth
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("student");
    delete axios.defaults.headers.common.Authorization;
    setCurrentStudent(null);
  };

  const handleLogin = (student, token) => {
    if (token) {
      localStorage.setItem("token", token);
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
    localStorage.setItem("student", JSON.stringify(student));
    setCurrentStudent(student);
  };

  // While auth is not checked, don't render routes that might redirect
  if (!authReady) {
    return (
      <div className="container py-5">
        Checking session...
      </div>
    );
  }

  return (
    <BrowserRouter>
    <Toaster/>
      <Header currentStudent={currentStudent} onLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/mentor" element={<Mentor />} />
        <Route path="/myprogress" element={<MyProgress />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/student-register" element={<StudentRegister />} />

        {/* ✅ Protected route: only decide AFTER authReady is true */}
        <Route
          path="/aiteacher"
          element={
            currentStudent ? (
              <AITeacher userId={currentStudent.id} />
            ) : (
              <Navigate to="/studentlogin" replace />
            )
          }
        />

        <Route
          path="/studentlogin"
          element={<StudentLogin onLogin={handleLogin} />}
        />

        <Route path="/grants" element={<Grants />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
