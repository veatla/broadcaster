import { Router } from "express";
import { listChatsHandler } from "./handlers/list-chats.handler";

const chatsRoute = Router();

chatsRoute.get("/", listChatsHandler);

export default chatsRoute;
