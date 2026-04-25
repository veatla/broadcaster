import { Router } from "express";
import { sendMessageHandler } from "./handlers/send-message.handler";
import { listMessagesHandler } from "./handlers/list-messages.handler";
import { deleteMessageHandler } from "./handlers/delete-message.handler";
import { editMessageHandler } from "./handlers/edit-message.handler";

const messagesRoute = Router();

messagesRoute.post("/send/:type/:id", sendMessageHandler);
messagesRoute.get("/list/:type/:id", listMessagesHandler);
messagesRoute.delete("/:id", deleteMessageHandler);
messagesRoute.patch("/edit/:id", editMessageHandler);

export default messagesRoute;
