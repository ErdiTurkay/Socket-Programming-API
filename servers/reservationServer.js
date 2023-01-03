import path from "path";
import net from "net";
import {readFileSync, writeFile} from "fs";
import {createServer} from "net";
import {createResponse, getDayName, send400, statusCodes} from "../common.js";

// Set the file path for the JSON file storing the list of reservations
const reservationPath = path.resolve("database", "reservations.json");
// Read the contents of the file
const readReservations = readFileSync(reservationPath, {
    encoding: "utf-8",
});
// Parse the JSON file contents into a JavaScript object
const reservation = JSON.parse(readReservations);

export const display = (reservation, query, socket) => { // Display the details of a specific reservation
    const reservationID = Number(query.split("&")[0].split("id=")[1]?.trim()); // Get the reservation ID from the query
    const foundReservation = reservation.reservations.find( // Find the reservation with the given ID
        (e) => e.id === reservationID
    );

    if (!foundReservation) { // If the reservation does not exist
        return send400(
            socket,
            "There is no reservation according to the ID you entered."
        );
    }
    // Construct the message to be sent in the HTTP response
    const message = `Reservation ID: ${reservationID} <br> 
                       Room: ${foundReservation.room} <br>
                       Activity:  ${foundReservation.activity} <br>
                       When:  ${foundReservation.when} `;

    createResponse(  // Send a response to the client
        socket,
        statusCodes[200],
        `Reservation ID: ${reservationID}`,
        message
    );
};

export const fetchAllAvailableHours = ( // Fetch all available hours
    day,
    listOfDays,
    roomName,
    roomServerPortNumber,
    socket
) => {
    const roomClientSocket = new net.Socket(); // Create a new socket

    roomClientSocket.connect(roomServerPortNumber, "localhost", () => {
    }); // Connect to the room server

    const request = // Create a request to the room server
        `GET /checkavailability?name=${roomName}&day=${day} HTTTP/1.1\r\n` +
        "Host: localhost\r\n" +
        "Accept: text/html\r\n" +
        "Accepted-Language: en-us,en\r\n" +
        "\r\n";

    roomClientSocket.write(request); // Send the request to the room server

    roomClientSocket.on("data", (data) => { // When the room server sends a response
        const responseFromRoomServer = data.toString("utf-8"); // Get the response from the room server

        if (listOfDays.length < 6) {
            // Parse the list of available hours from the response
            let hours;

            try {
                hours = responseFromRoomServer
                    .split("\r\n")[6]
                    .split("h3")[1]
                    .slice(28, -2);
            } catch (e) {
                return send400(socket);
            }
            // Add the day and the available hours to the list of days
            listOfDays.push({
                day: day,
                message: "<br>" + hours,
            });

            return;
        } else {
            let hours;

            try {
                hours = responseFromRoomServer
                    .split("\r\n")[6]
                    .split("h3")[1]
                    .slice(28, -2);
            } catch (e) {
                return send400(socket);
            }

            listOfDays.push({
                day: day,
                message: "<br>" + hours,
            });
            // Sort the list of days by day number
            listOfDays.sort((a, b) => a.day - b.day);
            // Construct the message to be sent in the HTTP response
            const message = listOfDays.map((e) => e.message).join(" \n");

            createResponse(socket, statusCodes[200], "All Available Hours", message);

            listOfDays = [];
        }
    });
};

