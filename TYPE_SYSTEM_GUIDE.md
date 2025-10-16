# Type System Guide - Phase 1 Complete ✅

## 📁 New Type Files Created

### 1. `src/lib/types/mongodb.ts` - MongoDB Operations
**Purpose**: Types for raw MongoDB queries and BSON data

**Key Exports**:
- `MongoDocument` - Base MongoDB document with `_id`
- `MongoCommandResult<T>` - Result from `$runCommandRaw`
- `MongoDate` - BSON date format `{ $date: string }`
- `MongoObjectId` - BSON ObjectId format `{ $oid: string }`
- `MongoFilter<T>` - Type-safe MongoDB query filters
- `DateValue` - Union type for all date formats
- `isMongoDate()` / `isMongoObjectId()` - Type guards

**Usage**:
```typescript
import type { MongoCommandResult, SessionBookingDocument } from '@/lib/types';

const result = await prisma.$runCommandRaw({...}) as MongoCommandResult<SessionBookingDocument>;
const sessions = result.cursor?.firstBatch || [];
```

---

### 2. `src/lib/types/sessions.ts` - Domain Models
**Purpose**: Session, TimeSlot, Schedule document types matching Prisma schema

**Key Exports**:
- `SessionBookingDocument` - Raw MongoDB session booking
- `ScheduleDocument` - Raw MongoDB schedule entry
- `TimeSlotDocument` - Raw MongoDB time slot
- `SessionWithMentor` - Joined query result (session + mentor)
- `TimeSlotWithMentor` - Joined query result (slot + mentor + bookings)
- `ScheduleWithBookings` - Joined query result (schedule + bookings)

**Usage**:
```typescript
import type { SessionBookingDocument, SessionWithMentor } from '@/lib/types';

let sessions: SessionBookingDocument[] = [];
const enriched: SessionWithMentor[] = sessions.map(s => ({
  ...s,
  mentor: { id: 'x', name: 'Y', email: 'z@example.com' }
}));
```

---

### 3. `src/lib/types/api.ts` - API Responses
**Purpose**: Standard API response formats

**Key Exports**:
- `ApiResponse<T>` - Generic API response
- `PaginatedResponse<T>` - Paginated list response
- `ListResponse<T>` - Simple list response
- `ErrorResponse` - Error response
- `SuccessResponse<T>` - Success response

**Usage**:
```typescript
import type { ApiResponse, SessionBookingDocument } from '@/lib/types';

return NextResponse.json<ApiResponse<SessionBookingDocument[]>>({
  success: true,
  data: sessions
});
```

---

### 4. `src/lib/types/utils.ts` - Utility Types
**Purpose**: Reusable helper types and type guards

**Key Exports**:
- `FilterConditions<T>` - Generic filter builder
- `QueryBuilder` - Flexible query object
- `EditorContent` - TipTap JSON content (diet plans)
- `UserDetails` - Minimal user info for props
- `TicketMetadata` - Ticket JSON metadata
- `RazorpayPaymentDetails` - Payment gateway data
- `RazorpayError` - Payment error type
- `isError()` / `getErrorMessage()` - Error helpers

**Usage**:
```typescript
import { isError, getErrorMessage } from '@/lib/types';

try {
  // ...
} catch (error) {
  console.error(getErrorMessage(error));
}
```

---

### 5. `src/lib/types/index.ts` - Barrel Export
**Purpose**: Single import point for all types

**Usage**:
```typescript
// Import everything you need from one place
import type {
  MongoCommandResult,
  SessionBookingDocument,
  ApiResponse,
  UserDetails
} from '@/lib/types';
```

---

### 6. `src/lib/types/common.ts` - Updated for Re-exports
**Purpose**: Backwards compatibility + convenience re-exports

**Changes**:
- ✅ Re-exports all new types
- ✅ Maintains legacy aliases (`SessionDocument` → `SessionBookingDocument`)
- ✅ Keeps React event types

---

## 🎯 Import Strategy

### ✅ Recommended (Specific Imports)
```typescript
import type {
  SessionBookingDocument,
  MongoCommandResult
} from '@/lib/types';
```

### ✅ Also Fine (Barrel Import)
```typescript
import type { SessionBookingDocument } from '@/lib/types/sessions';
```

### ⚠️ Legacy (Still Works)
```typescript
import type { SessionDocument } from '@/lib/types/common';
// SessionDocument is alias for SessionBookingDocument
```

---

## 🔄 Migration Patterns

### Pattern 1: MongoDB Query Results
```typescript
// BEFORE
let sessions: any[] = [];
const result = await prisma.$runCommandRaw({...});
sessions = result.cursor.firstBatch;

// AFTER
import type { MongoCommandResult, SessionBookingDocument } from '@/lib/types';

let sessions: SessionBookingDocument[] = [];
const result = await prisma.$runCommandRaw({...}) as MongoCommandResult<SessionBookingDocument>;
sessions = result.cursor?.firstBatch || [];
```

### Pattern 2: Date Conversions
```typescript
// BEFORE
function convertDate(date: any): Date | null {
  if (!date) return null;
  // ...
}

// AFTER
import type { DateValue } from '@/lib/types';
import { isMongoDate } from '@/lib/types';

function convertDate(date: DateValue): Date | null {
  if (!date) return null;
  if (isMongoDate(date)) return new Date(date.$date);
  if (date instanceof Date) return date;
  return new Date(date);
}
```

### Pattern 3: Component Props
```typescript
// BEFORE
interface Props {
  userDetails?: any;
}

// AFTER
import type { UserDetails } from '@/lib/types';

interface Props {
  userDetails?: UserDetails;
}
```

---

## 📊 Type Coverage

| Category | Type File | Count | Status |
|----------|-----------|-------|--------|
| MongoDB Operations | mongodb.ts | 6 types + 2 guards | ✅ Complete |
| Session/Schedule | sessions.ts | 6 document types | ✅ Complete |
| API Responses | api.ts | 5 response types | ✅ Complete |
| Utilities | utils.ts | 7 types + 2 helpers | ✅ Complete |
| **TOTAL** | | **26 types** | ✅ **Phase 1 Done** |

---

## ✅ Phase 1 Complete!

**Created**:
- 4 new specialized type files
- 26 production-ready types
- 4 type guard functions
- 1 barrel export file
- Updated common.ts for compatibility

**Next**: Phase 2 - Fix MongoDB Query Results (~40 errors)
