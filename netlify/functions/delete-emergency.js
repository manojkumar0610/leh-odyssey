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
    const { id } = JSON.parse(event.body || "{}");
    await sql`DELETE FROM emergency_cards WHERE id = ${id}`;
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("delete-emergency error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
