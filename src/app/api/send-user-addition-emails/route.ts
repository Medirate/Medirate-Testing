import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'gnersess@medirate.net';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'MediRate';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, primaryUserEmail, action } = await request.json();

    if (!userEmail || !primaryUserEmail || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY is not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Send email to the added user
    if (action === 'user_added') {
      await sendUserAddedEmail(userEmail);
    }

    // Send email to the primary user
    if (action === 'user_added') {
      await sendPrimaryUserNotificationEmail(primaryUserEmail, userEmail);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Emails sent successfully' 
    });

  } catch (error) {
    console.error('Error sending user addition emails:', error);
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}

async function sendUserAddedEmail(userEmail: string) {
  try {
    // Read the user-added email template
    const templatePath = path.join(process.cwd(), 'public', 'user-added-email-template.html');
    let emailTemplate = fs.readFileSync(templatePath, 'utf8');

    // Replace any placeholders if needed
    emailTemplate = emailTemplate.replace(/{{USER_EMAIL}}/g, userEmail);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL,
        },
        to: [
          {
            email: userEmail,
            name: userEmail.split('@')[0],
          },
        ],
        subject: 'Welcome to MediRate - You\'ve been added as a secondary user',
        htmlContent: emailTemplate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API error for user email:', errorData);
      throw new Error(`Brevo API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ User added email sent successfully:', result.messageId);
    return result;

  } catch (error) {
    console.error('Error sending user added email:', error);
    throw error;
  }
}

async function sendPrimaryUserNotificationEmail(primaryUserEmail: string, addedUserEmail: string) {
  try {
    // Read the primary user notification template
    const templatePath = path.join(process.cwd(), 'public', 'user-added-primary-email-template.html');
    let emailTemplate = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders
    emailTemplate = emailTemplate.replace(/{{USER_EMAIL}}/g, addedUserEmail);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL,
        },
        to: [
          {
            email: primaryUserEmail,
            name: primaryUserEmail.split('@')[0],
          },
        ],
        subject: 'User Added to Your MediRate Subscription',
        htmlContent: emailTemplate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API error for primary user email:', errorData);
      throw new Error(`Brevo API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Primary user notification email sent successfully:', result.messageId);
    return result;

  } catch (error) {
    console.error('Error sending primary user notification email:', error);
    throw error;
  }
}
