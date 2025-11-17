import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'gnersess@medirate.net';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'MediRate';

export async function POST(req: NextRequest) {
  try {
    const { userEmail, primaryUserEmail, action, firstName, lastName } = await req.json();

    if (!userEmail || !action) {
      return NextResponse.json({ error: 'User email and action are required' }, { status: 400 });
    }

    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY is not set.');
      return NextResponse.json({ error: 'Server configuration error: Brevo API key missing' }, { status: 500 });
    }

    let subject = '';
    let templatePath = '';
    let recipientEmail = userEmail;

    if (action === 'user_removed') {
      // Email to the removed sub-user
      subject = 'Access Removed - MediRate Subscription Update';
      templatePath = path.join(process.cwd(), 'public', 'user-removed-email-template.html');
      
      // Send email to the removed user
      await sendEmail(userEmail, subject, templatePath, { 
        USER_NAME: firstName || userEmail.split('@')[0],
        PRIMARY_USER_EMAIL: primaryUserEmail || 'N/A'
      });
      
      return NextResponse.json({ success: true, message: 'Removal email sent successfully' });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error sending user removal email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

async function sendEmail(toEmail: string, subject: string, templatePath: string, placeholders: { [key: string]: string } = {}) {
  let emailTemplate = fs.readFileSync(templatePath, 'utf8');

  // Replace common placeholders
  emailTemplate = emailTemplate.replace(/{{USER_EMAIL}}/g, toEmail);
  for (const key in placeholders) {
    emailTemplate = emailTemplate.replace(new RegExp(`{{${key}}}`, 'g'), placeholders[key]);
  }

  const brevoRequestBody = {
    sender: { email: SENDER_EMAIL, name: SENDER_NAME },
    to: [{ email: toEmail }],
    subject: subject,
    htmlContent: emailTemplate,
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY!,
      'content-type': 'application/json',
    },
    body: JSON.stringify(brevoRequestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Brevo API error for ${toEmail}:`, errorData);
    throw new Error(`Failed to send email via Brevo: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const result = await response.json();
  console.log(`Email sent to ${toEmail} successfully:`, result.messageId);
  return result;
}
