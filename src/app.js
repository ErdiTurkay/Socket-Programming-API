import reservation from "./reservationServer.js";
import room from "./roomServer.js";
import activity from "./activityServer.js";

const reservationServerPort = process.argv[2];
const roomServerPort = process.argv[3];
const activityServerPort = process.argv[4];

/*
  8080: Reservation
  8081: Room
  8082: Activity
*/

const activityServer = activity(activityServerPort);
const roomServer = room(roomServerPort);
const reservationServer = reservation(
  reservationServerPort,
  roomServerPort,
  activityServerPort
);
