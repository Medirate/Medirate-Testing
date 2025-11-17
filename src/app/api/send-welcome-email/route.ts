import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'gnersess@medirate.net';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'MediRate';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, firstName, lastName, subscriptionType, isFirstLogin = false } = await request.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY is not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Send appropriate welcome email based on context
    if (isFirstLogin) {
      await sendFirstLoginWelcomeEmail(userEmail, firstName, lastName);
    } else {
      await sendSubscriptionWelcomeEmail(userEmail, firstName, lastName, subscriptionType);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Welcome email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}

async function sendFirstLoginWelcomeEmail(userEmail: string, firstName?: string, lastName?: string) {
  try {
    // Read the first login welcome template
    const templatePath = path.join(process.cwd(), 'public', 'first-login-welcome-template.html');
    let emailTemplate = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : userEmail.split('@')[0];
    emailTemplate = emailTemplate.replace(/{{USER_NAME}}/g, fullName);
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
            name: fullName,
          },
        ],
        subject: 'Welcome to MediRate - Your First Login!',
        htmlContent: emailTemplate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API error for first login email:', errorData);
      throw new Error(`Brevo API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ First login welcome email sent successfully:', result.messageId);
    return result;

  } catch (error) {
    console.error('Error sending first login welcome email:', error);
    throw error;
  }
}

async function sendSubscriptionWelcomeEmail(userEmail: string, firstName?: string, lastName?: string, subscriptionType?: string) {
  try {
    // Read the subscription welcome template (we can reuse the existing welcome template)
    const templatePath = path.join(process.cwd(), 'public', 'welcome-email-template.html');
    let emailTemplate = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : userEmail.split('@')[0];
    emailTemplate = emailTemplate.replace(/{{USER_NAME}}/g, fullName);
    emailTemplate = emailTemplate.replace(/{{USER_EMAIL}}/g, userEmail);
    emailTemplate = emailTemplate.replace(/{{SUBSCRIPTION_TYPE}}/g, subscriptionType || 'Professional Plan');

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
            name: fullName,
          },
        ],
        subject: 'Welcome to MediRate - Your Subscription is Active!',
        htmlContent: emailTemplate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API error for subscription welcome email:', errorData);
      throw new Error(`Brevo API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Subscription welcome email sent successfully:', result.messageId);
    return result;

  } catch (error) {
    console.error('Error sending subscription welcome email:', error);
    throw error;
  }
}
