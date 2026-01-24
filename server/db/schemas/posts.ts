import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";
import z from "zod";

import { userTable } from "./auth";
import { commentsTable } from "./comments";
import { commentsUpvotesTable, postUpvotesTable } from "./upvotes";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  url: text("url"),
  content: text("content"),
  points: integer("points").default(0).notNull(),
  commentCount: integer("comment_count").default(0).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const insertPostSchema = createInsertSchema(postsTable, {
  title: z.string().min(3, { error: "Title must be atleast 3 character" }),
  url: z.url({ error: "URL must be a valid URL" }).optional().or(z.literal("")),
  content: z.string().optional(),
});

export const postRelations = relations(postsTable, ({ one, many }) => ({
  author: one(userTable, {
    fields: [postsTable.userId],
    references: [userTable.id],
    relationName: "author",
  }),
  postUpvotesTable: many(postUpvotesTable, {
    relationName: "postUpvotes",
  }),
  comments: many(commentsTable),
}));
