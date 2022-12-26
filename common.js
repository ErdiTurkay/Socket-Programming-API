import {Buffer} from "buffer";

export const statusCodes = {
    200: "200 OK",
    400: "400 Bad Request",
    403: "403 Forbidden",
    404: "404 Not Found",
    500: "500 Internal Server Error",
};

export const createResponse = (socket, status, title, message) => {
    const payload = `<html>
        <head>
            <title>${title}</title>
            <style>
                .title {
                    font-size: 24px;
                    font-weight: bold;
                    color: red;
                    margin-bottom: 10px;
                }
                
                .message {
                    font-size: 18px;
                    color: #333;
                }
            </style>
        </head>
        <body>
            <h1 class="title">${title}</h1>
            <p class="message">${message}</p>
        </body>
      </html>`;

    const contentLength = Buffer.byteLength(payload, "utf8");

    const response =
        "HTTP/1.1 " +
        status +
        "\r\n" +
        "Content-Type: text/html\r\n" +
        `Content-Length: ${contentLength}\r\n` +
        "Cache-control: no-cache, max-age=0\r\n" +
        "Date: " +
        new Date().toUTCString() +
        "\r\n" +
        "\r\n" +
        payload;

    return socket.end(response);
};

export const createRoom = (name) => {
    const room = new Object();

    room.name = name;

    room.days = {
        monday: {
            9: "available",
            10: "available",
            11: "available",
            12: "available",
            13: "available",
            14: "available",
            15: "available",
            16: "available",
            17: "available",
        },
        tuesday: {
            9: "available",
            10: "available",
            11: "available",
            12: "available",
            13: "available",
            14: "available",
            15: "available",
            16: "available",
            17: "available",
        },
        wednesday: {
            9: "available",
            10: "available",
            11: "available",
            12: "available",
            13: "available",
            14: "available",
            15: "available",
            16: "available",
            17: "available",
        },
        thursday: {
            9: "available",
            10: "available",
            11: "available",
            12: "available",
            13: "available",
            14: "available",
            15: "available",
            16: "available",
            17: "available",
        },
        friday: {
            9: "available",
            10: "available",
            11: "available",
            12: "available",
            13: "available",
            14: "available",
            15: "available",
            16: "available",
            17: "available",
        },
        saturday: {
            9: "available",
            10: "available",
            11: "available",
            12: "available",
            13: "available",
            14: "available",
            15: "available",
            16: "available",
            17: "available",
        },
        sunday: {
            9: "available",
            10: "available",
            11: "available",
            12: "available",
            13: "available",
            14: "available",
            15: "available",
            16: "available",
            17: "available",
        },
    };

    return room;
};

export const send400 = (socket, message) => {
    createResponse(socket, statusCodes[400], statusCodes[400], message);
};

export const send403 = (socket, message) => {
    createResponse(socket, statusCodes[400], statusCodes[400], message);
};

export const getDayName = (day) => {
    switch (day) {
        case 1:
            return "Monday";
        case 2:
            return "Tuesday";
        case 3:
            return "Wednesday";
        case 4:
            return "Thursday";
        case 5:
            return "Friday";
        case 6:
            return "Saturday";
        case 7:
            return "Sunday";
        default:
            return null;
    }
};

export const sendFileWritingError = (socket, err, message) => {
    createResponse(
        socket,
        statusCodes[500],
        "Error",
        `${message} An error occured while writing file.`
    );
};
