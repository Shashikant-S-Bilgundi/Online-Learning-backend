// src/Mentor.js
import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MapPin,
  Languages,
  BookOpen,
  Video,
  Clock,
  Award,
  Users,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_BASE_URL || "http://localhost:3001";

const SUBJECTS = ["All", "Physics", "Chemistry", "Biology", "Maths", "English"];
const SORTERS = [
  { key: "popular", label: "Most Sessions" },
  { key: "rating", label: "Highest Rated" },
  { key: "priceLow", label: "Price: Low to High" },
  { key: "priceHigh", label: "Price: High to Low" },
];

export function Mentor() {
  const [q, setQ] = useState("");
  const [subj, setSubj] = useState("All");
  const [city] = useState("All"); // reserved for future city filter
  const [sort, setSort] = useState("popular");
  const [active, setActive] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMentors() {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (token) {
          axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        }

        const res = await axios.get(`${API_BASE_URL}/api/mentors`);
        let incoming;
        if (Array.isArray(res.data)) {
          incoming = res.data;
        } else if (res.data?.success) {
          incoming = res.data.data || [];
        } else {
          incoming = res.data?.data || [];
        }
        setMentors(Array.isArray(incoming) ? incoming : []);
      } catch (err) {
        console.error("Error fetching mentors:", err);
        toast.error(
          err?.response?.data?.error ||
            "Failed to load mentors. Please try again."
        );
        setMentors([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMentors();
  }, []);

  const filtered = useMemo(() => {
    let out = mentors.filter((m) => {
      const haystackSubjects = (m.subjects || []).join(" ").toLowerCase();
      const matchQ =
        !q.trim() ||
        m.name.toLowerCase().includes(q.toLowerCase()) ||
        haystackSubjects.includes(q.toLowerCase());

      const matchSub =
        subj === "All" || haystackSubjects.includes(subj.toLowerCase());

      const matchCity = city === "All" || m.city === city;

      return matchQ && matchSub && matchCity;
    });

    out = [...out]; // avoid accidental mutation

    switch (sort) {
      case "rating":
        out.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "priceLow":
        out.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "priceHigh":
        out.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      default:
        // popular by sessions
        out.sort((a, b) => (b.sessions || 0) - (a.sessions || 0));
    }
    return out;
  }, [mentors, q, subj, city, sort]);

  return (
    <div>
      <section
        className="py-5"
        style={{
          background: "linear-gradient(135deg,#0A2342,#1b3d6b,#2c5aa0)",
          color: "white",
        }}
      >
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <motion.h1
                className="display-6 fw-bold mb-1"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                Find your perfect mentor
              </motion.h1>
              <motion.p
                className="mb-0"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
              >
                1:1 guidance, exam strategies, and doubt-solving—learn faster
                with experts.
              </motion.p>
            </div>
            <div className="col-lg-5">
              <motion.div
                className="card border-0 shadow-lg"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="card-body p-3 p-sm-4">
                  <div className="row g-2">
                    <div className="col-12 col-md-5">
                      <input
                        className="form-control"
                        placeholder="Search mentor / topic…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <select
                        className="form-select"
                        value={subj}
                        onChange={(e) => setSubj(e.target.value)}
                      >
                        {SUBJECTS.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <select
                        className="form-select"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        {SORTERS.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="small mt-2 opacity-75">
                    Showing <strong>{filtered.length}</strong> of{" "}
                    {mentors.length} mentors
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          {loading && (
            <div className="mb-3 text-secondary">Loading mentors…</div>
          )}
          <AnimatePresence mode="popLayout">
            <div className="row g-4">
              {!loading &&
                filtered.map((m, i) => (
                  <motion.div
                    key={m._id || m.id || `${m.name}-${i}`}
                    className="col-12 col-md-6 col-lg-4"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                  >
                    <div className="card h-100 shadow-sm border-0">
                      <div className="position-relative">
                        <img
                          src={m.photo}
                          alt={m.name}
                          className="card-img-top"
                          style={{ height: 210, objectFit: "cover" }}
                        />
                        {m.tag && (
                          <span className="badge bg-warning text-dark position-absolute top-0 start-0 m-2">
                            {m.tag}
                          </span>
                        )}
                        {m.availability && (
                          <span className="badge bg-success-subtle text-success position-absolute top-0 end-0 m-2">
                            <CheckCircle2 size={14} className="me-1" />{" "}
                            {m.availability}
                          </span>
                        )}
                      </div>
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex align-items-start justify-content-between">
                          <div>
                            <h5 className="card-title mb-1">{m.name}</h5>
                            <div className="small text-secondary d-flex align-items-center gap-2">
                              <Stars rating={m.rating || 0} />
                              <span>
                                {m.rating?.toFixed(1) || "0.0"}(
                                {m.reviews ?? 0})
                              </span>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-semibold">
                              ₹{m.price?.toLocaleString() || 0}
                            </div>
                            <div className="small text-secondary">
                              per 45 min
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 small text-secondary">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <BookOpen size={16} />{" "}
                            {(m.subjects || []).join(" • ")}
                          </div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <Languages size={16} />{" "}
                            {(m.languages || []).join(", ")}
                          </div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <MapPin size={16} /> {m.city}
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <Users size={16} />{" "}
                            {(m.sessions || 0).toLocaleString()} sessions
                          </div>
                        </div>

                        <div className="mt-3 d-flex flex-wrap gap-2">
                          <span className="badge bg-primary-subtle text-primary">
                            <Video size={14} className="me-1" /> Live 1:1
                          </span>
                          <span className="badge bg-secondary-subtle text-secondary">
                            <CalendarDays size={14} className="me-1" /> Slots
                          </span>
                          <span className="badge bg-info-subtle text-info">
                            <Award size={14} className="me-1" /> Verified
                          </span>
                        </div>

                        <div className="mt-auto d-grid gap-2 pt-3">
                          <button
                            className="btn btn-primary"
                            onClick={() => setActive(m)}
                          >
                            Book a Session
                          </button>
                          <button className="btn btn-outline-secondary">
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              {!loading && filtered.length === 0 && (
                <div className="col-12">
                  <div className="alert alert-light border">
                    No mentors found. Try changing subject or search term.
                  </div>
                </div>
              )}
            </div>
          </AnimatePresence>
        </div>
      </section>

      <AnimatePresence>
        {active && (
          <BookingModal
            mentor={active}
            onClose={() => setActive(null)}
            apiBaseUrl={API_BASE_URL}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Stars({ rating = 0 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="d-inline-flex align-items-center">
      {Array.from({ length: full }).map((_, i) => (
        <Star
          key={`f${i}`}
          size={16}
          className="text-warning me-1"
          fill="currentColor"
        />
      ))}
      {half && (
        <Star
          size={16}
          className="text-warning me-1"
          fill="currentColor"
          style={{ clipPath: "inset(0 50% 0 0)" }}
        />
      )}
      {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => (
        <Star key={`e${i}`} size={16} className="text-secondary me-1" />
      ))}
    </span>
  );
}

function BookingModal({ mentor, onClose, apiBaseUrl }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("17:00");
  const [dur, setDur] = useState(45);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);

  async function submitBooking(e) {
    e.preventDefault();
    if (!date || !time) return;

    setLoading(true);
    try {
      const rawStudent = localStorage.getItem("student");
      const token = localStorage.getItem("token");
      const student = rawStudent ? JSON.parse(rawStudent) : null;
      const userId = student?.id;
      const userEmail = student?.email || "student@example.com";

      if (token) {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      // 1) Book mentor session
      const { data } = await axios.post(
        `${apiBaseUrl}/api/mentors/book`,
        {
          mentorId: mentor._id || mentor.id,
          date,
          time,
          duration: dur,
          userEmail,
        }
      );

      if (data.success) {
        // 2) Save to progress if logged in
        if (userId) {
          await axios.post(
            `${apiBaseUrl}/api/progress/${userId}/mentor-book`,
            {
              mentorId: mentor._id || mentor.id,
              mentorName: mentor.name,
              subjects: mentor.subjects,
              languages: mentor.languages,
              city: mentor.city,
              price: mentor.price,
              date,
              time,
              duration: dur,
              mode: "Live 1:1",
              photo: mentor.photo,
            }
          );
          window.dispatchEvent(new CustomEvent("progress:updated"));
        }

        toast.success("Session booked! Check your email for the invite.");
        setOk(true);
        setTimeout(() => onClose(), 1000);
      } else {
        toast.error(data.message || "Booking failed. Please try again.");
      }
    } catch (err) {
      console.error("Booking error:", err);
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Error connecting to server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="modal fade show"
      style={{ display: "block", background: "rgba(0,0,0,.45)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-dialog modal-dialog-centered"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Book a Session — {mentor.name}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            />
          </div>
          <form onSubmit={submitBooking}>
            <div className="modal-body">
              <div className="d-flex align-items-center gap-3 mb-3">
                <img
                  src={mentor.photo}
                  alt={mentor.name}
                  style={{
                    width: 56,
                    height: 56,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <div className="small">
                  <div className="fw-semibold">{mentor.name}</div>
                  <div className="text-secondary">
                    {(mentor.subjects || []).join(" • ")}
                  </div>
                </div>
              </div>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label">Duration</label>
                  <select
                    className="form-select"
                    value={dur}
                    onChange={(e) => setDur(Number(e.target.value))}
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              </div>
              <div className="alert alert-secondary mt-3 small d-flex align-items-center gap-2 mb-0">
                <Clock size={16} /> ₹
                {mentor.price?.toLocaleString() || 0} per {dur} min • Mode:
                Live 1:1
              </div>
            </div>
            <div className="modal-footer">
              {!ok ? (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Booking…" : "Confirm Booking"}
                  </button>
                </>
              ) : (
                <div className="text-success d-flex align-items-center gap-2">
                  <CheckCircle2 /> Booked! Check your email for the invite.
                </div>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