export const listAvailability = ( // Display the available hours for each day of the week
    day,
    roomName,
    roomServerPortNumber,
    socket
) => {
    const roomClientSocket = new net.Socket();
    roomClientSocket.connect(roomServerPortNumber, "localhost", () => {
    });

    let reqToRoomServer =
        `GET /checkavailability?name=${roomName}&day=${day} HTTTP/1.1\r\n` +
        "Host: localhost\r\n" +
        "Accept: text/html\r\n" +
        "Accepted-Language: en-us,en\r\n" +
        "\r\n";

    roomClientSocket.write(reqToRoomServer);

    roomClientSocket.on("data", (data) => {
        const responseFromRoomServer = data.toString("utf-8");

        return socket.end(responseFromRoomServer);
    });
};
export const reserve = (
    reservation,
    reservationPath,
    roomName,
    query,
    activityServerPortNumber,
    roomServerPortNumber,
    socket
) => {
    let day, hour, duration, activityName;

    try {
        activityName = query.split("&")[1].split("activity=")[1]?.trim(); // Get the activity name from the query
        day = query.split("&")[2].split("day=")[1]?.trim(); // Get the day from the query
        hour = query.split("&")[3].split("hour=")[1]?.trim(); // Get the hour from the query
        duration = query.split("&")[4].split("duration=")[1]?.trim(); // Get the duration from the query
    } catch (e) {
        return send400(socket, "Please enter a valid request!"); // If the query is invalid
    }

    let reqToActivityServer = // Create a request to the activity server
        `GET /check?name=${activityName} HTTTP/1.1\r\n` +
        "Host: localhost\r\n" +
        "Accept: text/html\r\n" +
        "Accepted-Language: en-us,en\r\n" +
        "\r\n";

    var activityClientSocket = new net.Socket(); // Create a new socket

    activityClientSocket.connect(activityServerPortNumber, "localhost", () => {
    }); // Connect to the activity server

    activityClientSocket.write(reqToActivityServer);

    activityClientSocket.on("data", (data) => {
        const responseFromActivityServer = data.toString("utf-8");
        const responseStatus = responseFromActivityServer.split(" ")[1];

        if (responseStatus !== "200") { // If the activity does not exist
            return socket.end(responseFromActivityServer);
        }

        var roomClientSocket = new net.Socket();

        roomClientSocket.connect(roomServerPortNumber, "localhost", () => {
        });

        let reqToRoomServer = // Create a request to the room server
            `GET /reserve?name=${roomName}&day=${day}&hour=${hour}&duration=${duration} HTTTP/1.1\r\n` +
            "Host: localhost\r\n" +
            "Accept: text/html\r\n" +
            "Accepted-Language: en-us,en\r\n" +
            "\r\n";

        roomClientSocket.write(reqToRoomServer);

        roomClientSocket.on("data", (data) => {
            const responseFromRoomServer = data.toString("utf-8");
            const responseStatus = data
                .toString("utf-8")
                .split("\r\n")[0]
                .split(" ")[1];

            if (responseStatus !== "200") {
                return socket.end(responseFromRoomServer);
            }

            const reservationID = reservation.reservations.length + 1;

            const newReservation = {
                id: reservationID,
                activity: activityName,
                room: roomName,
                when: `${getDayName(day - 0)} ${hour.toString().padStart(2, "0")}:00-${(
                    Number(hour) + Number(duration)
                )
                    .toString()
                    .padStart(2, "0")}:00`,
            };

            reservation.reservations.push(newReservation);

            return writeFile(
                reservationPath,
                JSON.stringify(reservation, null, 2),
                (err) => {
                    if (err) console.log(err);
                    const message = `Room ${newReservation.room}  is reserved for activity ${newReservation.activity}
                          on ${newReservation.when}.
                          Your reservation ID is ${newReservation.id}
          `;

                    createResponse(
                        socket,
                        statusCodes[200],
                        "Reservation Successful",
                        message
                    );
                }
            );
        });
    });
};

export default (portNumber, roomServerPortNumber, activityServerPortNumber) => {
    const server = net.createServer((socket) => {
        let listOfDays = [];
        let i = 1;

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

            if (
                path !== "display" &&
                path !== "listavailability" &&
                path !== "reserve"
            ) {
                return send400(
                    socket,
                    `Please use one of the "display", "listavailability" or "reserve" methods!`
                );
            }

            let roomName = "";

            if (path === "listavailability" || path === "reserve") {
                roomName = query.split("&")[0].split("room=")[1]?.trim();
                if (roomName === "" || roomName == undefined) {
                    return send400(socket, "The room name must not be empty.");
                }
            }

            if (path === "reserve")
                return reserve(
                    reservation,
                    reservationPath,
                    roomName,
                    query,
                    activityServerPortNumber,
                    roomServerPortNumber,
                    socket
                );

            const day = query.split("&")[1]?.split("day=")[1]?.trim();

            if (path == "listavailability" && day)
                return listAvailability(day, roomName, roomServerPortNumber, socket);

            if (path == "listavailability" && !day) {
                for (let x = 1; x < 8; x++) {
                    fetchAllAvailableHours(
                        i,
                        listOfDays,
                        roomName,
                        roomServerPortNumber,
                        socket
                    );
                    i++;
                }
                listOfDays = [];
                return;
            }

            if (path == "display") return display(reservation, query, socket);
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