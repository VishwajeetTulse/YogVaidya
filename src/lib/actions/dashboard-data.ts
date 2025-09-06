'use server';

import { prisma } from '@/lib/config/prisma';
import { auth } from '@/lib/config/auth';
import { headers } from 'next/headers';

export interface DashboardData {
  classesThisWeek: number;
  totalPracticeTime: string;
  goalsAchieved: number;
  totalGoals: number;
  streakDays: number;
  todaySchedule: {
    id: string;
    title: string;
    mentor: string;
    time: string;
    scheduledTime: Date;
    type: 'yoga' | 'meditation';
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  }[];
  upcomingSessions: {
    id: string;
    title: string;
    mentor: string;
    time: string;
    type: 'yoga' | 'meditation';
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  }[];
  monthlyStats: {
    currentMonth: {
      sessions: number;
      practiceTime: number; // in minutes
    };
    previousMonth: {
      sessions: number;
      practiceTime: number; // in minutes
    };
  };
}

export async function getUserDashboardData(): Promise<{
  success: boolean;
  data?: DashboardData;
  error?: string;
}> {
  try {
    // Get the session using headers (similar to mentor-overview-server.ts)
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        // Get user's session data
        sessions: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            }
          },
          select: {
            id: true,
            createdAt: true,
          }
        }
      }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Date calculations (similar to mentor analytics)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    // Get start of week (Monday)
    const startOfWeek = (() => {
      const date = new Date(now);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday;
    })();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get user's scheduled sessions for this week (as a student)
    const userScheduledSessions = await prisma.schedule.findMany({
      where: {
        // Add studentId field when available, for now using a different approach
        scheduledTime: {
          gte: startOfWeek,
          lte: endOfWeek
        },
        status: {
          in: ['SCHEDULED', 'COMPLETED']
        }
      },
      include: {
        mentor: {
          select: {
            name: true
          }
        }
      }
    });

    // Calculate classes this week based on actual scheduled sessions
    const classesThisWeek = userScheduledSessions.filter(session => 
      session.status === 'COMPLETED' || session.scheduledTime <= now
    ).length;

    // Calculate total practice time based on completed sessions
    const totalMinutes = classesThisWeek * 45; // 45 minutes per session
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const totalPracticeTime = `${hours}h ${minutes}m`;

    // Calculate goals based on user activity and subscription level
    const subscriptionGoals = {
      'SEED': 4,     // 4 sessions per week
      'BLOOM': 6,    // 6 sessions per week  
      'FLOURISH': 8  // 8 sessions per week
    };
    const totalGoals = subscriptionGoals[user.subscriptionPlan as keyof typeof subscriptionGoals] || 4;
    const goalsAchieved = Math.min(classesThisWeek, totalGoals);

    // Calculate streak days based on recent activity
    const recentSessions = await prisma.schedule.findMany({
      where: {
        scheduledTime: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        },
        status: 'COMPLETED'
      },
      orderBy: {
        scheduledTime: 'desc'
      }
    });

    // Calculate streak (simplified - count consecutive days with sessions)
    let streakDays = 0;
    if (recentSessions.length > 0) {
      const today = new Date();
      const sessionDates = recentSessions.map(s => 
        new Date(s.scheduledTime).toDateString()
      );
      
      // Count consecutive days from today backwards
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const checkDateString = checkDate.toDateString();
        
        if (sessionDates.includes(checkDateString)) {
          streakDays++;
        } else if (i > 0) {
          break; // Break streak if no session found
        }
      }
    }

    // Get today's scheduled sessions
    const todaySchedule = await prisma.schedule.findMany({
      where: {
        scheduledTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        mentor: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        scheduledTime: 'asc'
      }
    });

    // Get upcoming sessions (next 7 days)
    const upcomingSessions = await prisma.schedule.findMany({
      where: {
        scheduledTime: {
          gt: now,
          lte: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))
        }
      },
      include: {
        mentor: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        scheduledTime: 'asc'
      },
      take: 5
    });

    // Get monthly stats
    const currentMonthSessions = await prisma.schedule.count({
      where: {
        scheduledTime: {
          gte: startOfMonth,
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        },
        status: 'COMPLETED'
      }
    });

    const previousMonthSessions = await prisma.schedule.count({
      where: {
        scheduledTime: {
          gte: startOfPreviousMonth,
          lte: endOfPreviousMonth
        },
        status: 'COMPLETED'
      }
    });

    // Format the data
    const formatSessionTime = (date: Date) => {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    return {
      success: true,
      data: {
        classesThisWeek,
        totalPracticeTime,
        goalsAchieved,
        totalGoals,
        streakDays,
        todaySchedule: todaySchedule.map(session => ({
          id: session.id,
          title: session.title || `${session.sessionType} Session`,
          mentor: session.mentor?.name || 'Mentor',
          time: formatSessionTime(session.scheduledTime),
          scheduledTime: session.scheduledTime, // Add full datetime for time-based logic
          type: session.sessionType.toLowerCase() as 'yoga' | 'meditation',
          status: session.status as 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
        })),
        upcomingSessions: upcomingSessions.map(session => ({
          id: session.id,
          title: session.title || `${session.sessionType} Session`,
          mentor: session.mentor?.name || 'Mentor',
          time: formatSessionTime(session.scheduledTime),
          type: session.sessionType.toLowerCase() as 'yoga' | 'meditation',
          status: session.status as 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
        })),
        monthlyStats: {
          currentMonth: {
            sessions: currentMonthSessions,
            practiceTime: currentMonthSessions * 45 // 45 minutes per session
          },
          previousMonth: {
            sessions: previousMonthSessions,
            practiceTime: previousMonthSessions * 45
          }
        }
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return { success: false, error: 'Failed to fetch dashboard data' };
  }
}
