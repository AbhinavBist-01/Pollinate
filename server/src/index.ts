import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT) || 8000;

const app = createApp();
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
