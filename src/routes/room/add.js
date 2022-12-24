import { writeFile, readFileSync } from "fs";
import { createResponse } from "../../common.js";
import { createRoom } from "../../common.js";
import { sendFileWritingError } from "../../common.js";
import { statusCodes } from "../../common.js";
import { send403 } from "../../common.js";

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

    const response = createResponse(
      statusCodes[200],
      "Room Added",
      "Room with name " + name + " is successfully added."
    );

    return socket.end(response);
  });
};
