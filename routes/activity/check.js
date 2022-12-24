import { statusCodes, send400 } from "../../common.js";

export const check = (activities, name, socket) => {
  if (activities.names.includes(name)) {
    const response = "HTTP/1.1 " + statusCodes[200] + "\r\n";
    return socket.end(response);
  }

  send400(socket, "The requested activity has not been added yet.");
};
