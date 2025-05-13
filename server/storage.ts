import { User, InsertUser, Expert, InsertExpert, Specialization, InsertSpecialization, Appointment, InsertAppointment, Message, InsertMessage, Category, InsertCategory } from "@shared/schema";
import { db } from "./db";
import { and, eq } from "drizzle-orm";
import { users, experts, specializations, appointments, messages, categories } from "@shared/schema";
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
  
  // Specialization methods
  getSpecializationsByExpert(expertId: number): Promise<Specialization[]>;
  createSpecialization(specialization: InsertSpecialization): Promise<Specialization>;
  
  // Appointment methods
  getAppointmentsByUser(userId: number): Promise<(Appointment & { expert: Expert })[]>;
  getAppointmentsByExpert(expertId: number): Promise<(Appointment & { user: User })[]>;
  getUpcomingAppointments(userId: number): Promise<(Appointment & { expert: Expert })[]>;
  getPastAppointments(userId: number): Promise<(Appointment & { expert: Expert })[]>;
  getNextUpcomingAppointment(userId: number): Promise<(Appointment & { expert: Expert }) | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment>;
  
  // Message methods
  getMessagesByUserAndExpert(userId: number, expertId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
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
  
  async getSpecializationsByExpert(expertId: number): Promise<Specialization[]> {
    return db.select().from(specializations).where(eq(specializations.expertId, expertId));
  }
  
  async createSpecialization(specialization: InsertSpecialization): Promise<Specialization> {
    const [newSpecialization] = await db.insert(specializations).values(specialization).returning();
    return newSpecialization;
  }
  
  async getAppointmentsByUser(userId: number): Promise<(Appointment & { expert: Expert })[]> {
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
    
    return result;
  }
  
  async getAppointmentsByExpert(expertId: number): Promise<(Appointment & { user: User })[]> {
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
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
  
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
}

export const storage = new DatabaseStorage();