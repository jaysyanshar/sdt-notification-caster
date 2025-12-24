# sdt-notification-caster
A demo notification caster project built in TypeScript.

## Features
- TypeScript-based Express.js server
- REST API endpoint: `/api/placeholder/hello-world`

## Prerequisites
- Node.js (v14 or higher)
- npm

## Installation

```bash
npm install
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
