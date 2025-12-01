// src/Dashboard.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Hand,
  PlayCircle,
  CalendarDays,
  Clock,
  Users,
  ChevronRight,
  Video,
} from "lucide-react";
import toast from "react-hot-toast";

// Backend base URL from env; fallback to localhost for dev
const API_BASE_URL =
  process.env.REACT_APP_BASE_URL || "http://localhost:3001";

// --- Helpers ---
function toDateTime(dateStr, timeStr) {
  // expects e.g. "2025-11-10", "14:30"
  return new Date(`${dateStr}T${timeStr}:00`);
}

function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, (target?.getTime?.() || 0) - now);
  const s = Math.floor(diff / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { h, m, s: sec, done: diff <= 0 };
}

// ✅ Frontend-only mapping for banners based on title
function getBannerForTitle(title = "") {
  const t = title.toLowerCase();

  // Computer / coding / CS
  if (t.includes("computer") || t.includes("coding") || t.includes("program"))
    return "/images/computer.jpg";

  // Maths
  if (t.includes("math")) return "/images/maths.jpg";

  // Science
  if (t.includes("science") || t.includes("physics") || t.includes("chemistry"))
    return "/images/science.jpg";

  // English / literature
  if (t.includes("english") || t.includes("poem") || t.includes("grammar"))
    return "/images/english.jpg";

  // Social / history / civics
  if (t.includes("history") || t.includes("democracy") || t.includes("civics"))
    return "/images/social.jpg";

  // Fallback generic
  return "https://via.placeholder.com/300x150?text=Class";
}

