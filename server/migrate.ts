import { db } from './db';
import { sql } from 'drizzle-orm';

export async function runMigrations() {
  try {
    console.log('Running database migrations...');

    // Create tables if they don't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "username" varchar(255) NOT NULL,
        "password" text NOT NULL,
        "first_name" varchar(255),
        "last_name" varchar(255),
        "email" varchar(255),
        "phone_number" varchar(20),
        "date_of_birth" date,
        "gender" varchar(50),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "users_username_unique" UNIQUE("username")
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "experts" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer,
        "name" varchar(255) NOT NULL,
        "specialty" varchar(255) NOT NULL,
        "about" text,
        "education" text,
        "experience" integer DEFAULT 0,
        "rating" numeric(2,1) DEFAULT '5.0',
        "review_count" integer DEFAULT 0,
        "profile_image" text,
        "is_available" boolean DEFAULT true,
        "phone_number" varchar(20),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "experts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "specializations" (
        "id" serial PRIMARY KEY NOT NULL,
        "expert_id" integer NOT NULL,
        "name" varchar(255) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "specializations_expert_id_experts_id_fk" FOREIGN KEY ("expert_id") REFERENCES "experts"("id") ON DELETE cascade
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "appointments" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "expert_id" integer NOT NULL,
        "date" date NOT NULL,
        "time" time NOT NULL,
        "status" varchar(50) DEFAULT 'scheduled',
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade,
        CONSTRAINT "appointments_expert_id_experts_id_fk" FOREIGN KEY ("expert_id") REFERENCES "experts"("id") ON DELETE cascade
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "expert_id" integer NOT NULL,
        "content" text NOT NULL,
        "sender_type" varchar(20) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade,
        CONSTRAINT "messages_expert_id_experts_id_fk" FOREIGN KEY ("expert_id") REFERENCES "experts"("id") ON DELETE cascade,
        CONSTRAINT "messages_sender_type_check" CHECK ("sender_type" IN ('user', 'expert'))
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "questionnaires" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "questions" jsonb NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "questionnaire_responses" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "questionnaire_id" integer NOT NULL,
        "responses" jsonb NOT NULL,
        "score" integer,
        "completed_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "questionnaire_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade,
        CONSTRAINT "questionnaire_responses_questionnaire_id_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "questionnaires"("id") ON DELETE cascade,
        CONSTRAINT "questionnaire_responses_user_id_questionnaire_id_unique" UNIQUE("user_id","questionnaire_id")
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
    `);

    // Create indexes (check if columns exist first)
    try {
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_appointments_user_id" ON "appointments" ("user_id");`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_appointments_expert_id" ON "appointments" ("expert_id");`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_appointments_date" ON "appointments" ("date");`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_messages_user_expert" ON "messages" ("user_id", "expert_id");`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_messages_created_at" ON "messages" ("created_at");`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_session_expire" ON "session" ("expire");`);
    } catch (indexError) {
      console.log('Some indexes may have failed to create, but tables are ready');
    }

    console.log('Database migrations completed successfully!');
    
    // Initialize sample data if tables are empty
    await initializeSampleData();
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function initializeSampleData() {
  try {
    // Check if users table is empty
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    const count = (userCount.rows[0] as any).count;
    
    if (parseInt(count) === 0) {
      console.log('Initializing sample data...');
      
      // Insert sample users
      await db.execute(sql`
        INSERT INTO users (username, password, first_name, last_name, email, phone_number, gender) VALUES
        ('drjames', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'James', 'Wilson', 'james.wilson@example.com', '+1234567890', 'Male'),
        ('drsarah', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'Sarah', 'Johnson', 'sarah.johnson@example.com', '+1234567891', 'Female'),
        ('drchen', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'Thomas', 'Chen', 'thomas.chen@example.com', '+1234567892', 'Male'),
        ('dremily', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'Emily', 'Davis', 'emily.davis@example.com', '+1234567893', 'Female'),
        ('testuser', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'Test', 'User', 'test@example.com', '+918837266208', 'Male')
      `);

      // Insert experts
      await db.execute(sql`
        INSERT INTO experts (user_id, name, specialty, about, education, experience, rating, review_count, phone_number) VALUES
        (1, 'Dr. James Wilson', 'Clinical Psychology', 'Experienced clinical psychologist specializing in anxiety and depression treatment.', 'PhD in Clinical Psychology', 15, 4.8, 127, '+1234567890'),
        (2, 'Dr. Sarah Johnson', 'Counseling Psychology', 'Specializes in relationship counseling and family therapy.', 'PhD in Counseling Psychology', 12, 4.9, 89, '+1234567891'),
        (3, 'Dr. Thomas Chen', 'Cognitive Behavioral Therapy', 'Expert in CBT techniques for treating anxiety and depression.', 'MD in Psychiatry', 10, 4.7, 156, '+1234567892'),
        (4, 'Dr. Emily Davis', 'Child Psychology', 'Dedicated to helping children and adolescents.', 'PhD in Child Psychology', 8, 4.9, 203, '+1234567893')
      `);

      // Insert categories
      await db.execute(sql`
        INSERT INTO categories (name, description) VALUES
        ('Anxiety Disorders', 'Treatment for various anxiety conditions'),
        ('Depression', 'Support and therapy for depression and mood disorders'),
        ('Relationship Counseling', 'Couples therapy and relationship guidance'),
        ('Child & Adolescent', 'Mental health services for children and teenagers')
      `);

      // Insert mental health questionnaire
      await db.execute(sql`
        INSERT INTO questionnaires (title, description, questions) VALUES
        ('Personal Information & Mental Health Assessment', 'A comprehensive mental health screening questionnaire.', 
        '[
          {
            "id": "name",
            "question": "What is your name?",
            "type": "text",
            "required": true,
            "category": "personal"
          },
          {
            "id": "age",
            "question": "How old are you?",
            "type": "number",
            "required": true,
            "category": "personal"
          },
          {
            "id": "gender",
            "question": "What is your gender identity?",
            "type": "radio",
            "options": ["Male", "Female", "Other"],
            "required": true,
            "category": "personal"
          },
          {
            "id": "main_concerns",
            "question": "What are your main concerns? (Select all that apply)",
            "type": "checkbox",
            "options": ["Anxiety", "Depression", "Stress", "Relationship issues", "Work issues", "Family problems", "Other"],
            "required": true,
            "category": "concerns"
          },
          {
            "id": "anxiety_frequency",
            "question": "How often do you feel anxious or worried?",
            "type": "radio",
            "options": ["Never", "Rarely", "Sometimes", "Often", "Always"],
            "required": true,
            "category": "symptoms"
          }
        ]'::jsonb)
      `);

      console.log('Sample data initialized successfully!');
    }
  } catch (error) {
    console.error('Failed to initialize sample data:', error);
    // Don't throw here, as the app can still work without sample data
  }
}