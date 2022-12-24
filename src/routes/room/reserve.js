import { writeFile } from "fs";
import {
  createResponse,
  sendFileWritingError,
  statusCodes,
  getDayName,
  send400,
  send403,
} from "../../common.js";

export const reserve = (room, roomPath, name, query, socket) => {
  let day, hour, duration;
  let indx = 0;

  if (
    !room.rooms.some((rm, i) => {
      if (rm.name === name) indx = i;
      return rm.name === name;
    })
  ) {
    return send400(socket);
  }

  try {
    day = query.split("&")[1].split("day=")[1]?.trim() - 0;
    hour = query.split("&")[2].split("hour=")[1]?.trim() - 0;
    duration = query.split("&")[3].split("duration=")[1]?.trim() - 0;
  } catch (e) {
    return send400(socket);
  }
  if (
    day < 1 ||
    day > 7 ||
    !Number.isInteger(day) ||
    hour < 9 ||
    hour > 17 ||
    !Number.isInteger(hour) ||
    duration < 1 ||
    duration > 9 ||
    !Number.isInteger(duration)
  ) {
    return send400(socket);
  }

  let requestedRoom = room.rooms[indx];
  let dayName = getDayName(day).toLowerCase();
  let hoursOfDay = requestedRoom.days[dayName];

  for (let i = 0; i < duration; i++) {
    if (hoursOfDay[hour + i] !== "available") {
      return send403(socket);
    }
  }

  let reservedHours = [];
  for (let i = 0; i < duration; i++) {
    hoursOfDay[hour + i] = "reserved";
    let str = `<br> ${(hour + i).toString().padStart(2, "0")}:00-${(
      hour +
      i +
      1
    )
      .toString()
      .padStart(2, "0")}:00`;

    reservedHours.push(str);
  }

  return writeFile(roomPath, JSON.stringify(room, null, 2), (err) => {
    if (err)
      return sendFileWritingError(
        socket,
        err,
        "Server could not remove the activity."
      );

    let message = `<h3> On ${getDayName(day - 0)}, 
        Room ${name} is reserved for the following hours:
                      ${reservedHours.join(",")}  </h3> 
        `;

    const response = createResponse(
      statusCodes[200],
      "Reserved Hours",
      message
    );

    return socket.end(response);
  });
};
