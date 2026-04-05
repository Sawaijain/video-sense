# VideoSense

A full-stack video content moderation platform that uploads videos, analyzes them frame-by-frame for sensitive content, and provides streaming playback with real-time processing updates.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Role-Based Access Control](#role-based-access-control)
- [Socket.io Events](#socketio-events)
- [Testing](#testing)
- [Assumptions and Design Decisions](#assumptions-and-design-decisions)

---

## Features

- **Video Upload** -- Drag-and-drop interface with real-time upload progress tracking via React Dropzone and Multer.
- **Frame-by-Frame Sensitivity Analysis** -- Uploaded videos are decomposed into frames using FFmpeg and each frame is evaluated by a mock classifier (~15% flagged rate).
- **Real-Time Processing Updates** -- Socket.io pushes frame analysis progress to the client as processing occurs.
- **HTTP Range-Request Streaming** -- Videos are served using partial content responses, enabling seek and progressive playback.
- **JWT Authentication** -- Stateless token-based authentication for all protected routes.
- **Role-Based Access Control (RBAC)** -- Three roles (viewer, editor, admin) with granular permission enforcement.
- **Multi-Tenant Isolation** -- Users see only their own videos; admins have visibility across all users.
- **Advanced Filtering** -- Filter videos by processing status, sensitivity label, date range, and file size.
- **Pagination and Sorting** -- Server-side pagination with configurable sort fields and order.
- **Admin User Management** -- Admins can assign roles and activate or deactivate user accounts.

---

## Tech Stack

| Layer    | Technology                                                         |
| -------- | ------------------------------------------------------------------ |
| Backend  | Node.js, Express 5, MongoDB (Mongoose 9), Socket.io, JWT, Multer, FFmpeg |
| Frontend | React 19, Vite 8, Tailwind CSS 4, Axios, Socket.io-client, React Dropzone |
| Testing  | Jest, Supertest                                                    |

---

## Prerequisites

Ensure the following are installed on your system before proceeding:

- **Node.js** (v18 or later recommended)
- **npm** or **yarn**
- **MongoDB** (local instance or a hosted service such as MongoDB Atlas)
- **FFmpeg** (must be available on the system PATH)

To verify FFmpeg is installed:

```bash
ffmpeg -version
```

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/video-sense.git
cd video-sense
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (see [Environment Variables](#environment-variables) below):

```bash
cp .env.example .env   # if an example file exists, otherwise create manually
```

Start the backend server:

```bash
npm run dev     # development with hot reload
# or
npm start       # production
```

The backend will start on the port defined in your `.env` (default: 5000).

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```bash
cp .env.example .env   # if an example file exists, otherwise create manually
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will start on the port assigned by Vite (default: 5173). Open `http://localhost:5173` in your browser.

### 4. Verify the Setup

1. Register a new account through the frontend.
2. Log in and navigate to the Upload page.
3. Upload a video file -- you should see real-time processing updates as frames are analyzed.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Description                              | Example                          |
| -------------- | ---------------------------------------- | -------------------------------- |
| `PORT`         | Port the Express server listens on       | `5000`                           |
| `NODE_ENV`     | Environment mode                         | `development` or `production`    |
| `MONGODB_URI`  | MongoDB connection string                | `mongodb://localhost:27017/videosense` |
| `JWT_SECRET`   | Secret key used to sign JWT tokens       | `your-secret-key`                |
| `JWT_EXPIRES_IN` | Token expiration duration              | `7d`                             |
| `UPLOAD_DIR`   | Directory for storing uploaded videos    | `uploads`                        |
| `MAX_FILE_SIZE` | Maximum upload file size in bytes       | `104857600` (100 MB)             |
| `CORS_ORIGIN`  | Allowed CORS origin for the frontend     | `http://localhost:5173`          |

### Frontend (`frontend/.env`)

| Variable          | Description                          | Example                    |
| ----------------- | ------------------------------------ | -------------------------- |
| `VITE_API_URL`    | Base URL of the backend API          | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Base URL for the Socket.io server    | `http://localhost:5000`    |

---

## API Documentation

All endpoints under `/api/videos` and `/api/users` require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Authentication

| Method | Path                 | Auth     | Request Body                                          | Response                              |
| ------ | -------------------- | -------- | ----------------------------------------------------- | ------------------------------------- |
| POST   | `/api/auth/register` | Public   | `{ "name", "email", "password" }`                     | `{ "token", "user" }`                |
| POST   | `/api/auth/login`    | Public   | `{ "email", "password" }`                             | `{ "token", "user" }`                |
| GET    | `/api/auth/me`       | Required | --                                                    | `{ "user" }`                          |

### Videos

| Method | Path                          | Auth     | Role           | Description                                      |
| ------ | ----------------------------- | -------- | -------------- | ------------------------------------------------ |
| GET    | `/api/videos`                 | Required | Any            | List videos with filters, pagination, and sorting |
| GET    | `/api/videos/:id`             | Required | Any            | Get full details for a single video               |
| GET    | `/api/videos/:id/stream`     | Required | Any            | Stream video with HTTP range requests             |
| POST   | `/api/videos`                 | Required | Editor, Admin  | Upload a new video (multipart form-data)          |
| PATCH  | `/api/videos/:id`             | Required | Editor, Admin  | Update video metadata (title, description)        |
| DELETE | `/api/videos/:id`             | Required | Editor, Admin  | Delete a video and its associated files           |
| POST   | `/api/videos/:id/reprocess`  | Required | Editor, Admin  | Re-run frame analysis on an existing video        |

**Query Parameters for `GET /api/videos`:**

| Parameter    | Type   | Description                                |
| ------------ | ------ | ------------------------------------------ |
| `status`     | String | Filter by processing status                |
| `sensitivity`| String | Filter by sensitivity label                |
| `startDate`  | String | Filter videos uploaded after this date     |
| `endDate`    | String | Filter videos uploaded before this date    |
| `minSize`    | Number | Minimum file size in bytes                 |
| `maxSize`    | Number | Maximum file size in bytes                 |
| `page`       | Number | Page number (default: 1)                   |
| `limit`      | Number | Results per page (default: 10)             |
| `sortBy`     | String | Field to sort by (e.g., `createdAt`)       |
| `order`      | String | Sort direction: `asc` or `desc`            |

### Users (Admin Only)

| Method | Path                        | Auth     | Role  | Description                          |
| ------ | --------------------------- | -------- | ----- | ------------------------------------ |
| GET    | `/api/users`                | Required | Admin | List all registered users            |
| PATCH  | `/api/users/:id/role`       | Required | Admin | Update a user's role                 |
| PATCH  | `/api/users/:id/active`     | Required | Admin | Activate or deactivate a user        |

**Request body for `PATCH /api/users/:id/role`:**

```json
{ "role": "viewer" | "editor" | "admin" }
```

**Request body for `PATCH /api/users/:id/active`:**

```json
{ "isActive": true | false }
```

---

## Project Structure

```
video-sense/
├── backend/
│   ├── src/
│   │   ├── config/           # env.js (env var loader), db.js (MongoDB connection), socket.js (Socket.io init)
│   │   ├── controllers/      # auth, video, user controllers -- request handling logic
│   │   ├── middleware/        # auth (JWT verify), rbac (role check), tenancy (ownership filter),
│   │   │                     #   upload (Multer config), errorHandler (global error middleware)
│   │   ├── models/           # Mongoose schemas: User, Video, Organization
│   │   ├── routes/           # Express route definitions: auth, video, user
│   │   ├── services/         # Business logic: auth, video CRUD, frame processing pipeline
│   │   ├── socket/           # processingEvents -- Socket.io event handlers for progress updates
│   │   ├── utils/            # ApiError (custom error class), ffmpeg (frame extraction), mockClassifier
│   │   ├── app.js            # Express app setup (middleware, routes, error handling)
│   │   └── server.js         # Server entry point (HTTP + Socket.io bootstrap)
│   ├── uploads/              # Stored video files (created at runtime)
│   └── tests/                # Jest + Supertest integration and unit tests
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios instance with base URL and interceptors
│   │   ├── components/       # Reusable UI components (VideoCard, Navbar, DropZone, etc.)
│   │   ├── context/          # React contexts: AuthContext (JWT + user state), SocketContext
│   │   ├── hooks/            # Custom hooks: useAuth, useSocket, useVideos, useUpload
│   │   └── pages/            # Page components: Login, Register, Dashboard, Upload, VideoDetail, AdminUsers
│   └── public/               # Static assets
└── README.md
```

---

## Architecture Overview

### Video Processing Pipeline

```
[Client]                    [Server]                         [Processing]
   |                           |                                  |
   |  POST /api/videos         |                                  |
   |  (multipart upload) ----> |                                  |
   |                           |  1. Save file to disk (Multer)   |
   |                           |  2. Create Video document        |
   |                           |     (status: "uploaded")         |
   |                           |                                  |
   |                           |  3. Kick off async processing ---|
   |                           |                                  |
   |                           |     4. Extract frames (FFmpeg)   |
   |                           |        status -> "processing"    |
   |                           |                                  |
   |  <-- Socket.io event --   |     5. For each frame:           |
   |  (frame progress)         |        - Run mock classifier     |
   |                           |        - Emit progress via       |
   |                           |          Socket.io               |
   |                           |                                  |
   |  <-- Socket.io event --   |     6. Aggregate results         |
   |  (processing complete)    |        status -> "completed"     |
   |                           |        Assign sensitivity label  |
```

1. **Upload** -- The client sends a video file via multipart form-data. Multer saves it to the configured upload directory.
2. **Document Creation** -- A Video document is created in MongoDB with status `uploaded` and metadata (size, MIME type, duration).
3. **Frame Extraction** -- FFmpeg extracts frames from the video at a defined interval.
4. **Frame Classification** -- Each frame is passed through a mock classifier that flags approximately 15% of frames as sensitive. In a production environment this would be replaced with an actual ML model or third-party moderation API.
5. **Progress Broadcasting** -- As each frame is classified, a Socket.io event is emitted so the client can display a live progress indicator.
6. **Completion** -- Once all frames are processed, the video status is set to `completed` and an overall sensitivity label is assigned based on the proportion of flagged frames.

### Streaming

Video playback uses HTTP range requests (`Range` header). The server responds with `206 Partial Content` and the requested byte range, enabling browsers to seek and progressively load the video without downloading the entire file.

---

## Role-Based Access Control

VideoSense implements three roles with hierarchical permissions:

| Capability                     | Viewer | Editor | Admin |
| ------------------------------ | :----: | :----: | :---: |
| View dashboard and video list  |   Yes  |   Yes  |  Yes  |
| Stream and view video details  |   Yes  |   Yes  |  Yes  |
| Upload videos                  |   No   |   Yes  |  Yes  |
| Edit own video metadata        |   No   |   Yes  |  Yes  |
| Delete own videos              |   No   |   Yes  |  Yes  |
| Reprocess own videos           |   No   |   Yes  |  Yes  |
| View all users' videos         |   No   |   No   |  Yes  |
| Manage all videos              |   No   |   No   |  Yes  |
| List users                     |   No   |   No   |  Yes  |
| Change user roles              |   No   |   No   |  Yes  |
| Activate/deactivate users      |   No   |   No   |  Yes  |

### Multi-Tenant Isolation

- **Viewers and Editors** see only videos they uploaded. Tenancy middleware automatically scopes database queries to the authenticated user's ID.
- **Admins** bypass tenant filtering and can view and manage videos across all users.

---

## Socket.io Events

The server emits real-time events during video processing. Clients join a room scoped to their user ID upon connection.

### Server-to-Client Events

| Event                  | Payload                                                        | Description                                      |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------------ |
| `processing:start`     | `{ videoId, totalFrames }`                                     | Emitted when frame extraction begins             |
| `processing:progress`  | `{ videoId, currentFrame, totalFrames, percentComplete, frameSensitivity }` | Emitted after each frame is classified           |
| `processing:complete`  | `{ videoId, status, sensitivityLabel, summary }`               | Emitted when all frames have been analyzed       |
| `processing:error`     | `{ videoId, error }`                                           | Emitted if processing fails                      |

### Client Usage

```javascript
import { useSocket } from './hooks/useSocket';

const socket = useSocket();

socket.on('processing:progress', (data) => {
  console.log(`Video ${data.videoId}: ${data.percentComplete}% complete`);
});
```

---

## Testing

Tests are located in `backend/tests/` and use **Jest** with **Supertest** for HTTP assertions.

### Running Tests

```bash
cd backend
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

Tests cover:

- **Authentication** -- Registration, login, token validation, and protected route access.
- **Video CRUD** -- Upload, listing with filters and pagination, metadata updates, and deletion.
- **RBAC Enforcement** -- Verifying that viewers cannot upload, editors cannot manage users, and admins have full access.
- **Tenancy Isolation** -- Ensuring users cannot access videos belonging to other users.
- **Streaming** -- Range request handling and partial content responses.

---

## Assumptions and Design Decisions

1. **Mock Classifier** -- The frame sensitivity classifier is intentionally a mock implementation that flags roughly 15% of frames at random. This simulates a real ML model and allows the full pipeline to be demonstrated without requiring a trained model or external API. Replacing it with a real classifier requires only swapping out the `mockClassifier` utility.

2. **Local File Storage** -- Videos are stored on the local filesystem under the `uploads/` directory. In a production deployment this would be replaced with an object storage service (e.g., AWS S3, Google Cloud Storage) with the upload and streaming logic abstracted behind a storage interface.

3. **FFmpeg for Frame Extraction** -- FFmpeg was chosen for its ubiquity and reliability. It extracts frames at a configurable interval, producing temporary image files that are classified and then cleaned up.

4. **Express 5** -- The project uses Express 5 for its native async error handling support, eliminating the need for manual try-catch wrappers in async route handlers.

5. **Mongoose 9** -- Used for schema validation, middleware hooks, and query building. The Video model stores frame analysis results as an embedded array rather than a separate collection to avoid cross-document joins during read operations.

6. **JWT with No Refresh Token** -- For simplicity, the authentication flow uses a single JWT with a configurable expiration. A production system would benefit from a refresh token rotation strategy.

7. **Socket.io Room Strategy** -- Each authenticated user joins a room identified by their user ID. Processing events are emitted to the room of the user who owns the video, ensuring users receive updates only for their own uploads. Admins can optionally subscribe to all rooms.

8. **RBAC Middleware** -- Role checks are implemented as Express middleware (`rbac`) that accepts an array of allowed roles. This keeps authorization logic declarative and co-located with route definitions.

9. **Multi-Tenant Middleware** -- Rather than scattering ownership checks across controllers, a dedicated tenancy middleware injects a user scope into the query before it reaches the service layer. Admins are exempt from this filter.

10. **Sensitivity Labeling** -- After all frames are processed, the video receives an overall sensitivity label based on the proportion of flagged frames. The threshold logic is encapsulated in the processing service and can be tuned independently.

11. **No Transcoding** -- Videos are stored and streamed in their original format. Adding transcoding (e.g., to HLS or DASH) would improve playback compatibility but was considered out of scope for the initial implementation.

12. **Single-Server Deployment** -- The current architecture assumes a single server instance. Scaling horizontally would require a shared file storage backend and a Socket.io adapter (e.g., Redis adapter) for cross-instance event broadcasting.

---

## License

This project is provided as-is for educational and demonstration purposes.
