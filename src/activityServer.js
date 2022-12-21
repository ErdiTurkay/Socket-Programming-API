import net from "net";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { send400 } from "./utils.js";
import { createResponseToFaviconRequest } from "./utils.js";
import { add } from "./routes/activity/add.js";
import { remove } from "./routes/activity/remove.js";
import { check } from "./routes/activity/check.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const activityPath = path.join(__dirname, "..", "database", "activity.json");

const readActivities = fs.readFileSync(activityPath, { encoding: "utf-8" });
const activities = JSON.parse(readActivities);

export default (portNumber) => {
  const server = net.createServer((socket) => {
    socket.on("data", async (buffer) => {
      const request = buffer.toString("utf-8").split("\r\n");
      let query = "";
      let path = "";

      // Checks if its a favicon request from the browser.
      if (request[0].split(" ")[1] === "/favicon.ico") {
        const response = createResponseToFaviconRequest();
        return socket.end(response);
      }

      try {
        path = request[0].split(" ")[1].split("?")[0].slice(1).trim();
        query = request[0].split(" ")[1].split("?")[1].trim();
      } catch (err) {
        return send400(socket, "Please enter a valid request!");
      }

      const name = query.split("name=")[1]?.trim();

      if (name === "" || name == undefined) {
        return send400(socket);
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

  server.listen(portNumber);

  server.on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      console.log("<Activity Server> Address in use, retrying...");
    }
  });
  return server;
};
