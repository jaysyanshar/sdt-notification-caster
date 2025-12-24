# sdt-notification-caster
A demo notification caster project built in TypeScript with a layered architecture.

## Features
- TypeScript-based Express.js server
- Layered architecture (controller, service, repository pattern)
- Environment configuration management
- Structured error handling
- Logging system
- Graceful shutdown
- REST API endpoint: `/api/placeholder/hello-world`

## Project Structure

```
src/
  app.ts                # Express app setup (middlewares, routes)
  server.ts             # Server entry point with graceful shutdown
  config/
    env.ts              # Environment variable parsing and validation
    index.ts
  shared/
    logger/
      index.ts          # Logging utility
    errors/
      AppError.ts       # Custom error classes
      errorHandler.ts   # Express error middleware
    middleware/         # Shared middleware (auth, validation, etc.)
    utils/              # Utility functions
    types/              # Shared TypeScript types
  modules/
    placeholder/
      placeholder.routes.ts      # Route definitions
      placeholder.controller.ts  # Request handlers
      placeholder.service.ts     # Business logic
```

## Prerequisites
- Node.js (v14 or higher)
- npm

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory (optional):

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

## Build

```bash
npm run build
```

## Run

### Development mode (with ts-node)
```bash
npm run dev
```

### Production mode
```bash
npm run build
npm start
```

## API Endpoints

### GET /api/placeholder/hello-world
Returns a "Hello World" message with HTTP 200 status.

**Response:**
```
Hello World
```

## Error Handling

The application includes centralized error handling:
- Custom error classes (AppError, NotFoundError, BadRequestError, etc.)
- Structured error responses
- 404 handler for undefined routes
- Global error handler for unexpected errors

