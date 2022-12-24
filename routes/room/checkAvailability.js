import {
  createResponse,
  statusCodes,
  getDayName,
  send400,
} from "../../common.js";

export const checkAvailability = (room, name, query, socket) => {
  let indx = 0;

  if (
    !room.rooms.some((rm, i) => {
      if (rm.name === name) indx = i;

      return rm.name === name;
    })
  ) {
    const response = "HTTP/1.1 " + statusCodes[404] + "\r\n";
    return socket.end(response);
  }
  let day;

  try {
    day = query.split("&")[1].split("day=")[1]?.trim() - 0;
  } catch (e) {
    return send400(socket);
  }
  if (isNaN(day) || day < 1 || day > 7 || !Number.isInteger(day)) {
    return send400(socket);
  }

  let requestedRoom = room.rooms[indx];
  let dayName = getDayName(day);
  let hours = requestedRoom.days[dayName.toLowerCase()];
  let availableHours = [];

  for (let hour in hours) {
    if (hours[hour] === "available") availableHours.push(hour);
  }

  let message = `<h3> On ${dayName}, 
    Room ${name} is available for the following hours:
                  ${availableHours.join(" ")}  </h3> 
    `;
  createResponse(socket, statusCodes[200], "Available Hours", message);
};
