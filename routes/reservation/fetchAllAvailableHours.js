import net from "net";
import { statusCodes, send400, createResponse } from "../../common.js";

export const fetchAllAvailableHours = (
  day,
  listOfDays,
  roomName,
  roomServerPortNumber,
  socket
) => {
  const roomClientSocket = new net.Socket();

  roomClientSocket.connect(roomServerPortNumber, "localhost", () => {});

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
