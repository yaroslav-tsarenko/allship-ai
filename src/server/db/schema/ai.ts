import { index, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./_helpers";
import { user } from "./auth";
import { aiRoleEnum } from "./enums";

export const aiThread = pgTable(
  "ai_thread",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text().notNull().default("New conversation"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("ai_thread_user_idx").on(t.userId, t.updatedAt)],
);

export const aiMessage = pgTable(
  "ai_message",
  {
    id: id(),
    threadId: uuid()
      .notNull()
      .references(() => aiThread.id, { onDelete: "cascade" }),
    role: aiRoleEnum().notNull(),
    parts: jsonb().$type<unknown[]>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("ai_message_thread_idx").on(t.threadId, t.createdAt)],
);
