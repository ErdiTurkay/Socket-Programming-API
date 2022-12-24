import { writeFile } from "fs";
import { createResponse } from "../../common.js";
import { sendFileWritingError } from "../../common.js";
import { statusCodes } from "../../common.js";
import { send403 } from "../../common.js";

export const remove = (room, roomPath, name, socket) => {
  let indx = 0;

  if (
    !room.rooms.some((rm, i) => {
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

    const response = createResponse(
      statusCodes[200],
      "Room Removed",
      "Room with name " + name + " is successfully removed."
    );

    return socket.end(response);
  });
};
