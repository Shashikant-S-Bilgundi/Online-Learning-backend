// src/Quizzes.js
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  RotateCcw,
  Clock,
  BookOpen,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_BASE_URL || "http://localhost:3001";

export function Quizzes() {
  const [quizList, setQuizList] = useState([]);
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Load quiz list
  useEffect(() => {
    async function loadQuizzes() {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/quizzes`);
        const payload = res.data?.data || [];
        setQuizList(Array.isArray(payload) ? payload : []);
        if (payload?.length) {
          setActiveQuizId(payload[0]._id);
        }
      } catch (err) {
        console.error("Error loading quiz list:", err);
        setQuizList([]);
      } finally {
        setLoadingQuizzes(false);
      }
    }
    loadQuizzes();
  }, []);

  // Load questions for active quiz
  useEffect(() => {
    if (!activeQuizId) return;
    async function loadQuizQuestions() {
      setLoadingQuestions(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/quizzes/${activeQuizId}`
        );
        const payload = res.data?.data?.questions || [];
        setQuestions(Array.isArray(payload) ? payload : []);
        setAnswers({});
        setIndex(0);
        setSubmitted(false);
        setShowReview(false);
      } catch (err) {
        console.error("Error loading quiz questions:", err);
        setQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    }
    loadQuizQuestions();
  }, [activeQuizId]);

  const total = questions.length;
  const progress =
    total > 0
      ? Math.round((Object.keys(answers).length / total) * 100)
      : 0;

  // Always compute correctCount from questions + answers
  const correctCount = useMemo(() => {
    if (!total) return 0;
    return questions.reduce((acc, q, i) => {
      const correctIdx = q.fix ?? q.answer;
      return acc + (answers[i] === correctIdx ? 1 : 0);
    }, 0);
  }, [questions, answers, total]);

  function selectOption(optIdx) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [index]: optIdx }));
  }

  function next() {
    if (index < total - 1) setIndex((x) => x + 1);
  }

  function prev() {
    if (index > 0) setIndex((x) => x - 1);
  }

  async function submitQuiz() {
    if (
      total > 0 &&
      Object.keys(answers).length < total &&
      !window.confirm("Some questions are unanswered. Submit anyway?")
    )
      return;

    setSubmitted(true);
    setShowReview(true);

    try {
      const rawStudent = localStorage.getItem("student");
      const token = localStorage.getItem("token");
      const student = rawStudent ? JSON.parse(rawStudent) : null;
      const userId = student?.id;

      if (!userId) {
        console.warn("No logged-in student found; skipping progress save.");
        return;
      }

      if (token) {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const activeQuiz = quizList.find((q) => q._id === activeQuizId);
      const accuracy =
        total > 0 ? Math.round((correctCount / total) * 100) : 0;

      await axios.post(
        `${API_BASE_URL}/api/progress/${userId}/quiz`,
        {
          quizId: activeQuizId,
          quizTitle:
            typeof activeQuiz?.title === "object"
              ? activeQuiz?.title?.text
              : activeQuiz?.title,
          subject: activeQuiz?.subject || "General",
          total,
          correct: correctCount,
          accuracy,
          takenAt: new Date().toISOString(),
        }
      );

      window.dispatchEvent(new CustomEvent("progress:updated"));
    } catch (e) {
      console.error("Failed to save quiz result to progress:", e);
    }
  }

  function retake() {
    setAnswers({});
    setIndex(0);
    setSubmitted(false);
    setShowReview(false);
  }

  function switchQuiz(id) {
    setActiveQuizId(id);
  }

  const getQuizTitle = (quiz) => {
    if (!quiz) return "Untitled Quiz";
    if (typeof quiz.title === "string") return quiz.title;
    if (quiz.title && typeof quiz.title === "object" && quiz.title.text)
      return quiz.title.text;
    return "Untitled Quiz";
  };

  const activeQuiz = quizList.find((q) => q._id === activeQuizId);
  const activeQuizTitle = getQuizTitle(activeQuiz);

  if (loadingQuizzes) {
    return (
      <div className="container py-4">Loading quizzes…</div>
    );
  }

  if (!quizList.length) {
    return (
      <div className="container py-4">
        <div className="alert alert-info">
          No quizzes available yet. Please check back later.
        </div>
      </div>
    );
  }

  if (loadingQuestions) {
    return (
      <div className="container py-4">Loading questions…</div>
    );
  }

  if (!questions.length) {
    return (
      <div className="container py-4">
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
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                Practice Quizzes
              </motion.h1>
              <motion.p
                className="mb-0"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
              >
                Select a quiz from the list below to get started.
              </motion.p>
            </div>
          </div>
        </section>
        <div className="alert alert-warning">
          This quiz has no questions yet.
        </div>
      </div>
    );
  }

  const q = questions[index];
  const correctIdx = q.fix ?? q.answer;

  return (
    <div className="container py-4">
      {/* HERO / HEADER */}
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
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              Practice Quizzes
            </motion.h1>
            <motion.p
              className="mb-0"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              Attempt questions per quiz. Get instant feedback and a
              scorecard. Retake to improve!
            </motion.p>
          </div>
          <div className="col-lg-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card border-0 shadow-lg"
            >
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <BookOpen size={18} />
                    <div className="small">
                      Quiz: <strong>{activeQuizTitle}</strong>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Clock size={18} />
                    <div className="small">
                      Question {index + 1}/{total}
                    </div>
                  </div>
                </div>
                <div
                  className="progress mt-2"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <div
                    className="progress-bar bg-warning"
                    style={{ width: `${progress}%` }}
                  >
                    {progress}%
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* QUIZ SELECTOR */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {quizList.map((quiz) => (
          <button
            key={quiz._id}
            className={`btn btn-sm ${
              activeQuizId === quiz._id
                ? "btn-warning text-dark"
                : "btn-outline-dark"
            }`}
            onClick={() => switchQuiz(quiz._id)}
          >
            {getQuizTitle(quiz)}
          </button>
        ))}
      </div>

      {/* ACTIVE QUESTION CARD */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${activeQuizId}-${index}-${submitted}`}
          className="card border-0 shadow-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
        >
          <div className="card-body">
            <div className="d-flex align-items-start gap-3">
              <div className="badge bg-primary-subtle text-primary">
                Q{index + 1}
              </div>
              <h5 className="mb-0">
                {typeof q.q === "object" ? q.q.text : q.q}
              </h5>
            </div>

            <div className="row g-3 mt-3">
              {q.options.map((opt, i) => {
                const chosen = answers[index] === i;
                const isCorrect = submitted && i === correctIdx;
                const isWrong =
                  submitted && chosen && i !== correctIdx;
                return (
                  <div className="col-12 col-md-6" key={i}>
                    <button
                      type="button"
                      className={`btn w-100 text-start d-flex align-items-center justify-content-between ${
                        chosen
                          ? "btn-primary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => selectOption(i)}
                      disabled={submitted}
                    >
                      <span>
                        {typeof opt === "object" ? opt.text : opt}
                      </span>
                      {submitted && (
                        <>
                          {isCorrect ? (
                            <CheckCircle2
                              size={18}
                              className="ms-2"
                            />
                          ) : isWrong ? (
                            <XCircle
                              size={18}
                              className="ms-2"
                            />
                          ) : (
                            <HelpCircle
                              size={18}
                              className="ms-2 opacity-50"
                            />
                          )}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {submitted && (
              <div className="alert alert-light border d-flex align-items-start gap-2 mt-3">
                <div className="pt-1">
                  {answers[index] === correctIdx ? (
                    <CheckCircle2 className="text-success" />
                  ) : (
                    <XCircle className="text-danger" />
                  )}
                </div>
                <div className="small">
                  <div className="fw-semibold mb-1">
                    Explanation
                  </div>
                  {q.explain}
                </div>
              </div>
            )}

            <div className="d-flex align-items-center justify-content-between mt-3">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={prev}
                  disabled={index === 0}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={next}
                  disabled={index === total - 1}
                >
                  Next
                </button>
              </div>
              <div className="d-flex gap-2">
                {!submitted ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      onClick={() => setIndex(0)}
                    >
                      First
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={submitQuiz}
                    >
                      Submit
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      onClick={() => setShowReview(!showReview)}
                    >
                      {showReview ? "Hide Review" : "Review Answers"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={retake}
                    >
                      <RotateCcw
                        size={16}
                        className="me-1"
                      />{" "}
                      Retake
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* SCORECARD + REVIEW */}
      {submitted && (
        <motion.div
          className="mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Scorecard */}
          <div className="card border-0 shadow-sm">
            <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <Trophy size={36} className="text-warning" />
                <div>
                  <div className="h5 mb-0">
                    Your Score: {correctCount}/{total}
                  </div>
                  <div className="text-secondary small">
                    {total > 0 &&
                    correctCount / total >= 0.8
                      ? "Excellent! Keep it up."
                      : total > 0 &&
                        correctCount / total >= 0.5
                      ? "Good job—review and try again."
                      : "Don't worry. Practice makes perfect!"}
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={retake}
                >
                  <RotateCcw
                    size={16}
                    className="me-1"
                  />{" "}
                  Retake
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIndex(0)}
                >
                  Go to Q1
                </button>
              </div>
            </div>
          </div>

          {/* Review grid */}
          {showReview && (
            <div className="row g-3 mt-2">
              {questions.map((item, i) => {
                const corr = item.fix ?? item.answer;
                const chosen = answers[i];
                const ok = chosen === corr;
                return (
                  <div
                    key={i}
                    className="col-12 col-md-6 col-lg-4"
                  >
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body">
                        <div className="d-flex align-items-start gap-2 mb-2">
                          <div
                            className={`badge ${
                              ok ? "bg-success" : "bg-danger"
                            }`}
                          >
                            Q{i + 1}
                          </div>
                          <div className="small">
                            {typeof item.q === "object"
                              ? item.q.text
                              : item.q}
                          </div>
                        </div>
                        <ul className="list-unstyled small mb-2">
                          {item.options.map((o, idx) => (
                            <li
                              key={idx}
                              className="d-flex align-items-center gap-2"
                            >
                              <span
                                className={`badge ${
                                  idx === corr
                                    ? "bg-success"
                                    : idx === chosen
                                    ? "bg-danger"
                                    : "bg-light text-dark"
                                }`}
                              >
                                {idx === corr
                                  ? "Correct"
                                  : idx === chosen
                                  ? "Yours"
                                  : "Option"}
                              </span>
                              <span>
                                {typeof o === "object"
                                  ? o.text
                                  : o}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="alert alert-light border small mb-0">
                          <span className="fw-semibold">Why:</span>{" "}
                          {item.explain}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
