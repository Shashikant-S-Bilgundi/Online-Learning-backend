// server/controllers/aiTeacherController.js
import AITeacher from "../models/AITeacher.js";
import axios from "axios"; // for calling AI API (OpenRouter)

/**
 * POST /api/ai-teacher/ask
 * Body: { userId: string, message: string }
 */
export const askAITeacher = async (req, res) => {
  try {
    const { userId, message } = req.body || {};
    console.log("AI Teacher request:", { userId, message });

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      return res
        .status(500)
        .json({ error: "AI configuration error. Please contact admin." });
    }

    const FRONTEND_ORIGIN =
      process.env.CLIENT_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:3000";

    const aiResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "HTTP-Referer": 'https://online-learning-eight-chi.vercel.app',
          "X-Title": "Online Learning Platform AI Teacher",
        },
        timeout: 30000, // 30s timeout to avoid hanging
      }
    );

    console.log("OpenRouter response status:", aiResponse.status);

    const aiMessage =
      aiResponse.data?.choices?.[0]?.message?.content?.trim() ||
      "I'm sorry, I couldn't generate a response right now.";

    // Save chat history only if we have a userId
    if (userId) {
      let chat = await AITeacher.findOne({ userId });
      if (!chat) chat = new AITeacher({ userId, messages: [] });

      chat.messages.push({ role: "user", content: message });
      chat.messages.push({ role: "assistant", content: aiMessage });

      await chat.save();
    }

    return res.status(200).json({ reply: aiMessage });
  } catch (error) {
    console.error(
      "AI Teacher Error:",
      error.response?.status,
      error.response?.data || error.message || error
    );

    // Try to surface a slightly clearer error to frontend for debugging
    const msg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Something went wrong while talking to the AI service.";

    return res.status(500).json({ error: msg });
  }
};

/**
 * GET /api/ai-teacher/chat/:userId
 * Returns saved chat history for a user
 */
export const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const chat = await AITeacher.findOne({ userId });
    if (!chat) {
      return res.status(404).json({ message: "No chat found" });
    }

    return res.status(200).json(chat.messages);
  } catch (error) {
    console.error("GetChatHistory Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
