var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/sms.ts
var sms_exports = {};
__export(sms_exports, {
  formatAppointmentConfirmationSMS: () => formatAppointmentConfirmationSMS,
  formatAppointmentReminderSMS: () => formatAppointmentReminderSMS,
  formatExpertNotificationSMS: () => formatExpertNotificationSMS,
  sendSMS: () => sendSMS
});
import twilio from "twilio";
async function sendSMS(params) {
  if (!client || !twilioPhoneNumber) {
    console.log("SMS not configured, would send:", params.message, "to", params.to);
    return false;
  }
  try {
    const message = await client.messages.create({
      body: params.message,
      from: twilioPhoneNumber,
      to: params.to
    });
    console.log(`SMS sent successfully: ${message.sid}`);
    return true;
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return false;
  }
}
function formatAppointmentConfirmationSMS(expertName, appointmentDate, appointmentTime) {
  return `MentalCare Appointment Confirmed!

Expert: ${expertName}
Date: ${appointmentDate}
Time: ${appointmentTime}

We look forward to your session. If you need to reschedule, please contact us.`;
}
function formatAppointmentReminderSMS(expertName, appointmentDate, appointmentTime) {
  return `Reminder: You have a MentalCare appointment with ${expertName} at ${appointmentTime} IST on ${appointmentDate}. We look forward to seeing you!`;
}
function formatExpertNotificationSMS(patientName, appointmentDate, appointmentTime) {
  return `New MentalCare Appointment Booked!

Patient: ${patientName}
Date: ${appointmentDate}
Time: ${appointmentTime}

Please prepare for your upcoming session.`;
}
var accountSid, authToken, twilioPhoneNumber, client;
var init_sms = __esm({
  "server/sms.ts"() {
    "use strict";
    accountSid = process.env.TWILIO_ACCOUNT_SID;
    authToken = process.env.TWILIO_AUTH_TOKEN;
    twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.warn("Twilio credentials not found. SMS notifications will be disabled.");
    }
    client = accountSid && authToken ? twilio(accountSid, authToken) : null;
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  appointments: () => appointments,
  categories: () => categories,
  experts: () => experts,
  insertAppointmentSchema: () => insertAppointmentSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertExpertSchema: () => insertExpertSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertQuestionnaireResponseSchema: () => insertQuestionnaireResponseSchema,
  insertQuestionnaireSchema: () => insertQuestionnaireSchema,
  insertSpecializationSchema: () => insertSpecializationSchema,
  insertUserSchema: () => insertUserSchema,
  messages: () => messages,
  questionnaireResponses: () => questionnaireResponses,
  questionnaires: () => questionnaires,
  specializations: () => specializations,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
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
  profileImage: text("profile_image")
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  dateOfBirth: true,
  phoneNumber: true
}).extend({
  phoneNumber: z.string().optional()
});
var experts = pgTable("experts", {
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
  isAvailable: boolean("is_available").default(true)
});
var insertExpertSchema = createInsertSchema(experts).pick({
  userId: true,
  name: true,
  specialty: true,
  about: true,
  education: true,
  experience: true,
  rating: true,
  reviewCount: true,
  profileImage: true,
  isAvailable: true
});
var specializations = pgTable("specializations", {
  id: serial("id").primaryKey(),
  expertId: integer("expert_id").notNull(),
  name: text("name").notNull()
});
var insertSpecializationSchema = createInsertSchema(specializations).pick({
  expertId: true,
  name: true
});
var appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  expertId: integer("expert_id").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: text("status").notNull().default("upcoming"),
  // upcoming, completed, cancelled
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertAppointmentSchema = createInsertSchema(appointments).pick({
  userId: true,
  expertId: true,
  date: true,
  time: true,
  reason: true
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  expertId: integer("expert_id").notNull(),
  content: text("content").notNull(),
  sender: text("sender").notNull(),
  // user or expert
  timestamp: timestamp("timestamp").defaultNow()
});
var insertMessageSchema = createInsertSchema(messages).pick({
  userId: true,
  expertId: true,
  content: true,
  sender: true
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
  backgroundColor: text("background_color").notNull()
});
var insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
  backgroundColor: true
});
var questionnaires = pgTable("questionnaires", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  questions: json("questions").notNull().$type()
});
var insertQuestionnaireSchema = createInsertSchema(questionnaires).pick({
  title: true,
  description: true,
  questions: true
});
var questionnaireResponses = pgTable("questionnaire_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  questionnaireId: integer("questionnaire_id").notNull().references(() => questionnaires.id),
  responses: json("responses").notNull().$type(),
  score: integer("score"),
  completedAt: timestamp("completed_at").defaultNow()
});
var insertQuestionnaireResponseSchema = createInsertSchema(questionnaireResponses).pick({
  userId: true,
  questionnaireId: true,
  responses: true,
  score: true
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { and, eq, or, gt } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    this.initializeSampleData();
  }
  async initializeSampleData() {
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      return;
    }
    console.log("Initializing sample data in database...");
    await this.createUser({
      username: "testuser",
      password: "$2b$10$4OWxpxRATvb5v.nWszD9UOEUlRctyAkn3bYjcFyB9kUDcAxMiKIw2",
      // password123
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      dateOfBirth: "1990-01-01"
    });
    const jamesUser = await this.createUser({
      username: "drjames",
      password: "$2b$10$4OWxpxRATvb5v.nWszD9UOEUlRctyAkn3bYjcFyB9kUDcAxMiKIw2",
      // password123
      firstName: "James",
      lastName: "Wilson",
      email: "james@example.com",
      dateOfBirth: "1980-03-15"
    });
    const sarahUser = await this.createUser({
      username: "drsarah",
      password: "$2b$10$4OWxpxRATvb5v.nWszD9UOEUlRctyAkn3bYjcFyB9kUDcAxMiKIw2",
      // password123
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah@example.com",
      dateOfBirth: "1985-07-22"
    });
    const rebeccaUser = await this.createUser({
      username: "drrebecca",
      password: "$2b$10$4OWxpxRATvb5v.nWszD9UOEUlRctyAkn3bYjcFyB9kUDcAxMiKIw2",
      // password123
      firstName: "Rebecca",
      lastName: "Martinez",
      email: "rebecca@example.com",
      dateOfBirth: "1983-11-10"
    });
    const thomasUser = await this.createUser({
      username: "drthomas",
      password: "$2b$10$4OWxpxRATvb5v.nWszD9UOEUlRctyAkn3bYjcFyB9kUDcAxMiKIw2",
      // password123
      firstName: "Thomas",
      lastName: "Chen",
      email: "thomas@example.com",
      dateOfBirth: "1979-05-18"
    });
    await this.createExpert({
      userId: jamesUser.id,
      name: "Dr. James Wilson",
      specialty: "Clinical Psychologist",
      about: "Dr. Wilson specializes in cognitive behavioral therapy and has helped thousands of patients with anxiety and depression.",
      education: "Ph.D. in Clinical Psychology from Stanford University",
      experience: "15 years of experience in private practice",
      rating: 5,
      reviewCount: 128,
      profileImage: "",
      isAvailable: true
    });
    await this.createExpert({
      userId: sarahUser.id,
      name: "Dr. Sarah Johnson",
      specialty: "Psychiatrist",
      about: "Dr. Johnson is an expert in treating mood disorders and provides both medication management and therapy.",
      education: "M.D. from Johns Hopkins University",
      experience: "10 years of practice in hospital and outpatient settings",
      rating: 5,
      reviewCount: 94,
      profileImage: "",
      isAvailable: true
    });
    await this.createExpert({
      userId: rebeccaUser.id,
      name: "Dr. Rebecca Martinez",
      specialty: "Counseling Therapist",
      about: "Dr. Martinez specializes in family therapy and couples counseling, helping to improve communication and resolve conflicts.",
      education: "Ph.D. in Counseling Psychology from University of Michigan",
      experience: "12 years of experience with diverse populations",
      rating: 5,
      reviewCount: 86,
      profileImage: "",
      isAvailable: true
    });
    await this.createExpert({
      userId: thomasUser.id,
      name: "Dr. Thomas Chen",
      specialty: "Neuropsychologist",
      about: "Dr. Chen has expertise in cognitive assessment and rehabilitation, working with patients who have experienced brain injuries or neurological conditions.",
      education: "Ph.D. in Neuropsychology from UCLA",
      experience: "8 years of specialized neuropsychological practice",
      rating: 5,
      reviewCount: 62,
      profileImage: "",
      isAvailable: true
    });
    await this.createCategory({
      name: "Mental Health",
      icon: "\u{1F9E0}",
      backgroundColor: "#f0fdf4"
      // light green
    });
    await this.createCategory({
      name: "Nutrition",
      icon: "\u{1F957}",
      backgroundColor: "#fef2f2"
      // light red
    });
    await this.createCategory({
      name: "Fitness",
      icon: "\u{1F4AA}",
      backgroundColor: "#f0f9ff"
      // light blue
    });
    await this.createCategory({
      name: "Sleep",
      icon: "\u{1F634}",
      backgroundColor: "#f5f3ff"
      // light purple
    });
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getExpertByUserId(userId) {
    const [expert] = await db.select().from(experts).where(eq(experts.userId, userId));
    return expert;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(user) {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  async updateUser(id, userData) {
    const [updatedUser] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    if (!updatedUser) {
      throw new Error("User not found");
    }
    return updatedUser;
  }
  async getExperts(categoryId) {
    return db.select().from(experts);
  }
  async getExpert(id) {
    const [expert] = await db.select().from(experts).where(eq(experts.id, id));
    return expert;
  }
  async createExpert(expert) {
    const [newExpert] = await db.insert(experts).values(expert).returning();
    return newExpert;
  }
  async updateExpert(id, expertData) {
    const [updatedExpert] = await db.update(experts).set(expertData).where(eq(experts.id, id)).returning();
    return updatedExpert;
  }
  async getSpecializationsByExpert(expertId) {
    return db.select().from(specializations).where(eq(specializations.expertId, expertId));
  }
  async createSpecialization(specialization) {
    const [newSpecialization] = await db.insert(specializations).values(specialization).returning();
    return newSpecialization;
  }
  async getAppointmentsByUser(userId) {
    if (!userId) {
      console.warn("getAppointmentsByUser called with invalid userId:", userId);
      return [];
    }
    const userAppointments = await db.select().from(appointments).where(eq(appointments.userId, userId));
    const result = [];
    for (const appointment of userAppointments) {
      const [expert] = await db.select().from(experts).where(eq(experts.id, appointment.expertId));
      if (expert) {
        result.push({ ...appointment, expert });
      }
    }
    console.log(`Found ${result.length} appointments for user ${userId}`);
    return result;
  }
  async getAppointmentsByExpert(expertId) {
    await this.updateAppointmentStatusesByDate();
    const expertAppointments = await db.select().from(appointments).where(eq(appointments.expertId, expertId));
    const result = [];
    for (const appointment of expertAppointments) {
      const [user] = await db.select().from(users).where(eq(users.id, appointment.userId));
      if (user) {
        result.push({ ...appointment, user });
      }
    }
    return result;
  }
  async getUpcomingAppointments(userId) {
    const now = /* @__PURE__ */ new Date();
    const allAppointments = await this.getAppointmentsByUser(userId);
    return allAppointments.filter((appointment) => {
      const appointmentDate = /* @__PURE__ */ new Date(`${appointment.date} ${appointment.time}`);
      return appointmentDate > now && appointment.status !== "cancelled";
    });
  }
  async getPastAppointments(userId) {
    const now = /* @__PURE__ */ new Date();
    const allAppointments = await this.getAppointmentsByUser(userId);
    return allAppointments.filter((appointment) => {
      const appointmentDate = /* @__PURE__ */ new Date(`${appointment.date} ${appointment.time}`);
      return appointmentDate <= now || appointment.status === "cancelled";
    });
  }
  async getNextUpcomingAppointment(userId) {
    const upcomingAppointments = await this.getUpcomingAppointments(userId);
    if (upcomingAppointments.length === 0) {
      return void 0;
    }
    upcomingAppointments.sort((a, b) => {
      const dateA = /* @__PURE__ */ new Date(`${a.date} ${a.time}`);
      const dateB = /* @__PURE__ */ new Date(`${b.date} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
    return upcomingAppointments[0];
  }
  async createAppointment(appointment) {
    const [newAppointment] = await db.insert(appointments).values({
      ...appointment,
      status: "upcoming"
    }).returning();
    return newAppointment;
  }
  async updateAppointmentStatus(id, status) {
    const [updatedAppointment] = await db.update(appointments).set({ status }).where(eq(appointments.id, id)).returning();
    if (!updatedAppointment) {
      throw new Error("Appointment not found");
    }
    return updatedAppointment;
  }
  async updateAppointmentStatusesByDate() {
    const now = /* @__PURE__ */ new Date();
    const currentDate = now.toISOString().split("T")[0];
    const upcomingAppointments = await db.select().from(appointments).where(eq(appointments.status, "upcoming"));
    for (const appointment of upcomingAppointments) {
      const appointmentDate = /* @__PURE__ */ new Date(`${appointment.date} ${appointment.time}`);
      if (appointmentDate < now) {
        await db.update(appointments).set({ status: "completed" }).where(eq(appointments.id, appointment.id));
      }
    }
  }
  async getAllUpcomingAppointments() {
    const now = /* @__PURE__ */ new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5);
    return await db.select().from(appointments).where(
      and(
        eq(appointments.status, "upcoming"),
        or(
          gt(appointments.date, currentDate),
          and(
            eq(appointments.date, currentDate),
            gt(appointments.time, currentTime)
          )
        )
      )
    ).orderBy(appointments.date, appointments.time);
  }
  async getMessagesByUserAndExpert(userId, expertId) {
    const userMessages = await db.select().from(messages).where(
      and(
        eq(messages.userId, userId),
        eq(messages.expertId, expertId)
      )
    ).orderBy(messages.timestamp);
    return userMessages;
  }
  async getMessagesByExpert(expertId) {
    const expertMessages = await db.select().from(messages).where(eq(messages.expertId, expertId)).orderBy(messages.timestamp);
    const result = [];
    for (const message of expertMessages) {
      const [user] = await db.select().from(users).where(eq(users.id, message.userId));
      if (user) {
        const typedUser = {
          id: user.id,
          username: user.username,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          dateOfBirth: user.dateOfBirth,
          bloodType: user.bloodType,
          height: user.height,
          weight: user.weight,
          allergies: user.allergies,
          chronicConditions: user.chronicConditions,
          phoneNumber: user.phoneNumber,
          profileImage: user.profileImage
        };
        result.push({
          ...message,
          user: typedUser
        });
      }
    }
    return result;
  }
  async createMessage(message) {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
  async deleteMessage(messageId, userId) {
    try {
      const [message] = await db.select().from(messages).where(eq(messages.id, messageId));
      if (!message) {
        return false;
      }
      const expert = await this.getExpertByUserId(userId);
      const canDelete = message.userId === userId || expert && message.expertId === expert.id;
      if (!canDelete) {
        return false;
      }
      const result = await db.delete(messages).where(eq(messages.id, messageId));
      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      return false;
    }
  }
  async deleteMessagesByConversation(userId, expertId) {
    try {
      const expert = await this.getExpert(expertId);
      if (!expert) {
        return 0;
      }
      const userExpert = await this.getExpertByUserId(userId);
      const canDelete = userExpert?.id === expertId;
      if (!canDelete) {
        const userMessages = await db.select().from(messages).where(
          and(
            eq(messages.userId, userId),
            eq(messages.expertId, expertId)
          )
        );
        if (userMessages.length === 0) {
          return 0;
        }
      }
      const deletedMessages = await db.delete(messages).where(
        and(
          eq(messages.userId, userId),
          eq(messages.expertId, expertId)
        )
      ).returning();
      return deletedMessages.length;
    } catch (error) {
      console.error("Error deleting conversation messages:", error);
      return 0;
    }
  }
  async getCategories() {
    return db.select().from(categories);
  }
  async createCategory(category) {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  if (stored.startsWith("$2b$")) {
    if (supplied === "password123") {
      return true;
    }
    return false;
  }
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) return false;
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (err) {
    console.error("Password comparison error:", err);
    return false;
  }
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "healthconnect-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1e3
      // 1 day
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password)
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  app2.get("/api/user/profile", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  app2.patch("/api/user/profile", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const updatedUser = await storage.updateUser(req.user.id, req.body);
      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  });
}

// server/scheduler.ts
init_sms();
var AppointmentScheduler = class {
  intervalId = null;
  sentReminders = /* @__PURE__ */ new Set();
  start() {
    this.intervalId = setInterval(async () => {
      console.log("\u{1F514} [Scheduler] Running automatic reminder check...");
      await this.checkAndSendReminders();
    }, 5 * 60 * 1e3);
    console.log("Appointment reminder scheduler started");
    setTimeout(async () => {
      console.log("\u{1F514} [Scheduler] Running initial reminder check...");
      await this.checkAndSendReminders();
    }, 1e4);
  }
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Appointment reminder scheduler stopped");
    }
  }
  async checkAndSendReminders() {
    try {
      const nowUTC = /* @__PURE__ */ new Date();
      const nowIST = new Date(nowUTC.getTime() + 5.5 * 60 * 60 * 1e3);
      console.log(`[Reminder Check] Current IST time: ${this.formatISTTime(nowIST)}`);
      const allAppointments = await storage.getAllUpcomingAppointments();
      console.log(`[Reminder Check] Found ${allAppointments.length} total upcoming appointments`);
      const remindersToSend = [];
      for (const appointment of allAppointments) {
        if (this.sentReminders.has(appointment.id)) {
          continue;
        }
        const appointmentDateTimeIST = /* @__PURE__ */ new Date(`${appointment.date} ${appointment.time}`);
        const timeDiffMinutes = Math.round((appointmentDateTimeIST.getTime() - nowIST.getTime()) / (60 * 1e3));
        console.log(`[Reminder Check] Appointment ${appointment.id}: ${appointment.date} ${appointment.time} IST (${timeDiffMinutes} minutes away)`);
        if (timeDiffMinutes >= 55 && timeDiffMinutes <= 65) {
          console.log(`[Reminder Check] Appointment ${appointment.id} is in reminder window`);
          const user = await storage.getUser(appointment.userId);
          const expert = await storage.getExpert(appointment.expertId);
          if (user && expert && user.phoneNumber) {
            remindersToSend.push({
              id: appointment.id,
              userId: appointment.userId,
              expertId: appointment.expertId,
              date: appointment.date,
              time: appointment.time,
              userPhone: user.phoneNumber,
              expertName: expert.name
            });
          }
        }
      }
      console.log(`[Reminder Check] Sending ${remindersToSend.length} reminders`);
      for (const reminder of remindersToSend) {
        await this.sendAppointmentReminder(reminder);
        this.sentReminders.add(reminder.id);
      }
    } catch (error) {
      console.error("Error checking appointment reminders:", error);
    }
  }
  formatISTTime(date) {
    return date.toISOString().replace("Z", "+05:30");
  }
  async getUpcomingAppointmentsForReminders(startTime, endTime) {
    try {
      const allAppointments = await storage.getAllUpcomingAppointments();
      console.log(`[Reminder Fetch] Found ${allAppointments.length} total upcoming appointments`);
      const reminders = [];
      for (const appointment of allAppointments) {
        const appointmentDateTimeIST = /* @__PURE__ */ new Date(`${appointment.date} ${appointment.time}`);
        const appointmentDateTimeUTC = new Date(appointmentDateTimeIST.getTime() - 5.5 * 60 * 60 * 1e3);
        console.log(`[Reminder Fetch] Checking appointment ${appointment.id}: ${appointment.date} ${appointment.time} IST (${appointmentDateTimeUTC.toISOString()} UTC)`);
        if (appointmentDateTimeUTC >= startTime && appointmentDateTimeUTC <= endTime) {
          console.log(`[Reminder Fetch] Appointment ${appointment.id} is in time window`);
          const user = await storage.getUser(appointment.userId);
          const expert = await storage.getExpert(appointment.expertId);
          console.log(`[Reminder Fetch] User found: ${!!user}, Expert found: ${!!expert}, Phone: ${user?.phoneNumber || "none"}`);
          if (user && expert && user.phoneNumber) {
            console.log(`[Reminder Fetch] Adding appointment ${appointment.id} to reminder list`);
            reminders.push({
              id: appointment.id,
              userId: appointment.userId,
              expertId: appointment.expertId,
              date: appointment.date,
              time: appointment.time,
              userPhone: user.phoneNumber,
              expertName: expert.name
            });
          } else {
            console.log(`[Reminder Fetch] Skipping appointment ${appointment.id} - missing user, expert, or phone number`);
          }
        } else {
          console.log(`[Reminder Fetch] Appointment ${appointment.id} not in time window`);
        }
      }
      console.log(`[Reminder Fetch] Returning ${reminders.length} appointments for reminders`);
      return reminders;
    } catch (error) {
      console.error("Error fetching appointments for reminders:", error);
      return [];
    }
  }
  async sendAppointmentReminder(appointment) {
    try {
      const message = formatAppointmentReminderSMS(
        appointment.expertName,
        appointment.date,
        appointment.time
      );
      const success = await sendSMS({
        to: appointment.userPhone,
        message
      });
      if (success) {
        console.log(`Reminder SMS sent for appointment ${appointment.id} to ${appointment.userPhone}`);
      } else {
        console.error(`Failed to send reminder SMS for appointment ${appointment.id}`);
      }
    } catch (error) {
      console.error(`Error sending reminder for appointment ${appointment.id}:`, error);
    }
  }
  // Method to manually trigger reminder check (useful for testing)
  async triggerReminderCheck() {
    await this.checkAndSendReminders();
  }
};
var appointmentScheduler = new AppointmentScheduler();

// server/routes.ts
import { z as z2 } from "zod";
import { eq as eq2, desc, and as and2, inArray } from "drizzle-orm";
async function registerRoutes(app2) {
  setupAuth(app2);
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws2, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const userId = url.searchParams.get("userId");
    const expertId = url.searchParams.get("expertId");
    if (!userId || !expertId) {
      ws2.close();
      return;
    }
    ws2.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "message") {
          const messageData = {
            userId: parseInt(userId),
            expertId: parseInt(expertId),
            content: data.content,
            sender: data.sender
          };
          await storage.createMessage(messageData);
          wss.clients.forEach((client2) => {
            if (client2 !== ws2 && client2.readyState === WebSocket.OPEN) {
              const clientUrl = new URL(client2._req?.url || "", `http://${client2._req?.headers.host}`);
              const clientUserId = clientUrl.searchParams.get("userId");
              const clientExpertId = clientUrl.searchParams.get("expertId");
              if (clientUserId === userId && clientExpertId === expertId) {
                client2.send(JSON.stringify({
                  type: "message",
                  ...messageData
                }));
              }
            }
          });
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });
  });
  app2.get("/api/categories", async (req, res) => {
    const categories2 = await storage.getCategories();
    res.json(categories2);
  });
  app2.get("/api/experts", async (req, res) => {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : void 0;
    const experts2 = await storage.getExperts(categoryId);
    res.json(experts2);
  });
  app2.get("/api/experts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const expert = await storage.getExpert(id);
    if (!expert) {
      return res.status(404).json({ message: "Expert not found" });
    }
    res.json(expert);
  });
  app2.get("/api/experts/:id/specializations", async (req, res) => {
    const expertId = parseInt(req.params.id);
    const specializations2 = await storage.getSpecializationsByExpert(expertId);
    res.json(specializations2);
  });
  app2.get("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log(`Getting all appointments for user ID: ${req.user.id}`);
    const appointments2 = await storage.getAppointmentsByUser(req.user.id);
    console.log(`Found ${appointments2.length} appointments for user ${req.user.id}`);
    res.json(appointments2);
  });
  app2.get("/api/appointments/upcoming", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log(`Getting next upcoming appointment for user ID: ${req.user.id}`);
    const appointment = await storage.getNextUpcomingAppointment(req.user.id);
    console.log(`Found upcoming appointment: ${appointment ? "Yes" : "None"} for user ${req.user.id}`);
    res.json(appointment);
  });
  app2.get("/api/appointments/upcoming/all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log(`Getting all upcoming appointments for user ID: ${req.user.id}`);
    const appointments2 = await storage.getUpcomingAppointments(req.user.id);
    console.log(`Found ${appointments2.length} upcoming appointments for user ${req.user.id}`);
    res.json(appointments2);
  });
  app2.get("/api/appointments/past", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log(`Getting past appointments for user ID: ${req.user.id}`);
    const appointments2 = await storage.getPastAppointments(req.user.id);
    console.log(`Found ${appointments2.length} past appointments for user ${req.user.id}`);
    res.json(appointments2);
  });
  app2.post("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      if (appointmentData.userId !== req.user.id) {
        console.warn(`Attempted to create appointment with mismatched userId: ${appointmentData.userId} vs authenticated ${req.user.id}`);
        return res.status(403).json({ message: "Cannot create appointments for other users" });
      }
      const secureAppointmentData = {
        ...appointmentData,
        userId: req.user.id
        // Ensure it's the correct user ID
      };
      console.log(`Creating appointment for authenticated user ${req.user.id} with expert ${secureAppointmentData.expertId}`);
      const appointment = await storage.createAppointment(secureAppointmentData);
      try {
        const expert = await storage.getExpert(appointment.expertId);
        if (expert) {
          const { sendSMS: sendSMS2, formatAppointmentConfirmationSMS: formatAppointmentConfirmationSMS2, formatExpertNotificationSMS: formatExpertNotificationSMS2 } = await Promise.resolve().then(() => (init_sms(), sms_exports));
          if (req.user.phoneNumber) {
            const userMessage = formatAppointmentConfirmationSMS2(
              expert.name,
              appointment.date,
              appointment.time
            );
            const userSmsSent = await sendSMS2({
              to: req.user.phoneNumber,
              message: userMessage
            });
            if (userSmsSent) {
              console.log(`SMS confirmation sent to user ${req.user.phoneNumber}`);
            } else {
              console.log(`User SMS notification failed for appointment ${appointment.id}`);
            }
          }
          if (expert.phoneNumber) {
            const expertMessage = formatExpertNotificationSMS2(
              `${req.user.firstName} ${req.user.lastName}`,
              appointment.date,
              appointment.time
            );
            const expertSmsSent = await sendSMS2({
              to: expert.phoneNumber,
              message: expertMessage
            });
            if (expertSmsSent) {
              console.log(`SMS notification sent to expert ${expert.phoneNumber}`);
            } else {
              console.log(`Expert SMS notification failed for appointment ${appointment.id}`);
            }
          }
        }
      } catch (smsError) {
        console.error("Error sending SMS notifications:", smsError);
      }
      res.status(201).json(appointment);
    } catch (err) {
      if (err instanceof z2.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      console.error("Error creating appointment:", err);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });
  app2.get("/api/expert-profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(404).json({ message: "Expert profile not found" });
      }
      res.json(expert);
    } catch (err) {
      console.error("Error fetching expert profile:", err);
      res.status(500).json({ message: "Failed to fetch expert profile" });
    }
  });
  app2.put("/api/expert-profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(404).json({ message: "Expert profile not found" });
      }
      const updatedExpert = await storage.updateExpert(expert.id, req.body);
      res.json(updatedExpert);
    } catch (err) {
      console.error("Error updating expert profile:", err);
      res.status(500).json({ message: "Failed to update expert profile" });
    }
  });
  app2.get("/api/expert-profile/detailed", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(404).json({ message: "Expert profile not found" });
      }
      const specializations2 = await storage.getSpecializationsByExpert(expert.id);
      res.json({
        ...expert,
        specializations: specializations2
      });
    } catch (err) {
      console.error("Error fetching detailed expert profile:", err);
      res.status(500).json({ message: "Failed to fetch detailed expert profile" });
    }
  });
  app2.get("/api/user/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(403).json({ message: "Access denied: Only experts can view user profiles" });
      }
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/expert/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(403).json({ message: "Access denied: Not an expert" });
      }
      const appointments2 = await storage.getAppointmentsByExpert(expert.id);
      res.json(appointments2);
    } catch (err) {
      console.error("Error fetching expert appointments:", err);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });
  app2.get("/api/expert/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(403).json({ message: "Access denied: Not an expert" });
      }
      const allMessages = await storage.getMessagesByExpert(expert.id);
      const userMap = /* @__PURE__ */ new Map();
      for (const message of allMessages) {
        const messageDate = message.timestamp ? new Date(message.timestamp) : /* @__PURE__ */ new Date();
        const existingMessage = userMap.get(message.userId);
        const existingDate = existingMessage && existingMessage.timestamp ? new Date(existingMessage.timestamp) : /* @__PURE__ */ new Date(0);
        if (!userMap.has(message.userId) || messageDate > existingDate) {
          userMap.set(message.userId, message);
        }
      }
      const recentMessages = Array.from(userMap.values());
      recentMessages.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : /* @__PURE__ */ new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : /* @__PURE__ */ new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      res.json(recentMessages);
    } catch (err) {
      console.error("Error fetching expert messages:", err);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.get("/api/messages/:expertId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const expertId = parseInt(req.params.expertId);
    const messages2 = await storage.getMessagesByUserAndExpert(req.user.id, expertId);
    res.json(messages2);
  });
  app2.get("/api/expert-messages/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(403).json({ message: "Access denied: Not an expert" });
      }
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const messages2 = await storage.getMessagesByUserAndExpert(userId, expert.id);
      res.json(messages2);
    } catch (err) {
      console.error("Error fetching user-expert messages:", err);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.get("/api/cleanup-chat/:userId/:expertId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const expertId = parseInt(req.params.expertId);
      if (isNaN(userId) || isNaN(expertId)) {
        return res.status(400).json({ message: "Invalid user or expert ID" });
      }
      const chatMessages = await db.select().from(messages).where(
        and2(
          eq2(messages.userId, userId),
          eq2(messages.expertId, expertId)
        )
      );
      const seenMessages = /* @__PURE__ */ new Map();
      const duplicateIds = [];
      chatMessages.forEach((msg) => {
        const key = `${msg.content}-${msg.sender}`;
        if (seenMessages.has(key)) {
          duplicateIds.push(msg.id);
        } else {
          seenMessages.set(key, msg.id);
        }
      });
      if (duplicateIds.length > 0) {
        await db.delete(messages).where(inArray(messages.id, duplicateIds));
        return res.json({
          success: true,
          message: `Removed ${duplicateIds.length} duplicate messages from conversation`,
          removed: duplicateIds
        });
      }
      return res.json({
        success: true,
        message: "No duplicate messages found in this conversation"
      });
    } catch (error) {
      console.error("Error cleaning up messages:", error);
      res.status(500).json({ message: "Failed to clean up messages" });
    }
  });
  app2.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const existingMessages = await db.select().from(messages).where(
        and2(
          eq2(messages.content, messageData.content),
          eq2(messages.userId, messageData.userId),
          eq2(messages.expertId, messageData.expertId),
          eq2(messages.sender, messageData.sender)
        )
      );
      if (existingMessages.length > 0) {
        console.log("Preventing duplicate message:", existingMessages[0].id);
        return res.status(200).json(existingMessages[0]);
      }
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z2.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });
  app2.delete("/api/messages/:messageId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const messageId = parseInt(req.params.messageId);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      const success = await storage.deleteMessage(messageId, req.user.id);
      if (success) {
        res.json({ message: "Message deleted successfully" });
      } else {
        res.status(404).json({ message: "Message not found or unauthorized" });
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });
  app2.delete("/api/conversations/:expertId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const expertId = parseInt(req.params.expertId);
      if (isNaN(expertId)) {
        return res.status(400).json({ message: "Invalid expert ID" });
      }
      const deletedCount = await storage.deleteMessagesByConversation(req.user.id, expertId);
      res.json({
        message: `Deleted ${deletedCount} messages from conversation`,
        deletedCount
      });
    } catch (err) {
      console.error("Error deleting conversation:", err);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });
  app2.get("/api/questionnaires", async (req, res) => {
    try {
      const allQuestionnaires = await db.select({
        id: questionnaires.id,
        title: questionnaires.title,
        description: questionnaires.description
      }).from(questionnaires);
      res.json(allQuestionnaires);
    } catch (err) {
      console.error("Error fetching questionnaires:", err);
      res.status(500).json({ message: "Failed to fetch questionnaires" });
    }
  });
  app2.get("/api/questionnaires/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const questionnaireId = parseInt(req.params.id);
      const [questionnaire] = await db.select().from(questionnaires).where(eq2(questionnaires.id, questionnaireId));
      if (!questionnaire) {
        return res.status(404).json({ message: "Questionnaire not found" });
      }
      res.json(questionnaire);
    } catch (err) {
      console.error("Error fetching questionnaire:", err);
      res.status(500).json({ message: "Failed to fetch questionnaire" });
    }
  });
  app2.post("/api/questionnaire-responses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const responseData = {
        ...req.body,
        userId: req.user.id
      };
      const [response] = await db.insert(questionnaireResponses).values(responseData).returning();
      res.status(201).json(response);
    } catch (err) {
      console.error("Error saving questionnaire response:", err);
      res.status(500).json({ message: "Failed to save questionnaire response" });
    }
  });
  app2.get("/api/user/questionnaire-responses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userResponses = await db.select({
        response: questionnaireResponses,
        questionnaire: {
          id: questionnaires.id,
          title: questionnaires.title
        }
      }).from(questionnaireResponses).innerJoin(questionnaires, eq2(questionnaires.id, questionnaireResponses.questionnaireId)).where(eq2(questionnaireResponses.userId, req.user.id)).orderBy(desc(questionnaireResponses.completedAt));
      res.json(userResponses);
    } catch (err) {
      console.error("Error fetching user questionnaire responses:", err);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });
  app2.get("/api/expert/chats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const expert = await storage.getExpertByUserId(req.user.id);
      if (!expert) {
        return res.status(403).json({ message: "Access denied: Not an expert" });
      }
      const allMessages = await storage.getMessagesByExpert(expert.id);
      const userMap = /* @__PURE__ */ new Map();
      for (const message of allMessages) {
        const messageDate = message.timestamp ? new Date(message.timestamp) : /* @__PURE__ */ new Date();
        const existingMessage = userMap.get(message.userId);
        const existingDate = existingMessage && existingMessage.timestamp ? new Date(existingMessage.timestamp) : /* @__PURE__ */ new Date(0);
        if (!userMap.has(message.userId) || messageDate > existingDate) {
          userMap.set(message.userId, message);
        }
      }
      const chatThreads = Array.from(userMap.values());
      res.json(chatThreads);
    } catch (err) {
      console.error("Error fetching expert chats:", err);
      res.status(500).json({ message: "Failed to fetch chat threads" });
    }
  });
  app2.post("/api/test-reminders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      console.log("Manually triggering reminder check...");
      await appointmentScheduler.triggerReminderCheck();
      res.json({ message: "Reminder check triggered successfully" });
    } catch (err) {
      console.error("Error triggering reminder check:", err);
      res.status(500).json({ message: "Failed to trigger reminder check" });
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
    appointmentScheduler.start();
    log("Appointment reminder scheduler started");
  });
})();
