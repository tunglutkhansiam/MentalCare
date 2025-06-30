-- MentalCare Database Schema for Neon PostgreSQL
-- This script creates all tables and sample data for the mental health consultation app

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone_number VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Experts table
CREATE TABLE IF NOT EXISTS experts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    about TEXT,
    education TEXT,
    experience INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    profile_image TEXT,
    is_available BOOLEAN DEFAULT true,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Specializations table
CREATE TABLE IF NOT EXISTS specializations (
    id SERIAL PRIMARY KEY,
    expert_id INTEGER REFERENCES experts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expert_id INTEGER REFERENCES experts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expert_id INTEGER REFERENCES experts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'expert')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Questionnaires table
CREATE TABLE IF NOT EXISTS questionnaires (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Questionnaire Responses table
CREATE TABLE IF NOT EXISTS questionnaire_responses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    questionnaire_id INTEGER REFERENCES questionnaires(id) ON DELETE CASCADE,
    responses JSONB NOT NULL,
    score INTEGER,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, questionnaire_id)
);

-- Create Session table for authentication
CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (sid)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_expert_id ON appointments(expert_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_messages_user_expert ON messages(user_id, expert_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_user ON questionnaire_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);

-- Insert sample users
INSERT INTO users (username, password, first_name, last_name, email, phone_number, gender) VALUES
('drjames', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'James', 'Wilson', 'james.wilson@example.com', '+1234567890', 'Male'),
('drsarah', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'Sarah', 'Johnson', 'sarah.johnson@example.com', '+1234567891', 'Female'),
('drchen', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'Thomas', 'Chen', 'thomas.chen@example.com', '+1234567892', 'Male'),
('dremily', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'Emily', 'Davis', 'emily.davis@example.com', '+1234567893', 'Female'),
('siam', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'Siam', 'Kumar', 'siam@example.com', '+918837266207', 'Male'),
('muan', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'Muan', 'Lal', 'muan@example.com', '+918837266208', 'Male'),
('user1', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'John', 'Doe', 'john@example.com', '+918837266209', 'Male'),
('user2', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'Jane', 'Smith', 'jane@example.com', '+918837266210', 'Female'),
('thang', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'Thang', 'Lian', 'thang@example.com', '+918837266211', 'Male'),
('ching', '$2b$10$8K0ZNqjh6K6o4FMRPgbB/uZuRnJZXhm4nkOYY6Yp9GXQzOKwBgS7i', 'Ching', 'Lal', 'ching@example.com', '+918837266212', 'Female');

-- Insert experts (linking to users)
INSERT INTO experts (user_id, name, specialty, about, education, experience, rating, review_count, phone_number) VALUES
(1, 'Dr. James Wilson', 'Clinical Psychology', 'Experienced clinical psychologist specializing in anxiety and depression treatment with over 15 years of practice.', 'PhD in Clinical Psychology from Harvard University', 15, 4.8, 127, '+1234567890'),
(2, 'Dr. Sarah Johnson', 'Counseling Psychology', 'Specializes in relationship counseling and family therapy with a focus on communication and conflict resolution.', 'PhD in Counseling Psychology from Stanford University', 12, 4.9, 89, '+1234567891'),
(3, 'Dr. Thomas Chen', 'Cognitive Behavioral Therapy', 'Expert in CBT techniques for treating anxiety disorders, depression, and trauma-related conditions.', 'MD in Psychiatry from Johns Hopkins University', 10, 4.7, 156, '+1234567892'),
(4, 'Dr. Emily Davis', 'Child Psychology', 'Dedicated to helping children and adolescents overcome behavioral and emotional challenges through play therapy.', 'PhD in Child Psychology from UCLA', 8, 4.9, 203, '+1234567893');

-- Insert categories
INSERT INTO categories (name, description) VALUES
('Anxiety Disorders', 'Treatment for various anxiety conditions including GAD, panic disorders, and phobias'),
('Depression', 'Support and therapy for depression, mood disorders, and emotional wellness'),
('Relationship Counseling', 'Couples therapy, family counseling, and relationship guidance'),
('Trauma & PTSD', 'Specialized care for trauma survivors and PTSD treatment'),
('Child & Adolescent', 'Mental health services specifically for children and teenagers'),
('Stress Management', 'Techniques and strategies for managing stress and improving work-life balance');

-- Insert sample specializations
INSERT INTO specializations (expert_id, name) VALUES
(1, 'Anxiety Disorders'),
(1, 'Depression'),
(1, 'Cognitive Behavioral Therapy'),
(2, 'Relationship Counseling'),
(2, 'Family Therapy'),
(2, 'Communication Skills'),
(3, 'Cognitive Behavioral Therapy'),
(3, 'Trauma & PTSD'),
(3, 'Anxiety Disorders'),
(4, 'Child Psychology'),
(4, 'Play Therapy'),
(4, 'Adolescent Counseling');

-- Insert mental health questionnaire
INSERT INTO questionnaires (title, description, questions) VALUES
('Personal Information & Mental Health Assessment', 'A comprehensive mental health screening questionnaire to better understand your needs and provide personalized care.', 
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
    "id": "relationship_status",
    "question": "What is your relationship status?",
    "type": "radio",
    "options": ["Single", "In a relationship", "Married", "Divorced", "Widowed"],
    "required": true,
    "category": "personal"
  },
  {
    "id": "living_situation",
    "question": "Who do you live with?",
    "type": "radio",
    "options": ["Alone", "With family", "With friends/roommates", "With partner/spouse", "Other"],
    "required": true,
    "category": "personal"
  },
  {
    "id": "employment_status",
    "question": "What is your employment status?",
    "type": "radio",
    "options": ["Employed full-time", "Employed part-time", "Unemployed", "Student", "Retired", "Other"],
    "required": true,
    "category": "personal"
  },
  {
    "id": "therapy_experience",
    "question": "Have you been in therapy before?",
    "type": "radio",
    "options": ["Yes, currently", "Yes, in the past", "No, never"],
    "required": true,
    "category": "therapy"
  },
  {
    "id": "therapy_preference",
    "question": "What type of therapy are you most interested in?",
    "type": "radio",
    "options": ["Individual therapy", "Group therapy", "Couples therapy", "Family therapy", "Not sure"],
    "required": true,
    "category": "therapy"
  },
  {
    "id": "communication_preference",
    "question": "How would you prefer to communicate with your therapist?",
    "type": "radio",
    "options": ["Video calls", "Phone calls", "Text messaging", "In-person (when available)", "No preference"],
    "required": true,
    "category": "therapy"
  },
  {
    "id": "main_concerns",
    "question": "What are your main concerns or reasons for seeking therapy? (Select all that apply)",
    "type": "checkbox",
    "options": ["Anxiety", "Depression", "Stress", "Relationship issues", "Work/career issues", "Family problems", "Trauma", "Grief/loss", "Self-esteem", "Other"],
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
  },
  {
    "id": "depression_frequency",
    "question": "How often do you feel sad or depressed?",
    "type": "radio",
    "options": ["Never", "Rarely", "Sometimes", "Often", "Always"],
    "required": true,
    "category": "symptoms"
  },
  {
    "id": "sleep_quality",
    "question": "How would you rate your sleep quality?",
    "type": "radio",
    "options": ["Excellent", "Good", "Fair", "Poor", "Very poor"],
    "required": true,
    "category": "symptoms"
  },
  {
    "id": "energy_level",
    "question": "How would you describe your energy level?",
    "type": "radio",
    "options": ["Very high", "High", "Normal", "Low", "Very low"],
    "required": true,
    "category": "symptoms"
  },
  {
    "id": "social_connections",
    "question": "How satisfied are you with your social connections?",
    "type": "radio",
    "options": ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"],
    "required": true,
    "category": "symptoms"
  },
  {
    "id": "stress_level",
    "question": "On a scale of 1-10, how would you rate your current stress level?",
    "type": "radio",
    "options": ["1 (No stress)", "2", "3", "4", "5", "6", "7", "8", "9", "10 (Extremely stressed)"],
    "required": true,
    "category": "symptoms"
  },
  {
    "id": "coping_mechanisms",
    "question": "What do you currently do to cope with stress or difficult emotions? (Select all that apply)",
    "type": "checkbox",
    "options": ["Exercise", "Meditation", "Talk to friends/family", "Journaling", "Hobbies", "Substance use", "Avoidance", "Other", "Nothing specific"],
    "required": true,
    "category": "coping"
  },
  {
    "id": "goals",
    "question": "What are your main goals for therapy?",
    "type": "text",
    "required": true,
    "category": "goals"
  },
  {
    "id": "medication",
    "question": "Are you currently taking any medication for mental health?",
    "type": "radio",
    "options": ["Yes", "No", "Prefer not to say"],
    "required": true,
    "category": "medical"
  },
  {
    "id": "emergency_contact",
    "question": "Do you have someone you can contact in case of emergency?",
    "type": "radio",
    "options": ["Yes", "No"],
    "required": true,
    "category": "safety"
  },
  {
    "id": "self_harm",
    "question": "Have you had thoughts of self-harm in the past month?",
    "type": "radio",
    "options": ["Never", "Rarely", "Sometimes", "Often", "Always"],
    "required": true,
    "category": "safety"
  }
]'::jsonb);

