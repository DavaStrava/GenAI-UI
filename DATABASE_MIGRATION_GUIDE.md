# Database Migration Guide

This guide walks you through migrating from localStorage to a Prisma + SQLite database.

## 📦 Quick Facts

**Installation:**
- ✅ **No system installation** - Everything stays in your project folder
- ✅ **SQLite is built into Node.js** - No separate database server needed
- ✅ **Just npm packages** - Installed like any other dependency

**Storage:**
- **Prisma packages:** ~50-100 MB in `node_modules/` (shared with other packages)
- **Database file:** Starts at ~10 KB, grows with your data
- **Location:** `prisma/dev.db` (in your project folder)

**What You Get:**
- Single `.db` file in your project
- No background processes or services
- Works offline, no configuration needed
- Easy to backup (just copy the file)
- Easy to remove (delete the file and uninstall packages)

**See `PRISMA_SQLITE_FAQ.md` for more details.**

## Prerequisites

- Node.js installed
- npm or yarn package manager
- Basic understanding of Prisma

## Step-by-Step Migration

### Step 1: Install Dependencies

```bash
npm install prisma @prisma/client
npm install -D prisma
```

### Step 2: Initialize Prisma

```bash
npx prisma init --datasource-provider sqlite
```

This creates:
- `prisma/schema.prisma` - Database schema
- `.env` - Environment variables (add DATABASE_URL)

### Step 3: Design Database Schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String?  @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  projects  Project[]
  chats     Chat[]
}

model Project {
  id        String   @id @default(cuid())
  name      String
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  chats     Chat[]
  knowledgeBases KnowledgeBase[]
}

model Chat {
  id           String   @id @default(cuid())
  name         String
  projectId    String?
  project      Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId       String?
  user         User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  llmProvider  String
  llmModel     String
  temperature  Float?   @default(0.7)
  maxTokens    Int?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  messages     Message[]
}

model Message {
  id        String   @id @default(cuid())
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  role      String   // "user" | "assistant" | "system"
  content   String
  timestamp DateTime @default(now())
}

model KnowledgeBase {
  id        String   @id @default(cuid())
  name      String
  projectId String?
  project   Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  documents Document[]
}

model Document {
  id             String        @id @default(cuid())
  name           String
  filePath       String
  fileType       String
  knowledgeBaseId String
  knowledgeBase  KnowledgeBase @relation(fields: [knowledgeBaseId], references: [id], onDelete: Cascade)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

model Workflow {
  id        String        @id @default(cuid())
  name      String
  steps     WorkflowStep[]
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}

model WorkflowStep {
  id         String   @id @default(cuid())
  workflowId String
  workflow   Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  order      Int
  type       String   // "llm" | "condition" | "transform"
  config     String   // JSON config
  createdAt  DateTime @default(now())
}

model LLMConfiguration {
  id          String   @id @default(cuid())
  provider    String
  model       String
  apiKey      String   // Encrypted
  temperature Float?   @default(0.7)
  maxTokens   Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Step 4: Update .env

```env
DATABASE_URL="file:./dev.db"
```

### Step 5: Create Migration

```bash
npx prisma migrate dev --name init
```

### Step 6: Generate Prisma Client

```bash
npx prisma generate
```

### Step 7: Create Database Service Layer

Create `lib/db/client.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Step 8: Create Service Files

#### `lib/db/projects.ts`

```typescript
import { prisma } from './client'
import type { Project } from '@prisma/client'

export async function getProjects(): Promise<Project[]> {
  return prisma.project.findMany({
    orderBy: { updatedAt: 'desc' }
  })
}

export async function createProject(name: string): Promise<Project> {
  return prisma.project.create({
    data: { name }
  })
}

export async function updateProject(id: string, name: string): Promise<Project> {
  return prisma.project.update({
    where: { id },
    data: { name }
  })
}

export async function deleteProject(id: string): Promise<void> {
  await prisma.project.delete({
    where: { id }
  })
}
```

#### `lib/db/chats.ts`

```typescript
import { prisma } from './client'
import type { Chat, Message } from '@prisma/client'

export async function getChats(projectId: string | null) {
  return prisma.chat.findMany({
    where: projectId ? { projectId } : { projectId: null },
    include: { messages: true },
    orderBy: { updatedAt: 'desc' }
  })
}

export async function createChat(data: {
  name: string
  projectId?: string | null
  llmProvider: string
  llmModel: string
  temperature?: number
  maxTokens?: number
}) {
  return prisma.chat.create({
    data: {
      ...data,
      projectId: data.projectId || null
    }
  })
}

export async function updateChat(id: string, data: Partial<Chat>) {
  return prisma.chat.update({
    where: { id },
    data
  })
}

export async function addMessage(chatId: string, role: string, content: string) {
  return prisma.message.create({
    data: {
      chatId,
      role,
      content
    }
  })
}
```

### Step 9: Create Migration Script

Create `scripts/migrate-from-localstorage.ts`:

```typescript
import { prisma } from '../lib/db/client'

async function migrate() {
  // Read from localStorage (run in browser context or use a different approach)
  // Then insert into database
  
  console.log('Migration complete!')
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

### Step 10: Update Existing Code

1. Update `lib/storage/projects.ts` to use database instead of localStorage
2. Update `lib/storage/chats.ts` to use database instead of localStorage
3. Update `lib/storage/settings.ts` to use database instead of localStorage
4. Update API routes to use database services

### Step 11: Test Migration

1. Export localStorage data first
2. Run migration script
3. Verify all data migrated correctly
4. Test all features work with database

## Migration Checklist

- [ ] Install Prisma dependencies
- [ ] Initialize Prisma
- [ ] Design and create schema
- [ ] Run migration
- [ ] Generate Prisma Client
- [ ] Create database client
- [ ] Create service layer (projects, chats, messages, settings)
- [ ] Create migration script
- [ ] Update storage services
- [ ] Update API routes
- [ ] Test migration
- [ ] Verify all features work
- [ ] Remove localStorage code (optional, keep as fallback)

## Troubleshooting

### Common Issues

1. **"Prisma Client not generated"**
   - Run `npx prisma generate`

2. **"Database locked"**
   - Close any processes using the database
   - Check for concurrent access

3. **"Migration failed"**
   - Check schema syntax
   - Verify DATABASE_URL in .env

4. **"Data not migrating"**
   - Check migration script logic
   - Verify localStorage data structure

## Next Steps

After migration:
1. Add database indexes for performance
2. Add data validation
3. Add error handling
4. Consider adding database backups
5. Plan for PostgreSQL migration (if needed)

## Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma with Next.js](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

