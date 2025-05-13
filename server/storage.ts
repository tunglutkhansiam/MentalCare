import { users, experts, specializations, appointments, messages, categories } from "@shared/schema";
import type { User, Expert, Specialization, Appointment, Message, Category } from "@shared/schema";
import type { InsertUser, InsertExpert, InsertSpecialization, InsertAppointment, InsertMessage, InsertCategory } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Modify the interface with CRUD methods for all entities
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

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private expertsMap: Map<number, Expert>;
  private specializationsMap: Map<number, Specialization>;
  private appointmentsMap: Map<number, Appointment>;
  private messagesMap: Map<number, Message>;
  private categoriesMap: Map<number, Category>;
  
  sessionStore: session.Store;
  
  private userIdCounter: number = 1;
  private expertIdCounter: number = 1;
  private specializationIdCounter: number = 1;
  private appointmentIdCounter: number = 1;
  private messageIdCounter: number = 1;
  private categoryIdCounter: number = 1;

  constructor() {
    this.usersMap = new Map();
    this.expertsMap = new Map();
    this.specializationsMap = new Map();
    this.appointmentsMap = new Map();
    this.messagesMap = new Map();
    this.categoriesMap = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create patient user accounts
    const user1 = await this.createUser({
      username: "johndoe",
      password: "$2b$10$g4Xm8/PzX.J3w8xK6gD98OpE1xI9iBN9nMYZ1EkkK.BDVLXwo2zJm", // hashed "password123"
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      dateOfBirth: "1990-01-01"
    });

    const user2 = await this.createUser({
      username: "janedoe",
      password: "$2b$10$g4Xm8/PzX.J3w8xK6gD98OpE1xI9iBN9nMYZ1EkkK.BDVLXwo2zJm", // hashed "password123"
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      dateOfBirth: "1992-05-15"
    });
    
    // Create expert user accounts
    const expertUser1 = await this.createUser({
      username: "drjames",
      password: "$2b$10$g4Xm8/PzX.J3w8xK6gD98OpE1xI9iBN9nMYZ1EkkK.BDVLXwo2zJm", // hashed "password123"
      firstName: "James",
      lastName: "Wilson",
      email: "dr.james@example.com",
      dateOfBirth: "1978-06-10"
    });
    
    const expertUser2 = await this.createUser({
      username: "drsarah",
      password: "$2b$10$g4Xm8/PzX.J3w8xK6gD98OpE1xI9iBN9nMYZ1EkkK.BDVLXwo2zJm", // hashed "password123"
      firstName: "Sarah",
      lastName: "Johnson",
      email: "dr.sarah@example.com",
      dateOfBirth: "1985-03-20"
    });
    
    const expertUser3 = await this.createUser({
      username: "drrebecca",
      password: "$2b$10$g4Xm8/PzX.J3w8xK6gD98OpE1xI9iBN9nMYZ1EkkK.BDVLXwo2zJm", // hashed "password123"
      firstName: "Rebecca",
      lastName: "Miller",
      email: "dr.rebecca@example.com",
      dateOfBirth: "1988-07-15"
    });
    
    const expertUser4 = await this.createUser({
      username: "drthomas",
      password: "$2b$10$g4Xm8/PzX.J3w8xK6gD98OpE1xI9iBN9nMYZ1EkkK.BDVLXwo2zJm", // hashed "password123"
      firstName: "Thomas",
      lastName: "Nguyen",
      email: "dr.thomas@example.com",
      dateOfBirth: "1982-09-28"
    });
    
    // Create mental health categories
    await this.createCategory({
      name: "Depression",
      icon: "😔",
      backgroundColor: "#EBF5FF"
    });
    
    await this.createCategory({
      name: "Anxiety",
      icon: "😰",
      backgroundColor: "#E6F7EF"
    });
    
    await this.createCategory({
      name: "Stress",
      icon: "😩",
      backgroundColor: "#FEF3C7"
    });
    
    await this.createCategory({
      name: "Trauma",
      icon: "🧠",
      backgroundColor: "#F3E8FF"
    });
    
    // Create mental health experts
    const expert1 = await this.createExpert({
      userId: expertUser1.id,
      name: "Dr. James Wilson",
      specialty: "Clinical Psychologist",
      about: "Dr. Wilson is a licensed clinical psychologist with over 15 years of experience. He specializes in cognitive behavioral therapy, depression, and anxiety disorders. Dr. Wilson is dedicated to providing compassionate care and helping patients develop effective coping strategies.",
      education: "PhD in Clinical Psychology, Harvard University\nInternship at Massachusetts General Hospital\nLicensed Clinical Psychologist",
      experience: "15+ years of clinical experience\nFormer Director of Mental Health Services at Boston Medical Center",
      rating: 5,
      reviewCount: 120,
      profileImage: "",
      isAvailable: true
    });
    
    const expert2 = await this.createExpert({
      userId: expertUser2.id,
      name: "Dr. Sarah Johnson",
      specialty: "Psychiatrist",
      about: "Dr. Johnson is a board-certified psychiatrist specializing in mood disorders and anxiety. With her extensive training and holistic approach, she provides personalized care combining medication management and psychotherapy techniques.",
      education: "MD, University of California, San Francisco\nPsychiatry Residency, Stanford University Medical Center\nBoard Certified in Psychiatry",
      experience: "12 years of clinical practice\nPublished researcher in treatment-resistant depression",
      rating: 4.9,
      reviewCount: 98,
      profileImage: "",
      isAvailable: true
    });
    
    const expert3 = await this.createExpert({
      name: "Dr. Rebecca Miller",
      specialty: "Psychotherapist",
      about: "Dr. Miller is a respected psychotherapist focused on women's mental health and trauma-informed care. She combines evidence-based approaches with a patient-centered philosophy to help manage and overcome emotional challenges.",
      education: "PhD in Psychology, Johns Hopkins University\nTrauma-Focused Therapy Certification\nLicensed Psychotherapist",
      experience: "10 years of specialized practice\nDirector of Women's Mental Health Program",
      rating: 4.8,
      reviewCount: 85,
      profileImage: "",
      isAvailable: true
    });

    const expert4 = await this.createExpert({
      name: "Dr. Thomas Nguyen",
      specialty: "Mental Health Counselor",
      about: "Dr. Nguyen provides comprehensive mental health counseling for all ages. He emphasizes preventive strategies and developing resilience, with special expertise in family therapy and relationship issues.",
      education: "PhD in Counseling Psychology, Yale University\nFamily Systems Therapy Certification\nLicensed Mental Health Counselor",
      experience: "8 years in counseling practice\nFocus on relationship issues and family dynamics",
      rating: 4.7,
      reviewCount: 112,
      profileImage: "",
      isAvailable: true
    });
    
    // Create specializations
    await this.createSpecialization({
      expertId: expert1.id,
      name: "Depression"
    });
    
    await this.createSpecialization({
      expertId: expert1.id,
      name: "Anxiety"
    });
    
    await this.createSpecialization({
      expertId: expert1.id,
      name: "Cognitive Behavioral Therapy"
    });
    
    await this.createSpecialization({
      expertId: expert1.id,
      name: "Stress Management"
    });
    
    await this.createSpecialization({
      expertId: expert2.id,
      name: "Medication Management"
    });
    
    await this.createSpecialization({
      expertId: expert2.id,
      name: "Bipolar Disorder"
    });
    
    await this.createSpecialization({
      expertId: expert2.id,
      name: "Anxiety Disorders"
    });
    
    await this.createSpecialization({
      expertId: expert3.id,
      name: "Trauma Therapy"
    });
    
    await this.createSpecialization({
      expertId: expert3.id,
      name: "Women's Mental Health"
    });
    
    await this.createSpecialization({
      expertId: expert3.id,
      name: "PTSD"
    });
    
    await this.createSpecialization({
      expertId: expert4.id,
      name: "Family Therapy"
    });
    
    await this.createSpecialization({
      expertId: expert4.id,
      name: "Relationship Counseling"
    });
    
    await this.createSpecialization({
      expertId: expert4.id,
      name: "Stress Management"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }
  
  async getExpertByUserId(userId: number): Promise<Expert | undefined> {
    return Array.from(this.expertsMap.values()).find(expert => expert.userId === userId);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { 
      ...user, 
      id,
      bloodType: null,
      height: null,
      weight: null,
      allergies: null,
      chronicConditions: null,
      phoneNumber: null,
      profileImage: null,
      dateOfBirth: user.dateOfBirth || null
    };
    this.usersMap.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, ...userData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  // Expert methods
  async getExperts(categoryId?: number): Promise<Expert[]> {
    let experts = Array.from(this.expertsMap.values());
    
    if (categoryId) {
      // Filter by category if provided
      const expertIdsInCategory = Array.from(this.specializationsMap.values())
        .filter(spec => {
          const categorySpec = Array.from(this.categoriesMap.values())
            .find(cat => cat.id === categoryId && cat.name === spec.name);
          return !!categorySpec;
        })
        .map(spec => spec.expertId);
      
      experts = experts.filter(expert => expertIdsInCategory.includes(expert.id));
    }
    
    return experts;
  }

  async getExpert(id: number): Promise<Expert | undefined> {
    return this.expertsMap.get(id);
  }

  async createExpert(expert: InsertExpert): Promise<Expert> {
    const id = this.expertIdCounter++;
    const newExpert: Expert = { 
      ...expert, 
      id,
      userId: expert.userId || null,
      profileImage: expert.profileImage || null,
      rating: expert.rating || null,
      reviewCount: expert.reviewCount || null,
      isAvailable: expert.isAvailable !== undefined ? expert.isAvailable : null
    };
    this.expertsMap.set(id, newExpert);
    return newExpert;
  }

  // Specialization methods
  async getSpecializationsByExpert(expertId: number): Promise<Specialization[]> {
    return Array.from(this.specializationsMap.values()).filter(
      (spec) => spec.expertId === expertId
    );
  }

  async createSpecialization(specialization: InsertSpecialization): Promise<Specialization> {
    const id = this.specializationIdCounter++;
    const newSpecialization: Specialization = { ...specialization, id };
    this.specializationsMap.set(id, newSpecialization);
    return newSpecialization;
  }

  // Appointment methods
  async getAppointmentsByUser(userId: number): Promise<(Appointment & { expert: Expert })[]> {
    const userAppointments = Array.from(this.appointmentsMap.values()).filter(
      (appointment) => appointment.userId === userId
    );
    
    return Promise.all(
      userAppointments.map(async (appointment) => {
        const expert = await this.getExpert(appointment.expertId);
        return { ...appointment, expert: expert! };
      })
    );
  }

  async getUpcomingAppointments(userId: number): Promise<(Appointment & { expert: Expert })[]> {
    const appointments = await this.getAppointmentsByUser(userId);
    const now = new Date();
    
    return appointments
      .filter(appointment => {
        const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
        return appointmentDate > now && appointment.status === "upcoming";
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }

  async getPastAppointments(userId: number): Promise<(Appointment & { expert: Expert })[]> {
    const appointments = await this.getAppointmentsByUser(userId);
    const now = new Date();
    
    return appointments
      .filter(appointment => {
        const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
        return appointmentDate < now || appointment.status === "completed";
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime(); // Sort descending
      });
  }

  async getNextUpcomingAppointment(userId: number): Promise<(Appointment & { expert: Expert }) | undefined> {
    const upcomingAppointments = await this.getUpcomingAppointments(userId);
    return upcomingAppointments.length > 0 ? upcomingAppointments[0] : undefined;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const now = new Date();
    const newAppointment: Appointment = { 
      ...appointment, 
      id, 
      status: "upcoming", 
      createdAt: now,
      reason: appointment.reason || null
    };
    this.appointmentsMap.set(id, newAppointment);
    return newAppointment;
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment> {
    const appointment = this.appointmentsMap.get(id);
    if (!appointment) {
      throw new Error(`Appointment with ID ${id} not found`);
    }
    
    const updatedAppointment = { ...appointment, status };
    this.appointmentsMap.set(id, updatedAppointment);
    return updatedAppointment;
  }

  // Message methods
  async getMessagesByUserAndExpert(userId: number, expertId: number): Promise<Message[]> {
    return Array.from(this.messagesMap.values())
      .filter(message => 
        (message.userId === userId && message.expertId === expertId)
      )
      .sort((a, b) => {
        const timeA = a.timestamp?.getTime() || 0;
        const timeB = b.timestamp?.getTime() || 0;
        return timeA - timeB;
      });
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const newMessage: Message = { ...message, id, timestamp: now };
    this.messagesMap.set(id, newMessage);
    return newMessage;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categoriesMap.values());
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = { ...category, id };
    this.categoriesMap.set(id, newCategory);
    return newCategory;
  }
}

export const storage = new MemStorage();
