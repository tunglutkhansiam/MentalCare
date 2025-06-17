import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  dateOfBirth: text("date_of_birth"),
  bloodType: text("blood_type"),
  height: integer("height"),
  weight: integer("weight"),
  allergies: text("allergies"),
  chronicConditions: text("chronic_conditions"),
  phoneNumber: text("phone_number"),
  profileImage: text("profile_image"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  dateOfBirth: true,
  phoneNumber: true,
}).extend({
  phoneNumber: z.string().optional(),
});

// Health expert schema
export const experts = pgTable("experts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  about: text("about").notNull(),
  education: text("education").notNull(),
  experience: text("experience").notNull(),
  rating: integer("rating"),
  reviewCount: integer("review_count"),
  profileImage: text("profile_image"),
  phoneNumber: text("phone_number"),
  isAvailable: boolean("is_available").default(true),
});

export const insertExpertSchema = createInsertSchema(experts).pick({
  userId: true,
  name: true,
  specialty: true,
  about: true,
  education: true,
  experience: true,
  rating: true,
  reviewCount: true,
  profileImage: true,
  isAvailable: true,
});

// Specialization for the experts
export const specializations = pgTable("specializations", {
  id: serial("id").primaryKey(),
  expertId: integer("expert_id").notNull(),
  name: text("name").notNull(),
});

export const insertSpecializationSchema = createInsertSchema(specializations).pick({
  expertId: true,
  name: true,
});

// Appointment schema
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  expertId: integer("expert_id").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: text("status").notNull().default("upcoming"), // upcoming, completed, cancelled
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).pick({
  userId: true,
  expertId: true,
  date: true,
  time: true,
  reason: true,
});

// Chat message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  expertId: integer("expert_id").notNull(),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // user or expert
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  userId: true,
  expertId: true,
  content: true,
  sender: true,
});

// Health categories (for browsing experts)
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
  backgroundColor: text("background_color").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
  backgroundColor: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertExpert = z.infer<typeof insertExpertSchema>;
export type Expert = typeof experts.$inferSelect;

export type InsertSpecialization = z.infer<typeof insertSpecializationSchema>;
export type Specialization = typeof specializations.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Mental Health Questionnaires
export const questionnaires = pgTable("questionnaires", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  questions: json("questions").notNull().$type<Array<{
    id: number;
    text: string;
    options: Array<{
      id: number;
      text: string;
      value: number;
    }>;
  }>>(),
});

export const insertQuestionnaireSchema = createInsertSchema(questionnaires).pick({
  title: true,
  description: true,
  questions: true,
});

// User responses to questionnaires
export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  questionnaireId: integer("questionnaire_id").notNull().references(() => questionnaires.id),
  responses: json("responses").notNull().$type<Array<{
    questionId: number;
    answerId: number;
    value: number;
  }>>(),
  score: integer("score"),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertQuestionnaireResponseSchema = createInsertSchema(questionnaireResponses).pick({
  userId: true,
  questionnaireId: true,
  responses: true,
  score: true,
});

export type InsertQuestionnaire = z.infer<typeof insertQuestionnaireSchema>;
export type Questionnaire = typeof questionnaires.$inferSelect;

export type InsertQuestionnaireResponse = z.infer<typeof insertQuestionnaireResponseSchema>;
export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
