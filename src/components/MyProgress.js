// src/MyProgress.js
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Clock,
  Target,
  TrendingUp,
  Flame,
  Trophy,
  BookOpen,
  CheckCircle2,
  Award,
  CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_BASE_URL || "http://localhost:3001";

function minutesToHhMm(min) {
  const safe = Number(min || 0);
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function Sparkline({ data = [], width = 110, height = 32, stroke = "#0d6efd" }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1, max - min);
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const pts = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const last = data[data.length - 1];
  const lastX = (data.length - 1) * stepX;
  const lastY = height - ((last - min) / range) * height;

  return (
    <svg width={width} height={height}>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        points={pts}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.length > 0 && (
        <circle cx={lastX} cy={lastY} r="3" fill={stroke} />
      )}
    </svg>
  );
}

function Donut({
  value = 0,
  size = 140,
  stroke = 12,
  color = "#0d6efd",
  track = "#e9ecef",
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * c;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={track}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="round"
      />
      <g transform={`rotate(90 ${size / 2} ${size / 2})`}>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="22"
          fontWeight="700"
          fill="#212529"
        >
          {Math.round(clamped)}%
        </text>
      </g>
    </svg>
  );
}

export function MyProgress() {
  const [kpis, setKpis] = useState({
    studyMinutes: 0,
    accuracy: 0,
    streak: 0,
    rank: 0,
    totalMinutes: 0,
    completion: 0,
  });
  const [subjects, setSubjects] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [activity, setActivity] = useState([]);
  const [badges, setBadges] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [mentorSessions, setMentorSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("progress:updated", handler);
    return () => window.removeEventListener("progress:updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekTime = minutesToHhMm(kpis.studyMinutes);
  const totalTime = minutesToHhMm(kpis.totalMinutes);

  const heatMax = useMemo(() => {
    const flat = heatmap.flat();
    return flat.length ? Math.max(...flat) : 1;
  }, [heatmap]);

  const colorFor = (v) => {
    if (!v) return "#f1f3f5";
    const alpha = 0.2 + 0.8 * (v / heatMax);
    return `rgba(13,110,253,${alpha.toFixed(2)})`;
  };

  async function refresh() {
    try {
      setLoading(true);
      const rawStudent = localStorage.getItem("student");
      const token = localStorage.getItem("token");
      const student = rawStudent ? JSON.parse(rawStudent) : null;
      const userId = student?.id;

      if (!userId) {
        // no logged-in student; just clear & stop
        setKpis({
          studyMinutes: 0,
          accuracy: 0,
          streak: 0,
          rank: 0,
          totalMinutes: 0,
          completion: 0,
        });
        setEnrolledCourses([]);
        setJoinedClasses([]);
        setMentorSessions([]);
        setSubjects([]);
        setHeatmap([]);
        setActivity([]);
        setBadges([]);
        setLoading(false);
        return;
      }

      if (token) {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const res = await axios.get(`${API_BASE_URL}/api/progress/${userId}`);
      const p =
        res.data?.data && typeof res.data.data === "object"
          ? res.data.data
          : res.data || {};

      const kk = p.kpis || {};

      setKpis({
        studyMinutes: kk.studyMinutes ?? 0,
        accuracy: kk.accuracy ?? 0,
        streak: kk.streak ?? 0,
        rank: kk.rank ?? 0,
        totalMinutes: kk.totalMinutes ?? 0,
        completion: kk.completion ?? 0,
      });
      setEnrolledCourses(
        Array.isArray(p.enrolledCourses) ? p.enrolledCourses : []
      );
      setJoinedClasses(
        Array.isArray(p.joinedClasses) ? p.joinedClasses : []
      );
      setMentorSessions(
        Array.isArray(p.mentorSessions) ? p.mentorSessions : []
      );

      setSubjects(Array.isArray(p.subjects) ? p.subjects : []);
      setHeatmap(Array.isArray(p.heatmap) ? p.heatmap : []);
      setActivity(Array.isArray(p.activity) ? p.activity : []);
      setBadges(Array.isArray(p.badges) ? p.badges : []);
    } catch (err) {
      console.error("Error fetching progress:", err);
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load progress."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container py-4">
      <motion.div
        initial={{ y: -14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-3"
      >
        <h1 className="h3 mb-1">My Progress</h1>
        <div className="text-secondary">
          Track your learning journey, milestones, and targets.
        </div>
      </motion.div>

      {/* KPI CARDS */}
      <div className="row g-3">
        <motion.div
          className="col-12 col-md-6 col-lg-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <div className="text-secondary small">
                  Study Time (This Week)
                </div>
                <div className="h4 mb-0">{weekTime}</div>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(13,110,253,.12)",
                  color: "#0d6efd",
                }}
              >
                <Clock size={24} />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="col-12 col-md-6 col-lg-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <div className="text-secondary small">Accuracy</div>
                <div className="h4 mb-0">{kpis.accuracy}%</div>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(25,135,84,.12)",
                  color: "#198754",
                }}
              >
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="col-12 col-md-6 col-lg-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <div className="text-secondary small">Streak</div>
                <div className="h4 mb-0">{kpis.streak} days</div>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(253,126,20,.12)",
                  color: "#fd7e14",
                }}
              >
                <Flame size={24} />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="col-12 col-md-6 col-lg-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <div className="text-secondary small">Current Rank</div>
                <div className="h4 mb-0">#{kpis.rank}</div>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(111,66,193,.12)",
                  color: "#6f42c1",
                }}
              >
                <Trophy size={24} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subject progress + overall donut (kept commented for now) */}
      {/* 
      <div className="row g-3 mt-1">
        <motion.div className="col-lg-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          ...
        </motion.div>
        <motion.div className="col-lg-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          ...
        </motion.div>
      </div>
      */}

      {/* Weekly Heatmap + Goals */}
      <div className="row g-3 mt-1">
        <motion.div
          className="col-lg-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-2">Weekly Study Heatmap</h5>
              <div className="small text-secondary mb-2">
                Darker = more minutes studied (last 6 weeks)
              </div>
              <div className="d-flex gap-3">
                <div
                  className="d-grid"
                  style={{
                    gridTemplateColumns: `repeat(${heatmap.length || 0}, 16px)`,
                    gap: 6,
                  }}
                >
                  {heatmap.map((col, i) => (
                    <div
                      key={`col-${i}`}
                      className="d-grid"
                      style={{
                        gridTemplateRows: "repeat(7, 16px)",
                        gap: 6,
                      }}
                    >
                      {col.map((v, r) => (
                        <div
                          key={`cell-${i}-${r}`}
                          title={`${(v || 0) * 10} min`}
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            background: colorFor(v),
                          }}
                        />
                      ))}
                    </div>
                  ))}
                  {heatmap.length === 0 && (
                    <div className="small text-secondary">
                      No study data yet — start watching videos or taking tests.
                    </div>
                  )}
                </div>
                <div className="small text-secondary">
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                  <div>Sun</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="col-lg-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="mb-2">Goals</h5>
              <div className="vstack gap-3">
                <Goal
                  label="Study 6h this week"
                  now={kpis.studyMinutes}
                  max={360}
                />
                <Goal
                  label="Accuracy 80%+"
                  now={kpis.accuracy}
                  max={80}
                />
                <Goal
                  label="Maintain 7-day streak"
                  now={kpis.streak}
                  max={7}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enrolled Courses */}
      <div className="row g-3 mt-1">
        <motion.div
          className="col-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h5 className="mb-0">Enrolled Courses</h5>
                <span className="badge bg-secondary-subtle text-secondary">
                  {enrolledCourses.length} enrolled
                </span>
              </div>

              {enrolledCourses.length === 0 ? (
                <div className="text-secondary small">
                  You haven’t enrolled in any course yet — go to Courses and
                  enroll!
                </div>
              ) : (
                <div className="row g-3">
                  {enrolledCourses.map((c, idx) => (
                    <div
                      key={c.courseId || c.id || idx}
                      className="col-12 col-md-6 col-lg-4"
                    >
                      <div className="card h-100 border-0 shadow-sm">
                        {c.thumbnail && (
                          <img
                            src={c.thumbnail}
                            alt={c.title}
                            className="card-img-top"
                            style={{ height: 150, objectFit: "cover" }}
                          />
                        )}
                        <div className="card-body d-flex flex-column">
                          <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                            <span className="badge bg-primary-subtle text-primary">
                              {c.category || "General"}
                            </span>
                            <span className="badge bg-secondary-subtle text-secondary">
                              {c.level || "All"}
                            </span>
                          </div>
                          <h6 className="mb-2">{c.title}</h6>
                          {c.enrolledAt && (
                            <div className="small text-secondary mb-2">
                              Enrolled on{" "}
                              {new Date(c.enrolledAt).toLocaleDateString()}
                            </div>
                          )}

                          <div className="mt-auto">
                            <div className="small text-secondary mb-1">
                              Progress
                            </div>
                            <div className="progress" style={{ height: 6 }}>
                              <div
                                className="progress-bar"
                                style={{ width: "0%" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Joined Classes / Mentor Sessions are kept commented for now */}
      {/*
        ... your commented Joined Classes & Mentor Sessions blocks ...
      */}

      {/* Recent Activity + Achievements */}
      <div className="row g-3 mt-1">
        <motion.div
          className="col-lg-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-2">Recent Activity</h5>
              <ul className="list-group list-group-flush">
                {activity.map((a, idx) => (
                  <li
                    key={a.id || idx}
                    className="list-group-item d-flex align-items-start gap-3"
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: 40,
                        height: 40,
                        background: "#f1f3f5",
                      }}
                    >
                      {a.icon === "quiz" && <Target size={18} />}
                      {a.icon === "class" && <Award size={18} />}
                      {a.icon === "practice" && <TrendingUp size={18} />}
                      {a.icon === "video" && <BookOpen size={18} />}
                      {!a.icon && <CheckCircle2 size={18} />}
                    </div>
                    <div>
                      <div className="fw-semibold">{a.text}</div>
                      <div className="small text-secondary">{a.when}</div>
                    </div>
                  </li>
                ))}
                {activity.length === 0 && (
                  <li className="list-group-item small text-secondary">
                    No activity yet — take your first quiz!
                  </li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="col-lg-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="mb-2">Achievements</h5>
              <div className="vstack gap-2">
                {badges.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className="d-flex align-items-center gap-3 border rounded p-2"
                  >
                    <div
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{
                        width: 36,
                        height: 36,
                        background: `${b.color || "#0d6efd"}22`,
                        color: b.color || "#0d6efd",
                      }}
                    >
                      {/* Using Trophy as default icon */}
                      <Trophy size={18} />
                    </div>
                    <div>
                      <div className="fw-semibold">{b.name}</div>
                      <div className="small text-secondary">{b.desc}</div>
                    </div>
                  </div>
                ))}
                {badges.length === 0 && (
                  <div className="text-secondary small">
                    No badges yet — complete quizzes to unlock achievements.
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Goal({ label, now = 0, max = 100 }) {
  const pct = Math.min(100, Math.round(((now || 0) / (max || 1)) * 100));
  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-1">
        <div className="small">{label}</div>
        <div className="small text-secondary">{pct}%</div>
      </div>
      <div className="progress" style={{ height: 8 }}>
        <div
          className="progress-bar"
          role="progressbar"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
