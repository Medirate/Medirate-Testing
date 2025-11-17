import { NextRequest, NextResponse } from "next/server";

// Run on Edge to minimize cold starts and lower latency
export const runtime = 'edge';

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({
        error: "OpenAI API key not configured",
        details: "OPENAI_API_KEY environment variable is missing"
      }, { status: 500 });
    }

    const enhancedPrompt = `You are a world-class email marketing specialist with 15+ years of experience in creating award-winning email campaigns for Fortune 500 companies. Your expertise spans psychology, design theory, conversion optimization, and modern email best practices.

Create a PROFESSIONAL, SOPHISTICATED, and HIGHLY ENGAGING HTML email template based on this description: "${prompt}"

CRITICAL REQUIREMENTS - Use this exact structure and styling as your base template, but create PREMIUM content:

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marketing Email</title>
    <style>
        @media only screen and (max-width: 600px) {
            .main-content { padding: 0 !important; }
            .content-card { padding: 16px 4% !important; font-size: 15px !important; margin: 16px 2% !important; }
            .button { padding: 12px 20px !important; font-size: 14px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family: Arial, sans-serif;">
    <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td>
                <!-- Header - ALWAYS KEEP THIS EXACTLY THE SAME -->
                <div style="background:#0F3557; padding:30px 0 20px 0; border-radius:0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td align="left" style="padding-left:30px;">
                                <img src="https://raw.githubusercontent.com/Medirate/Medirate-Public/main/top-black-just-word.png" alt="MediRate Wordmark" style="max-width:200px; width:90%; display:block;">
                            </td>
                            <td align="right" style="padding-right:30px;">
                                <img src="https://raw.githubusercontent.com/Medirate/Medirate-Public/main/top-black-just-logo.png" alt="MediRate Logo" style="max-width:80px; width:80px; display:block;">
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Main Content - CREATE SOPHISTICATED, PROFESSIONAL CONTENT HERE -->
                <div class="main-content" style="padding:0; margin:0;">
                    <!-- Create compelling, professional content that converts -->
                    <!-- Use sophisticated language, clear value propositions, and engaging storytelling -->
                    <!-- Implement psychological triggers: urgency, social proof, authority, and benefits -->
                    <!-- Structure content with clear hierarchy, scannable sections, and strategic CTAs -->
                </div>

                <!-- Footer - ALWAYS KEEP THIS EXACTLY THE SAME -->
                <div style="background:#0F3557; color:#fff; font-size:13px; padding:12px; border-radius:0; text-align:center;">
                    © 2025 MediRate. All rights reserved.
                </div>
            </td>
        </tr>
    </table>
</body>
</html>

PROFESSIONAL CONTENT REQUIREMENTS:

1. **SOPHISTICATED LANGUAGE & TONE:**
   - Use professional, authoritative language that builds trust
   - Implement persuasive copywriting techniques
   - Create emotional connections while maintaining credibility
   - Use industry-specific terminology appropriately

2. **PSYCHOLOGICAL DESIGN PRINCIPLES:**
   - Implement social proof elements (testimonials, statistics, case studies)
   - Use authority markers (expertise, credentials, achievements)
   - Create urgency and scarcity when appropriate
   - Leverage reciprocity and value-first approach

3. **CONTENT STRUCTURE & HIERARCHY:**
   - Compelling headline that immediately captures attention
   - Clear value proposition in the first paragraph
   - Scannable content with strategic use of white space
   - Logical flow from problem → solution → benefit → action
   - Multiple strategic call-to-action opportunities

4. **ENGAGEMENT & CONVERSION OPTIMIZATION:**
   - Use benefit-driven language, not just feature descriptions
   - Implement storytelling elements that resonate with the target audience
   - Create micro-commitments throughout the email
   - Use power words and emotional triggers strategically
   - Include social proof and credibility indicators

5. **VISUAL DESIGN & LAYOUT:**
   - Professional color scheme using the provided MediRate branding
   - Strategic use of typography hierarchy for readability
   - Balanced content distribution with proper spacing
   - Mobile-responsive design considerations
   - Professional button styling and placement

6. **CALL-TO-ACTION STRATEGY:**
   - Primary CTA that's compelling and action-oriented
   - Secondary CTAs for different engagement levels
   - Clear value proposition for each action
   - Strategic placement for maximum conversion

7. **BRAND ALIGNMENT:**
   - Maintain MediRate's professional healthcare industry positioning
   - Use language that reflects expertise and reliability
   - Ensure all content aligns with healthcare compliance standards
   - Professional tone that builds trust with healthcare professionals

CONTENT CREATION APPROACH:
- Research the user's description thoroughly
- Create content that feels like it was written by a senior marketing director
- Implement modern email marketing best practices
- Focus on conversion optimization and user engagement
- Ensure the email feels premium and professional

TECHNICAL REQUIREMENTS:
1. ALWAYS keep the exact header and footer structure above
2. Customize ONLY the main content section based on the user's description
3. Use the same styling, colors, and responsive design
4. **CRITICAL**: Return ONLY raw HTML code - NO markdown formatting, NO backticks, NO code blocks, NO explanations
5. Ensure the template is ready to use immediately
6. Test all HTML for proper syntax and email client compatibility

**RESPONSE FORMAT - ABSOLUTELY CRITICAL:**
- Your response MUST contain ONLY the HTML code
- Do NOT wrap in \`\`\`html or \`\`\` or any markdown
- Do NOT add any explanatory text before or after the HTML
- Start immediately with <!DOCTYPE html> and end with </html>
- The entire response should be pure, valid HTML that can be directly used

The user wants: ${prompt}

Create a template that would win awards at email marketing conferences and drive exceptional engagement rates.

**REMEMBER**: Your entire response must be ONLY the HTML code - nothing else!`;

    // Add a timeout guard so we never hang and Vercel doesn't 504 the route
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s hard cap

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a world-class email marketing specialist with 15+ years of experience in creating award-winning email campaigns for Fortune 500 companies. Your expertise spans psychology, design theory, conversion optimization, and modern email best practices. CRITICAL: You MUST respond with ONLY raw HTML code - no markdown, no backticks, no explanations, no code blocks. Your entire response should be pure HTML starting with <!DOCTYPE html> and ending with </html>."
          },
          {
            role: "user",
            content: enhancedPrompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1500
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error("OpenAI API error:", response.status, errorData);
      } catch (e) {
        errorData = await response.text();
        console.error("OpenAI API error (text):", response.status, errorData);
      }

      let errorMessage = "Failed to generate template";
      let errorDetails = `OpenAI API error: ${response.status}`;

      if (errorData && typeof errorData === 'object') {
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
          errorDetails = `OpenAI API ${response.status}: ${errorData.error.type || 'ERROR'}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }

      return NextResponse.json({
        error: errorMessage,
        details: errorDetails
      }, { status: 500 });
    }

    const data = await response.json();

    // Log the full response for debugging
    console.log('AI Template Generation Response:', {
      status: response.status,
      statusText: response.statusText,
      hasChoices: !!(data.choices && data.choices.length > 0),
      firstChoiceContent: data.choices && data.choices[0] && data.choices[0].message ? 
        data.choices[0].message.content.substring(0, 200) + '...' : 'No content'
    });
    
    // Log the raw response for debugging
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('Raw AI Response (first 500 chars):', data.choices[0].message.content.substring(0, 500));
    }

    let htmlContent = "";
    if (data.choices && data.choices[0] && data.choices[0].message) {
      htmlContent = data.choices[0].message.content;
      
      // Aggressive cleaning to remove any markdown formatting
      htmlContent = htmlContent
        .replace(/```html/gi, '')  // Remove opening code blocks
        .replace(/```/g, '')       // Remove closing code blocks
        .replace(/^html\s*/i, '')  // Remove standalone "html" at start
        .replace(/^\s*```\s*/g, '') // Remove any remaining backticks at start
        .replace(/\s*```\s*$/g, '') // Remove any remaining backticks at end
        .trim();
        
      // Ensure it starts with DOCTYPE if it's valid HTML
      if (htmlContent && !htmlContent.toLowerCase().startsWith('<!doctype')) {
        // If it doesn't start with DOCTYPE but contains HTML structure, assume AI followed instructions
        console.log("Warning: AI response doesn't start with DOCTYPE, but proceeding...");
      }
    }

    if (!htmlContent) {
      return NextResponse.json({
        error: "No template generated",
        details: "OpenAI API returned empty response"
      }, { status: 500 });
    }

    console.log("AI template generated successfully");

    return NextResponse.json({
      success: true,
      htmlContent: htmlContent,
      message: "Template generated successfully"
    });

  } catch (error) {
    console.error("Error generating AI template:", error);
    let errorMessage = "Unknown error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    }

    return NextResponse.json(
      { error: "Failed to generate template", details: `Network Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