export function Dashboard() {
  const [streak, setStreak] = useState(5); // reserved for future use
  const [name, setName] = useState("");
  const [continueLearning, setContinueLearning] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load student info & set auth header if token exists
  useEffect(() => {
    try {
      const raw = localStorage.getItem("student");
      const token = localStorage.getItem("token");

      if (raw) {
        const s = JSON.parse(raw);
        setName(s?.name || s?.fullName || s?.firstName || "");
      }

      if (token) {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
    } catch {
      /* ignore parsing errors */
    }
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/dashboards`);
        if (res.data?.success) {
          const data = res.data.data || [];

          // Simple split — you can tweak logic as needed
          setUpcoming(data.filter((d) => d.mode));
          setContinueLearning(data.slice(0, 3));

          setAnnouncements([
            {
              id: "a1",
              title: "Diwali Scholarship Window Extended",
              when: "2h ago",
            },
            {
              id: "a2",
              title: "New Doubt Rooms — Get Answers in 15 mins",
              when: "Yesterday",
            },
            {
              id: "a3",
              title: "App Update: Revamped Practice Analytics",
              when: "2 days ago",
            },
          ]);
        } else {
          setUpcoming([]);
          setContinueLearning([]);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        toast.error(
          err?.response?.data?.error ||
            "Failed to load dashboard data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const nextLive = upcoming[0];
  const cd = useCountdown(
    nextLive ? toDateTime(nextLive.date, nextLive.start) : null
  );

  if (loading)
    return <div className="container py-5">Loading dashboard...</div>;

  return (
    <div>
      {/* Hero / Welcome */}
      <section
        className="py-20"
        style={{
          background:
            "linear-gradient(135deg, #0A2342 0%, #1b3d6b 50%, #2c5aa0 100%)",
          color: "white",
        }}
      >
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="">
              <motion.h1 className="h2 py-4 d-flex h1-lg fw-bold mb-2" layout>
                Welcome back&nbsp;{name ? "," : "!"} {name}&nbsp;
                {name ? "!" : ""}{" "}
                <Hand
                  size={28}
                  className="align-text-bottom ms-3 mt-1"
                  aria-label="hi"
                />
              </motion.h1>
            </div>
          </div>
        </div>
      </section>

      {/* Continue Learning */}
      <section className="py-4">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h5 className="mb-0">Continue Learning</h5>
            <Link
              className="btn btn-outline-warning d-flex small"
              to="/courses"
            >
              View all <ChevronRight />
            </Link>
          </div>
          <div className="row g-3">
            {continueLearning.map((c, i) => (
              <div
                key={c._id || c.id || i}
                className="col-12 col-md-6 col-lg-4"
              >
                <div className="card h-100 shadow-sm border-0">
                  <div className="position-relative">
                    {/* ✅ Image decided ONLY from frontend by title */}
                    <img
                      src={getBannerForTitle(c.title)}
                      alt={c.title}
                      className="card-img-top"
                      style={{ height: 150, objectFit: "cover" }}
                    />
                    <span className="badge bg-dark position-absolute bottom-0 start-0 m-2">
                      {c.duration || "N/A"} left
                    </span>
                    <button className="btn btn-light btn-sm position-absolute bottom-0 end-0 m-2 d-flex align-items-center gap-1">
                      <PlayCircle size={16} /> Resume
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="small text-secondary mb-1">
                      {c.lastLesson || "Last lesson"}
                    </div>
                    <h6 className="mb-2">{c.title}</h6>
                  </div>
                </div>
              </div>
            ))}
            {continueLearning.length === 0 && (
              <div className="col-12">
                <div className="alert alert-info mb-0">
                  No ongoing courses yet. Start learning from the{" "}
                  <Link to="/courses">Courses</Link> page.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Classes */}
      <section className="py-4">
        <div className="container">
          <div className="row g-3">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h5 className="mb-0 fs-4 fw-bold">Upcoming Classes</h5>
                    <Link
                      className="btn btn-outline-primary d-flex small"
                      to="/classes"
                    >
                      View all <ChevronRight />
                    </Link>
                  </div>
                  <div className="row g-3">
                    {upcoming.length === 0 && (
                      <div className="col-12">
                        <div className="alert alert-info mb-0">
                          No upcoming classes scheduled. Check back soon!
                        </div>
                      </div>
                    )}
                    {upcoming.map((u) => (
                      <div className="col-12" key={u._id || u.id}>
                        <UpcomingRow data={u} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Placeholder for future widgets (announcements, streak, etc.) */}
          </div>
        </div>
      </section>
    </div>
  );
}

function UpcomingRow({ data }) {
  const start = toDateTime(data.date, data.start);
  const { h, m, s, done } = useCountdown(start);

  const seats = Number.isFinite(data.seats) && data.seats > 0 ? data.seats : 0;
  const booked = Number.isFinite(data.booked) ? data.booked : 0;
  const ratio = seats > 0 ? Math.min(100, Math.round((booked / seats) * 100)) : 0;

  return (
    <div className="border rounded p-2 p-md-3 mb-2">
      <div className="d-flex gap-3">
        <div className="ratio ratio-16x9" style={{ width: 180 }}>
          {/* ✅ Also using frontend banner logic here */}
          <img
            src={getBannerForTitle(data.title)}
            alt={data.title}
            style={{ objectFit: "cover", borderRadius: 6 }}
          />
        </div>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center justify-content-between">
            <h6 className="mb-0">{data.title}</h6>
            <span className="badge bg-success-subtle text-success">
              {data.mode}
            </span>
          </div>
          <div className="small text-secondary mb-2">
            By {data.teacher || "Mentor"}
          </div>
          <div className="d-flex flex-wrap gap-3 small text-secondary mb-2">
            <span className="d-inline-flex align-items-center gap-1">
              <CalendarDays size={16} />{" "}
              {typeof data.date === "string"
                ? data.date
                : new Date(data.date).toISOString().slice(0, 10)}
            </span>
            <span className="d-inline-flex align-items-center gap-1">
              <Clock size={16} /> {data.start}–{data.end} IST
            </span>
            {seats > 0 && (
              <span className="d-inline-flex align-items-center gap-1">
                <Users size={16} /> {booked}/{seats}
              </span>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="progress flex-grow-1" style={{ height: 6 }}>
              <div
                className="progress-bar"
                style={{ width: `${ratio}%` }}
              />
            </div>
            <span className="small text-secondary">
              {seats > 0 ? `${ratio}% full` : "Seats info NA"}
            </span>
          </div>
          {!done && (
            <div className="mt-2 small alert alert-info py-1 px-2 d-inline-flex align-items-center gap-2">
              <Video size={16} /> Starts in{" "}
              {String(h).padStart(2, "0")}:
              {String(m).padStart(2, "0")}:
              {String(s).padStart(2, "0")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
