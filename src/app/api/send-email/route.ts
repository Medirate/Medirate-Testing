import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const CONTACT_EMAIL = 'contact@MediRate.net';

// Additional recipients for contact us and support emails
const ADDITIONAL_RECIPIENTS = [
  { email: 'dev@metasysconsulting.com', name: 'MetaSys Dev Team' },
  { email: 'nischalareddy@metasysconsulting.com', name: 'Nischala Reddy' }
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, company, title, email, message } = body;

    // Only require firstName, lastName, email, and message
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, email, and message are required.' },
        { status: 400 }
      );
    }

    // Compose the email content
    const htmlContent = `
      <h2>Contact Us Form Submission</h2>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Company:</strong> ${company || '(not provided)'}</p>
      <p><strong>Title:</strong> ${title || '(not provided)'}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `;

    // Send email using Brevo
    const brevoRes = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY || '',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: CONTACT_EMAIL, name: 'MediRate Contact Form' },
        to: [
          { email: CONTACT_EMAIL, name: 'MediRate Contact' },
          ...ADDITIONAL_RECIPIENTS
        ],
        subject: `Contact Us: Message from ${firstName} ${lastName}`,
        htmlContent,
        replyTo: { email, name: `${firstName} ${lastName}` },
      }),
    });

    if (!brevoRes.ok) {
      const errorText = await brevoRes.text();
      return NextResponse.json(
        { success: false, error: 'Failed to send email via Brevo', details: errorText },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Email sent successfully.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to send email.' },
      { status: 500 }
    );
  }
}
