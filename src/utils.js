import { Buffer } from "buffer";

export const statusCodes = {
  200: "200 | OK",
  204: "204 | No Content",
  400: "400 | Bad Request",
  403: "403 | Forbidden",
  404: "404 | Not Found",
  500: "500 | Internal Server Error",
};
const httpVersion = "1.1";

export const htmlTemplate = (statusCode, message) => {

  return `<DOCTYPE html>
    <html>
        <head>
            <link rel="stylesheet" href="data:image/x-icon" type="image/x-icon">
            <title>${statusCodes[statusCode]}</title>
        </head>
        <body>
            <h1>${statusCodes[statusCode]}</h1>
            <p>${message}</p>
        </body>
    </html>`;
};

export const createResponse = (status, title, message) => {

  const payload = `<DOCTYPE html>
    <html>
        <head>
            <link rel="shortcut icon" href="data:image/x-icon" type="image/x-icon">
            <title>${statusCodes[status]}</title>
        </head>
        <body>
            <h1>${title}</h1>
            <p>${message}</p>
        </body>
    </html>`;

  const contentLength = Buffer.byteLength(payload, "utf8");

  return (
    "HTTP/" +
    httpVersion +
    " " +
    status +
    "\r\n" +
    "Content-Type: text/html\r\n" +
    `Content-Length: ${contentLength}\r\n` +
    "Cache-control: no-cache, max-age=0\r\n" +
    "Date: " +
    new Date().toUTCString() +
    "\r\n" +
    "\r\n" +
    payload
  );
};

export const createRoom = (name) => {
  const room = new Object();

  room.name = name;

  room.days = {
    day1: {
      9: "empty",
      10: "empty",
      11: "empty",
      12: "empty",
      13: "empty",
      14: "empty",
      15: "empty",
      16: "empty",
      17: "empty",
    },
    day2: {
      9: "empty",
      10: "empty",
      11: "empty",
      12: "empty",
      13: "empty",
      14: "empty",
      15: "empty",
      16: "empty",
      17: "empty",
    },
    day3: {
      9: "empty",
      10: "empty",
      11: "empty",
      12: "empty",
      13: "empty",
      14: "empty",
      15: "empty",
      16: "empty",
      17: "empty",
    },
    day4: {
      9: "empty",
      10: "empty",
      11: "empty",
      12: "empty",
      13: "empty",
      14: "empty",
      15: "empty",
      16: "empty",
      17: "empty",
    },
    day5: {
      9: "empty",
      10: "empty",
      11: "empty",
      12: "empty",
      13: "empty",
      14: "empty",
      15: "empty",
      16: "empty",
      17: "empty",
    },
    day6: {
      9: "empty",
      10: "empty",
      11: "empty",
      12: "empty",
      13: "empty",
      14: "empty",
      15: "empty",
      16: "empty",
      17: "empty",
    },
    day7: {
      9: "empty",
      10: "empty",
      11: "empty",
      12: "empty",
      13: "empty",
      14: "empty",
      15: "empty",
      16: "empty",
      17: "empty",
    },
  };

  return room;
};

export const send400 = (socket, message) => {
  const html = htmlTemplate(statusCodes[400], message);

  const contentLength = Buffer.byteLength(html, "utf8");

  const response =
    "HTTP/" +
    httpVersion +
    " " +
    statusCodes[400] +
    "\r\n" +
    "Content-Type: text/html\r\n" +
    `Content-Length: ${contentLength}\r\n` +
    "Cache-control: no-cache, max-age=0\r\n" +
    "Date: " +
    new Date().toUTCString() +
    "\r\n" +
    "\r\n" +
    html;

  return socket.end(response);
};

export const send403 = (socket, message) => {
  const html = htmlTemplate(statusCodes[403], message);

  const contentLength = Buffer.byteLength(html, "utf8");

  const response =
    "HTTP/" +
    httpVersion +
    " " +
    statusCodes[403] +
    "\r\n" +
    "Content-Type: text/html\r\n" +
    `Content-Length: ${contentLength}\r\n` +
    "Cache-control: no-cache, max-age=0\r\n" +
    "Date: " +
    new Date().toUTCString() +
    "\r\n" +
    "\r\n" +
    html;

  return socket.end(response);
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
  const response = createResponse(
    statusCodes[500],
    "Error",
    `${message} An error occured while writing file.`
  );
  return socket.end(response);
};

export const createResponseToFaviconRequest = () => {
  return (
    "HTTP/" +
    httpVersion +
    " " +
    statusCodes[204] +
    "\r\n" +
    "Content-Type: text/html\r\n" +
    "Content-Length: 0\r\n" +
    "Cache-control: no-cache, max-age=0\r\n" +
    "Date: " +
    new Date().toUTCString() +
    "\r\n" +
    "\r\n"
  );
};
