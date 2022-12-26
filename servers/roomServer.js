import path from "path";
import {createServer} from "net";
import {readFileSync, writeFile} from "fs";
import {
    createResponse,
    createRoom,
    getDayName,
    send400,
    send403,
    sendFileWritingError,
    statusCodes
} from "../common.js";


const roomPath = path.resolve("database", "rooms.json");
export const add = (room, roomPath, name, socket) => {
    for (let rm of room.rooms) {
        if (rm.name === name) {
            return send403(socket, "A room with this name already exists!");
        }
    }

    let newRoom = createRoom(name);
    room.rooms.push(newRoom);

    return writeFile(roomPath, JSON.stringify(room, null, 2), (err) => {
        if (err)
            return sendFileWritingError(
                socket,
                err,
                "Server could not add the room."
            );

        createResponse(
            socket,
            statusCodes[200],
            "Room Added",
            "Room with name " + name + " is successfully added."
        );
    });
};
export const checkAvailability = (room, name, query, socket) => {
    let indx = 0;

    if (
        !room.rooms.some((rm, i) => {
            if (rm.name === name) indx = i;

            return rm.name === name;
        })
    ) {
        const response = "HTTP/1.1 " + statusCodes[404] + "\r\n";
        return socket.end(response);
    }
    let day;

    try {
        day = query.split("&")[1].split("day=")[1]?.trim() - 0;
    } catch (e) {
        return send400(socket, "Invalid query! Please enter a day.");
    }
    if (isNaN(day) || day < 1 || day > 7 || !Number.isInteger(day)) {
        return send400(socket, "Please provide a valid day! Day must be an integer between 1 and 7.");
    }

    let requestedRoom = room.rooms[indx];
    let dayName = getDayName(day);
    let hours = requestedRoom.days[dayName.toLowerCase()];
    let availableHours = [];

    for (let hour in hours) {
        if (hours[hour] === "available") availableHours.push(hour);
    }

    let message = `<h3 style="text-align: center"> On ${dayName}, 
    Room ${name} is available for the following hours:
                  ${availableHours.join(" ")}  </h3> 
    `;
    createResponse(socket, statusCodes[200], "Available Hours", message);
};
export const remove = (room, roomPath, name, socket) => {
    let indx = 0;

    if (
        !room.rooms.some((rm, i) => {
            if (rm.name === name) indx = i;

            return rm.name === name;
        })
    ) {
        return send403(socket, "A room with this name does not exist!");
    }

    room.rooms.splice(indx, 1);
    return writeFile(roomPath, JSON.stringify(room, null, 2), (err) => {
        if (err)
            return sendFileWritingError(
                socket,
                err,
                "Server could not remove the activity."
            );

        createResponse(
            socket,
            statusCodes[200],
            "Room Removed",
            "Room with name " + name + " is successfully removed."
        );
    });
};
export const reserve = (room, roomPath, name, query, socket) => {
    let day, hour, duration;
    let indx = 0;

    if (
        !room.rooms.some((rm, i) => {
            if (rm.name === name) indx = i;
            return rm.name === name;
        })
    ) {
        return send400(socket, "A room with the name you entered does not exist.");
    }

    try {
        day = query.split("&")[1].split("day=")[1]?.trim() - 0;
        hour = query.split("&")[2].split("hour=")[1]?.trim() - 0;
        duration = query.split("&")[3].split("duration=")[1]?.trim() - 0;
    } catch (e) {
        return send400(socket, "Invalid query! One of the parameters is missing or invalid. Please enter a day, hour and duration.");
    }
    if (
        day < 1 ||
        day > 7 ||
        !Number.isInteger(day) ||
        hour < 9 ||
        hour > 17 ||
        !Number.isInteger(hour) ||
        duration < 1 ||
        duration > 9 ||
        !Number.isInteger(duration)
    ) {
        return send400(socket, "Please provide a valid day, hour and duration! Day must be an integer between 1 and 7, hour must be an integer between 9 and 17 and duration must be an integer between 1 and 9.");
    }

    let requestedRoom = room.rooms[indx];
    let dayName = getDayName(day).toLowerCase();
    let hoursOfDay = requestedRoom.days[dayName];

    for (let i = 0; i < duration; i++) {
        if (hoursOfDay[hour + i] == "reserved") {
            return send403(
                socket,
                "There is another reservation in the time slot you have selected."
            );
        }
    }

    let reservedHours = [];
    for (let i = 0; i < duration; i++) {
        hoursOfDay[hour + i] = "reserved";
        let str = `<br> ${(hour + i).toString().padStart(2, "0")}:00-${(
            hour +
            i +
            1
        )
            .toString()
            .padStart(2, "0")}:00`;

        reservedHours.push(str);
    }

    return writeFile(roomPath, JSON.stringify(room, null, 2), (err) => {
        if (err)
            return sendFileWritingError(
                socket,
                err,
                "Server could not remove the activity."
            );

        let message = `<h3> On ${getDayName(day - 0)}, 
        Room ${name} is reserved for the following hours:
                      ${reservedHours.join(",")}  </h3> 
        `;

        createResponse(socket, statusCodes[200], "Reserved Hours", message);
    });
};

export default (portNumber) => {
    const server = createServer((socket) => {
        socket.on("data", async (buffer) => {
            const request = buffer.toString("utf-8").split("\r\n");
            let query = "";
            let path = "";

            const readRooms = readFileSync(roomPath, {encoding: "utf-8"});
            const room = JSON.parse(readRooms);

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

    server.on("error", (e) => {
        if (e.code === "EADDRINUSE") {
            console.log("<Room Server> The given port number is already in use!");
        }
    });

    server.listen(portNumber);

    return server;
};
