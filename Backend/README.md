# Blog Application — Fraction 1: Backend

> Week 4 · Backend — MongoDB schemas, CRUD REST API, Multer + Cloudinary

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (via Mongoose) |
| File Upload | Multer + Cloudinary |
| Password Hashing | bcrypt |
| Config | dotenv |

---

## Project Structure

```
├── API.js                # Express app + all route handlers
├── cloudinaryConfig.js   # Multer-Cloudinary storage setup
├── db_schema.js          # Mongoose models (User, Post, Comment)
```

---

## Environment Variables

Create a `.env` file in the root with the following keys:

```env
ConnectionString=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>
PORT=5000

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Database Schemas (`db_schema.js`)

### User
| Field | Type | Notes |
|---|---|---|
| `username` | String | Display name |
| `email` | String | Used for login |
| `password` | String | Stored as bcrypt hash |
| `avatar` | String | Cloudinary URL |
| `role` | String | `"user"` or `"admin"` |
| `timestamps` | Auto | `createdAt`, `updatedAt` |

### Post
| Field | Type | Notes |
|---|---|---|
| `title` | String | |
| `content` | String | |
| `slug` | String | Unique, auto-generated from title |
| `author` | ObjectId | Ref → `User` |
| `tags` | [String] | Optional array |
| `status` | String | `"draft"` (default) or `"published"` |
| `timestamps` | Auto | `createdAt`, `updatedAt` |

### Comment
| Field | Type | Notes |
|---|---|---|
| `post` | ObjectId | Ref → `Post` |
| `author` | ObjectId | Ref → `User` |
| `content` | String | |
| `timestamps` | Auto | `createdAt`, `updatedAt` |

---

## File Upload (`cloudinaryConfig.js`)

Multer is configured with `multer-storage-cloudinary` as its storage engine. Uploaded files go directly to Cloudinary — Multer never writes them to disk locally.

- **Cloudinary folder:** `blog_app_avatars`
- **Allowed formats:** `jpg`, `png`, `jpeg`
- After upload, `req.file.path` holds the secure Cloudinary URL, which is saved to the `avatar` field on the User document.

---

## API Reference (`API.js`)

### Auth

#### `POST /api/register`
Register a new user.

**Body:**
```json
{ "username": "john", "email": "john@example.com", "password": "secret" }
```

**What happens:** Checks for duplicate email → hashes password with bcrypt (salt rounds: 10) → saves user with role `"user"`.

**Response `201`:**
```json
{ "message": "User registered successfully", "user": { "id", "username", "email", "role" } }
```

---

#### `POST /api/login`
Authenticate an existing user.

**Body:**
```json
{ "email": "john@example.com", "password": "secret" }
```

**What happens:** Looks up user by email → compares password with `bcrypt.compare` → returns user info on match.

> ⚠️ No JWT is issued yet — session/token auth is planned for a later fraction.

---

### Users

#### `PUT /api/users/:id`
Update a user's profile. Accepts `multipart/form-data` for avatar upload.

**Form fields (all optional):**
- `username` — new display name
- `email` — new email
- `avatar` — image file (jpg/png/jpeg)

**What happens:** Builds an update object from whichever fields are provided → if a file was uploaded, sets `avatar` to the Cloudinary URL → runs `findByIdAndUpdate` with validators.

**Error `400`:** Duplicate username or email (`error.code === 11000`)

---

### Posts

#### `GET /api/posts`
Fetch all posts, sorted newest first. Populates `author` with `username` and `avatar`.

---

#### `POST /api/posts`
Create a new blog post.

**Body:**
```json
{
  "title": "My First Post",
  "content": "Hello world",
  "author": "<userId>",
  "tags": ["intro", "general"],
  "status": "published"
}
```

**What happens:** Validates required fields → auto-generates a URL-safe `slug` from the title (lowercase, spaces → hyphens, special chars stripped) → saves with status defaulting to `"draft"`.

---

#### `GET /api/posts/:slug`
Fetch a single post by its slug. Populates `author`.

---

#### `PUT /api/posts/:id`
Update a post by MongoDB `_id`. All fields optional.

**Body (any subset):**
```json
{ "title": "Updated Title", "content": "...", "tags": [], "status": "published" }
```

**What happens:** If `title` is updated, the `slug` is regenerated automatically.

---

#### `DELETE /api/posts/:id`
Delete a post by its MongoDB `_id`.

---

### Comments

#### `POST /api/comments`
Add a comment to a post.

**Body:**
```json
{ "post": "<postId>", "author": "<userId>", "content": "Great post!" }
```

---

#### `GET /api/posts/:id/comments`
Fetch all comments for a post (by post `_id`). Populates `author` with `username` and `avatar`.

---

#### `DELETE /api/comments/:id`
Delete a comment by its `_id`.

---

## How to Run

```bash
# Install dependencies
npm install

# Start the server
node API.js
```

Server starts on `http://localhost:5000` (or the `PORT` in `.env`) after MongoDB connects successfully.

---

## Roadmap

| Fraction | Week | Focus |
|---|---|---|
| ✅ Fraction 1 | Week 4 | Backend — schemas, REST API, file uploads |
| 🔲 Fraction 2 | Week 5 | Frontend — post list/detail, React Quill editor, pagination |
| 🔲 Fraction 3 | Week 6 | Features — comments UI, RBAC (admin/user), deploy + E2E tests |

---

## Known Gaps / TODOs

- **No authentication middleware** — all endpoints are currently unprotected. JWT or session auth should be added before connecting the frontend.
- **No input sanitisation** — schema fields use plain `String` without `trim`, `maxlength`, or XSS protection.
- **Comment sort bug** — `GET /api/posts/:id/comments` sorts by `timestamps` (wrong key); should be `createdAt`.
- **RBAC not yet implemented** — `role` field exists on User but is not enforced on any route.