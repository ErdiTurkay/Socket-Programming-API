import path from "path";
import net from "net";
import {readFileSync, writeFile} from "fs";
import {createServer} from "net";
import {createResponse, getDayName, send400, statusCodes} from "../common.js";


const reservationPath = path.resolve("database", "reservations.json");
const readReservations = readFileSync(reservationPath, {
    encoding: "utf-8",
});

const reservation = JSON.parse(readReservations);

export const display = (reservation, query, socket) => {
    const reservationID = Number(query.split("&")[0].split("id=")[1]?.trim());
    const foundReservation = reservation.reservations.find(
        (e) => e.id === reservationID
    );

    if (!foundReservation) {
        return send400(
            socket,
            "There is no reservation according to the ID you entered."
        );
    }

    const message = `Reservation ID: ${reservationID} <br>
                       Room: ${foundReservation.room} <br>
                       Activity:  ${foundReservation.activity} <br>
                       When:  ${foundReservation.when} `;

    createResponse(
        socket,
        statusCodes[200],
        `Reservation ID: ${reservationID}`,
        message
    );
};

export const fetchAllAvailableHours = (
    day,
    listOfDays,
    roomName,
    roomServerPortNumber,
    socket
) => {
    const roomClientSocket = new net.Socket();

    roomClientSocket.connect(roomServerPortNumber, "localhost", () => {
    });

    const request =
        `GET /checkavailability?name=${roomName}&day=${day} HTTTP/1.1\r\n` +
        "Host: localhost\r\n" +
        "Accept: text/html\r\n" +
        "Accepted-Language: en-us,en\r\n" +
        "\r\n";

    roomClientSocket.write(request);

    roomClientSocket.on("data", (data) => {
        const responseFromRoomServer = data.toString("utf-8");

        if (listOfDays.length < 6) {
            let hours;

            try {
                hours = responseFromRoomServer
                    .split("\r\n")[6]
                    .split("h3")[1]
                    .slice(2, -2);
            } catch (e) {
                return send400(socket);
            }

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
                    .slice(2, -2);
            } catch (e) {
                return send400(socket);
            }

            listOfDays.push({
                day: day,
                message: "<br>" + hours,
            });

            listOfDays.sort((a, b) => a.day - b.day);

            const message = listOfDays.map((e) => e.message).join(" \n");

            createResponse(socket, statusCodes[200], "All Available Hours", message);

            listOfDays = [];
        }
    });
};

export const listAvailability = (
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
        activityName = query.split("&")[1].split("activity=")[1]?.trim();
        day = query.split("&")[2].split("day=")[1]?.trim();
        hour = query.split("&")[3].split("hour=")[1]?.trim();
        duration = query.split("&")[4].split("duration=")[1]?.trim();
    } catch (e) {
        return send400(socket, "Please enter a valid request!");
    }

    let reqToActivityServer =
        `GET /check?name=${activityName} HTTTP/1.1\r\n` +
        "Host: localhost\r\n" +
        "Accept: text/html\r\n" +
        "Accepted-Language: en-us,en\r\n" +
        "\r\n";

    var activityClientSocket = new net.Socket();

    activityClientSocket.connect(activityServerPortNumber, "localhost", () => {
    });

    activityClientSocket.write(reqToActivityServer);

    activityClientSocket.on("data", (data) => {
        const responseFromActivityServer = data.toString("utf-8");
        const responseStatus = responseFromActivityServer.split(" ")[1];

        if (responseStatus !== "200") {
            return socket.end(responseFromActivityServer);
        }

        var roomClientSocket = new net.Socket();

        roomClientSocket.connect(roomServerPortNumber, "localhost", () => {
        });

        let reqToRoomServer =
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

            let roomName = "";

            if (path === "listavailability" || path === "reserve") {
                roomName = query.split("&")[0].split("room=")[1]?.trim();

                if (!roomName) {
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
                        return listAvailability(
                            day,
                            roomName,
                            roomServerPortNumber,
                            socket
                        );
                    } else {
                        for (let i = 1; i < 8; i++) {
                            await fetchAllAvailableHours(
                                i,
                                roomName,
                                roomServerPortNumber,
                                socket
                            );
                        }
                        return;
                    }
                default:
                    return send400(
                        socket,
                        `Please use one of the "display", "listavailability" or "reserve" methods!`
                    );
            }
        });
    });

    server.on("error", (e) => {
        if (e.code === "EADDRINUSE") {
            console.log(
                "<Reservation Server> The given port number is already in use!"
            );
        }
    });

    server.listen(portNumber);

    return server;
};
