import { storage } from "./storage";
import { sendSMS, formatAppointmentReminderSMS } from "./sms";

interface AppointmentReminder {
  id: number;
  userId: number;
  expertId: number;
  date: string;
  time: string;
  userPhone: string;
  expertName: string;
}

class AppointmentScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private sentReminders: Set<number> = new Set();

  start() {
    // Check every 5 minutes for appointments needing reminders
    this.intervalId = setInterval(async () => {
      console.log("🔔 [Scheduler] Running automatic reminder check...");
      await this.checkAndSendReminders();
    }, 5 * 60 * 1000); // 5 minutes

    console.log("Appointment reminder scheduler started");
    
    // Run initial check after 10 seconds
    setTimeout(async () => {
      console.log("🔔 [Scheduler] Running initial reminder check...");
      await this.checkAndSendReminders();
    }, 10000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Appointment reminder scheduler stopped");
    }
  }

  private async checkAndSendReminders() {
    try {
      // Get current time in IST (UTC+5:30)
      const nowUTC = new Date();
      const nowIST = new Date(nowUTC.getTime() + (5.5 * 60 * 60 * 1000));
      
      console.log(`[Reminder Check] Current IST time: ${this.formatISTTime(nowIST)}`);

      // Get all upcoming appointments
      const allAppointments = await storage.getAllUpcomingAppointments();
      console.log(`[Reminder Check] Found ${allAppointments.length} total upcoming appointments`);

      const remindersToSend: AppointmentReminder[] = [];

      for (const appointment of allAppointments) {
        // Skip if we've already sent a reminder for this appointment
        if (this.sentReminders.has(appointment.id)) {
          continue;
        }

        // Parse appointment time as IST
        const appointmentDateTimeIST = new Date(`${appointment.date} ${appointment.time}`);
        const timeDiffMinutes = Math.round((appointmentDateTimeIST.getTime() - nowIST.getTime()) / (60 * 1000));
        
        console.log(`[Reminder Check] Appointment ${appointment.id}: ${appointment.date} ${appointment.time} IST (${timeDiffMinutes} minutes away)`);
        
        // Send reminder if appointment is between 55 and 65 minutes away
        if (timeDiffMinutes >= 55 && timeDiffMinutes <= 65) {
          console.log(`[Reminder Check] Appointment ${appointment.id} is in reminder window`);
          
          // Get user and expert details
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
              expertName: expert.name,
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

  private formatISTTime(date: Date): string {
    return date.toISOString().replace('Z', '+05:30');
  }

  private async getUpcomingAppointmentsForReminders(
    startTime: Date,
    endTime: Date
  ): Promise<AppointmentReminder[]> {
    try {
      // Get all users to access their phone numbers
      const allAppointments = await storage.getAllUpcomingAppointments();
      console.log(`[Reminder Fetch] Found ${allAppointments.length} total upcoming appointments`);
      
      const reminders: AppointmentReminder[] = [];

      for (const appointment of allAppointments) {
        // Parse appointment time as IST and convert to UTC for comparison
        const appointmentDateTimeIST = new Date(`${appointment.date} ${appointment.time}`);
        const appointmentDateTimeUTC = new Date(appointmentDateTimeIST.getTime() - (5.5 * 60 * 60 * 1000));
        console.log(`[Reminder Fetch] Checking appointment ${appointment.id}: ${appointment.date} ${appointment.time} IST (${appointmentDateTimeUTC.toISOString()} UTC)`);
        
        if (appointmentDateTimeUTC >= startTime && appointmentDateTimeUTC <= endTime) {
          console.log(`[Reminder Fetch] Appointment ${appointment.id} is in time window`);
          
          // Get user details for phone number
          const user = await storage.getUser(appointment.userId);
          const expert = await storage.getExpert(appointment.expertId);

          console.log(`[Reminder Fetch] User found: ${!!user}, Expert found: ${!!expert}, Phone: ${user?.phoneNumber || 'none'}`);

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

  private async sendAppointmentReminder(appointment: AppointmentReminder) {
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
}

export const appointmentScheduler = new AppointmentScheduler();