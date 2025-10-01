import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/services/email";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user || session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Unauthorized - Mentors only" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { studentId, sessionId, title, description, content, tags, isDraft, mentorId } = body;

    // Validate mentor owns this action
    if (mentorId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Verify mentor is DIETPLANNER
    const mentor = await prisma.user.findUnique({
      where: { id: mentorId },
      select: { mentorType: true, name: true },
    });

    if (mentor?.mentorType !== "DIETPLANNER") {
      return NextResponse.json(
        { error: "Only diet planners can create diet plans" },
        { status: 403 }
      );
    }

    // Verify student has FLOURISH subscription (premium feature)
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { 
        name: true, 
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true 
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (
      student.subscriptionPlan !== "FLOURISH" ||
      student.subscriptionStatus !== "ACTIVE"
    ) {
      return NextResponse.json(
        { error: "Student must have active FLOURISH subscription" },
        { status: 403 }
      );
    }

    // Create diet plan
    const dietPlan = await prisma.dietPlan.create({
      data: {
        studentId,
        mentorId,
        sessionId: sessionId || undefined,
        title,
        description: description || "",
        content,
        tags: tags || [],
        isDraft: isDraft || false,
      },
    });

    // Send email notification if not draft
    if (!isDraft) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      
      await sendEmail({
        to: student.email,
        subject: `New Diet Plan: ${title}`,
        html: true,
        text: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🥗 New Diet Plan Available!</h1>
              </div>
              <div class="content">
                <h2>Hi ${student.name},</h2>
                <p>Your mentor <strong>${mentor.name || "Your mentor"}</strong> has created a personalized diet plan for you!</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #10b981;">${title}</h3>
                  ${description ? `<p>${description}</p>` : ''}
                </div>

                <p>This plan has been carefully crafted to help you achieve your health and wellness goals.</p>
                
                <div style="text-align: center;">
                  <a href="${appUrl}/dashboard" class="button">View Your Diet Plan</a>
                </div>

                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                  💡 <strong>Tip:</strong> Access your diet plan anytime from your dashboard!
                </p>
              </div>
              <div class="footer">
                <p>Best regards,<br/>YogVaidya Team</p>
                <p style="font-size: 12px;">This is an automated message. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      dietPlan,
    });

  } catch (error) {
    console.error("Error creating diet plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Fetch diet plans (for mentor or student)
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    console.log("🔍 GET Diet Plans - User:", session?.user?.id, "Role:", session?.user?.role);
    
    if (!session?.user) {
      console.error("❌ Unauthorized - No session");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const mentorId = searchParams.get("mentorId");

    console.log("📋 Query params - mentorId:", mentorId);

    let dietPlans;

    try {
      if (session.user.role === "MENTOR" && mentorId === session.user.id) {
        // Mentor viewing their created plans
        console.log("👨‍🏫 Fetching plans for MENTOR:", session.user.id);
        dietPlans = await (prisma as any).dietPlan.findMany({
          where: { mentorId: session.user.id },
          include: {
            student: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      } else {
        // Student viewing their received plans
        console.log("🎓 Fetching plans for STUDENT:", session.user.id);
        dietPlans = await (prisma as any).dietPlan.findMany({
          where: { 
            studentId: session.user.id,
            isDraft: false, // Students don't see drafts
          },
          include: {
            mentor: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      }
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
      return NextResponse.json(
        { error: "Database error", details: dbError instanceof Error ? dbError.message : String(dbError) },
        { status: 500 }
      );
    }

    // Transform tags - handle both string and array formats
    const transformedDietPlans = dietPlans.map((plan: any) => {
      let tags = [];
      
      if (plan.tags) {
        if (typeof plan.tags === 'string') {
          // Tags stored as comma-separated string
          tags = plan.tags.split(',').map((t: string) => t.trim());
        } else if (Array.isArray(plan.tags)) {
          // Tags already an array
          tags = plan.tags;
        }
      }
      
      return {
        ...plan,
        tags,
      };
    });

    console.log("✅ Returning", transformedDietPlans.length, "diet plans");
    return NextResponse.json({ dietPlans: transformedDietPlans });

  } catch (error) {
    console.error("❌ Error fetching diet plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
