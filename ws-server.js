// ws-server.js
"use node";

// eslint-disable-next-line @typescript-eslint/no-require-imports
import { WebSocketServer } from "ws";
import { ConvexHttpClient } from "convex/browser"; // SDK Convex
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import user from "./convex/users.js";

const wss = new WebSocketServer({ port: 8080 });

const clients = new Map(); // Stocker l'état des connexions utilisateurs

const convexDeploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convexClient = new ConvexHttpClient(convexDeploymentUrl);
console.log(convexDeploymentUrl.slice(4));

wss.on("connection", (ws) => {
  console.log("Nouvelle connexion WebSocket");

  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));

  ws.on("message", async (message) => {
    const parsedMessage = JSON.parse(message);
    // Stocker l'utilisateur dans la Map
    if (parsedMessage.type === "SET_ONLINE") {
      clients.set(parsedMessage.userId, ws);
    }

    // Détection de déconnexion
    ws.on("close", async () => {
      console.log("Un utilisateur a quitté.");
      clients.forEach(async (client, userId) => {
        if (client === ws) {
          
          clients.delete(userId);
        }
      });
    });
  });
});

// Garder les connexions WebSocket ouvertes
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

console.log("Serveur WebSocket démarré sur ws://localhost:8080");