-- Insert some sample appointments
INSERT INTO appointments (user_id, expert_id, date, time, status) VALUES
(5, 1, '2025-07-02', '10:00', 'scheduled'),
(6, 2, '2025-07-02', '14:30', 'scheduled'),
(7, 3, '2025-07-03', '11:00', 'scheduled'),
(8, 4, '2025-07-03', '15:00', 'scheduled'),
(9, 1, '2025-07-04', '09:30', 'scheduled');

-- Insert some sample messages
INSERT INTO messages (user_id, expert_id, content, sender_type) VALUES
(5, 1, 'Hello Dr. Wilson, I am looking forward to our session tomorrow.', 'user'),
(5, 1, 'Hello! Thank you for reaching out. I am also looking forward to our session. Please let me know if you have any questions beforehand.', 'expert'),
(6, 2, 'Hi Dr. Johnson, I have been feeling overwhelmed lately and could use some guidance.', 'user'),
(6, 2, 'I understand how you''re feeling. These feelings are completely valid, and I''m here to help you work through them. We can explore coping strategies during our session.', 'expert');

-- Update trigger for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experts_updated_at BEFORE UPDATE ON experts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (adjust as needed for your deployment)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;

-- Final summary
SELECT 'Database schema created successfully! Tables created:' as message;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;