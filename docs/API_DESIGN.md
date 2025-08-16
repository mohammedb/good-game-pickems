# Good Game Pickems Public API Design

## Overview

The Good Game Pickems API provides programmatic access to predictions, leaderboards, and match data for third-party integrations like Discord bots, Twitch overlays, and mobile apps.

## Authentication

### API Key Authentication
- Each developer registers for an API key through their profile
- API keys are passed via `X-API-Key` header
- Keys are scoped to specific permissions (read, write, admin)

### Rate Limiting
- 100 requests per minute for free tier
- 1000 requests per minute for premium tier
- Rate limit headers included in responses

## API Endpoints

### Base URL
```
https://goodgamepickems.com/api/v1
```

### Core Endpoints

#### Matches
```
GET /matches
GET /matches/:id
GET /matches/upcoming
GET /matches/live
```

#### Predictions
```
GET /predictions/user/:userId
GET /predictions/match/:matchId
GET /predictions/shared/:shareId
POST /predictions
```

#### Leaderboards
```
GET /leaderboard
GET /leaderboard/:gameType
GET /leaderboard/user/:userId/position
```

#### Users
```
GET /users/:userId
GET /users/:userId/stats
GET /users/:userId/achievements
GET /users/search?q=username
```

#### Social
```
GET /shared/:shareId
GET /shared/trending
GET /shared/user/:userId
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2025-01-05T12:00:00Z",
    "version": "1.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {}
  }
}
```

## Webhooks

### Event Types
- `match.started`
- `match.completed`
- `prediction.created`
- `leaderboard.updated`

### Webhook Payload
```json
{
  "event": "match.completed",
  "data": {},
  "timestamp": "2025-01-05T12:00:00Z"
}
```

## Use Cases

### Discord Bot
- `/predict` - Make predictions
- `/leaderboard` - Show top players
- `/stats @user` - Show user statistics

### Twitch Overlay
- Live match predictions
- Viewer prediction stats
- Real-time leaderboard updates

### Mobile App
- Full prediction functionality
- Push notifications
- Offline prediction caching

## Security Considerations

- API keys are hashed and salted
- HTTPS required for all requests
- CORS configured for specific domains
- Request signing for sensitive operations
- IP allowlisting for premium accounts

## SDK Support

- TypeScript/JavaScript SDK
- Python SDK
- Go SDK
- Community SDKs encouraged