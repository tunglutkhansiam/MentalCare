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
    this.intervalId = setInterval(() => {
      this.checkAndSendReminders();
    }, 5 * 60 * 1000); // 5 minutes

    console.log("Appointment reminder scheduler started");
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
      const now = new Date();
      const fiftyFiveMinutesFromNow = new Date(now.getTime() + 55 * 60 * 1000);
      const sixtyFiveMinutesFromNow = new Date(now.getTime() + 65 * 60 * 1000);

      console.log(`[Reminder Check] Current time: ${now.toISOString()}`);
      console.log(`[Reminder Check] Looking for appointments between ${fiftyFiveMinutesFromNow.toISOString()} and ${sixtyFiveMinutesFromNow.toISOString()}`);

      // Get all upcoming appointments that need reminders
      const upcomingAppointments = await this.getUpcomingAppointmentsForReminders(
        fiftyFiveMinutesFromNow,
        sixtyFiveMinutesFromNow
      );

      console.log(`[Reminder Check] Found ${upcomingAppointments.length} appointments in reminder window`);

      for (const appointment of upcomingAppointments) {
        console.log(`[Reminder Check] Processing appointment ${appointment.id}: ${appointment.date} ${appointment.time}`);
        
        // Skip if we've already sent a reminder for this appointment
        if (this.sentReminders.has(appointment.id)) {
          console.log(`[Reminder Check] Skipping appointment ${appointment.id} - reminder already sent`);
          continue;
        }

        // Check if the appointment is exactly 1 hour away (within 5-minute window)
        const appointmentDateTime = new Date(`${appointment.date} ${appointment.time}`);
        const timeDiff = appointmentDateTime.getTime() - now.getTime();
        const oneHourInMs = 60 * 60 * 1000;
        const timeDiffMinutes = Math.round(timeDiff / (60 * 1000));
        
        console.log(`[Reminder Check] Appointment ${appointment.id} is ${timeDiffMinutes} minutes away`);
        
        // Send reminder if appointment is between 55 minutes and 65 minutes away
        if (timeDiff >= (oneHourInMs - 5 * 60 * 1000) && timeDiff <= (oneHourInMs + 5 * 60 * 1000)) {
          console.log(`[Reminder Check] Sending reminder for appointment ${appointment.id}`);
          await this.sendAppointmentReminder(appointment);
          this.sentReminders.add(appointment.id);
        } else {
          console.log(`[Reminder Check] Appointment ${appointment.id} not in reminder window (${timeDiffMinutes} minutes away)`);
        }
      }
    } catch (error) {
      console.error("Error checking appointment reminders:", error);
    }
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
        const appointmentDateTime = new Date(`${appointment.date} ${appointment.time}`);
        console.log(`[Reminder Fetch] Checking appointment ${appointment.id}: ${appointment.date} ${appointment.time} (${appointmentDateTime.toISOString()})`);
        
        if (appointmentDateTime >= startTime && appointmentDateTime <= endTime) {
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