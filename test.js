const apiKey = "test-api-key-3e2c8e11-8386-4a1e-8124-149bc4d8c29e";

fetch("http://localhost:3001/api/v1/ingest", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    service: "billing-service",
    error: "Payment Failed",
    amount: 500
  })
}).then(res => res.json()).then(console.log).catch(console.error);
