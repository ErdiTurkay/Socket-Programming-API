import net from "net";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { add } from "./routes/room/add.js";
import { remove } from "./routes/room/remove.js";
import { checkAvailability } from "./routes/room/checkAvailability.js";
import { reserve } from "./routes/room/reserve.js";
import { send400 } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const roomPath = path.join(__dirname, "..", "database", "room.json");

const createServer = (portNumber) => {
    const server = net.createServer((socket) => {
        socket.on("data", async (buffer) => {
            const request = buffer.toString("utf-8").split("\r\n");
            let query = "";
            let path = "";

            const readRooms = fs.readFileSync(roomPath, {encoding: "utf-8"});
            const room = JSON.parse(readRooms);

            try {
                path = request[0].split(" ")[1].split("?")[0].slice(1).trim();
                query = request[0].split(" ")[1].split("?")[1].trim();
            } catch (err) {
                return send400(socket, "Please enter a valid request!");
            }
            const name = query.split("&")[0].split("name=")[1]?.trim();

            if (!name) {
                return send400(socket, "The room name must not be empty.");
            }
            switch (path) {
                case "add":
                    return add(room, roomPath, name, socket);
                case "remove":
                    return remove(room, roomPath, name, socket);
                case "checkavailability":
                    return checkAvailability(room, name, query, socket);
                case "reserve":
                    return reserve(room, roomPath, name, query, socket);
                default:
                    return send400(
                        socket,
                        `Please use one of the "add", "remove", "reserve" or "checkavailability" methods!`
                    );
            }
        });
    });

    server.listen(portNumber);

    server.on("error", (e) => {
        if (e.code === "EADDRINUSE") {
            console.log("<Room Server> Address in use, retrying...");
        }
    });

    return server;
};

export default createServer;
