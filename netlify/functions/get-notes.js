const { neon } = require("@neondatabase/serverless");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

exports.handler = async function(event, context) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    await sql`CREATE TABLE IF NOT EXISTS trip_notes (id TEXT PRIMARY KEY, data JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())`;

    const rows = await sql`SELECT data FROM trip_notes ORDER BY created_at DESC LIMIT 50`;
    const notes = rows.map(r => r.data);

    return { statusCode: 200, headers, body: JSON.stringify(notes) };

  } catch (err) {
    console.error("get-notes error:", err.message);
    return { statusCode: 200, headers, body: JSON.stringify([]) };
  }
};
