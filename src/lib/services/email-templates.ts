/**
 * Email Templates for YogVaidya
 * Centralized HTML email templates for all notification types
 */

const BRAND_COLOR = "#5e60ce";
const _BRAND_GRADIENT = "linear-gradient(135deg, #5e60ce 0%, #7b7fd9 100%)";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const COMPANY_NAME = "YogVaidya Wellness Pvt. Ltd.";

// Base email wrapper
function emailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        ${content}
        <footer style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">
          <p>${COMPANY_NAME}</p>
          <p>This is an automated email—please do not reply directly.</p>
        </footer>
      </div>
    </body>
    </html>
  `;
}

// Card wrapper for main content
function cardWrapper(content: string): string {
  return `
    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      ${content}
    </div>
  `;
}

// Info box component
function infoBox(content: string, color: string = BRAND_COLOR): string {
  return `
    <div style="background-color: #f0f4f8; padding: 16px; border-left: 4px solid ${color}; border-radius: 4px; margin: 20px 0;">
      ${content}
    </div>
  `;
}

// Button component
function button(text: string, url: string, color: string = BRAND_COLOR): string {
  return `
    <div style="text-align: center; margin: 25px 0;">
      <a href="${url}" style="background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
        ${text}
      </a>
    </div>
  `;
}

// ============================================
// WELCOME EMAIL
// ============================================
export function welcomeEmailTemplate(name: string): { subject: string; html: string } {
  const content = cardWrapper(`
    <h2 style="text-align: center; color: #4a4e69;">🧘 Welcome to YogVaidya, ${name}!</h2>
    
    <p style="font-size: 15px; color: #333;">
      We're thrilled to have you join our wellness community! Your journey towards better health and inner peace begins now.
    </p>

    ${infoBox(`
      <h3 style="margin: 0 0 10px 0; color: #222;">What's Next?</h3>
      <ul style="margin: 0; padding-left: 20px; color: #333;">
        <li>Complete your profile to personalize your experience</li>
        <li>Explore our yoga and meditation sessions</li>
        <li>Connect with expert mentors</li>
        <li>Start your free trial today!</li>
      </ul>
    `)}

    ${button("Go to Dashboard", `${APP_URL}/dashboard`)}

    <p style="font-size: 15px; color: #333;">
      If you have any questions, feel free to reach out to our support team.
    </p>

    <p style="font-size: 15px;">
      Namaste,<br/>
      <strong>The YogVaidya Team</strong>
    </p>
  `);

  return {
    subject: "🧘 Welcome to YogVaidya - Your Wellness Journey Begins!",
    html: emailWrapper(content),
  };
}

// ============================================
// SUBSCRIPTION ACTIVATED
// ============================================
export function subscriptionActivatedTemplate(
  name: string,
  planName: string,
  amount: number,
  billingPeriod: string,
  nextBillingDate: Date
): { subject: string; html: string } {
  const content = cardWrapper(`
    <h2 style="text-align: center; color: #4a4e69;">🎉 Subscription Activated!</h2>
    
    <p style="font-size: 15px; color: #333;">
      Hi ${name}, your <strong>${planName}</strong> subscription is now active!
    </p>

    ${infoBox(`
      <h3 style="margin: 0 0 10px 0; color: #222;">📋 Subscription Details</h3>
      <table style="width: 100%; font-size: 14px; color: #333;">
        <tr><td><strong>Plan:</strong></td><td>${planName}</td></tr>
        <tr><td><strong>Amount:</strong></td><td>₹${amount} / ${billingPeriod}</td></tr>
        <tr><td><strong>Next Billing:</strong></td><td>${nextBillingDate.toLocaleDateString('en-IN', { dateStyle: 'long' })}</td></tr>
      </table>
    `, "#4caf50")}

    <p style="font-size: 15px; color: #333;">
      You now have access to all the features included in your plan. Start exploring and make the most of your wellness journey!
    </p>

    ${button("Access Your Dashboard", `${APP_URL}/dashboard`)}

    <p style="font-size: 15px;">
      Thank you for choosing YogVaidya!<br/>
      <strong>The YogVaidya Team</strong>
    </p>
  `);

  return {
    subject: `🎉 Your ${planName} Subscription is Active!`,
    html: emailWrapper(content),
  };
}

// ============================================
// SUBSCRIPTION EXPIRING SOON
// ============================================
export function subscriptionExpiringSoonTemplate(
  name: string,
  planName: string,
  daysRemaining: number,
  expiryDate: Date,
  autoRenewal: boolean
): { subject: string; html: string } {
  const urgencyColor = daysRemaining <= 3 ? "#e53935" : daysRemaining <= 7 ? "#ff9800" : BRAND_COLOR;
  
  const content = cardWrapper(`
    <h2 style="text-align: center; color: ${urgencyColor};">⏰ Subscription Expiring Soon!</h2>
    
    <p style="font-size: 15px; color: #333;">
      Hi ${name}, your <strong>${planName}</strong> subscription will expire in <strong>${daysRemaining} day${daysRemaining > 1 ? 's' : ''}</strong>.
    </p>

    ${infoBox(`
      <p style="margin: 0; font-size: 14px; color: #222;">
        <strong>Expiry Date:</strong> ${expiryDate.toLocaleDateString('en-IN', { dateStyle: 'long' })}<br/>
        <strong>Auto-Renewal:</strong> ${autoRenewal ? '✅ Enabled' : '❌ Disabled'}
      </p>
    `, urgencyColor)}

    ${autoRenewal ? `
      <p style="font-size: 15px; color: #333;">
        ✅ Good news! Auto-renewal is enabled, so your subscription will automatically renew.
      </p>
    ` : `
      <p style="font-size: 15px; color: #333;">
        ⚠️ Auto-renewal is disabled. To continue enjoying YogVaidya, please renew your subscription before it expires.
      </p>
      ${button("Renew Now", `${APP_URL}/pricing`, urgencyColor)}
    `}

    <p style="font-size: 15px;">
      Best regards,<br/>
      <strong>The YogVaidya Team</strong>
    </p>
  `);

  return {
    subject: `⏰ Your ${planName} Subscription Expires in ${daysRemaining} Day${daysRemaining > 1 ? 's' : ''}`,
    html: emailWrapper(content),
  };
}

// ============================================
// SUBSCRIPTION EXPIRED
// ============================================
export function subscriptionExpiredTemplate(
  name: string,
  planName: string
): { subject: string; html: string } {
  const content = cardWrapper(`
    <h2 style="text-align: center; color: #e53935;">😔 Subscription Expired</h2>
    
    <p style="font-size: 15px; color: #333;">
      Hi ${name}, your <strong>${planName}</strong> subscription has expired.
    </p>

    ${infoBox(`
      <p style="margin: 0; font-size: 14px; color: #222;">
        Don't worry! You can renew your subscription anytime to regain access to all features and continue your wellness journey with us.
      </p>
    `, "#e53935")}

    <p style="font-size: 15px; color: #333;">
      Here's what you're missing:
    </p>
    <ul style="font-size: 14px; color: #333;">
      <li>Live yoga and meditation sessions</li>
      <li>Personalized diet plans</li>
      <li>One-on-one mentor sessions</li>
      <li>Progress tracking and analytics</li>
    </ul>

    ${button("Renew Subscription", `${APP_URL}/pricing`, "#e53935")}

    <p style="font-size: 15px;">
      We'd love to have you back!<br/>
      <strong>The YogVaidya Team</strong>
    </p>
  `);

  return {
    subject: `😔 Your ${planName} Subscription Has Expired`,
    html: emailWrapper(content),
  };
}

// ============================================
// SESSION BOOKED
// ============================================
export function sessionBookedTemplate(
  studentName: string,
  mentorName: string,
  sessionType: string,
  sessionDate: Date,
  duration: string,
  meetingLink?: string
): { subject: string; html: string } {
  const content = cardWrapper(`
    <h2 style="text-align: center; color: #4a4e69;">✅ Session Booked Successfully!</h2>
    
    <p style="font-size: 15px; color: #333;">
      Hi ${studentName}, your ${sessionType.toLowerCase()} session has been confirmed!
    </p>

    ${infoBox(`
      <h3 style="margin: 0 0 10px 0; color: #222;">📅 Session Details</h3>
      <table style="width: 100%; font-size: 14px; color: #333;">
        <tr><td><strong>Type:</strong></td><td>${sessionType}</td></tr>
        <tr><td><strong>Mentor:</strong></td><td>${mentorName}</td></tr>
        <tr><td><strong>Date & Time:</strong></td><td>${sessionDate.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</td></tr>
        <tr><td><strong>Duration:</strong></td><td>${duration}</td></tr>
      </table>
    `, "#4caf50")}

    ${meetingLink ? `
      <p style="font-size: 15px; color: #333;">
        🔗 <strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: ${BRAND_COLOR};">${meetingLink}</a>
      </p>
    ` : ''}

    <p style="font-size: 15px; color: #333;">
      ⏰ Please join <strong>5-10 minutes</strong> before the scheduled time.
    </p>

    ${button("View My Sessions", `${APP_URL}/dashboard`)}

    <p style="font-size: 15px;">
      See you soon!<br/>
      <strong>The YogVaidya Team</strong>
    </p>
  `);

  return {
    subject: `✅ Session Booked: ${sessionType} with ${mentorName}`,
    html: emailWrapper(content),
  };
}

// ============================================
// SESSION BOOKED - MENTOR NOTIFICATION
// ============================================
export function sessionBookedMentorTemplate(
  mentorName: string,
  studentName: string,
  sessionType: string,
  sessionDate: Date,
  duration: string
): { subject: string; html: string } {
  const content = cardWrapper(`
    <h2 style="text-align: center; color: #4a4e69;">📅 New Session Booking!</h2>
    
    <p style="font-size: 15px; color: #333;">
      Hi ${mentorName}, you have a new ${sessionType.toLowerCase()} session booking!
    </p>

    ${infoBox(`
      <h3 style="margin: 0 0 10px 0; color: #222;">📋 Session Details</h3>
      <table style="width: 100%; font-size: 14px; color: #333;">
        <tr><td><strong>Student:</strong></td><td>${studentName}</td></tr>
        <tr><td><strong>Type:</strong></td><td>${sessionType}</td></tr>
        <tr><td><strong>Date & Time:</strong></td><td>${sessionDate.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</td></tr>
        <tr><td><strong>Duration:</strong></td><td>${duration}</td></tr>
      </table>
    `, BRAND_COLOR)}

    ${button("View Dashboard", `${APP_URL}/dashboard`)}

    <p style="font-size: 15px;">
      Best regards,<br/>
      <strong>The YogVaidya Team</strong>
    </p>
  `);

  return {
    subject: `📅 New Booking: ${sessionType} Session with ${studentName}`,
    html: emailWrapper(content),
  };
}

// ============================================
// SESSION CANCELLED
// ============================================
export function sessionCancelledTemplate(
  recipientName: string,
  sessionType: string,
  sessionDate: Date,
  cancelledBy: string,
  reason?: string
): { subject: string; html: string } {
  const content = cardWrapper(`
    <h2 style="text-align: center; color: #e53935;">❌ Session Cancelled</h2>
    
    <p style="font-size: 15px; color: #333;">
      Hi ${recipientName}, the following session has been cancelled.
    </p>

    ${infoBox(`
      <h3 style="margin: 0 0 10px 0; color: #222;">📅 Cancelled Session</h3>
      <table style="width: 100%; font-size: 14px; color: #333;">
        <tr><td><strong>Type:</strong></td><td>${sessionType}</td></tr>
        <tr><td><strong>Scheduled For:</strong></td><td>${sessionDate.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</td></tr>
        <tr><td><strong>Cancelled By:</strong></td><td>${cancelledBy}</td></tr>
        ${reason ? `<tr><td><strong>Reason:</strong></td><td>${reason}</td></tr>` : ''}
      </table>
    `, "#e53935")}

    <p style="font-size: 15px; color: #333;">
      You can book another session at your convenience.
    </p>

    ${button("Book New Session", `${APP_URL}/mentors`)}

    <p style="font-size: 15px;">
      We apologize for any inconvenience.<br/>
      <strong>The YogVaidya Team</strong>
    </p>
  `);

  return {
    subject: `❌ Session Cancelled: ${sessionType} on ${sessionDate.toLocaleDateString('en-IN')}`,
    html: emailWrapper(content),
  };
}

// ============================================
// NEW MENTOR APPLICATION - ADMIN NOTIFICATION
// ============================================
export function newMentorApplicationTemplate(
  applicantName: string,
  applicantEmail: string,
  mentorType: string,
  experience: string,
  expertise: string
): { subject: string; html: string } {
  const content = cardWrapper(`
    <h2 style="text-align: center; color: #4a4e69;">📝 New Mentor Application</h2>
    
    <p style="font-size: 15px; color: #333;">
      A new mentor application has been submitted and is awaiting review.
    </p>

    ${infoBox(`
      <h3 style="margin: 0 0 10px 0; color: #222;">👤 Applicant Details</h3>
      <table style="width: 100%; font-size: 14px; color: #333;">
        <tr><td><strong>Name:</strong></td><td>${applicantName}</td></tr>
        <tr><td><strong>Email:</strong></td><td>${applicantEmail}</td></tr>
        <tr><td><strong>Type:</strong></td><td>${mentorType === 'YOGAMENTOR' ? 'Yoga Mentor' : 'Meditation Mentor'}</td></tr>
        <tr><td><strong>Experience:</strong></td><td>${experience}</td></tr>
      </table>
    `)}

    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0;">
      <h4 style="margin: 0 0 10px 0; color: #222;">💡 Expertise</h4>
      <p style="margin: 0; font-size: 14px; color: #333;">${expertise}</p>
    </div>

    ${button("Review Application", `${APP_URL}/dashboard/mentors`)}

    <p style="font-size: 15px;">
      Please review and take action.<br/>
      <strong>YogVaidya System</strong>
    </p>
  `);

  return {
    subject: `📝 New Mentor Application: ${applicantName} (${mentorType === 'YOGAMENTOR' ? 'Yoga' : 'Meditation'})`,
    html: emailWrapper(content),
  };
}

// ============================================
// SUPPORT TICKET ACKNOWLEDGMENT
// ============================================
export function supportTicketAcknowledgmentTemplate(
  userName: string,
  ticketId: string,
  subject: string,
  message: string
): { subject: string; html: string } {
  const content = cardWrapper(`
    <h2 style="text-align: center; color: #4a4e69;">🎫 Support Ticket Received</h2>
    
    <p style="font-size: 15px; color: #333;">
      Hi ${userName}, we've received your support request and our team is on it!
    </p>

    ${infoBox(`
      <h3 style="margin: 0 0 10px 0; color: #222;">📋 Ticket Details</h3>
      <table style="width: 100%; font-size: 14px; color: #333;">
        <tr><td><strong>Ticket ID:</strong></td><td>#${ticketId}</td></tr>
        <tr><td><strong>Subject:</strong></td><td>${subject}</td></tr>
        <tr><td><strong>Status:</strong></td><td>🟡 Open</td></tr>
      </table>
    `)}

    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0;">
      <h4 style="margin: 0 0 10px 0; color: #222;">Your Message:</h4>
      <p style="margin: 0; font-size: 14px; color: #333; white-space: pre-wrap;">${message}</p>
    </div>

    <p style="font-size: 15px; color: #333;">
      ⏱️ We typically respond within <strong>24-48 hours</strong>. You'll receive an email when we update your ticket.
    </p>

    <p style="font-size: 15px;">
      Thank you for your patience!<br/>
      <strong>The YogVaidya Support Team</strong>
    </p>
  `);

  return {
    subject: `🎫 Support Ticket #${ticketId}: ${subject}`,
    html: emailWrapper(content),
  };
}

