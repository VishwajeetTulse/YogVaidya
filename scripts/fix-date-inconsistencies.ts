import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDateInconsistencies() {
  try {
    console.log('🔧 Starting to fix date field inconsistencies...');
    
    // Fix Schedule collection date fields
    console.log('📅 Fixing Schedule collection...');
    
    // Fix scheduledTime field in Schedule
    const scheduleTimeResult = await prisma.$runCommandRaw({
      update: 'schedule',
      updates: [
        {
          q: { scheduledTime: { $type: "string" } },
          u: [
            {
              $set: {
                scheduledTime: {
                  $dateFromString: {
                    dateString: "$scheduledTime"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    console.log('✅ Fixed scheduledTime in Schedule:', scheduleTimeResult);

    // Fix createdAt field in Schedule
    const scheduleCreatedResult = await prisma.$runCommandRaw({
      update: 'schedule',
      updates: [
        {
          q: { createdAt: { $type: "string" } },
          u: [
            {
              $set: {
                createdAt: {
                  $dateFromString: {
                    dateString: "$createdAt"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    console.log('✅ Fixed createdAt in Schedule:', scheduleCreatedResult);

    // Fix updatedAt field in Schedule
    const scheduleUpdatedResult = await prisma.$runCommandRaw({
      update: 'schedule',
      updates: [
        {
          q: { updatedAt: { $type: "string" } },
          u: [
            {
              $set: {
                updatedAt: {
                  $dateFromString: {
                    dateString: "$updatedAt"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    console.log('✅ Fixed updatedAt in Schedule:', scheduleUpdatedResult);

    // Fix MentorTimeSlot collection date fields
    console.log('📅 Fixing MentorTimeSlot collection...');
    
    // Fix startTime field in MentorTimeSlot
    const timeSlotStartResult = await prisma.$runCommandRaw({
      update: 'mentorTimeSlot',
      updates: [
        {
          q: { startTime: { $type: "string" } },
          u: [
            {
              $set: {
                startTime: {
                  $dateFromString: {
                    dateString: "$startTime"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    console.log('✅ Fixed startTime in MentorTimeSlot:', timeSlotStartResult);

    // Fix endTime field in MentorTimeSlot
    const timeSlotEndResult = await prisma.$runCommandRaw({
      update: 'mentorTimeSlot',
      updates: [
        {
          q: { endTime: { $type: "string" } },
          u: [
            {
              $set: {
                endTime: {
                  $dateFromString: {
                    dateString: "$endTime"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    console.log('✅ Fixed endTime in MentorTimeSlot:', timeSlotEndResult);

    // Fix createdAt field in MentorTimeSlot
    const timeSlotCreatedResult = await prisma.$runCommandRaw({
      update: 'mentorTimeSlot',
      updates: [
        {
          q: { createdAt: { $type: "string" } },
          u: [
            {
              $set: {
                createdAt: {
                  $dateFromString: {
                    dateString: "$createdAt"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    console.log('✅ Fixed createdAt in MentorTimeSlot:', timeSlotCreatedResult);

    // Fix updatedAt field in MentorTimeSlot
    const timeSlotUpdatedResult = await prisma.$runCommandRaw({
      update: 'mentorTimeSlot',
      updates: [
        {
          q: { updatedAt: { $type: "string" } },
          u: [
            {
              $set: {
                updatedAt: {
                  $dateFromString: {
                    dateString: "$updatedAt"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    console.log('✅ Fixed updatedAt in MentorTimeSlot:', timeSlotUpdatedResult);

    // Fix SessionBooking collection date fields
    console.log('📅 Fixing SessionBooking collection...');
    
    // Fix scheduledAt field in SessionBooking
    const bookingScheduledResult = await prisma.$runCommandRaw({
      update: 'sessionBooking',
      updates: [
        {
          q: { scheduledAt: { $type: "string" } },
          u: [
            {
              $set: {
                scheduledAt: {
                  $dateFromString: {
                    dateString: "$scheduledAt"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    console.log('✅ Fixed scheduledAt in SessionBooking:', bookingScheduledResult);

    // Fix createdAt field in SessionBooking
    const bookingCreatedResult = await prisma.$runCommandRaw({
      update: 'sessionBooking',
      updates: [
        {
          q: { createdAt: { $type: "string" } },
          u: [
            {
              $set: {
                createdAt: {
                  $dateFromString: {
                    dateString: "$createdAt"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    console.log('✅ Fixed createdAt in SessionBooking:', bookingCreatedResult);

    // Fix updatedAt field in SessionBooking
    const bookingUpdatedResult = await prisma.$runCommandRaw({
      update: 'sessionBooking',
      updates: [
        {
          q: { updatedAt: { $type: "string" } },
          u: [
            {
              $set: {
                updatedAt: {
                  $dateFromString: {
                    dateString: "$updatedAt"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    console.log('✅ Fixed updatedAt in SessionBooking:', bookingUpdatedResult);

    // Fix manualStartTime field in SessionBooking (if it exists as string)
    const manualStartResult = await prisma.$runCommandRaw({
      update: 'sessionBooking',
      updates: [
        {
          q: { manualStartTime: { $type: "string" } },
          u: [
            {
              $set: {
                manualStartTime: {
                  $dateFromString: {
                    dateString: "$manualStartTime"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    console.log('✅ Fixed manualStartTime in SessionBooking:', manualStartResult);

    // Fix actualEndTime field in SessionBooking (if it exists as string)
    const actualEndResult = await prisma.$runCommandRaw({
      update: 'sessionBooking',
      updates: [
        {
          q: { actualEndTime: { $type: "string" } },
          u: [
            {
              $set: {
                actualEndTime: {
                  $dateFromString: {
                    dateString: "$actualEndTime"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    console.log('✅ Fixed actualEndTime in SessionBooking:', actualEndResult);

    // Fix User collection date fields
    console.log('📅 Fixing User collection...');
    
    // Fix createdAt field in User
    const userCreatedResult = await prisma.$runCommandRaw({
      update: 'user',
      updates: [
        {
          q: { createdAt: { $type: "string" } },
          u: [
            {
              $set: {
                createdAt: {
                  $dateFromString: {
                    dateString: "$createdAt"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    console.log('✅ Fixed createdAt in User:', userCreatedResult);

    // Fix updatedAt field in User
    const userUpdatedResult = await prisma.$runCommandRaw({
      update: 'user',
      updates: [
        {
          q: { updatedAt: { $type: "string" } },
          u: [
            {
              $set: {
                updatedAt: {
                  $dateFromString: {
                    dateString: "$updatedAt"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    console.log('✅ Fixed updatedAt in User:', userUpdatedResult);

    // Fix subscription date fields in User
    const subscriptionDates = [
      'subscriptionStartDate',
      'subscriptionEndDate', 
      'lastPaymentDate',
      'nextBillingDate',
      'trialEndDate'
    ];

    for (const dateField of subscriptionDates) {
      const result = await prisma.$runCommandRaw({
        update: 'user',
        updates: [
          {
            q: { [dateField]: { $type: "string" } },
            u: [
              {
                $set: {
                  [dateField]: {
                    $dateFromString: {
                      dateString: `$${dateField}`
                    }
                  }
                }
              }
            ],
            multi: true
          }
        ]
      });
      console.log(`✅ Fixed ${dateField} in User:`, result);
    }

    console.log('🎉 All date field inconsistencies have been fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing date inconsistencies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixDateInconsistencies();