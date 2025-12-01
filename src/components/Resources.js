// src/Resources.js
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Eye,
  BookmarkPlus,
  BookmarkCheck,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  Film,
  Filter,
  Search,
  Layers,
  X,
  PlusCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_BASE_URL || "http://localhost:3001";

const CATEGORIES = [
  "All",
  "English",
  "Social Science",
  "Maths",
  "Science",
  "Design",
  "Productivity",
];
const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];
const FORMATS = ["PDF", "Image", "Video", "XLS", "PPT", "Code", "ZIP"];

const FRONTEND_THUMBNAILS = {
  "Physics Formulas Sheet": "/images/physics.avif",
  "Excel Advanced Functions": "/images/excel.jpg",
  "UI Design Inspiration Pack": "/images/ui_ux.webp",
  "Polynomials Essentials": "/images/banner2-2.jpg",
  "Trigonometry: Angles & Identities": "/images/trignometry.webp",
  "Coordinate Geometry: Distance & Section": "/images/coordinate.webp",
  "Chemical Reactions & Equations": "/images/chemical.jpg",
  "Electricity: Ohm’s Law & Circuits": "/images/electricity.jpg",
  "Life Processes: Nutrition & Respiration": "/images/life_process.png",
  "Resources & Development (India)": "/images/resource.webp",
  "Democratic Politics: Power Sharing": "/images/power.jpg",
};

const FORMAT_THUMBNAILS = {
  pdf: "/images/format_pdf.jpg",
  image: "/images/format_image.jpg",
  video: "/images/format_video.jpg",
  xls: "/images/format_excel.jpg",
  spreadsheet: "/images/format_excel.jpg",
  ppt: "/images/format_ppt.jpg",
  code: "/images/format_code.jpg",
  zip: "/images/format_zip.jpg",
};

const CATEGORY_THUMBNAILS = {
  Maths: "/images/maths.jpg",
  Science: "/images/science.jpg",
  English: "/images/english.jpg",
  "Social Science": "/images/social.jpg",
  Design: "/images/cat_design.jpg",
  Productivity: "/images/cat_productivity.jpg",
};

function getThumbnailSrc(resource) {
  const title = resource?.title || "";
  const format = (resource?.format || "").toLowerCase();
  const category = resource?.category || "";

  // 1) Hard-coded matches by title (frontend only mapping)
  if (FRONTEND_THUMBNAILS[title]) {
    return FRONTEND_THUMBNAILS[title];
  }

  // 2) By format
  if (FORMAT_THUMBNAILS[format]) {
    return FORMAT_THUMBNAILS[format];
  }

  // 3) By category
  if (CATEGORY_THUMBNAILS[category]) {
    return CATEGORY_THUMBNAILS[category];
  }

  // 4) From DB if provided
  if (resource.thumbnail) {
    return resource.thumbnail;
  }

  // 5) Fallback
  return "https://via.placeholder.com/600x400.png?text=Resource";
}

function FormatBadge({ format }) {
  const f = (format || "").toLowerCase();
  const map = {
    pdf: { icon: <FileText size={16} />, cls: "bg-danger" },
    image: { icon: <ImageIcon size={16} />, cls: "bg-info" },
    video: { icon: <Film size={16} />, cls: "bg-dark" },
    xls: { icon: <FileSpreadsheet size={16} />, cls: "bg-success" },
    spreadsheet: {
      icon: <FileSpreadsheet size={16} />,
      cls: "bg-success",
    },
    ppt: { icon: <Layers size={16} />, cls: "bg-warning text-dark" },
    code: { icon: <FileCode size={16} />, cls: "bg-primary" },
    zip: { icon: <Layers size={16} />, cls: "bg-secondary" },
  };
  const m = map[f] || { icon: <FileText size={16} />, cls: "bg-secondary" };
  return (
    <span className={`badge d-inline-flex align-items-center gap-1 ${m.cls}`}>
      {m.icon} {format}
    </span>
  );
}

export function Resources() {
  const [resources, setResources] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [lvl, setLvl] = useState("All");
  const [fmt, setFmt] = useState("All");
  const [active, setActive] = useState(null);
  const [saved, setSaved] = useState(new Set());
  const [showSaves, setShowSaves] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    category: "Maths", // align with CATEGORIES
    level: "Beginner",
    format: "PDF",
    size: "",
    tags: "",
    thumbnail: "",
    previewUrl: "",
    downloadUrl: "",
  });

  // Fetch resources whenever filters/search change
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/resources`, {
          params: {
            category: cat,
            level: lvl,
            format: fmt,
            q,
          },
        });
        if (data.success) {
          setResources(Array.isArray(data.data) ? data.data : []);
        } else {
          setResources([]);
        }
      } catch (err) {
        console.error("Error fetching resources:", err);
        toast.error("Failed to load resources");
      }
    };
    fetchResources();
  }, [cat, lvl, fmt, q]);

  // Backend already filters, but kept for future extension
  const filtered = useMemo(() => resources, [resources]);

  const toggleSave = (id) => {
    setSaved((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const savedList = resources.filter((r) => saved.has(r._id));

  const handleNewChange = (field, value) => {
    setNewResource((prev) => ({ ...prev, [field]: value }));
  };

  const handleThumbnailFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewResource((prev) => ({ ...prev, thumbnail: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();

    if (!newResource.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!newResource.category || newResource.category === "All") {
      toast.error("Please select a category");
      return;
    }

    if (!newResource.level || newResource.level === "All") {
      toast.error("Please select a level");
      return;
    }

    if (!newResource.format) {
      toast.error("Please select a format");
      return;
    }

    try {
      setSavingNew(true);

      const payload = {
        ...newResource,
        tags:
          typeof newResource.tags === "string"
            ? newResource.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : newResource.tags,
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/resources`,
        payload
      );

      if (res.data?.success) {
        const created = res.data.data;
        setResources((prev) => [created, ...prev]);
        toast.success("Resource added");
        setShowAddModal(false);
        setNewResource({
          title: "",
          category: "Maths",
          level: "Beginner",
          format: "PDF",
          size: "",
          tags: "",
          thumbnail: "",
          previewUrl: "",
          downloadUrl: "",
        });
      } else {
        toast.error(res.data?.message || "Failed to save resource");
      }
    } catch (err) {
      console.error("Error creating resource", err);
      toast.error("Error creating resource");
    } finally {
      setSavingNew(false);
    }
  };

  return (
    <div className="container py-4">
      {/* HERO */}
      <section
        className="rounded-4 p-4 p-md-5 mb-4 position-relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0A2342 0%, #1b3d6b 55%, #2c5aa0 100%)",
          color: "white",
        }}
      >
        <div className="row align-items-center g-4">
          <div className="col-lg-8">
            <motion.h1
              className="h2 h1-md fw-bold mb-2"
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              Material Resources & Downloads
            </motion.h1>
            <motion.p
              className="mb-0"
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              Curated notes, practice sets, slides, code templates, and
              more. Filter and download what you need.
            </motion.p>
          </div>
          <div className="col-lg-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card border-0 shadow-lg"
            >
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-12">
                    <div className="input-group">
                      <span className="input-group-text bg-white">
                        <Search size={16} />
                      </span>
                      <input
                        className="form-control"
                        placeholder="Search resources…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <select
                      className="form-select"
                      value={cat}
                      onChange={(e) => setCat(e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <select
                      className="form-select"
                      value={lvl}
                      onChange={(e) => setLvl(e.target.value)}
                    >
                      {LEVELS.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between mt-2 small text-secondary">
                  <div className="d-inline-flex align-items-center gap-1">
                    <Filter size={14} /> Showing{" "}
                    <strong className="ms-1">{filtered.length}</strong> of{" "}
                    {resources.length}
                  </div>
                  <div className="d-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light"
                      onClick={() => setShowSaves(true)}
                    >
                      <BookmarkCheck size={14} className="me-1" /> My
                      Saves ({saved.size})
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-light d-inline-flex align-items-center"
                      onClick={() => setShowAddModal(true)}
                    >
                      <PlusCircle size={14} className="me-1" /> Add
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section>
        <div className="row g-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((r, i) => {
              const thumbnailSrc = getThumbnailSrc(r);

              return (
                <motion.div
                  key={r._id}
                  className="col-12 col-sm-6 col-lg-4"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                >
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="position-relative">
                      <img
                        src={thumbnailSrc}
                        alt={r.title}
                        className="card-img-top"
                        style={{ height: 170, objectFit: "cover" }}
                      />
                      <div className="position-absolute top-0 start-0 m-2 d-flex gap-2">
                        <FormatBadge format={r.format} />
                        <span className="badge bg-secondary">
                          {r.level}
                        </span>
                      </div>
                      <button
                        className="btn btn-light btn-sm position-absolute bottom-0 end-0 m-2 d-flex align-items-center gap-1"
                        onClick={() => setActive(r)}
                      >
                        <Eye size={16} /> Preview
                      </button>
                    </div>
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="badge bg-primary-subtle text-primary">
                          {r.category}
                        </span>
                        <span className="text-secondary small">
                          {r.size}
                        </span>
                      </div>
                      <h6 className="mt-2 mb-2">{r.title}</h6>
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {(r.tags || []).map((t) => (
                          <span
                            key={t}
                            className="badge bg-light text-dark border"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="mt-auto d-grid gap-2">
                        <a
                          href={r.downloadUrl || "#"}
                          download
                          className={`btn btn-primary d-inline-flex align-items-center justify-content-center gap-2 ${
                            r.downloadUrl ? "" : "disabled"
                          }`}
                        >
                          <Download size={18} /> Download
                        </a>
                        <button
                          className={`btn ${
                            saved.has(r._id)
                              ? "btn-success"
                              : "btn-outline-secondary"
                          } d-inline-flex align-items-center justify-content-center gap-2`}
                          onClick={() => toggleSave(r._id)}
                        >
                          {saved.has(r._id) ? (
                            <BookmarkCheck size={18} />
                          ) : (
                            <BookmarkPlus size={18} />
                          )}{" "}
                          {saved.has(r._id) ? "Saved" : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      {/* ADD RESOURCE MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title d-flex align-items-center gap-2">
                    <PlusCircle size={18} /> Add Resource
                  </h5>
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() => setShowAddModal(false)}
                  >
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={handleCreateResource}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-8">
                        <label className="form-label">Title</label>
                        <input
                          className="form-control"
                          value={newResource.title}
                          onChange={(e) =>
                            handleNewChange("title", e.target.value)
                          }
                          placeholder="e.g. Polynomials Essentials"
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Format</label>
                        <select
                          className="form-select"
                          value={newResource.format}
                          onChange={(e) =>
                            handleNewChange("format", e.target.value)
                          }
                        >
                          {FORMATS.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Category</label>
                        <select
                          className="form-select"
                          value={newResource.category}
                          onChange={(e) =>
                            handleNewChange("category", e.target.value)
                          }
                        >
                          {CATEGORIES.filter((c) => c !== "All").map(
                            (c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Level</label>
                        <select
                          className="form-select"
                          value={newResource.level}
                          onChange={(e) =>
                            handleNewChange("level", e.target.value)
                          }
                        >
                          {LEVELS.filter((l) => l !== "All").map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">
                          Size (optional)
                        </label>
                        <input
                          className="form-control"
                          value={newResource.size}
                          onChange={(e) =>
                            handleNewChange("size", e.target.value)
                          }
                          placeholder="e.g. 1.2MB"
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">
                          Tags (comma separated)
                        </label>
                        <input
                          className="form-control"
                          value={newResource.tags}
                          onChange={(e) =>
                            handleNewChange("tags", e.target.value)
                          }
                          placeholder="e.g. Polynomials, Algebra, Grade 10"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">
                          Thumbnail Image (will be stored as base64)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control"
                          onChange={handleThumbnailFile}
                        />
                        {newResource.thumbnail && (
                          <div className="mt-2">
                            <small className="text-muted d-block">
                              Preview:
                            </small>
                            <img
                              src={newResource.thumbnail}
                              alt="Thumbnail preview"
                              style={{
                                maxHeight: 120,
                                borderRadius: 8,
                                border: "1px solid #ddd",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">
                          Preview URL (optional)
                        </label>
                        <input
                          className="form-control mb-2"
                          value={newResource.previewUrl}
                          onChange={(e) =>
                            handleNewChange(
                              "previewUrl",
                              e.target.value
                            )
                          }
                          placeholder="https://..."
                        />
                        <label className="form-label">
                          Download URL (optional)
                        </label>
                        <input
                          className="form-control"
                          value={newResource.downloadUrl}
                          onChange={(e) =>
                            handleNewChange(
                              "downloadUrl",
                              e.target.value
                            )
                          }
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary d-inline-flex align-items-center gap-2"
                      disabled={savingNew}
                    >
                      {savingNew ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                          />
                          Saving…
                        </>
                      ) : (
                        <>
                          <PlusCircle size={16} /> Save Resource
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PREVIEW MODAL */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{active.title}</h5>
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() => setActive(null)}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="modal-body">
                  {active.previewUrl ? (
                    <iframe
                      src={active.previewUrl}
                      title={active.title}
                      style={{
                        width: "100%",
                        height: "400px",
                        border: "none",
                      }}
                    />
                  ) : (
                    <p className="text-muted">
                      No preview available for this resource.
                    </p>
                  )}
                </div>
                <div className="modal-footer">
                  <a
                    href={active.downloadUrl || "#"}
                    className={`btn btn-primary ${
                      active.downloadUrl ? "" : "disabled"
                    }`}
                    download
                  >
                    <Download size={16} className="me-1" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SAVED RESOURCES OFFCANVAS */}
      <AnimatePresence>
        {showSaves && (
          <motion.div
            className="offcanvas offcanvas-end show"
            style={{
              visibility: "visible",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            onClick={() => setShowSaves(false)}
          >
            <div
              className="offcanvas-body bg-white"
              style={{ width: 360 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">My Saved Resources</h5>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => setShowSaves(false)}
                >
                  <X size={16} />
                </button>
              </div>
              {savedList.length === 0 ? (
                <p className="text-muted">No saved resources yet.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {savedList.map((r) => (
                    <li
                      key={r._id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div className="fw-semibold small">{r.title}</div>
                        <div className="text-muted small">
                          {r.category}
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setActive(r)}
                      >
                        <Eye size={14} className="me-1" />
                        Open
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
