import { writeFile } from "fs";
import { createResponse } from "../../utils.js";
import { sendFileWritingError } from "../../utils.js";
import { statusCodes } from "../../utils.js";
import { send403 } from "../../utils.js";

export const remove = (activities, activityPath, name, socket) => {
  if (!activities.names.includes(name)) {
    return send403(socket);
  }

  activities.names.splice(activities.names.indexOf(name), 1);

  return writeFile(activityPath, JSON.stringify(activities), (err) => {
    if (err)
      return sendFileWritingError(
        socket,
        err,
        "Server could not remove the activity."
      );

    const response = createResponse(
      statusCodes[200],
      "Activity Removed",
      "Activity with name " + name + " is successfully removed."
    );

    return socket.end(response);
  });
};
