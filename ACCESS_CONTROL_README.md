# Access Control System

## Overview

This application implements a comprehensive access control system that blocks access until October 20, 2025 at 3:00 PM GMT-6, with an optional beta access system using CSV-managed access codes.

## Features

### 🕒 Countdown Timer
- **Target Date**: October 20, 2025 at 3:00 PM GMT-6 (CDT)
- **Real-time Updates**: Updates every second showing days, hours, minutes, and seconds remaining
- **Server Validation**: Time is validated server-side to prevent client manipulation

### 🔐 Beta Access System
- **CSV Management**: Access codes are managed via `static/access_codes.csv`
- **Device Limits**: Each code supports up to 10 devices (configurable per code)
- **Session Timeout**: Device sessions expire after 2 hours
- **Persistent Storage**: Access is stored in localStorage and validated on each visit

### 🛡️ Security Features
- **Server-side Validation**: All time checks and access validation happen on the server
- **Device Tracking**: Unique device IDs prevent code sharing beyond device limits
- **Session Management**: Automatic cleanup of expired sessions
- **CSV Protection**: Access codes are read from server-side CSV file

## File Structure

```
src/
├── lib/
│   ├── components/
│   │   └── CountdownTimer.svelte          # Main countdown component
│   ├── stores/
│   │   └── accessControl.ts               # Access control state management
│   └── utils/
│       └── accessCodes.ts                 # CSV reader and validation logic
└── routes/
    ├── +layout.svelte                     # Main layout with access control
    └── api/
        ├── access/
        │   ├── validate/+server.ts        # Beta code validation endpoint
        │   └── status/+server.ts          # Session status check endpoint
        └── time/+server.ts                # Server time validation endpoint
static/
└── access_codes.csv                       # Beta access codes configuration
```

## Configuration

### Access Codes CSV Format

The `static/access_codes.csv` file should follow this format:

```csv
code,max_devices,description
beta2025,10,Beta access code for 2025 launch
test123,5,Test access code for development
earlybird,15,Early bird access code
vip2025,20,VIP access code for 2025
```

**Columns:**
- `code`: The access code users will enter
- `max_devices`: Maximum number of devices that can use this code
- `description`: Optional description for the code

### Default Access Codes

The system includes these default codes for testing:
- `beta2025` - 10 devices, Beta access code for 2025
- `test123` - 5 devices, Test access code

## API Endpoints

### POST `/api/access/validate`
Validates a beta access code and creates a device session.

**Request:**
```json
{
  "code": "beta2025"
}
```

**Response:**
```json
{
  "success": true,
  "deviceId": "uuid-generated-device-id",
  "expiresAt": "2025-01-15T17:00:00.000Z",
  "message": "Acceso concedido"
}
```

### POST `/api/access/status`
Checks if an existing device session is still valid.

**Request:**
```json
{
  "betaCode": "beta2025",
  "deviceId": "uuid-device-id",
  "expiresAt": "2025-01-15T17:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "isValid": true
}
```

### GET `/api/time`
Returns server time information for client validation.

**Response:**
```json
{
  "serverTime": "2025-01-15T15:00:00.000Z",
  "launchDate": "2025-10-20T21:00:00.000Z",
  "timeUntilLaunch": 1234567890,
  "launchReached": false,
  "success": true
}
```

## Usage

### For Users

1. **Without Beta Code**: Users see the countdown timer until October 20, 2025
2. **With Beta Code**: Users can click "Ingresar Código Beta" to enter an access code
3. **Access Granted**: Once validated, users can access the full application
4. **Session Persistence**: Access persists across browser sessions until expiration

### For Developers

1. **Adding Access Codes**: Edit `static/access_codes.csv` and restart the server
2. **Testing**: Use the default `test123` code for development
3. **Monitoring**: Check server logs for access code usage and validation

## Security Considerations

### Client-side Protection
- All time validation happens server-side
- Client cannot manipulate system clock to bypass restrictions
- Device IDs are generated server-side using UUID

### Server-side Validation
- Access codes are read from CSV file on server startup
- Device sessions are tracked in memory with automatic cleanup
- All API endpoints validate requests and return appropriate errors

### Data Storage
- Access information is stored in localStorage (client-side)
- No sensitive data is stored on the server
- Device sessions expire automatically after 2 hours

## Troubleshooting

### Common Issues

1. **Access Codes Not Loading**
   - Check CSV file format and location (`static/access_codes.csv`)
   - Restart the server after modifying the CSV file
   - Check server logs for CSV parsing errors

2. **Time Not Updating**
   - Verify the target date is set correctly in the code
   - Check server time vs client time discrepancies
   - Ensure the `/api/time` endpoint is accessible

3. **Beta Codes Not Working**
   - Verify the code exists in the CSV file
   - Check if the device limit has been reached
   - Ensure the session hasn't expired (2-hour timeout)

### Development Testing

To test the system before the launch date:

1. Temporarily modify the target date in `CountdownTimer.svelte`
2. Use the `test123` access code for testing
3. Check browser localStorage for stored access data
4. Monitor network requests to API endpoints

## Future Enhancements

- Database storage for access codes and device sessions
- Admin panel for managing access codes
- Analytics for access code usage
- Email notifications for access granted/expired
- Rate limiting for access code validation attempts
