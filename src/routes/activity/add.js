import { writeFile } from "fs";
import {
  statusCodes,
  send403,
  sendFileWritingError,
  createResponse,
} from "../../utils.js";

export const add = (activities, activityPath, name, socket) => {
  if (activities.names.includes(name)) {
    return send403(socket);
  }

  activities.names.push(name);
  return writeFile(activityPath, JSON.stringify(activities, null, 2), (err) => {
    if (err)
      return sendFileWritingError(
        socket,
        err,
        "Server could not add the activity."
      );

    const response = createResponse(
      statusCodes[200],
      "Activity Added",
      "Activity with name " + name + " is successfully added."
    );

    return socket.end(response);
  });
};
