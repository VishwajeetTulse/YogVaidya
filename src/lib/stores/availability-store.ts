// Real-time mentor availability store
// This will maintain availability state in memory until database schema is deployed

interface MentorAvailability {
  mentorId: string;
  isAvailable: boolean;
  lastUpdated: Date;
  mentorName?: string;
  mentorType?: string;
}

class AvailabilityStore {
  private availabilityMap: Map<string, MentorAvailability> = new Map();

  // Set mentor availability
  setAvailability(
    mentorId: string,
    isAvailable: boolean,
    mentorData?: { name?: string; mentorType?: string }
  ) {
    const existing = this.availabilityMap.get(mentorId);

    this.availabilityMap.set(mentorId, {
      mentorId,
      isAvailable,
      lastUpdated: new Date(),
      mentorName: mentorData?.name || existing?.mentorName,
      mentorType: mentorData?.mentorType || existing?.mentorType,
    });

    return this.availabilityMap.get(mentorId);
  }

  // Get mentor availability
  getAvailability(mentorId: string): boolean {
    const availability = this.availabilityMap.get(mentorId);
    return availability?.isAvailable ?? true; // Default to available if not set
  }

  // Get all mentor availability data
  getAllAvailability(): MentorAvailability[] {
    return Array.from(this.availabilityMap.values());
  }

  // Get mentor data with availability
  getMentorData(mentorId: string): MentorAvailability | null {
    return this.availabilityMap.get(mentorId) || null;
  }

  // Initialize mentor if not exists
  initializeMentor(mentorId: string, mentorData: { name?: string; mentorType?: string }) {
    if (!this.availabilityMap.has(mentorId)) {
      this.setAvailability(mentorId, true, mentorData); // Default to available
    }
  }

  // Get availability summary
  getAvailabilitySummary() {
    const all = this.getAllAvailability();
    const available = all.filter((m) => m.isAvailable).length;
    const unavailable = all.filter((m) => !m.isAvailable).length;

    return {
      total: all.length,
      available,
      unavailable,
      availabilityRate: all.length > 0 ? (available / all.length) * 100 : 0,
    };
  }

  // Clear all data (for testing/reset)
  clear() {
    this.availabilityMap.clear();

  }
}

// Singleton instance
export const availabilityStore = new AvailabilityStore();

// Export types
export type { MentorAvailability };
