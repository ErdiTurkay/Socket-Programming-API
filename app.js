import reservation from "./servers/reservationServer.js";
import room from "./servers/roomServer.js";
import activity from "./servers/activityServer.js";

/*
  8080: Reservation
  8081: Room
  8082: Activity
*/

const reservationServerPort = process.argv[2];
const roomServerPort = process.argv[3];
const activityServerPort = process.argv[4];

const activityServer = activity(activityServerPort);
const roomServer = room(roomServerPort);
const reservationServer = reservation(
  reservationServerPort,
  roomServerPort,
  activityServerPort
);
