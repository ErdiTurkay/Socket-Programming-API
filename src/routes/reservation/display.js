import { createResponse } from "../../common.js";
import { statusCodes } from "../../common.js";
import { send400 } from "../../common.js";

export const display = (reservation, query, socket) => {
  const reservationID = Number(query.split("&")[0].split("id=")[1]?.trim());
  if (
    reservationID == 0 ||
    reservationID == undefined ||
    isNaN(reservationID)
  ) {
    return send400(socket);
  }

  const rt = reservation.reservations.find((e) => e.id === reservationID);

  if (rt === "" || rt == null || rt.length == 0) {
    return send400(socket);
  }

  const message = `Reservation ID: ${reservationID} <br>
                       Room: ${rt.room} <br>
                       Activity:  ${rt.activity} <br>
                       When:  ${rt.when} `;
  const response = createResponse(
    statusCodes[200],
    `Reservation ID: ${reservationID}`,
    message
  );

  return socket.end(response);
};
