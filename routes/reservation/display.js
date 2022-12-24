import { createResponse, statusCodes, send400 } from "../../common.js";

export const display = (reservation, query, socket) => {
  const reservationID = Number(query.split("&")[0].split("id=")[1]?.trim());
  const foundReservation = reservation.reservations.find(
    (e) => e.id === reservationID
  );

  if (!foundReservation) {
    return send400(
      socket,
      "There is no reservation according to the ID you entered."
    );
  }

  const message = `Reservation ID: ${reservationID} <br>
                       Room: ${foundReservation.room} <br>
                       Activity:  ${foundReservation.activity} <br>
                       When:  ${foundReservation.when} `;

  createResponse(
    socket,
    statusCodes[200],
    `Reservation ID: ${reservationID}`,
    message
  );
};
