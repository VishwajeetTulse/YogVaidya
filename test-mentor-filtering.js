// Test script to verify mentor filtering logic
// This script helps test that one-to-one completed sessions don't show mentors in "My Mentors"

console.log('🧪 Testing Mentor Filtering Logic');
console.log('='.repeat(50));

// Test data representing different session scenarios
const testSessions = [
  // Scenario 1: Completed one-to-one session (should NOT show mentor)
  {
    mentorId: 'mentor1',
    mentorName: 'Yoga Master John',
    sessions: [
      { 
        status: 'COMPLETED', 
        maxStudents: 1, 
        isRecurring: false, 
        scheduledAt: new Date('2024-09-01'), 
        sessionType: 'one-to-one' 
      }
    ]
  },
  
  // Scenario 2: Recurring sessions (should show mentor)
  {
    mentorId: 'mentor2',
    mentorName: 'Meditation Guide Sarah',
    sessions: [
      { 
        status: 'COMPLETED', 
        maxStudents: 1, 
        isRecurring: true, 
        scheduledAt: new Date('2024-09-01'),
        sessionType: 'recurring-personal'
      }
    ]
  },
  
  // Scenario 3: Group sessions (should show mentor)
  {
    mentorId: 'mentor3',
    mentorName: 'Group Yoga Instructor Mike',
    sessions: [
      { 
        status: 'COMPLETED', 
        maxStudents: 10, 
        isRecurring: false, 
        scheduledAt: new Date('2024-09-01'),
        sessionType: 'group'
      }
    ]
  },
  
  // Scenario 4: Multiple one-to-one sessions (should show mentor - indicates ongoing relationship)
  {
    mentorId: 'mentor4',
    mentorName: 'Personal Trainer Lisa',
    sessions: [
      { 
        status: 'COMPLETED', 
        maxStudents: 1, 
        isRecurring: false, 
        scheduledAt: new Date('2024-08-15'),
        sessionType: 'one-to-one'
      },
      { 
        status: 'COMPLETED', 
        maxStudents: 1, 
        isRecurring: false, 
        scheduledAt: new Date('2024-09-01'),
        sessionType: 'one-to-one'
      }
    ]
  },
  
  // Scenario 5: Future one-to-one session (should show mentor)
  {
    mentorId: 'mentor5',
    mentorName: 'Future Session Mentor',
    sessions: [
      { 
        status: 'SCHEDULED', 
        maxStudents: 1, 
        isRecurring: false, 
        scheduledAt: new Date('2025-12-01'), // Fixed: Set to future year
        sessionType: 'one-to-one-future'
      }
    ]
  }
];

// Apply the filtering logic
function shouldShowMentor(mentorData) {
  const sessions = mentorData.sessions;
  const now = new Date();
  
  const hasOngoingRelationship = 
    // Has recurring sessions
    sessions.some(s => s.isRecurring) ||
    // Has group sessions (maxStudents > 1)
    sessions.some(s => s.maxStudents > 1) ||
    // Has future sessions
    sessions.some(s => s.scheduledAt > now) ||
    // Has multiple sessions (indicates ongoing relationship)
    sessions.length > 1;
    
  return hasOngoingRelationship;
}

console.log('📋 Testing each scenario:');
console.log('');

testSessions.forEach((mentor, index) => {
  const shouldShow = shouldShowMentor(mentor);
  const scenario = index + 1;
  
  console.log(`Scenario ${scenario}: ${mentor.mentorName}`);
  console.log(`  Sessions: ${mentor.sessions.length}`);
  console.log(`  Session details:`, mentor.sessions.map(s => ({
    type: s.sessionType,
    status: s.status,
    maxStudents: s.maxStudents,
    isRecurring: s.isRecurring,
    isFuture: s.scheduledAt > new Date()
  })));
  console.log(`  Should show in "My Mentors": ${shouldShow ? '✅ YES' : '❌ NO'}`);
  console.log('');
});

console.log('🎯 Expected Results:');
console.log('  Scenario 1 (single completed 1-to-1): ❌ NO');
console.log('  Scenario 2 (recurring): ✅ YES');
console.log('  Scenario 3 (group): ✅ YES');
console.log('  Scenario 4 (multiple 1-to-1): ✅ YES');
console.log('  Scenario 5 (future 1-to-1): ✅ YES');
console.log('');
console.log('💡 This ensures users only see mentors they have ongoing relationships with!');

// Export for potential use in actual application
module.exports = { shouldShowMentor, testSessions };