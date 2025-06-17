import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn('Twilio credentials not found. SMS notifications will be disabled.');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SMSParams {
  to: string;
  message: string;
}

export async function sendSMS(params: SMSParams): Promise<boolean> {
  if (!client || !twilioPhoneNumber) {
    console.log('SMS not configured, would send:', params.message, 'to', params.to);
    return false;
  }

  try {
    const message = await client.messages.create({
      body: params.message,
      from: twilioPhoneNumber,
      to: params.to,
    });
    
    console.log(`SMS sent successfully: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}

export function formatAppointmentConfirmationSMS(
  expertName: string,
  appointmentDate: string,
  appointmentTime: string
): string {
  return `MentalCare Appointment Confirmed!\n\nExpert: ${expertName}\nDate: ${appointmentDate}\nTime: ${appointmentTime}\n\nWe look forward to your session. If you need to reschedule, please contact us.`;
}

export function formatAppointmentReminderSMS(
  expertName: string,
  appointmentDate: string,
  appointmentTime: string
): string {
  return `Reminder: You have a MentalCare appointment with ${expertName} at ${appointmentTime} IST on ${appointmentDate}. We look forward to seeing you!`;
}

export function formatExpertNotificationSMS(
  patientName: string,
  appointmentDate: string,
  appointmentTime: string
): string {
  return `New MentalCare Appointment Booked!\n\nPatient: ${patientName}\nDate: ${appointmentDate}\nTime: ${appointmentTime}\n\nPlease prepare for your upcoming session.`;
}