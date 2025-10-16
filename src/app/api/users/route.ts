import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { authClient } from "@/lib/auth-client";
import { prisma } from "@/lib/config/prisma";

// Get all users
export async function GET(req: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if user has admin or moderator privileges
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        billingPeriod: true,
      },
    });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
}

// Edit user (name, email, phone, role)
export async function PATCH(req: NextRequest) {
  try {


    // Check authentication and permissions
    const session = await auth.api.getSession({ headers: req.headers });


    if (!session?.user) {

      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if user has admin privileges
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });



    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR")) {

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id, name, email, phone, role, password } = await req.json();

    // Add extra validation for role changes
    if (role) {
      // Only admins can change roles to ADMIN or MODERATOR
      if ((role === "ADMIN" || role === "MODERATOR") && currentUser.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only admins can assign admin or moderator roles" },
          { status: 403 }
        );
      }

      // Get the target user
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { role: true },
      });

      // Moderators can't modify admins or other moderators
      if (
        targetUser &&
        (targetUser.role === "ADMIN" || targetUser.role === "MODERATOR") &&
        currentUser.role !== "ADMIN"
      ) {
        return NextResponse.json(
          { error: "Moderators can't modify admin or moderator accounts" },
          { status: 403 }
        );
      }
    }

    // Update the user's basic information
    const user = await prisma.user.update({
      where: { id },
      data: { name, email, phone, role },
    });



    // Handle password update if provided
    if (password && password.trim() !== "") {
      // Hash the password
      const { hash } = await import("bcryptjs");
      const hashedPassword = await hash(password, 10);
      // Find and update the account with new password
      const accountExists = await prisma.account.findFirst({
        where: {
          userId: id,
          providerId: "email_and_password", // Changed from "credentials" to match better-auth expectation
        },
      });

      if (accountExists) {
        // Update existing account
        await prisma.account.update({
          where: { id: accountExists.id },
          data: { password: hashedPassword, updatedAt: new Date() },
        });
      } else {
        // Create new account entry with password
        await prisma.account.create({
          data: {
            id: crypto.randomUUID(),
            userId: id,
            providerId: "email_and_password", // Changed from "credentials" to match better-auth expectation
            accountId: email || user.email,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("❌ Error in PATCH /api/users:", error);
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
}

// Delete user and their mentor application(s)
export async function DELETE(req: NextRequest) {
  try {


    // Check authentication and permissions
    const session = await auth.api.getSession({ headers: req.headers });


    if (!session?.user) {

      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if user has admin or moderator privileges
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });



    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR")) {

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await req.json();

    // Find the user to get their email and role
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {

      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }



    // Add protection for admin and moderator accounts
    if ((user.role === "ADMIN" || user.role === "MODERATOR") && currentUser.role !== "ADMIN") {

      return NextResponse.json(
        { error: "Only admins can delete admin or moderator accounts" },
        { status: 403 }
      );
    }

    // Delete all sessions for this user
    await prisma.session.deleteMany({ where: { userId: id } });

    // Delete all accounts for this user
    await prisma.account.deleteMany({ where: { userId: id } });

    // Delete mentor applications by email
    await prisma.mentorApplication.deleteMany({ where: { email: user.email } });

    // Finally delete the user
    await prisma.user.delete({ where: { id } });



    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error in DELETE /api/users:", error);
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
}

// Delete user and their mentor application(s)
export async function POST(req: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if user has admin privileges
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions. Only admins can create moderator accounts" },
        { status: 403 }
      );
    }

    const { name, email, phone, role, password }: { [x: string]: string } = await req.json();

    // Validate role - only allow creating MODERATOR accounts through this endpoint
    if (role !== "MODERATOR") {
      return NextResponse.json(
        { error: "This endpoint can only create MODERATOR accounts" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }
    const { data } = await authClient.signUp.email({
      email: email,
      password: password,
      name: name,
      phone: phone,
      role: "MODERATOR",
    });



    // Send an email with credentials
    try {
      // Import the email sending utility
      const { sendEmail } = await import("@/lib/services/email");

      const emailSubject = "Your YogaVaidya Moderator Account";
      const emailHtml = `
  <div style="background-color: #f9f9f9; padding: 30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div style="max-width: 600px; margin: auto; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <h2 style="text-align: center; color: #4a4e69;">👋 Welcome to YogVaidya, ${name}!</h2>

      <p style="font-size: 15px; color: #333;">
        An administrator has created a <strong>moderator account</strong> for you on the <strong>YogVaidya</strong> platform.
      </p>

      <div style="background-color: #f0f4f8; padding: 16px; border-left: 4px solid #5e60ce; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px;">
          <strong>Login Credentials:</strong><br/>
          Email: <code>${email}</code><br/>
          Password: <code>${password}</code>
        </p>
      </div>

      <p style="font-size: 15px;">
        👉 Please log in at <a href="https://your-login-url.com" style="color: #5e60ce; text-decoration: none;">https://your-login-url.com</a> and change your password immediately.
      </p>

      <p style="font-size: 15px;">
        If you have any questions, feel free to contact your administrator.
      </p>

      <p style="font-size: 15px;">Best regards,<br/><strong>The YogVaidya Team</strong></p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

      <footer style="text-align: center; font-size: 12px; color: #888;">
        YogaVaidya Wellness Pvt. Ltd.<br/>
        This is an automated email—please do not reply directly.
      </footer>
    </div>
  </div>
`;

      await sendEmail({
        to: email,
        subject: emailSubject,
        text: emailHtml,
        html: true, // Set to true to send HTML content
      });
    } catch (emailError) {
      console.error("Failed to send moderator credentials email:", emailError);
      // We don't want to fail the whole request if just the email fails
      // The account is still created successfully
    }

    return NextResponse.json({
      success: true,
      user: data,
      message: "Moderator account created successfully. Credentials have been emailed.",
    });
  } catch (error) {
    console.error("Error creating moderator:", error);
    return NextResponse.json({ success: false, error: error?.toString() }, { status: 500 });
  }
}
