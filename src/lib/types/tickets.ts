// Ticket System Types
export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_USER = 'WAITING_FOR_USER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TicketCategory {
  SUBSCRIPTION_ISSUE = 'SUBSCRIPTION_ISSUE',
  PAYMENT_PROBLEM = 'PAYMENT_PROBLEM',
  MENTOR_APPLICATION = 'MENTOR_APPLICATION',
  TECHNICAL_SUPPORT = 'TECHNICAL_SUPPORT',
  ACCOUNT_ISSUE = 'ACCOUNT_ISSUE',
  REFUND_REQUEST = 'REFUND_REQUEST',
  GENERAL_INQUIRY = 'GENERAL_INQUIRY',
  BUG_REPORT = 'BUG_REPORT',
  FEATURE_REQUEST = 'FEATURE_REQUEST'
}

export interface TicketUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export interface TicketMessage {
  id: string;
  content: string;
  isInternal: boolean;
  authorId: string;
  author: TicketUser;
  ticketId: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  userId: string;
  user: TicketUser;
  assignedToId: string | null;
  assignedTo: TicketUser | null;
  tags: string[];
  metadata: any;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  messages: TicketMessage[];
  _count: {
    messages: number;
  };
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  metadata?: any;
}

export interface TicketListResponse {
  tickets: Ticket[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned?: 'true' | 'false';
  page?: number;
  limit?: number;
}
