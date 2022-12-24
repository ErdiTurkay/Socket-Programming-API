import { writeFile } from "fs";
import {
  createResponse,
  sendFileWritingError,
  statusCodes,
  send403,
} from "../../common.js";

export const remove = (activities, activityPath, name, socket) => {
  if (!activities.names.includes(name)) {
    return send403(socket, "An activity with this name does not exist!");
  }

  activities.names.splice(activities.names.indexOf(name), 1);

  return writeFile(activityPath, JSON.stringify(activities, null, 2), (err) => {
    if (err)
      return sendFileWritingError(
        socket,
        err,
        "Server could not remove the activity."
      );

    createResponse(
      socket,
      statusCodes[200],
      "Activity Removed",
      "Activity with name " + name + " is successfully removed."
    );
  });
};
