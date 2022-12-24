import { writeFile } from "fs";
import {
  createResponse,
  createRoom,
  sendFileWritingError,
  statusCodes,
  send403,
} from "../../common.js";

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
