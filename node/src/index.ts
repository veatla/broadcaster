import express from "express";
import http from "http";
import { registerAllRoutes } from "./routes";

const PORT = process.env.NODE_PORT ?? 3000;

const app = express();

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_ORIGIN ?? "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,auth-session,Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Hello world");
});

registerAllRoutes(app);

const server = http.createServer(app);
const listener = server.listen(Number(PORT), "0.0.0.0", () => {
    const address = listener.address();
    if (typeof address === "string" || !address) process.exit(1);

    console.log(`Node hosted on https://localhost:${address.port}`);
});
