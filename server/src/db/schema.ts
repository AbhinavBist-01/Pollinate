import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 322 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  provider: varchar("provider", { length: 20 }).notNull().default("email"),
  providerId: varchar("provider_id", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const pollsTable = pgTable(
  "polls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    shareId: varchar("share_id", { length: 21 }).notNull().unique(),
    expiresAt: timestamp("expires_at"),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    shareIdIdx: uniqueIndex("share_id_idx").on(table.shareId),
    ownerIdIdx: index("owner_id_idx").on(table.ownerId),
  }),
);

export const questionsTable = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => pollsTable.id, { onDelete: "cascade" }),
    text: varchar("text", { length: 500 }).notNull(),
    type: varchar("type", { length: 20 }).notNull().default("radio"),
    order: integer("order").notNull().default(0),
    isRequired: boolean("is_required").notNull().default(true),
    timeLimit: integer("time_limit"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
    (table) => ({
      pollIdIdx: index("questions_poll_id_idx").on(table.pollId),
    }),
);

export const optionsTable = pgTable(
  "options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questionsTable.id, { onDelete: "cascade" }),
    text: varchar("text", { length: 255 }).notNull(),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
    (table) => ({
      questionIdIdx: index("options_question_id_idx").on(table.questionId),
    }),
);

export const responsesTable = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => pollsTable.id, { onDelete: "cascade" }),
    respondentId: uuid("respondent_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    pollIdIdx: index("responses_poll_id_idx").on(table.pollId),
    respondentIdIdx: index("respondent_id_idx").on(table.respondentId),
  }),
);

export const answersTable = pgTable(
  "answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => responsesTable.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questionsTable.id, { onDelete: "cascade" }),
    optionId: uuid("option_id"),
    value: text("value"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    responseIdIdx: index("answers_response_id_idx").on(table.responseId),
    questionIdIdx: index("answers_question_id_idx").on(table.questionId),
  }),
);
