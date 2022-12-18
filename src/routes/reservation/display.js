import { createResponse } from "../../utils.js";
import { statusCodes } from "../../utils.js";
import { send400 } from "../../utils.js";

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
    `Reservation id: ${reservationID}`,
    message
  );

  return socket.end(response);
};
