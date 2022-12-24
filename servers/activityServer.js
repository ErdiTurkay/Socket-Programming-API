import path from "path";
import { createServer } from "net";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { send400 } from "../common.js";
import { add } from "../routes/activity/add.js";
import { remove } from "../routes/activity/remove.js";
import { check } from "../routes/activity/check.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const activityPath = path.join(__dirname, "..", "database", "activities.json");

const readActivities = readFileSync(activityPath, { encoding: "utf-8" });
const activities = JSON.parse(readActivities);

export default (portNumber) => {
  const server = createServer((socket) => {
    socket.on("data", async (buffer) => {
      const request = buffer.toString("utf-8").split("\r\n");
      let query = "";
      let path = "";

      try {
        path = request[0]
          .split(" ")[1]
          .split("?")[0]
          .slice(1)
          .trim()
          .toLowerCase();
        query = request[0].split(" ")[1].split("?")[1].trim();
      } catch (e) {
        return send400(socket, "Please enter a valid request!");
      }

      const name = query.split("name=")[1]?.trim();

      if (!name) {
        return send400(socket, "The activity name must not be empty.");
      }

      switch (path) {
        case "add":
          return add(activities, activityPath, name, socket);
        case "remove":
          return remove(activities, activityPath, name, socket);
        case "check":
          return check(activities, name, socket);
        default:
          return send400(
            socket,
            `Please use one of the "add", "remove" or "check" methods!`
          );
      }
    });
  });

  server.on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      console.log("<Activity Server> The given port number is already in use!");
      e;
    }
  });

  server.listen(portNumber);

  return server;
};
