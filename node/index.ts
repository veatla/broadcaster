import express from "express";
import http from "http";

const PORT = process.env.NODE_PORT ?? 3000;

const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("Hello world");
});

const listener = server.listen(PORT, () => {
  const address = listener.address();
  if (typeof address === "string" || !address) process.exit(1);

  console.log(`Node hosted on https://localhost:${address.port}`);
});
