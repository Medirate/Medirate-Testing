import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);

    // Add your logic here to handle the slot addition
    // For example, you might interact with a database or external API

    return NextResponse.json({ success: true, message: 'Slot added successfully' });
  } catch (error) {
    console.error('Error adding slot:', error);
    return NextResponse.json({ success: false, message: 'Failed to add slot' }, { status: 500 });
  }
}
