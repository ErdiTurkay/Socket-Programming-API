import { createResponse } from "../../utils.js";
import { statusCodes } from "../../utils.js";
import { getDayName } from "../../utils.js";
import { send400 } from "../../utils.js";

const httpVersion = "1.1";

export const checkAvailability = (room, name, query, socket) => {
  let indx = 0;

  if (
    !room.rooms.some((rm, i) => {
      if (rm.name === name) indx = i;

      return rm.name === name;
    })
  ) {
    const response = "HTTP/" + httpVersion + " " + statusCodes[404] + "\r\n";
    return socket.end(response);
  }
  let day;

  try {
    day = query.split("&")[1].split("day=")[1]?.trim() - 0;
  } catch (err) {
    return send400(socket);
  }
  if (isNaN(day) || day < 1 || day > 7 || !Number.isInteger(day)) {
    return send400(socket);
  }

  let requestedRoom = room.rooms[indx];
  let hours = requestedRoom.days["day" + day];
  let availableHours = [];

  for (let hour in hours) {
    if (hours[hour] === "empty") availableHours.push(hour);
  }

  let message = `<h3> On ${getDayName(day - 0)}, 
    Room ${name} is available for the following hours:
                  ${availableHours.join(" ")}  </h3> 
    `;
  const response = createResponse(statusCodes[200], "Available Hours", message);
  return socket.end(response);
};
