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
    
    await sql`CREATE TABLE IF NOT EXISTS emergency_cards (id TEXT PRIMARY KEY, name TEXT NOT NULL, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`;

    const rows = await sql`SELECT data FROM emergency_cards ORDER BY updated_at ASC`;
    const cards = rows.map(r => r.data);

    return { statusCode: 200, headers, body: JSON.stringify(cards) };

  } catch (err) {
    console.error("get-emergency error:", err.message);
    return { statusCode: 200, headers, body: JSON.stringify([]) };
  }
};
