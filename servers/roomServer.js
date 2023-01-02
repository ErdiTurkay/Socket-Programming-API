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


const roomPath = path.resolve("database", "rooms.json"); // Set the file path for the JSON file storing the list of rooms
export const add = (room, roomPath, name, socket) => { // Add a new room to rooms.json
    for (let rm of room.rooms) {
        if (rm.name === name) {
            return send403(socket, "A room with this name already exists!");
        }
    }

    let newRoom = createRoom(name); // Create a new room object
    room.rooms.push(newRoom); // Add the new room to the list of rooms

    return writeFile(roomPath, JSON.stringify(room, null, 2), (err) => {
        if (err)
            return sendFileWritingError(
                socket,
                err,
                "Server could not add the room."
            );

        createResponse( // Send a response to the client
            socket,
            statusCodes[200],
            "Room Added",
            "Room with name " + name + " is successfully added."
        );
    });
};
export const checkAvailability = (room, name, query, socket) => { // Check the availability of a room
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
        day = query.split("&")[1].split("day=")[1]?.trim() - 0; // Get the day from the query string
    } catch (e) {
        return send400(socket, "Invalid query! Please enter a day.");
    }
    if (isNaN(day) || day < 1 || day > 7 || !Number.isInteger(day)) { // If the day is invalid
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
    createResponse(socket, statusCodes[200], "Available Hours", message); // Send a response to the client
};
export const remove = (room, roomPath, name, socket) => { // Remove a room from rooms.json
    let indx = 0;

    if (
        !room.rooms.some((rm, i) => { // If the room does not exist
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
export const reserve = (room, roomPath, name, query, socket) => { // Reserve a room
    let day, hour, duration;
    let indx = 0;

    if (
        !room.rooms.some((rm, i) => { // If the room does not exist
            if (rm.name === name) indx = i;
            return rm.name === name;
        })
    ) {
        return send400(socket, "A room with the name you entered does not exist.");
    }

    try {
        day = query.split("&")[1].split("day=")[1]?.trim() - 0; // Get the day from the query string
        hour = query.split("&")[2].split("hour=")[1]?.trim() - 0; // Get the hour from the query string
        duration = query.split("&")[3].split("duration=")[1]?.trim() - 0; // Get the duration from the query string
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

    for (let i = 0; i < duration; i++) { // Check if the room is available for the requested duration
        if (hoursOfDay[hour + i] == "reserved") {
            return send403(
                socket,
                "There is another reservation in the time slot you have selected."
            );
        }
    }

    let reservedHours = [];
    for (let i = 0; i < duration; i++) { // Reserve the room for the requested duration
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

        createResponse(socket, statusCodes[200], "Reserved Hours", message); // Send a response to the client
    });
};

export default (portNumber) => {
    const server = createServer((socket) => { // Create a server
        socket.on("data", async (buffer) => { // When the server receives data
            const request = buffer.toString("utf-8").split("\r\n"); // Get the request
            let query = ""; // Initialize the query string
            let path = "";  // Initialize the path

            const readRooms = readFileSync(roomPath, {encoding: "utf-8"});
            const room = JSON.parse(readRooms);

            try {
                path = request[0] // Get the path from the request
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
                case "add": // If the path is add return the add function
                    return add(room, roomPath, name, socket);
                case "remove": // If the path is remove return the remove function
                    return remove(room, roomPath, name, socket);
                case "checkavailability": // If the path is checkavailability return the checkAvailability function
                    return checkAvailability(room, name, query, socket);
                case "reserve": // If the path is reserve return the reserve function
                    return reserve(room, roomPath, name, query, socket);
                default: // If the path is not valid return an error
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
