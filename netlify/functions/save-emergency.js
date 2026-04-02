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
    
    // Ensure table exists
    await sql`CREATE TABLE IF NOT EXISTS emergency_cards (id TEXT PRIMARY KEY, name TEXT NOT NULL, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())`;

    const body = JSON.parse(event.body || "{}");
    const { name, blood, emergency_name, emergency_phone, phone, emergency_relation, role, bike, medical, insurance } = body;

    if (!name || !String(name).trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Name is required" }) };
    }

    const id = "ec_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
    const card = {
      id,
      name: String(name).trim().substring(0, 40),
      blood: String(blood || "").trim().substring(0, 5),
      phone: String(phone || "").trim().substring(0, 15),
      role: String(role || "rider"),
      emergency_name: String(emergency_name || "").trim().substring(0, 40),
      emergency_phone: String(emergency_phone || "").trim().substring(0, 15),
      emergency_relation: String(emergency_relation || "").trim().substring(0, 20),
      medical: String(medical || "None").trim().substring(0, 200),
      insurance: String(insurance || "").trim().substring(0, 100),
      bike: String(bike || "").trim().substring(0, 50),
      updated: new Date().toISOString()
    };

    // Upsert — insert or update if same name exists
    await sql`
      INSERT INTO emergency_cards (id, name, data, updated_at)
      VALUES (${card.id}, ${card.name}, ${JSON.stringify(card)}, NOW())
      ON CONFLICT (name) 
      DO UPDATE SET data = ${JSON.stringify(card)}, updated_at = NOW()
    `;

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, card }) };

  } catch (err) {
    console.error("save-emergency error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
