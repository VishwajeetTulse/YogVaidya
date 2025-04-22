import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { MongoClient, ObjectId } from "mongodb";

// Initialize MongoDB connection
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);
const database = client.db("yogavaidya");
const mentorApplicationsCollection = database.collection("mentorApplications");

export async function POST(req: NextRequest) {
  try {
    // Get the current session
    const session = await auth.getSession();
    
    // Make sure the user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { message: "You must be logged in to submit an application" },
        { status: 401 }
      );
    }
    
    // Parse the form data
    const formData = await req.formData();
    
    // Extract file data for proof of work
    const file = formData.get("proofOfWork") as File;
    let fileData = null;
    
    if (file) {
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // In a real application, you would store this file in a blob storage service
      // For demo purposes, we'll just store some metadata
      fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        // Not storing the actual buffer in MongoDB for demo purposes
        // In a real app, you'd upload to S3, Google Cloud Storage, etc.
      };
    }
    
    // Create mentor application data
    const mentorApplication = {
      userId: session.user.id,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      certification: formData.get("certification") as string,
      experience: formData.get("experience") as string,
      proofOfWork: fileData,
      status: "pending", // pending, approved, rejected
      createdAt: new Date(),
    };
    
    // Insert the application into MongoDB
    const result = await mentorApplicationsCollection.insertOne(mentorApplication);
    
    if (!result.acknowledged) {
      throw new Error("Failed to store mentor application");
    }
    
    return NextResponse.json(
      { message: "Application submitted successfully", id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in mentor application submission:", error);
    return NextResponse.json(
      { message: "An error occurred while submitting your application" },
      { status: 500 }
    );
  }
} 