import express from "express";
import http from "http";
import { registerAllRoutes } from "./routes";

const PORT = process.env.NODE_PORT ?? 3000;

const app = express();

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
