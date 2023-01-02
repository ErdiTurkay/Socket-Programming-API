import path from "path";
import {createServer} from "net";
import {readFileSync, writeFile} from "fs";
import {createResponse, send400, send403, sendFileWritingError, statusCodes} from "../common.js";

// Set the file path for the JSON file storing the list of activities
const activityPath = path.resolve("database", "activities.json");
// Read the contents of the file
const readActivities = readFileSync(activityPath, {encoding: "utf-8"});
// Parse the JSON file contents into a JavaScript object
const activities = JSON.parse(readActivities);

// Add a new activity to activities.json
export const add = (activities, activityPath, name, socket) => {
    if (activities.names.includes(name)) { // If the activity already exists
        return send403(socket, "An activity with this name already exists!");
    }

    activities.names.push(name); // Add the new activity to the list of activities
    // Write the updated list of activities to the JSON file
    return writeFile(activityPath, JSON.stringify(activities, null, 2), (err) => {
        if (err)
            return sendFileWritingError(
                socket,
                err,
                "Server could not add the activity."
            );
        // Send a response to the client
        createResponse(
            socket,
            statusCodes[200],
            "Activity Added",
            "Activity with name " + name + " is successfully added."
        );
    });
};
export const check = (activities, name, socket) => {
    if (activities.names.includes(name)) {
        const response = "HTTP/1.1 " + statusCodes[200] + "\r\n";
        return socket.end(response);
    }

    send400(socket, "The requested activity has not been added yet.");
};

export const remove = (activities, activityPath, name, socket) => { // Remove an activity from activities.json
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
export default (portNumber) => { // Create the server
    const server = createServer((socket) => {
        socket.on("data", async (buffer) => {
            const request = buffer.toString("utf-8").split("\r\n"); // Split the request into lines
            let query = ""; // Initialize the query string
            let path = ""; // Initialize the path string

            try { // Get the path and query from the request
                path = request[0]
                    .split(" ")[1]
                    .split("?")[0]
                    .slice(1)
                    .trim()
                    .toLowerCase();
                query = request[0].split(" ")[1].split("?")[1].trim(); // Get the query string
            } catch (e) { // If the request is invalid
                return send400(socket, "Please enter a valid request!");
            }

            const name = query.split("name=")[1]?.trim(); // Get the name of the activity from the query string

            if (!name) { // If the name is not provided
                return send400(socket, "The activity name must not be empty.");
            }

            switch (path) { // Handle the request based on the path
                case "add":
                    return add(activities, activityPath, name, socket);
                case "remove":
                    return remove(activities, activityPath, name, socket);
                case "check":
                    return check(activities, name, socket);
                default:
                    return send400(
                        socket,
                        `Please use one of the "add", "remove" or "check" methods!`
                    );
            }
        });
    });

    server.on("error", (e) => {
        if (e.code === "EADDRINUSE") { // If the port number is already in use
            console.log("<Activity Server> The given port number is already in use!");
            e;
        }
    });

    server.listen(portNumber); // Listen to the given port number

    return server;
};
