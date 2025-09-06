# Automatic Session Status Management

This feature automatically updates session statuses based on time, ensuring that ongoing sessions transition to COMPLETED when their time expires.

## How It Works

### 1. Session Status Flow
```
SCHEDULED → (manual OR delayed) → ONGOING → (automatic if not delayed) → COMPLETED
```

- **SCHEDULED**: Session is booked and waiting to start
- **ONGOING**: Session is in progress (manually started OR automatically marked as delayed)
  - If manually started: Will auto-complete when time ends
  - If automatically delayed: Remains ongoing indefinitely until manually completed
- **COMPLETED**: Session has ended (automatic for on-time sessions, manual for delayed sessions)

**Automatic Transitions:**
- SCHEDULED → ONGOING (with `isDelayed: true`) when start time passes without manual start
- ONGOING → COMPLETED only for sessions that were manually started on time (not delayed)

### 2. Automatic Updates

The system automatically updates session statuses in two ways:

#### Client-Side Updates (Primary)
- Runs every 60 seconds while users are on the dashboard
- Uses the hook `useSessionStatusUpdates` in:
  - User Dashboard (for students)
  - Mentor Dashboard (for mentors)
- Calls `/api/admin/update-session-status` endpoint

#### Server-Side Cron (Secondary)
- Protected endpoint `/api/cron/complete-sessions`
- Can be triggered by external cron services
- Requires authorization header with CRON_SECRET

### 3. Status Update Logic

**Delayed Sessions (SCHEDULED → ONGOING with delay flag)**
- Session time slot start time ≤ current time
- Session status is currently SCHEDULED
- Session is marked as `isDelayed: true` and status changed to ONGOING

**Completing Sessions (ONGOING → COMPLETED)**
- Session time slot end time ≤ current time
- Session status is currently ONGOING
- Session is NOT marked as delayed (`isDelayed: false` or `null`)

**Delayed Session Behavior**
- Sessions marked as delayed remain in ONGOING status indefinitely
- They do not automatically complete when their end time passes
- Must be manually completed by mentor or user

### 4. Technical Implementation

#### Service Layer
- `src/lib/services/session-status-service.ts`
- Contains `updateSessionStatuses()` function
- Handles database queries and status updates

#### API Endpoints
- `/api/admin/update-session-status` - Public endpoint for client-side updates
- `/api/cron/complete-sessions` - Protected endpoint for server-side cron
- `/api/sessions/[sessionId]/start` - Manual session start (prevents delay flag)
- `/api/sessions/[sessionId]/complete` - Manual session completion (works for delayed sessions)

#### Client Hook
- `src/hooks/use-session-status-updates.ts`
- Runs periodic checks every 60 seconds
- Emits `session-status-updated` event for UI updates

#### Dashboard Integration
- Automatically enabled in both User and Mentor dashboards
- No user interaction required
- Updates happen silently in the background

### 5. Event Handling

When sessions are updated, a custom event is dispatched:

```javascript
window.dispatchEvent(new CustomEvent('session-status-updated', { 
  detail: { 
    started: number,
    completed: number,
    updates: SessionStatusUpdate[]
  } 
}));
```

Components can listen for this event to refresh their data:

```javascript
useEffect(() => {
  const handleSessionUpdate = (event) => {
    // Refresh session data
    loadSessions();
  };
  
  window.addEventListener('session-status-updated', handleSessionUpdate);
  return () => window.removeEventListener('session-status-updated', handleSessionUpdate);
}, []);
```

### 6. Database Schema

The system relies on:
- `SessionBooking.status` (ScheduleStatus enum)
- `SessionBooking.timeSlotId` (reference to MentorTimeSlot)
- `MentorTimeSlot.startTime` and `MentorTimeSlot.endTime`

### 7. Error Handling

- Individual session updates are wrapped in try-catch
- Failed updates don't stop other sessions from being processed
- Errors are logged but don't crash the service
- Client-side errors are logged to console

### 8. Testing

#### Manual Testing
1. Visit `/api/admin/update-session-status` in browser
2. Check console logs for update activity
3. Verify session statuses in database

#### Automatic Testing
- Updates run every 60 seconds on dashboard pages
- Monitor browser console for update logs
- Check session status changes in real-time

### 9. Performance Considerations

- Updates only run when users are active on dashboards
- Efficient database queries using time-based filters
- Minimal overhead (runs once per minute max)
- Updates are batched for efficiency

### 10. Environment Configuration

```env
# Optional: Set custom cron secret for protected endpoint
CRON_SECRET=your-secret-key
```

## Manual Session Management

While the system handles automatic transitions, there are API endpoints for manual session control:

### Starting a Session Manually
```typescript
// POST /api/sessions/{sessionId}/start
// Prevents the session from being marked as delayed
fetch(`/api/sessions/${sessionId}/start`, {
  method: 'POST'
});
```

### Completing a Delayed Session
```typescript
// POST /api/sessions/{sessionId}/complete
// Manually complete any ongoing session, including delayed ones
fetch(`/api/sessions/${sessionId}/complete`, {
  method: 'POST'
});
```

### Session Status Indicators

Sessions can be identified by their status and delay flag:
- **SCHEDULED**: Not yet started, will auto-delay if start time passes
- **ONGOING + isDelayed: false**: Manually started on time, will auto-complete
- **ONGOING + isDelayed: true**: Auto-delayed session, requires manual completion
- **COMPLETED**: Session finished (automatically or manually)

## Benefits

1. **Automatic Management**: No manual intervention required
2. **Real-time Updates**: Sessions transition at the right time
3. **User Experience**: Students and mentors see accurate session statuses
4. **Data Integrity**: Ensures session data stays synchronized
5. **Scalable**: Works with any number of concurrent sessions

## Future Enhancements

- Email notifications when sessions start/complete
- Integration with calendar systems
- Session reminder notifications
- Automated session recording links
- Analytics and reporting on session completions
