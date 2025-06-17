import { sendSMS, formatAppointmentReminderSMS } from './server/sms.ts';

async function testSMS() {
  console.log('Testing SMS functionality...');
  
  const reminderMessage = formatAppointmentReminderSMS(
    'Dr. Sarah Johnson',
    '2025-06-17',
    '07:15'
  );
  
  console.log('SMS Message:', reminderMessage);
  
  const result = await sendSMS({
    to: '+918837266208',
    message: reminderMessage
  });
  
  console.log('SMS Result:', result);
}

testSMS().catch(console.error);