// ============================================
// SUPPORT TICKET STATUS UPDATE
// ============================================
export function supportTicketUpdateTemplate(
  userName: string,
  ticketId: string,
  ticketSubject: string,
  status: "in-progress" | "resolved" | "closed",
  updateMessage: string,
  agentName?: string
): { subject: string; html: string } {
  const statusConfig = {
    "in-progress": { emoji: "🔄", label: "In Progress", color: "#ff9800" },
    "resolved": { emoji: "✅", label: "Resolved", color: "#4caf50" },
    "closed": { emoji: "📁", label: "Closed", color: "#9e9e9e" },
  };

  const { emoji, label, color } = statusConfig[status];

  const content = cardWrapper(`
    <h2 style="text-align: center; color: ${color};">${emoji} Ticket Update</h2>
    
    <p style="font-size: 15px; color: #333;">
      Hi ${userName}, there's an update on your support ticket.
    </p>

    ${infoBox(`
      <h3 style="margin: 0 0 10px 0; color: #222;">📋 Ticket Details</h3>
      <table style="width: 100%; font-size: 14px; color: #333;">
        <tr><td><strong>Ticket ID:</strong></td><td>#${ticketId}</td></tr>
        <tr><td><strong>Subject:</strong></td><td>${ticketSubject}</td></tr>
        <tr><td><strong>New Status:</strong></td><td>${emoji} ${label}</td></tr>
        ${agentName ? `<tr><td><strong>Assigned To:</strong></td><td>${agentName}</td></tr>` : ''}
      </table>
    `, color)}

    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0;">
      <h4 style="margin: 0 0 10px 0; color: #222;">📝 Update Message:</h4>
      <p style="margin: 0; font-size: 14px; color: #333; white-space: pre-wrap;">${updateMessage}</p>
    </div>

    ${status === "resolved" ? `
      <p style="font-size: 15px; color: #333;">
        If this resolves your issue, no further action is needed. If you have additional questions, simply reply to this email.
      </p>
    ` : ''}

    <p style="font-size: 15px;">
      Best regards,<br/>
      <strong>The YogVaidya Support Team</strong>
    </p>
  `);

  return {
    subject: `${emoji} Ticket #${ticketId} ${label}: ${ticketSubject}`,
    html: emailWrapper(content),
  };
}
