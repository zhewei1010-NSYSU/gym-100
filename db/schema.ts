import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
export const checkins = sqliteTable("gym_checkins", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull(),
}, (table) => [index("gym_checkins_user_date_idx").on(table.userId, table.date)]);
