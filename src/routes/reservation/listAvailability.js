import net from "net";

export const listAvailability = (
  day,
  roomName,
  roomServerPortNumber,
  socket
) => {
  const roomClientSocket = new net.Socket();
  roomClientSocket.connect(roomServerPortNumber, "localhost", () => {
    //console.log("Connection from Reservation Server to Room Server");
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
