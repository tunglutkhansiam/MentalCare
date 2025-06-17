import { User, InsertUser, Expert, InsertExpert, Specialization, InsertSpecialization, Appointment, InsertAppointment, Message, InsertMessage, Category, InsertCategory, QuestionnaireResponse, InsertQuestionnaireResponse } from "@shared/schema";
import { db } from "./db";
import { and, eq, sql, or, gt } from "drizzle-orm";
import { users, experts, specializations, appointments, messages, categories, questionnaireResponses } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;

  // Expert methods
  getExperts(categoryId?: number): Promise<Expert[]>;
  getExpert(id: number): Promise<Expert | undefined>;
  getExpertByUserId(userId: number): Promise<Expert | undefined>;
  createExpert(expert: InsertExpert): Promise<Expert>;
  updateExpert(id: number, expertData: Partial<Expert>): Promise<Expert>;
  
  // Specialization methods
  getSpecializationsByExpert(expertId: number): Promise<Specialization[]>;
  createSpecialization(specialization: InsertSpecialization): Promise<Specialization>;
  
  // Appointment methods
  getAppointmentsByUser(userId: number): Promise<(Appointment & { expert: Expert })[]>;
  getAppointmentsByExpert(expertId: number): Promise<(Appointment & { user: User })[]>;
  getUpcomingAppointments(userId: number): Promise<(Appointment & { expert: Expert })[]>;
  getPastAppointments(userId: number): Promise<(Appointment & { expert: Expert })[]>;
  getNextUpcomingAppointment(userId: number): Promise<(Appointment & { expert: Expert }) | undefined>;
  getAllUpcomingAppointments(): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment>;
  
  // Message methods
  getMessagesByUserAndExpert(userId: number, expertId: number): Promise<Message[]>;
  getMessagesByExpert(expertId: number): Promise<(Message & { user: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(messageId: number, userId: number): Promise<boolean>;
  deleteMessagesByConversation(userId: number, expertId: number): Promise<number>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Questionnaire Response methods
  getQuestionnaireResponseByUser(userId: number, questionnaireId: number): Promise<QuestionnaireResponse | undefined>;
  createQuestionnaireResponse(response: InsertQuestionnaireResponse): Promise<QuestionnaireResponse>;
  updateQuestionnaireResponse(id: number, response: Partial<QuestionnaireResponse>): Promise<QuestionnaireResponse>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    });
    
    // Initialize sample data only if needed
    this.initializeSampleData();
  }
  
  private async initializeSampleData() {
    // Check if we have any users
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      return; // Data already exists, no need to seed
    }
    
    // Add sample data (only runs once when DB is empty)
    console.log("Initializing sample data in database...");
    
    // Add some sample users
    await this.createUser({
      username: "testuser",
      password: "$2b$10$4OWxpxRATvb5v.nWszD9UOEUlRctyAkn3bYjcFyB9kUDcAxMiKIw2", // password123
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      dateOfBirth: "1990-01-01"
    });
    
    // Create expert users (these are actual doctor accounts for logging in)
    const jamesUser = await this.createUser({
      username: "drjames",
      password: "$2b$10$4OWxpxRATvb5v.nWszD9UOEUlRctyAkn3bYjcFyB9kUDcAxMiKIw2", // password123
      firstName: "James",
      lastName: "Wilson",
      email: "james@example.com",
      dateOfBirth: "1980-03-15"
    });
    
    const sarahUser = await this.createUser({
      username: "drsarah",
      password: "$2b$10$4OWxpxRATvb5v.nWszD9UOEUlRctyAkn3bYjcFyB9kUDcAxMiKIw2", // password123
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah@example.com",
      dateOfBirth: "1985-07-22"
    });
    
    const rebeccaUser = await this.createUser({
      username: "drrebecca",
      password: "$2b$10$4OWxpxRATvb5v.nWszD9UOEUlRctyAkn3bYjcFyB9kUDcAxMiKIw2", // password123
      firstName: "Rebecca",
      lastName: "Martinez",
      email: "rebecca@example.com",
      dateOfBirth: "1983-11-10"
    });
    
    const thomasUser = await this.createUser({
      username: "drthomas",
      password: "$2b$10$4OWxpxRATvb5v.nWszD9UOEUlRctyAkn3bYjcFyB9kUDcAxMiKIw2", // password123
      firstName: "Thomas",
      lastName: "Chen",
      email: "thomas@example.com",
      dateOfBirth: "1979-05-18"
    });
    
    // Add some experts
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
    
    // Add some categories
    await this.createCategory({
      name: "Mental Health",
      icon: "🧠",
      backgroundColor: "#f0fdf4" // light green
    });
    
    await this.createCategory({
      name: "Nutrition",
      icon: "🥗",
      backgroundColor: "#fef2f2" // light red
    });
    
    await this.createCategory({
      name: "Fitness",
      icon: "💪",
      backgroundColor: "#f0f9ff" // light blue
    });
    
    await this.createCategory({
      name: "Sleep",
      icon: "😴",
      backgroundColor: "#f5f3ff" // light purple
    });
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getExpertByUserId(userId: number): Promise<Expert | undefined> {
    const [expert] = await db.select().from(experts).where(eq(experts.userId, userId));
    return expert;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return updatedUser;
  }
  
  async getExperts(categoryId?: number): Promise<Expert[]> {
    // For now, we're ignoring the categoryId filter since we don't have category associations
    return db.select().from(experts);
  }
  
  async getExpert(id: number): Promise<Expert | undefined> {
    const [expert] = await db.select().from(experts).where(eq(experts.id, id));
    return expert;
  }
  
  async createExpert(expert: InsertExpert): Promise<Expert> {
    const [newExpert] = await db.insert(experts).values(expert).returning();
    return newExpert;
  }

  async updateExpert(id: number, expertData: Partial<Expert>): Promise<Expert> {
    const [updatedExpert] = await db
      .update(experts)
      .set(expertData)
      .where(eq(experts.id, id))
      .returning();
    return updatedExpert;
  }
  
  async getSpecializationsByExpert(expertId: number): Promise<Specialization[]> {
    return db.select().from(specializations).where(eq(specializations.expertId, expertId));
  }
  
  async createSpecialization(specialization: InsertSpecialization): Promise<Specialization> {
    const [newSpecialization] = await db.insert(specializations).values(specialization).returning();
    return newSpecialization;
  }
  
  async getAppointmentsByUser(userId: number): Promise<(Appointment & { expert: Expert })[]> {
    if (!userId) {
      console.warn("getAppointmentsByUser called with invalid userId:", userId);
      return [];
    }
    
    // First get appointments for this specific user
    const userAppointments = await db.select().from(appointments).where(eq(appointments.userId, userId));
    
    // Get the related experts
    const result: (Appointment & { expert: Expert })[] = [];
    
    for (const appointment of userAppointments) {
      const [expert] = await db.select().from(experts).where(eq(experts.id, appointment.expertId));
      if (expert) {
        result.push({ ...appointment, expert });
      }
    }
    
    console.log(`Found ${result.length} appointments for user ${userId}`);
    return result;
  }
  
  async getAppointmentsByExpert(expertId: number): Promise<(Appointment & { user: User })[]> {
    // First update appointment statuses based on current date
    await this.updateAppointmentStatusesByDate();
    
    // First get appointments for this specific expert
    const expertAppointments = await db.select().from(appointments).where(eq(appointments.expertId, expertId));
    
    // Get the related users
    const result: (Appointment & { user: User })[] = [];
    
    for (const appointment of expertAppointments) {
      const [user] = await db.select().from(users).where(eq(users.id, appointment.userId));
      if (user) {
        result.push({ ...appointment, user });
      }
    }
    
    return result;
  }
  
  async getUpcomingAppointments(userId: number): Promise<(Appointment & { expert: Expert })[]> {
    const now = new Date();
    const allAppointments = await this.getAppointmentsByUser(userId);
    
    return allAppointments.filter(appointment => {
      const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
      return appointmentDate > now && appointment.status !== "cancelled";
    });
  }
  
  async getPastAppointments(userId: number): Promise<(Appointment & { expert: Expert })[]> {
    const now = new Date();
    const allAppointments = await this.getAppointmentsByUser(userId);
    
    return allAppointments.filter(appointment => {
      const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
      return appointmentDate <= now || appointment.status === "cancelled";
    });
  }
  
  async getNextUpcomingAppointment(userId: number): Promise<(Appointment & { expert: Expert }) | undefined> {
    const upcomingAppointments = await this.getUpcomingAppointments(userId);
    if (upcomingAppointments.length === 0) {
      return undefined;
    }
    
    upcomingAppointments.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
    
    return upcomingAppointments[0];
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        ...appointment,
        status: "upcoming",
      })
      .returning();
    
    return newAppointment;
  }
  
  async updateAppointmentStatus(id: number, status: string): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();
    
    if (!updatedAppointment) {
      throw new Error("Appointment not found");
    }
    
    return updatedAppointment;
  }

  async updateAppointmentStatusesByDate(): Promise<void> {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    
    // Get all upcoming appointments
    const upcomingAppointments = await db
      .select()
      .from(appointments)
      .where(eq(appointments.status, "upcoming"));
    
    // Update appointments that are past the current date to "completed"
    for (const appointment of upcomingAppointments) {
      const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
      if (appointmentDate < now) {
        await db
          .update(appointments)
          .set({ status: "completed" })
          .where(eq(appointments.id, appointment.id));
      }
    }
  }

  async getAllUpcomingAppointments(): Promise<Appointment[]> {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    return await db
      .select()
      .from(appointments)
      .where(
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
      )
      .orderBy(appointments.date, appointments.time);
  }
  
  async getMessagesByUserAndExpert(userId: number, expertId: number): Promise<Message[]> {
    const userMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.userId, userId),
          eq(messages.expertId, expertId)
        )
      )
      .orderBy(messages.timestamp);
    
    return userMessages;
  }
  
  async getMessagesByExpert(expertId: number): Promise<(Message & { user: User })[]> {
    // Fetch messages and users separately to avoid typing issues
    const expertMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.expertId, expertId))
      .orderBy(messages.timestamp);
    
    const result: (Message & { user: User })[] = [];
    
    // For each message, fetch the user and combine the data
    for (const message of expertMessages) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, message.userId));
      
      if (user) {
        // Create a fully typed user object with all required properties
        const typedUser: User = {
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
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async deleteMessage(messageId: number, userId: number): Promise<boolean> {
    try {
      // First verify that the message belongs to the user (either as sender or recipient)
      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId));

      if (!message) {
        return false;
      }

      // Check if the user is authorized to delete this message
      // Users can delete their own messages, experts can delete messages in their conversations
      const expert = await this.getExpertByUserId(userId);
      const canDelete = message.userId === userId || (expert && message.expertId === expert.id);

      if (!canDelete) {
        return false;
      }

      // Delete the message
      const result = await db
        .delete(messages)
        .where(eq(messages.id, messageId));

      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      return false;
    }
  }

  async deleteMessagesByConversation(userId: number, expertId: number): Promise<number> {
    try {
      // Verify user authorization - either the user or the expert can delete conversation
      const expert = await this.getExpert(expertId);
      if (!expert) {
        return 0;
      }

      const userExpert = await this.getExpertByUserId(userId);
      const canDelete = userExpert?.id === expertId;

      if (!canDelete) {
        // If not an expert, check if it's the user's own conversation
        const userMessages = await db
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.userId, userId),
              eq(messages.expertId, expertId)
            )
          );

        if (userMessages.length === 0) {
          return 0; // User has no messages in this conversation
        }
      }

      // Delete all messages in the conversation
      const deletedMessages = await db
        .delete(messages)
        .where(
          and(
            eq(messages.userId, userId),
            eq(messages.expertId, expertId)
          )
        )
        .returning();

      return deletedMessages.length;
    } catch (error) {
      console.error("Error deleting conversation messages:", error);
      return 0;
    }
  }
  
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  
  async getQuestionnaireResponseByUser(userId: number, questionnaireId: number): Promise<QuestionnaireResponse | undefined> {
    const [response] = await db
      .select()
      .from(questionnaireResponses)
      .where(
        and(
          eq(questionnaireResponses.userId, userId),
          eq(questionnaireResponses.questionnaireId, questionnaireId)
        )
      );
    return response || undefined;
  }
  
  async createQuestionnaireResponse(response: InsertQuestionnaireResponse): Promise<QuestionnaireResponse> {
    const [newResponse] = await db
      .insert(questionnaireResponses)
      .values(response)
      .returning();
    return newResponse;
  }
  
  async updateQuestionnaireResponse(id: number, response: Partial<QuestionnaireResponse>): Promise<QuestionnaireResponse> {
    const [updatedResponse] = await db
      .update(questionnaireResponses)
      .set(response)
      .where(eq(questionnaireResponses.id, id))
      .returning();
    
    if (!updatedResponse) {
      throw new Error("Questionnaire response not found");
    }
    
    return updatedResponse;
  }
}

export const storage = new DatabaseStorage();