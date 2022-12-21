import net from "net";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { send400 } from "./utils.js";
import { reserve } from "./routes/reservation/reserve.js";
import { display } from "./routes/reservation/display.js";
import { fetchAllAvailableHours } from "./routes/reservation/fetchAllAvailableHours.js";
import { listAvailability } from "./routes/reservation/listAvailability.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reservationPath = path.join(__dirname, "..", "database", "reservation.json");

const readReservations = fs.readFileSync(reservationPath, {
  encoding: "utf-8",
});

const reservation = JSON.parse(readReservations);

export default (portNumber, roomServerPortNumber, activityServerPortNumber) => {
  const server = net.createServer((socket) => {
    socket.on("data", async (buffer) => {
      const request = buffer.toString("utf-8").split("\r\n");
      let query = "";
      let path = "";

      try {
        path = request[0].split(" ")[1].split("?")[0].slice(1).trim();
        query = request[0].split(" ")[1].split("?")[1].trim();
      } catch (err) {
        return send400(socket, "Please enter a valid request!");
      }

      let roomName = "";

      if (path === "listavailability" || path === "reserve") {
        roomName = query.split("&")[0].split("room=")[1]?.trim();

        if (roomName === "" || roomName == undefined) {
          return send400(socket, "The room name must not be empty.");
        }
      }

      switch (path) {
        case "reserve":
          return reserve(
              reservation,
              reservationPath,
              roomName,
              query,
              activityServerPortNumber,
              roomServerPortNumber,
              socket
          );
        case "display":
          return display(reservation, query, socket);
        case "listavailability":
          const day = query.split("&")[1]?.split("day=")[1]?.trim();
          if (day) {
            return listAvailability(day, roomName, roomServerPortNumber, socket);
          } else {
            for (let i = 1; i < 8; i++) {
              await fetchAllAvailableHours(i, roomName, roomServerPortNumber, socket);
            }
            return;
          }
        default:
          // Send a 400 Bad Request response if the path is invalid
          return send400(
              socket,
              `Please use one of the "display", "listavailability" or "reserve" methods!`
          );
      }
    });
  });

  server.listen(portNumber);

  server.on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      console.log("<Reservation Server> Address in use, retrying...");
    }
  });

  return server;
};
