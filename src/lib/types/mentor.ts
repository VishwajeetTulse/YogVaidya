export interface Mentor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  experience: string;
  certifications: string;
  image: string;
  available: boolean;
  description: string;
  bio?: string; // New bio field
  mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null;
  profile?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MentorResponse {
  success: boolean;
  mentors: Mentor[];
  count: number;
  error?: string;
  details?: string;
}

// Legacy interface for backwards compatibility with MentorCarousel
export interface LegacyMentor {
  id: number;
  name: string;
  specialty: string;
  experience: string;
  imageUrl: string;
  available: boolean;
  description: string;
}
