const { neon } = require("@neondatabase/serverless");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

exports.handler = async function(event, context) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS trip_notes (id TEXT PRIMARY KEY, data JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())`;

    const { name, message, category, emoji } = JSON.parse(event.body || "{}");

    if (!name || !message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Name and message required" }) };
    }

    const note = {
      id: "note_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      name: String(name).trim().substring(0, 30),
      message: String(message).trim().substring(0, 280),
      category: category || "general",
      emoji: emoji || "💬",
      time: new Date().toISOString()
    };

    await sql`INSERT INTO trip_notes (id, data, created_at) VALUES (${note.id}, ${JSON.stringify(note)}, NOW())`;

    // Keep only last 50 notes
    await sql`DELETE FROM trip_notes WHERE id NOT IN (SELECT id FROM trip_notes ORDER BY created_at DESC LIMIT 50)`;

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, note }) };

  } catch (err) {
    console.error("save-note error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
