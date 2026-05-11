import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { initSocket } from "./app/modules/socket/index.js";

const PORT = Number(process.env.PORT) || 8000;

const app = createApp();
const server = createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
