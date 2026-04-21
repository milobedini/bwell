# Admin Overhaul — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the backend for a first-class admin role: clinical IAPT outcome metrics, expanded operational stats, programme health, audit trail, and admin-only endpoints.

**Architecture:** Split operational (live Mongo aggregations) from analytical (nightly pre-computed rollup collection). Apply k-anonymity suppression at read time with env-driven thresholds and a production boot-guard. Every admin write emits a curated semantic audit event. New `/api/admin/*` router sits behind existing `authenticateUser + authorizeAdmin` middleware.

**Tech Stack:** Node 24, Express 5, TypeScript strict, Mongoose 8, Luxon (Europe/London bucketing), `node-cron` (new), Jest + ts-jest (new), `mongodb-memory-server` (new), supertest (new).

**Source spec:** `docs/superpowers/specs/2026-04-20-admin-overhaul-design.md` (in this repo). All architectural decisions and invariants come from there — re-read it if anything in this plan seems underspecified.

**Working directory:** Backend work happens in `/Users/milobedini/Documents/git/cbt`. All paths below are relative to that root unless explicitly stated otherwise.

**Branch policy:** BE commits go direct to `main` per project convention. Plan lives in the FE repo for traceability.

---

## File / module map

**New files (BE)**

- `src/models/metricsRollupModel.ts` — IAPT rollup collection
- `src/models/adminAuditEventModel.ts` — audit event collection
- `src/models/jobRunModel.ts` — observability log for scheduled jobs
- `src/utils/audit.ts` — `logAdminAction()` helper
- `src/utils/suppression.ts` — k-anonymity / min-n suppression wrapper
- `src/utils/thresholds.ts` — env-driven threshold config + production boot-guard
- `src/utils/careTier.ts` — care-tier derivation helper
- `src/utils/iaptPairing.ts` — pure IAPT baseline/endpoint/metric computation
- `src/utils/londonBuckets.ts` — Luxon-based week/month bucket boundaries
- `src/jobs/rollupMetrics.ts` — nightly job entrypoint
- `src/jobs/rollupMetricsCli.ts` — CLI entrypoint for manual runs
- `src/jobs/scheduler.ts` — cron wiring (starts/stops cron, graceful shutdown hook)
- `src/controllers/adminController.ts` — `/overview`, `/system/health`
- `src/controllers/adminOutcomesController.ts` — `/outcomes`
- `src/controllers/adminProgrammesController.ts` — `/programmes/:id`
- `src/controllers/adminAuditController.ts` — `/audit`
- `src/routes/adminRoute.ts` — mounts admin endpoints
- `src/seeds/seedAdminDev.ts` — dev dataset generator
- `src/seeds/seedClinicalMetadata.ts` — one-off backfill for PHQ-9/GAD-7/PDSS + therapist tier
- `jest.config.ts` — Jest configuration
- `src/test-utils/mongo.ts` — in-memory Mongo lifecycle helpers
- `src/test-utils/factories.ts` — fixture builders for users, attempts, modules
- `src/test-utils/app.ts` — Express app factory for supertest without cron

**Modified files (BE)**

- `src/models/userModel.ts` — add `therapistTier`
- `src/models/moduleModel.ts` — add `instrument`, `clinicalCutoff`, `reliableChangeDelta`
- `src/controllers/userController.ts` — rewire `adminVerifyTherapist`, add `adminUnverifyTherapist`, relax `getUser` auth
- `src/controllers/attemptsController.ts` — relax patient timeline endpoints for admin, emit audit
- `src/controllers/moduleController.ts` — audit-wire `createModule`
- `src/routes/userRoute.ts` — register unverify route
- `src/index.ts` — mount admin router, boot thresholds guard, start scheduler
- `src/shared-types/types.ts` — new enums + response types + Module/User extensions
- `src/shared-types/constants.ts` — new `as const` arrays
- `src/shared-types/package.json` — version bump (done via publish script)
- `package.json` — new scripts + dev deps

**Shared-types package publishes**

Two publish checkpoints (§ "Shared-types publish checkpoints" below). Each requires the FE to run `npm run update-types` to consume.

---

## Prerequisites

- [ ] **Step 0.1: Confirm working directory and branch**

```bash
cd /Users/milobedini/Documents/git/cbt
git status
git branch --show-current
```

Expected: branch `main`, clean working tree.

- [ ] **Step 0.2: Verify dev DB connection**

```bash
mongosh "$(grep MONGO_URI .env | cut -d= -f2-)" --eval "db.stats()" --quiet
```

Expected: prints DB stats without auth errors.

---

## Phase 0 — Test infrastructure

Jest + ts-jest + mongodb-memory-server + supertest are all new to this repo. Set them up before any TDD work.

### Task 0.1: Install test dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install**

```bash
cd /Users/milobedini/Documents/git/cbt
npm install --save-dev jest @types/jest ts-jest mongodb-memory-server supertest @types/supertest
```

Expected: packages added to `devDependencies`, `package-lock.json` updated, no peer-dep warnings that block install.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add jest, ts-jest, mongodb-memory-server, supertest"
```

### Task 0.2: Jest config

**Files:**
- Create: `jest.config.ts`

- [ ] **Step 1: Write config**

```ts
// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/setup.ts'],
  testTimeout: 30000, // in-memory Mongo startup
  clearMocks: true,
  verbose: false,
}

export default config
```

- [ ] **Step 2: Add npm scripts**

Modify `package.json` scripts block to add:

```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

- [ ] **Step 3: Commit**

```bash
git add jest.config.ts package.json
git commit -m "chore(test): add jest config and npm test scripts"
```

### Task 0.3: In-memory Mongo helper

**Files:**
- Create: `src/test-utils/mongo.ts`
- Create: `src/test-utils/setup.ts`

- [ ] **Step 1: Mongo helper**

```ts
// src/test-utils/mongo.ts
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongo: MongoMemoryServer | null = null

export const connectTestDb = async (): Promise<void> => {
  mongo = await MongoMemoryServer.create()
  const uri = mongo.getUri()
  await mongoose.connect(uri)
}

export const clearTestDb = async (): Promise<void> => {
  const collections = mongoose.connection.collections
  await Promise.all(
    Object.values(collections).map((c) => c.deleteMany({}))
  )
}

export const disconnectTestDb = async (): Promise<void> => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  if (mongo) await mongo.stop()
}
```

- [ ] **Step 2: Jest setup file**

```ts
// src/test-utils/setup.ts
import { connectTestDb, clearTestDb, disconnectTestDb } from './mongo'

beforeAll(async () => { await connectTestDb() })
afterEach(async () => { await clearTestDb() })
afterAll(async () => { await disconnectTestDb() })
```

- [ ] **Step 3: Smoke test**

```ts
// src/test-utils/mongo.test.ts
import mongoose from 'mongoose'

describe('test-db harness', () => {
  it('connects to in-memory Mongo', () => {
    expect(mongoose.connection.readyState).toBe(1)
  })
})
```

- [ ] **Step 4: Run**

```bash
npm test -- --testPathPattern=test-utils/mongo
```

Expected: 1 test passes; mongod downloads on first run (can take 30-60s).

- [ ] **Step 5: Commit**

```bash
git add src/test-utils/mongo.ts src/test-utils/setup.ts src/test-utils/mongo.test.ts
git commit -m "chore(test): add in-memory mongo harness"
```

---

## Phase 1 — Shared types v1 (primitives only)

Publish enums, `OutcomeResult`, `PrivacyMode`, `Granularity`, and Module/User extensions before BE code references them. Response types come in v2 after endpoints are implemented.

### Task 1.1: Add enum types + Module/User extensions to types.ts

**Files:**
- Modify: `src/shared-types/types.ts`

- [ ] **Step 1: Add new exported types at the bottom of `types.ts`**

```ts
// ==================================
// Admin — primitives (v1)
// ==================================
export type Instrument = 'phq9' | 'gad7' | 'pdss'

export type CareTier = 'self_help' | 'cbt_guided' | 'pwp_guided'
export type TherapistTier = 'cbt' | 'pwp'

export type AuditedAction =
  | 'therapist.verified'
  | 'therapist.unverified'
  | 'user.viewed'
  | 'patient.attemptsViewed'
  | 'module.created'
  | 'admin.loggedIn'

export type MetricName = 'recovery' | 'reliable_improvement' | 'reliable_recovery'

export type PrivacyMode = 'production' | 'reduced'

export type Granularity = 'week' | 'month'

export type OutcomeResult = {
  rate: number | null
  n: number
  suppressed: boolean
  reason: 'below_k' | 'below_min_n' | null
}
```

- [ ] **Step 2: Extend `Module` type in `types.ts`**

Locate the existing `Module` type and add the optional fields:

```ts
export type Module = {
  _id: string
  title: string
  description: string
  program: ProgramRef
  type: ModuleType
  disclaimer?: string
  imageUrl?: string
  content?: string
  createdAt: string
  updatedAt: string
  accessPolicy: 'open' | 'assigned'
  // Admin v1 additions
  instrument?: Instrument
  clinicalCutoff?: number
  reliableChangeDelta?: number
}
```

- [ ] **Step 3: Extend `AuthUser` and `UsersListItem` types**

Add `therapistTier?: TherapistTier` to both.

- [ ] **Step 4: Commit**

```bash
git add src/shared-types/types.ts
git commit -m "feat(shared-types): add admin primitives and Module/User extensions"
```

### Task 1.2: Runtime constants

**Files:**
- Modify: `src/shared-types/constants.ts`

- [ ] **Step 1: Add `as const` arrays at the bottom of `constants.ts`**

```ts
// Admin — primitives (v1)
export const INSTRUMENTS = ['phq9', 'gad7', 'pdss'] as const
export const CARE_TIERS = ['self_help', 'cbt_guided', 'pwp_guided'] as const
export const THERAPIST_TIERS = ['cbt', 'pwp'] as const
export const AUDITED_ACTIONS = [
  'therapist.verified',
  'therapist.unverified',
  'user.viewed',
  'patient.attemptsViewed',
  'module.created',
  'admin.loggedIn',
] as const
export const METRIC_NAMES = [
  'recovery',
  'reliable_improvement',
  'reliable_recovery',
] as const
export const PRIVACY_MODES = ['production', 'reduced'] as const
export const GRANULARITIES = ['week', 'month'] as const
```

- [ ] **Step 2: Commit**

```bash
git add src/shared-types/constants.ts
git commit -m "feat(shared-types): add admin primitive runtime constants"
```

### Task 1.3: First shared-types publish (v1)

- [ ] **Step 1: Bump shared-types package version**

```bash
cd /Users/milobedini/Documents/git/cbt
npm --prefix src/shared-types version minor
```

Expected: `src/shared-types/package.json` version bumps e.g. `1.x.0 → 1.(x+1).0`.

- [ ] **Step 2: Publish**

```bash
npm run publish
```

Expected: package pushed to npm. Note the new version number.

- [ ] **Step 3: Commit version bump**

```bash
git add src/shared-types/package.json
git commit -m "chore(shared-types): publish v1 admin primitives"
```

- [ ] **Step 4: FE sync (informational — FE dev does this)**

FE repo: `cd /Users/milobedini/Documents/git/bwell && npm run update-types`. FE will get the new types but no response types yet.

---

## Phase 2 — Model changes and clinical-metadata backfill

### Task 2.1: Add `therapistTier` to User model

**Files:**
- Modify: `src/models/userModel.ts`

- [ ] **Step 1: Add field + enum to schema**

Update `IUser` type:

```ts
type IUser = Document & {
  username: string
  email: string
  // ... existing fields ...
  therapistTier?: 'cbt' | 'pwp'
}
```

Update schema:

```ts
therapistTier: {
  type: String,
  enum: ['cbt', 'pwp'],
  default: undefined,
},
```

- [ ] **Step 2: Commit**

```bash
git add src/models/userModel.ts
git commit -m "feat(user): add therapistTier field"
```

### Task 2.2: Add clinical metadata to Module model

**Files:**
- Modify: `src/models/moduleModel.ts`

- [ ] **Step 1: Add fields to interface and schema**

Interface additions:

```ts
instrument?: 'phq9' | 'gad7' | 'pdss'
clinicalCutoff?: number
reliableChangeDelta?: number
```

Schema additions:

```ts
instrument: {
  type: String,
  enum: ['phq9', 'gad7', 'pdss'],
  default: undefined,
},
clinicalCutoff: { type: Number, default: undefined },
reliableChangeDelta: { type: Number, default: undefined },
```

- [ ] **Step 2: Schema validator — cutoff required when instrument set**

Add a `.pre('validate', ...)` hook to `moduleModel.ts`:

```ts
ModuleSchema.pre('validate', function (next) {
  if (this.instrument && (this.clinicalCutoff === undefined || this.clinicalCutoff === null)) {
    return next(new Error('clinicalCutoff is required when instrument is set'))
  }
  next()
})
```

- [ ] **Step 3: Commit**

```bash
git add src/models/moduleModel.ts
git commit -m "feat(module): add instrument/clinicalCutoff/reliableChangeDelta with validator"
```

### Task 2.3: Clinical metadata backfill script

**Files:**
- Create: `src/seeds/seedClinicalMetadata.ts`
- Modify: `package.json`

- [ ] **Step 1: Write script**

```ts
// src/seeds/seedClinicalMetadata.ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Module from '../models/moduleModel'
import User from '../models/userModel'

dotenv.config()

type ClinicalRow = { titleMatch: RegExp; instrument: 'phq9' | 'gad7' | 'pdss'; cutoff: number; delta: number | null }

const CLINICAL_ROWS: ClinicalRow[] = [
  { titleMatch: /phq[-\s]?9/i, instrument: 'phq9', cutoff: 10, delta: 6 },
  { titleMatch: /gad[-\s]?7/i, instrument: 'gad7', cutoff: 8, delta: 4 },
  { titleMatch: /pdss/i, instrument: 'pdss', cutoff: 8, delta: null },
]

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI as string)

  // 1. Module clinical metadata
  for (const row of CLINICAL_ROWS) {
    const modules = await Module.find({ type: 'questionnaire', title: row.titleMatch })
    for (const mod of modules) {
      mod.instrument = row.instrument
      mod.clinicalCutoff = row.cutoff
      if (row.delta !== null) mod.reliableChangeDelta = row.delta
      await mod.save()
      console.log(`✔ ${mod.title} → ${row.instrument} (cutoff ${row.cutoff}, delta ${row.delta ?? 'n/a'})`)
    }
  }

  // 2. Therapist tier backfill
  const res = await User.updateMany(
    { roles: 'therapist', isVerifiedTherapist: true, therapistTier: { $exists: false } },
    { $set: { therapistTier: 'cbt' } }
  )
  console.log(`✔ Backfilled therapistTier='cbt' on ${res.modifiedCount} verified therapists`)

  await mongoose.connection.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Add npm script**

Add to `package.json` scripts:

```json
"seed:clinical-metadata": "ts-node ./src/seeds/seedClinicalMetadata.ts"
```

- [ ] **Step 3: Run against dev DB**

```bash
npm run seed:clinical-metadata
```

Expected: prints one line per matched module + one line for therapist backfill. Verify in mongosh:

```bash
mongosh "$(grep MONGO_URI .env | cut -d= -f2-)" --quiet --eval "db.modules.find({ instrument: { \$ne: null } }, { title: 1, instrument: 1, clinicalCutoff: 1, reliableChangeDelta: 1 }).toArray()"
```

- [ ] **Step 4: Commit**

```bash
git add src/seeds/seedClinicalMetadata.ts package.json
git commit -m "feat(seed): backfill clinical metadata and therapist tier"
```

---

## Phase 3 — New collections

### Task 3.1: MetricsRollup model

**Files:**
- Create: `src/models/metricsRollupModel.ts`

- [ ] **Step 1: Write model**

```ts
// src/models/metricsRollupModel.ts
import mongoose, { Document, Schema, Types } from 'mongoose'

export type MetricName = 'recovery' | 'reliable_improvement' | 'reliable_recovery'
export type CareTier = 'self_help' | 'cbt_guided' | 'pwp_guided'
export type Instrument = 'phq9' | 'gad7' | 'pdss'
export type Granularity = 'week' | 'month'

type IMetricsRollup = Document & {
  metric: MetricName
  dimension: {
    programmeId: Types.ObjectId | null
    careTier: CareTier | null
    instrument: Instrument
  }
  bucket: {
    granularity: Granularity
    startsAt: Date
    endsAt: Date
  }
  numerator: number
  denominator: number
  n: number
  computedAt: Date
  schemaVersion: number
}

const MetricsRollupSchema = new Schema<IMetricsRollup>(
  {
    metric: { type: String, enum: ['recovery', 'reliable_improvement', 'reliable_recovery'], required: true },
    dimension: {
      programmeId: { type: Schema.Types.ObjectId, ref: 'Program', default: null },
      careTier: { type: String, enum: ['self_help', 'cbt_guided', 'pwp_guided'], default: null },
      instrument: { type: String, enum: ['phq9', 'gad7', 'pdss'], required: true },
    },
    bucket: {
      granularity: { type: String, enum: ['week', 'month'], required: true },
      startsAt: { type: Date, required: true },
      endsAt: { type: Date, required: true },
    },
    numerator: { type: Number, required: true },
    denominator: { type: Number, required: true },
    n: { type: Number, required: true },
    computedAt: { type: Date, required: true },
    schemaVersion: { type: Number, required: true, default: 1 },
  },
  { collection: 'metricsRollups' }
)

MetricsRollupSchema.index({
  metric: 1,
  'dimension.programmeId': 1,
  'dimension.careTier': 1,
  'dimension.instrument': 1,
  'bucket.startsAt': 1,
})
MetricsRollupSchema.index({ computedAt: -1 })
MetricsRollupSchema.index(
  {
    metric: 1,
    'dimension.programmeId': 1,
    'dimension.careTier': 1,
    'dimension.instrument': 1,
    'bucket.granularity': 1,
    'bucket.startsAt': 1,
  },
  { unique: true, name: 'rollup_unique' }
)

const MetricsRollup = mongoose.model<IMetricsRollup>('MetricsRollup', MetricsRollupSchema)
export default MetricsRollup
export type { IMetricsRollup }
```

- [ ] **Step 2: Commit**

```bash
git add src/models/metricsRollupModel.ts
git commit -m "feat(model): add MetricsRollup with dimension/bucket schema and indexes"
```

### Task 3.2: AdminAuditEvent model

**Files:**
- Create: `src/models/adminAuditEventModel.ts`

- [ ] **Step 1: Write model**

```ts
// src/models/adminAuditEventModel.ts
import mongoose, { Document, Schema, Types } from 'mongoose'

type AuditedAction =
  | 'therapist.verified'
  | 'therapist.unverified'
  | 'user.viewed'
  | 'patient.attemptsViewed'
  | 'module.created'
  | 'admin.loggedIn'

type ResourceType = 'user' | 'therapist' | 'patient' | 'module' | 'attempt' | 'system'

type IAdminAuditEvent = Document & {
  actorId: Types.ObjectId
  actorRole: 'admin'
  impersonatorId: Types.ObjectId | null
  action: AuditedAction
  resourceType: ResourceType
  resourceId: Types.ObjectId | null
  outcome: 'success' | 'failure'
  context?: Record<string, unknown>
  ip?: string
  userAgent?: string
  at: Date
}

const AdminAuditEventSchema = new Schema<IAdminAuditEvent>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, enum: ['admin'], required: true, default: 'admin' },
    impersonatorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: {
      type: String,
      enum: [
        'therapist.verified',
        'therapist.unverified',
        'user.viewed',
        'patient.attemptsViewed',
        'module.created',
        'admin.loggedIn',
      ],
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['user', 'therapist', 'patient', 'module', 'attempt', 'system'],
      required: true,
    },
    resourceId: { type: Schema.Types.ObjectId, default: null },
    outcome: { type: String, enum: ['success', 'failure'], required: true },
    context: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    at: { type: Date, required: true, default: Date.now },
  },
  { collection: 'adminAuditEvents' }
)

AdminAuditEventSchema.index({ actorId: 1, at: -1 })
AdminAuditEventSchema.index({ resourceType: 1, resourceId: 1, at: -1 })
AdminAuditEventSchema.index({ action: 1, at: -1 })
AdminAuditEventSchema.index({ at: -1 })

const AdminAuditEvent = mongoose.model<IAdminAuditEvent>('AdminAuditEvent', AdminAuditEventSchema)
export default AdminAuditEvent
export type { IAdminAuditEvent }
```

- [ ] **Step 2: Commit**

```bash
git add src/models/adminAuditEventModel.ts
git commit -m "feat(model): add AdminAuditEvent with per-cut indexes"
```

### Task 3.3: JobRun model

**Files:**
- Create: `src/models/jobRunModel.ts`

- [ ] **Step 1: Write model**

```ts
// src/models/jobRunModel.ts
import mongoose, { Document, Schema } from 'mongoose'

type JobStatus = 'success' | 'partial' | 'failure'

type IJobRun = Document & {
  job: string
  startedAt: Date
  completedAt: Date | null
  status: JobStatus
  rowsWritten: number
  errors: Array<{ dimension: string; message: string }>
}

const JobRunSchema = new Schema<IJobRun>(
  {
    job: { type: String, required: true, index: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    status: { type: String, enum: ['success', 'partial', 'failure'], required: true },
    rowsWritten: { type: Number, default: 0 },
    errors: [{ dimension: String, message: String }],
  },
  { collection: 'jobRuns' }
)

JobRunSchema.index({ job: 1, startedAt: -1 })

const JobRun = mongoose.model<IJobRun>('JobRun', JobRunSchema)
export default JobRun
export type { IJobRun }
```

- [ ] **Step 2: Commit**

```bash
git add src/models/jobRunModel.ts
git commit -m "feat(model): add JobRun for scheduled-job observability"
```

---

## Phase 4 — Utilities

Each utility is TDD. Write the failing test first, then implement, then re-run.

### Task 4.1: Thresholds config + production boot-guard

**Files:**
- Create: `src/utils/thresholds.ts`
- Create: `src/utils/thresholds.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/utils/thresholds.test.ts
import { readThresholds, K_DEFAULT, MIN_N_DEFAULT } from './thresholds'

describe('thresholds', () => {
  const origEnv = { ...process.env }
  afterEach(() => { process.env = { ...origEnv } })

  it('returns defaults when env is unset', () => {
    delete process.env.K_ANONYMITY_THRESHOLD
    delete process.env.METRICS_MIN_N_FOR_DISPLAY
    expect(readThresholds()).toEqual({ k: K_DEFAULT, minN: MIN_N_DEFAULT, privacyMode: 'production' })
  })

  it('honours env overrides in non-production', () => {
    process.env.NODE_ENV = 'development'
    process.env.K_ANONYMITY_THRESHOLD = '1'
    process.env.METRICS_MIN_N_FOR_DISPLAY = '1'
    expect(readThresholds()).toEqual({ k: 1, minN: 1, privacyMode: 'reduced' })
  })

  it('forces defaults in production when env tries to lower', () => {
    process.env.NODE_ENV = 'production'
    process.env.K_ANONYMITY_THRESHOLD = '1'
    process.env.METRICS_MIN_N_FOR_DISPLAY = '1'
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    expect(readThresholds()).toEqual({ k: K_DEFAULT, minN: MIN_N_DEFAULT, privacyMode: 'production' })
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('marks privacyMode reduced when values are below defaults (non-prod)', () => {
    process.env.NODE_ENV = 'development'
    process.env.K_ANONYMITY_THRESHOLD = '3'
    delete process.env.METRICS_MIN_N_FOR_DISPLAY
    expect(readThresholds().privacyMode).toBe('reduced')
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- thresholds
```

Expected: fails (module missing).

- [ ] **Step 3: Implement**

```ts
// src/utils/thresholds.ts
export const K_DEFAULT = 5
export const MIN_N_DEFAULT = 20

export type Thresholds = {
  k: number
  minN: number
  privacyMode: 'production' | 'reduced'
}

export const readThresholds = (): Thresholds => {
  const isProd = process.env.NODE_ENV === 'production'
  const envK = process.env.K_ANONYMITY_THRESHOLD
  const envMinN = process.env.METRICS_MIN_N_FOR_DISPLAY
  let k = envK !== undefined ? Number(envK) : K_DEFAULT
  let minN = envMinN !== undefined ? Number(envMinN) : MIN_N_DEFAULT

  if (isProd && (k < K_DEFAULT || minN < MIN_N_DEFAULT)) {
    console.warn(
      `🚨 thresholds: production environment attempted lower values (k=${k}, minN=${minN}); forcing defaults (k=${K_DEFAULT}, minN=${MIN_N_DEFAULT})`
    )
    k = K_DEFAULT
    minN = MIN_N_DEFAULT
  }

  const privacyMode: 'production' | 'reduced' =
    k < K_DEFAULT || minN < MIN_N_DEFAULT ? 'reduced' : 'production'

  return { k, minN, privacyMode }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- thresholds
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/thresholds.ts src/utils/thresholds.test.ts
git commit -m "feat(thresholds): env-driven k/minN with production boot-guard"
```

### Task 4.2: Suppression wrapper

**Files:**
- Create: `src/utils/suppression.ts`
- Create: `src/utils/suppression.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/utils/suppression.test.ts
import { applySuppression } from './suppression'

describe('applySuppression', () => {
  it('suppresses below_k when denominator < k', () => {
    expect(applySuppression({ numerator: 1, denominator: 3 }, { k: 5, minN: 20 }))
      .toEqual({ rate: null, n: 3, suppressed: true, reason: 'below_k' })
  })

  it('suppresses below_min_n when denominator >= k but < minN', () => {
    expect(applySuppression({ numerator: 5, denominator: 10 }, { k: 5, minN: 20 }))
      .toEqual({ rate: null, n: 10, suppressed: true, reason: 'below_min_n' })
  })

  it('returns rate when denominator >= minN', () => {
    expect(applySuppression({ numerator: 10, denominator: 25 }, { k: 5, minN: 20 }))
      .toEqual({ rate: 0.4, n: 25, suppressed: false, reason: null })
  })

  it('handles zero denominator as below_k', () => {
    expect(applySuppression({ numerator: 0, denominator: 0 }, { k: 5, minN: 20 }))
      .toEqual({ rate: null, n: 0, suppressed: true, reason: 'below_k' })
  })

  it('returns rate of 0 cleanly (not null)', () => {
    expect(applySuppression({ numerator: 0, denominator: 25 }, { k: 5, minN: 20 }))
      .toEqual({ rate: 0, n: 25, suppressed: false, reason: null })
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- suppression
```

- [ ] **Step 3: Implement**

```ts
// src/utils/suppression.ts
import type { OutcomeResult } from '../shared-types/types'

export const applySuppression = (
  counts: { numerator: number; denominator: number },
  { k, minN }: { k: number; minN: number }
): OutcomeResult => {
  const { numerator, denominator } = counts
  if (denominator < k) return { rate: null, n: denominator, suppressed: true, reason: 'below_k' }
  if (denominator < minN) return { rate: null, n: denominator, suppressed: true, reason: 'below_min_n' }
  return { rate: numerator / denominator, n: denominator, suppressed: false, reason: null }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- suppression
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/suppression.ts src/utils/suppression.test.ts
git commit -m "feat(suppression): add k/minN suppression wrapper"
```

### Task 4.3: Care-tier derivation

**Files:**
- Create: `src/utils/careTier.ts`
- Create: `src/utils/careTier.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/utils/careTier.test.ts
import { deriveCareTier } from './careTier'

describe('deriveCareTier', () => {
  it('returns self_help when attempt has no therapist', () => {
    expect(deriveCareTier({ attemptTherapistId: null, therapistTierLookup: {} })).toBe('self_help')
  })

  it('returns cbt_guided when therapist tier is cbt', () => {
    expect(deriveCareTier({ attemptTherapistId: 't1', therapistTierLookup: { t1: 'cbt' } })).toBe('cbt_guided')
  })

  it('returns pwp_guided when therapist tier is pwp', () => {
    expect(deriveCareTier({ attemptTherapistId: 't1', therapistTierLookup: { t1: 'pwp' } })).toBe('pwp_guided')
  })

  it('falls back to self_help when therapist id is present but missing from lookup', () => {
    expect(deriveCareTier({ attemptTherapistId: 't99', therapistTierLookup: { t1: 'cbt' } })).toBe('self_help')
  })

  it('falls back to self_help when therapist tier is null', () => {
    expect(deriveCareTier({ attemptTherapistId: 't1', therapistTierLookup: { t1: null as unknown as 'cbt' } })).toBe('self_help')
  })
})
```

- [ ] **Step 2: Implement**

```ts
// src/utils/careTier.ts
import type { CareTier, TherapistTier } from '../shared-types/types'

export const deriveCareTier = (args: {
  attemptTherapistId: string | null
  therapistTierLookup: Record<string, TherapistTier | undefined>
}): CareTier => {
  const { attemptTherapistId, therapistTierLookup } = args
  if (!attemptTherapistId) return 'self_help'
  const tier = therapistTierLookup[attemptTherapistId]
  if (tier === 'cbt') return 'cbt_guided'
  if (tier === 'pwp') return 'pwp_guided'
  return 'self_help'
}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- careTier
```

- [ ] **Step 4: Commit**

```bash
git add src/utils/careTier.ts src/utils/careTier.test.ts
git commit -m "feat(careTier): add derivation helper with self_help fallback"
```

### Task 4.4: London bucket boundaries

**Files:**
- Create: `src/utils/londonBuckets.ts`
- Create: `src/utils/londonBuckets.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/utils/londonBuckets.test.ts
import { weekBucket, monthBucket, enumerateBuckets } from './londonBuckets'
import { DateTime } from 'luxon'

describe('londonBuckets', () => {
  it('weekBucket anchors Monday 00:00 Europe/London for a Wednesday in summer', () => {
    const wed = new Date('2026-07-15T12:00:00Z')
    const b = weekBucket(wed)
    const londonStart = DateTime.fromJSDate(b.startsAt).setZone('Europe/London')
    expect(londonStart.weekday).toBe(1) // Monday
    expect(londonStart.hour).toBe(0)
    expect(b.endsAt.getTime() - b.startsAt.getTime()).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it('weekBucket handles DST spring-forward correctly (25 March 2026)', () => {
    const dstWeek = new Date('2026-03-30T12:00:00Z') // Monday after UK spring-forward
    const b = weekBucket(dstWeek)
    const londonStart = DateTime.fromJSDate(b.startsAt).setZone('Europe/London')
    expect(londonStart.weekday).toBe(1)
    expect(londonStart.hour).toBe(0)
  })

  it('monthBucket anchors 1st 00:00 Europe/London', () => {
    const mid = new Date('2026-05-15T09:00:00Z')
    const b = monthBucket(mid)
    const londonStart = DateTime.fromJSDate(b.startsAt).setZone('Europe/London')
    expect(londonStart.day).toBe(1)
    expect(londonStart.hour).toBe(0)
    expect(londonStart.month).toBe(5)
    const londonEnd = DateTime.fromJSDate(b.endsAt).setZone('Europe/London')
    expect(londonEnd.day).toBe(1)
    expect(londonEnd.month).toBe(6)
  })

  it('enumerateBuckets produces contiguous non-overlapping weeks', () => {
    const from = new Date('2026-01-05T00:00:00Z') // Monday
    const to = new Date('2026-02-02T00:00:00Z')
    const buckets = enumerateBuckets({ from, to, granularity: 'week' })
    expect(buckets.length).toBe(4)
    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i].startsAt.getTime()).toBe(buckets[i - 1].endsAt.getTime())
    }
  })
})
```

- [ ] **Step 2: Implement**

```ts
// src/utils/londonBuckets.ts
import { DateTime } from 'luxon'
import type { Granularity } from '../shared-types/types'

const ZONE = 'Europe/London'

export const weekBucket = (at: Date): { startsAt: Date; endsAt: Date; granularity: 'week' } => {
  const london = DateTime.fromJSDate(at, { zone: ZONE })
  const startsAt = london.startOf('week').startOf('day').toJSDate()
  const endsAt = london.startOf('week').startOf('day').plus({ weeks: 1 }).toJSDate()
  return { startsAt, endsAt, granularity: 'week' }
}

export const monthBucket = (at: Date): { startsAt: Date; endsAt: Date; granularity: 'month' } => {
  const london = DateTime.fromJSDate(at, { zone: ZONE })
  const startsAt = london.startOf('month').startOf('day').toJSDate()
  const endsAt = london.startOf('month').startOf('day').plus({ months: 1 }).toJSDate()
  return { startsAt, endsAt, granularity: 'month' }
}

export const enumerateBuckets = (args: {
  from: Date
  to: Date
  granularity: Granularity
}): Array<{ startsAt: Date; endsAt: Date; granularity: Granularity }> => {
  const { from, to, granularity } = args
  const out: Array<{ startsAt: Date; endsAt: Date; granularity: Granularity }> = []
  let cursor =
    granularity === 'week'
      ? weekBucket(from).startsAt
      : monthBucket(from).startsAt
  const end = to.getTime()
  while (cursor.getTime() < end) {
    const bucket = granularity === 'week' ? weekBucket(cursor) : monthBucket(cursor)
    out.push(bucket)
    cursor = bucket.endsAt
  }
  return out
}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- londonBuckets
```

- [ ] **Step 4: Commit**

```bash
git add src/utils/londonBuckets.ts src/utils/londonBuckets.test.ts
git commit -m "feat(buckets): add London-anchored week/month bucket helpers"
```

### Task 4.5: IAPT pairing + metric computation

**Files:**
- Create: `src/utils/iaptPairing.ts`
- Create: `src/utils/iaptPairing.test.ts`

- [ ] **Step 1: Failing tests (cover all edges in spec §5.3)**

```ts
// src/utils/iaptPairing.test.ts
import { computeIaptMetrics } from './iaptPairing'

type Att = { userId: string; completedAt: Date; totalScore: number }

const phq9 = { instrument: 'phq9' as const, clinicalCutoff: 10, reliableChangeDelta: 6 }
const gad7 = { instrument: 'gad7' as const, clinicalCutoff: 8, reliableChangeDelta: 4 }
const pdss = { instrument: 'pdss' as const, clinicalCutoff: 8, reliableChangeDelta: null }

const date = (iso: string) => new Date(iso)

describe('computeIaptMetrics', () => {
  it('requires at least 2 attempts per user', () => {
    const attempts: Att[] = [{ userId: 'u1', completedAt: date('2026-01-01'), totalScore: 15 }]
    const res = computeIaptMetrics(attempts, phq9)
    expect(res.recovery.denominator).toBe(0)
    expect(res.reliableImprovement.denominator).toBe(0)
  })

  it('pairs baseline (earliest) and endpoint (latest) per user', () => {
    const attempts: Att[] = [
      { userId: 'u1', completedAt: date('2026-01-01'), totalScore: 15 },
      { userId: 'u1', completedAt: date('2026-01-15'), totalScore: 8 },
    ]
    const res = computeIaptMetrics(attempts, phq9)
    // baseline 15 >= 10 → recovery eligible
    // endpoint 8 < 10 → recovered
    expect(res.recovery).toEqual({ numerator: 1, denominator: 1 })
    // (15 - 8) = 7 >= 6 → reliably improved
    expect(res.reliableImprovement).toEqual({ numerator: 1, denominator: 1 })
    // both → reliable recovery
    expect(res.reliableRecovery).toEqual({ numerator: 1, denominator: 1 })
  })

  it('excludes sub-clinical baselines from recovery denominator but includes in reliable-improvement', () => {
    const attempts: Att[] = [
      { userId: 'u1', completedAt: date('2026-01-01'), totalScore: 8 }, // below cutoff 10
      { userId: 'u1', completedAt: date('2026-01-15'), totalScore: 2 },
    ]
    const res = computeIaptMetrics(attempts, phq9)
    expect(res.recovery.denominator).toBe(0)
    expect(res.reliableRecovery.denominator).toBe(0)
    expect(res.reliableImprovement).toEqual({ numerator: 1, denominator: 1 }) // delta 6 >= 6
  })

  it('counts non-recovered patients in denominator but not numerator', () => {
    const attempts: Att[] = [
      { userId: 'u1', completedAt: date('2026-01-01'), totalScore: 15 },
      { userId: 'u1', completedAt: date('2026-01-15'), totalScore: 14 }, // still above cutoff
    ]
    const res = computeIaptMetrics(attempts, phq9)
    expect(res.recovery).toEqual({ numerator: 0, denominator: 1 })
  })

  it('returns null for reliableImprovement when reliableChangeDelta is undefined', () => {
    const attempts: Att[] = [
      { userId: 'u1', completedAt: date('2026-01-01'), totalScore: 15 },
      { userId: 'u1', completedAt: date('2026-01-15'), totalScore: 6 },
    ]
    const res = computeIaptMetrics(attempts, pdss)
    expect(res.reliableImprovement).toBeNull()
    expect(res.reliableRecovery).toBeNull()
    expect(res.recovery.denominator).toBe(1)
  })

  it('aggregates multiple users', () => {
    const attempts: Att[] = [
      { userId: 'u1', completedAt: date('2026-01-01'), totalScore: 15 },
      { userId: 'u1', completedAt: date('2026-01-15'), totalScore: 5 }, // recovered + reliable
      { userId: 'u2', completedAt: date('2026-01-02'), totalScore: 12 },
      { userId: 'u2', completedAt: date('2026-01-20'), totalScore: 11 }, // not recovered
      { userId: 'u3', completedAt: date('2026-01-03'), totalScore: 9 }, // sub-clinical
      { userId: 'u3', completedAt: date('2026-01-10'), totalScore: 3 }, // reliable improvement only
    ]
    const res = computeIaptMetrics(attempts, phq9)
    expect(res.recovery).toEqual({ numerator: 1, denominator: 2 })
    expect(res.reliableImprovement).toEqual({ numerator: 2, denominator: 3 }) // u1 + u3
  })
})
```

- [ ] **Step 2: Implement**

```ts
// src/utils/iaptPairing.ts
import type { Instrument } from '../shared-types/types'

type Attempt = { userId: string; completedAt: Date; totalScore: number }

type InstrumentDef = {
  instrument: Instrument
  clinicalCutoff: number
  reliableChangeDelta: number | null
}

type Counts = { numerator: number; denominator: number }

export type IaptMetricsResult = {
  recovery: Counts
  reliableImprovement: Counts | null
  reliableRecovery: Counts | null
}

export const computeIaptMetrics = (
  attempts: Attempt[],
  def: InstrumentDef
): IaptMetricsResult => {
  // Group by user
  const byUser = new Map<string, Attempt[]>()
  for (const a of attempts) {
    const arr = byUser.get(a.userId)
    if (arr) arr.push(a)
    else byUser.set(a.userId, [a])
  }

  let recoveryNum = 0
  let recoveryDen = 0
  let reliableImpNum = 0
  let reliableImpDen = 0
  let reliableRecNum = 0
  let reliableRecDen = 0

  for (const userAttempts of byUser.values()) {
    if (userAttempts.length < 2) continue
    const sorted = [...userAttempts].sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
    const baseline = sorted[0]
    const endpoint = sorted[sorted.length - 1]

    const aboveCutoff = baseline.totalScore >= def.clinicalCutoff
    const recovered = endpoint.totalScore < def.clinicalCutoff
    const improved =
      def.reliableChangeDelta !== null &&
      baseline.totalScore - endpoint.totalScore >= def.reliableChangeDelta

    if (aboveCutoff) {
      recoveryDen++
      if (recovered) recoveryNum++
      if (def.reliableChangeDelta !== null) {
        reliableRecDen++
        if (recovered && improved) reliableRecNum++
      }
    }

    if (def.reliableChangeDelta !== null) {
      reliableImpDen++
      if (improved) reliableImpNum++
    }
  }

  return {
    recovery: { numerator: recoveryNum, denominator: recoveryDen },
    reliableImprovement:
      def.reliableChangeDelta === null
        ? null
        : { numerator: reliableImpNum, denominator: reliableImpDen },
    reliableRecovery:
      def.reliableChangeDelta === null
        ? null
        : { numerator: reliableRecNum, denominator: reliableRecDen },
  }
}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- iaptPairing
```

Expected: all 6 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/utils/iaptPairing.ts src/utils/iaptPairing.test.ts
git commit -m "feat(iapt): pure pairing+metrics computation with unit tests"
```

### Task 4.6: Audit helper

**Files:**
- Create: `src/utils/audit.ts`
- Create: `src/utils/audit.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/utils/audit.test.ts
import { logAdminAction } from './audit'
import AdminAuditEvent from '../models/adminAuditEventModel'
import type { Request } from 'express'
import mongoose from 'mongoose'

const fakeReq = (userId: string, opts: Partial<Request> = {}): Request =>
  ({
    user: { _id: new mongoose.Types.ObjectId(userId) },
    ip: '127.0.0.1',
    get: (h: string) => (h === 'user-agent' ? 'jest' : undefined),
    ...opts,
  } as unknown as Request)

describe('logAdminAction', () => {
  it('writes an AdminAuditEvent with the expected shape', async () => {
    const actorId = new mongoose.Types.ObjectId().toString()
    const resourceId = new mongoose.Types.ObjectId()

    await logAdminAction(fakeReq(actorId), {
      action: 'therapist.verified',
      resourceType: 'therapist',
      resourceId,
      outcome: 'success',
      context: { therapistTier: 'cbt' },
    })

    const events = await AdminAuditEvent.find({})
    expect(events.length).toBe(1)
    expect(events[0]).toMatchObject({
      actorRole: 'admin',
      impersonatorId: null,
      action: 'therapist.verified',
      resourceType: 'therapist',
      outcome: 'success',
      context: { therapistTier: 'cbt' },
      ip: '127.0.0.1',
      userAgent: 'jest',
    })
  })

  it('accepts null resourceId for system events', async () => {
    const actorId = new mongoose.Types.ObjectId().toString()
    await logAdminAction(fakeReq(actorId), {
      action: 'admin.loggedIn',
      resourceType: 'system',
      resourceId: null,
      outcome: 'success',
    })
    const events = await AdminAuditEvent.find({})
    expect(events[0].resourceId).toBeNull()
  })
})
```

- [ ] **Step 2: Implement**

```ts
// src/utils/audit.ts
import type { Request } from 'express'
import type { Types } from 'mongoose'
import AdminAuditEvent from '../models/adminAuditEventModel'

type AuditedAction =
  | 'therapist.verified'
  | 'therapist.unverified'
  | 'user.viewed'
  | 'patient.attemptsViewed'
  | 'module.created'
  | 'admin.loggedIn'

type ResourceType = 'user' | 'therapist' | 'patient' | 'module' | 'attempt' | 'system'

type LogParams = {
  action: AuditedAction
  resourceType: ResourceType
  resourceId: Types.ObjectId | string | null
  outcome: 'success' | 'failure'
  context?: Record<string, unknown>
}

export const logAdminAction = async (req: Request, params: LogParams): Promise<void> => {
  try {
    await AdminAuditEvent.create({
      actorId: req.user?._id,
      actorRole: 'admin',
      impersonatorId: null,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      outcome: params.outcome,
      context: params.context,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      at: new Date(),
    })
  } catch (err) {
    console.error('logAdminAction failed', err)
    // Deliberately swallow — audit failures must not break the caller
  }
}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- audit
```

- [ ] **Step 4: Commit**

```bash
git add src/utils/audit.ts src/utils/audit.test.ts
git commit -m "feat(audit): add logAdminAction helper with resilient write"
```

---

## Phase 5 — Rollup job

### Task 5.1: Rollup computation service

**Files:**
- Create: `src/jobs/rollupMetrics.ts`
- Create: `src/jobs/rollupMetrics.test.ts`
- Create: `src/test-utils/factories.ts`

- [ ] **Step 1: Factories**

```ts
// src/test-utils/factories.ts
import mongoose from 'mongoose'
import User from '../models/userModel'
import Module from '../models/moduleModel'
import Program from '../models/programModel'
import ModuleAttempt from '../models/moduleAttemptModel'

type CreateUserOpts = {
  role?: 'patient' | 'therapist' | 'admin'
  therapistTier?: 'cbt' | 'pwp'
  therapist?: mongoose.Types.ObjectId
  isVerifiedTherapist?: boolean
}

export const createUser = async (opts: CreateUserOpts = {}) => {
  const u = await User.create({
    username: `u-${new mongoose.Types.ObjectId().toString().slice(-6)}`,
    email: `${new mongoose.Types.ObjectId().toString()}@test.bwell`,
    password: 'x'.repeat(10),
    roles: [opts.role ?? 'patient'],
    isVerifiedTherapist: opts.isVerifiedTherapist ?? false,
    therapistTier: opts.therapistTier,
    therapist: opts.therapist,
  })
  return u
}

export const createProgram = async (title = 'Depression') =>
  Program.create({ title, description: `${title} programme`, modules: [] })

export const createQuestionnaireModule = async (args: {
  programId: mongoose.Types.ObjectId
  title: string
  instrument?: 'phq9' | 'gad7' | 'pdss'
  clinicalCutoff?: number
  reliableChangeDelta?: number
}) =>
  Module.create({
    title: args.title,
    description: args.title,
    type: 'questionnaire',
    program: args.programId,
    accessPolicy: 'open',
    instrument: args.instrument,
    clinicalCutoff: args.clinicalCutoff,
    reliableChangeDelta: args.reliableChangeDelta,
  })

export const createAttempt = async (args: {
  userId: mongoose.Types.ObjectId
  therapistId?: mongoose.Types.ObjectId
  programId: mongoose.Types.ObjectId
  moduleId: mongoose.Types.ObjectId
  totalScore: number
  completedAt: Date
}) =>
  ModuleAttempt.create({
    user: args.userId,
    therapist: args.therapistId,
    program: args.programId,
    module: args.moduleId,
    moduleType: 'questionnaire',
    status: 'submitted',
    startedAt: args.completedAt,
    completedAt: args.completedAt,
    lastInteractionAt: args.completedAt,
    totalScore: args.totalScore,
  })
```

- [ ] **Step 2: Failing integration test for rollup job**

```ts
// src/jobs/rollupMetrics.test.ts
import mongoose from 'mongoose'
import { runRollupForBucket } from './rollupMetrics'
import MetricsRollup from '../models/metricsRollupModel'
import {
  createUser,
  createProgram,
  createQuestionnaireModule,
  createAttempt,
} from '../test-utils/factories'

describe('rollupMetrics (integration)', () => {
  it('writes platform-wide, per-programme, and per-careTier rollups for PHQ-9', async () => {
    const programme = await createProgram('Depression')
    const phq9 = await createQuestionnaireModule({
      programId: programme._id,
      title: 'PHQ-9',
      instrument: 'phq9',
      clinicalCutoff: 10,
      reliableChangeDelta: 6,
    })
    const therapist = await createUser({ role: 'therapist', therapistTier: 'cbt', isVerifiedTherapist: true })
    const patient = await createUser({ therapist: therapist._id })
    await createAttempt({
      userId: patient._id,
      therapistId: therapist._id,
      programId: programme._id,
      moduleId: phq9._id,
      totalScore: 15,
      completedAt: new Date('2026-04-06T10:00:00Z'),
    })
    await createAttempt({
      userId: patient._id,
      therapistId: therapist._id,
      programId: programme._id,
      moduleId: phq9._id,
      totalScore: 4,
      completedAt: new Date('2026-04-10T10:00:00Z'),
    })

    const bucket = {
      granularity: 'week' as const,
      startsAt: new Date('2026-04-05T23:00:00Z'), // Monday 00:00 London
      endsAt: new Date('2026-04-12T23:00:00Z'),
    }

    await runRollupForBucket(bucket)

    const platform = await MetricsRollup.findOne({
      metric: 'recovery',
      'dimension.programmeId': null,
      'dimension.careTier': null,
      'dimension.instrument': 'phq9',
    })
    expect(platform?.numerator).toBe(1)
    expect(platform?.denominator).toBe(1)

    const byProgramme = await MetricsRollup.findOne({
      metric: 'recovery',
      'dimension.programmeId': programme._id,
      'dimension.careTier': null,
      'dimension.instrument': 'phq9',
    })
    expect(byProgramme?.numerator).toBe(1)

    const byCbt = await MetricsRollup.findOne({
      metric: 'recovery',
      'dimension.programmeId': programme._id,
      'dimension.careTier': 'cbt_guided',
      'dimension.instrument': 'phq9',
    })
    expect(byCbt?.numerator).toBe(1)
  })

  it('is idempotent: running twice yields one row per unique key', async () => {
    const programme = await createProgram('Depression')
    const phq9 = await createQuestionnaireModule({
      programId: programme._id,
      title: 'PHQ-9',
      instrument: 'phq9',
      clinicalCutoff: 10,
      reliableChangeDelta: 6,
    })
    const patient = await createUser({})
    await createAttempt({
      userId: patient._id,
      programId: programme._id,
      moduleId: phq9._id,
      totalScore: 15,
      completedAt: new Date('2026-04-06T10:00:00Z'),
    })
    await createAttempt({
      userId: patient._id,
      programId: programme._id,
      moduleId: phq9._id,
      totalScore: 5,
      completedAt: new Date('2026-04-10T10:00:00Z'),
    })

    const bucket = {
      granularity: 'week' as const,
      startsAt: new Date('2026-04-05T23:00:00Z'),
      endsAt: new Date('2026-04-12T23:00:00Z'),
    }
    await runRollupForBucket(bucket)
    await runRollupForBucket(bucket)

    const all = await MetricsRollup.find({ 'dimension.instrument': 'phq9' })
    // Expected combos per metric: platform, per-programme, platform×self_help, programme×self_help
    // metrics: recovery + reliable_improvement + reliable_recovery = 3
    // => 4 combos × 3 metrics = 12 rows (no tier-aggregated row when only one tier present → still 4 combos)
    expect(all.length).toBe(12)
  })
})
```

Note: the second test's exact row count depends on the "emit tier-aggregated row even when only one tier is present" decision. The implementation below makes tier-aggregated rows always emitted; adjust the expected count to 12 if so (which is what this test asserts).

- [ ] **Step 3: Implement `runRollupForBucket`**

```ts
// src/jobs/rollupMetrics.ts
import mongoose from 'mongoose'
import type { CareTier, Instrument, MetricName } from '../shared-types/types'
import Module from '../models/moduleModel'
import ModuleAttempt from '../models/moduleAttemptModel'
import User from '../models/userModel'
import MetricsRollup from '../models/metricsRollupModel'
import JobRun from '../models/jobRunModel'
import { computeIaptMetrics } from '../utils/iaptPairing'
import { deriveCareTier } from '../utils/careTier'
import {
  weekBucket,
  monthBucket,
  enumerateBuckets,
} from '../utils/londonBuckets'

type Bucket = {
  granularity: 'week' | 'month'
  startsAt: Date
  endsAt: Date
}

type ClinicalModule = {
  _id: mongoose.Types.ObjectId
  instrument: Instrument
  clinicalCutoff: number
  reliableChangeDelta: number | null
  programme: mongoose.Types.ObjectId
}

const CARE_TIERS: CareTier[] = ['self_help', 'cbt_guided', 'pwp_guided']

const upsertRollup = async (
  metric: MetricName,
  programmeId: mongoose.Types.ObjectId | null,
  careTier: CareTier | null,
  instrument: Instrument,
  bucket: Bucket,
  counts: { numerator: number; denominator: number }
) => {
  await MetricsRollup.updateOne(
    {
      metric,
      'dimension.programmeId': programmeId,
      'dimension.careTier': careTier,
      'dimension.instrument': instrument,
      'bucket.granularity': bucket.granularity,
      'bucket.startsAt': bucket.startsAt,
    },
    {
      $set: {
        metric,
        dimension: { programmeId, careTier, instrument },
        bucket,
        numerator: counts.numerator,
        denominator: counts.denominator,
        n: counts.denominator,
        computedAt: new Date(),
        schemaVersion: 1,
      },
    },
    { upsert: true }
  )
}

export const runRollupForBucket = async (bucket: Bucket): Promise<number> => {
  // 1. Load all clinical modules
  const modules = (await Module.find(
    { instrument: { $ne: null } },
    { _id: 1, instrument: 1, clinicalCutoff: 1, reliableChangeDelta: 1, program: 1 }
  ).lean()) as unknown as Array<{
    _id: mongoose.Types.ObjectId
    instrument: Instrument
    clinicalCutoff: number
    reliableChangeDelta?: number | null
    program: mongoose.Types.ObjectId
  }>
  let rowsWritten = 0

  // 2. Therapist tier lookup (current tier, as per §5.3)
  const therapists = (await User.find(
    { roles: 'therapist' },
    { _id: 1, therapistTier: 1 }
  ).lean()) as unknown as Array<{ _id: mongoose.Types.ObjectId; therapistTier?: 'cbt' | 'pwp' }>
  const tierLookup: Record<string, 'cbt' | 'pwp' | undefined> = {}
  for (const t of therapists) tierLookup[t._id.toString()] = t.therapistTier

  // 3. Pull every submitted questionnaire attempt in the bucket whose module has an instrument
  const moduleIds = modules.map((m) => m._id)
  const attempts = (await ModuleAttempt.find(
    {
      status: 'submitted',
      moduleType: 'questionnaire',
      module: { $in: moduleIds },
      completedAt: { $gte: bucket.startsAt, $lt: bucket.endsAt },
    },
    { user: 1, therapist: 1, program: 1, module: 1, totalScore: 1, completedAt: 1 }
  ).lean()) as unknown as Array<{
    user: mongoose.Types.ObjectId
    therapist?: mongoose.Types.ObjectId
    program: mongoose.Types.ObjectId
    module: mongoose.Types.ObjectId
    totalScore: number
    completedAt: Date
  }>

  // 4. Index modules by id for fast lookup
  const moduleById = new Map<string, ClinicalModule>()
  for (const m of modules) {
    moduleById.set(m._id.toString(), {
      _id: m._id,
      instrument: m.instrument,
      clinicalCutoff: m.clinicalCutoff,
      reliableChangeDelta: m.reliableChangeDelta ?? null,
      programme: m.program,
    })
  }

  // 5. For each dimension combo, filter attempts + compute + upsert
  // Dimensions: (programmeId | null) × (careTier | null) × instrument
  const programmes = Array.from(new Set(modules.map((m) => m.program.toString())))
  const instruments = Array.from(new Set(modules.map((m) => m.instrument)))

  type DimKey = { programmeId: mongoose.Types.ObjectId | null; careTier: CareTier | null; instrument: Instrument }
  const dimensions: DimKey[] = []
  for (const instrument of instruments) {
    dimensions.push({ programmeId: null, careTier: null, instrument })
    for (const tier of CARE_TIERS) {
      dimensions.push({ programmeId: null, careTier: tier, instrument })
    }
    for (const pId of programmes) {
      const pObj = new mongoose.Types.ObjectId(pId)
      dimensions.push({ programmeId: pObj, careTier: null, instrument })
      for (const tier of CARE_TIERS) {
        dimensions.push({ programmeId: pObj, careTier: tier, instrument })
      }
    }
  }

  for (const dim of dimensions) {
    // Filter attempts for this dimension
    const filtered = attempts.filter((a) => {
      const mod = moduleById.get(a.module.toString())
      if (!mod || mod.instrument !== dim.instrument) return false
      if (dim.programmeId && !mod.programme.equals(dim.programmeId)) return false
      if (dim.careTier) {
        const derived = deriveCareTier({
          attemptTherapistId: a.therapist ? a.therapist.toString() : null,
          therapistTierLookup: tierLookup,
        })
        if (derived !== dim.careTier) return false
      }
      return true
    })
    if (filtered.length === 0) continue

    // Pick any matching module's clinical def for this instrument
    const anyMod = modules.find((m) => m.instrument === dim.instrument)
    if (!anyMod) continue
    const def = {
      instrument: anyMod.instrument,
      clinicalCutoff: anyMod.clinicalCutoff,
      reliableChangeDelta: anyMod.reliableChangeDelta ?? null,
    }

    const metrics = computeIaptMetrics(
      filtered.map((a) => ({
        userId: a.user.toString(),
        completedAt: a.completedAt,
        totalScore: a.totalScore,
      })),
      def
    )

    if (metrics.recovery.denominator > 0) {
      await upsertRollup('recovery', dim.programmeId, dim.careTier, dim.instrument, bucket, metrics.recovery)
      rowsWritten++
    }
    if (metrics.reliableImprovement && metrics.reliableImprovement.denominator > 0) {
      await upsertRollup(
        'reliable_improvement',
        dim.programmeId,
        dim.careTier,
        dim.instrument,
        bucket,
        metrics.reliableImprovement
      )
      rowsWritten++
    }
    if (metrics.reliableRecovery && metrics.reliableRecovery.denominator > 0) {
      await upsertRollup(
        'reliable_recovery',
        dim.programmeId,
        dim.careTier,
        dim.instrument,
        bucket,
        metrics.reliableRecovery
      )
      rowsWritten++
    }
  }

  return rowsWritten
}

export const runNightlyRollup = async (now: Date = new Date()): Promise<void> => {
  const run = await JobRun.create({
    job: 'rollupMetrics',
    startedAt: now,
    status: 'success',
  })
  let rowsWritten = 0
  const errors: Array<{ dimension: string; message: string }> = []

  try {
    // 1. Current week bucket
    const thisWeek = weekBucket(now)
    rowsWritten += await runRollupForBucket(thisWeek)
    // 2. Previous week bucket (closed)
    const prevWeek = weekBucket(new Date(thisWeek.startsAt.getTime() - 1000))
    rowsWritten += await runRollupForBucket(prevWeek)
    // 3. Month buckets — current + just-closed if first run of month
    const thisMonth = monthBucket(now)
    rowsWritten += await runRollupForBucket(thisMonth)
    // If today is the 1st London-local, previous month is just closed — run it
    const london = new Date(now.toLocaleString('en-GB', { timeZone: 'Europe/London' }))
    if (london.getDate() === 1) {
      const prevMonth = monthBucket(new Date(thisMonth.startsAt.getTime() - 1000))
      rowsWritten += await runRollupForBucket(prevMonth)
    }
  } catch (err) {
    errors.push({ dimension: 'run', message: (err as Error).message })
  }

  await JobRun.updateOne(
    { _id: run._id },
    {
      $set: {
        completedAt: new Date(),
        status: errors.length ? 'partial' : 'success',
        rowsWritten,
        errors,
      },
    }
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- rollupMetrics
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/jobs/rollupMetrics.ts src/jobs/rollupMetrics.test.ts src/test-utils/factories.ts
git commit -m "feat(rollup): add nightly IAPT rollup with per-bucket computation"
```

### Task 5.2: Scheduler + CLI entrypoint

**Files:**
- Create: `src/jobs/scheduler.ts`
- Create: `src/jobs/rollupMetricsCli.ts`
- Modify: `package.json`

- [ ] **Step 1: Install node-cron**

```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

- [ ] **Step 2: Scheduler**

```ts
// src/jobs/scheduler.ts
import cron, { type ScheduledTask } from 'node-cron'
import { runNightlyRollup } from './rollupMetrics'

let task: ScheduledTask | null = null

export const startScheduler = (): void => {
  if (process.env.ROLLUP_JOB_ENABLED === 'false') {
    console.log('[scheduler] ROLLUP_JOB_ENABLED=false → skipping')
    return
  }
  task = cron.schedule(
    '0 2 * * *',
    async () => {
      console.log('[scheduler] running nightly rollup')
      try {
        await runNightlyRollup()
      } catch (err) {
        console.error('[scheduler] nightly rollup failed', err)
      }
    },
    { timezone: 'Europe/London' }
  )
  console.log('[scheduler] nightly rollup scheduled for 02:00 Europe/London')
}

export const stopScheduler = (): void => {
  if (task) {
    task.stop()
    task = null
  }
}
```

- [ ] **Step 3: CLI entrypoint**

```ts
// src/jobs/rollupMetricsCli.ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { runNightlyRollup } from './rollupMetrics'

dotenv.config()

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI as string)
  await runNightlyRollup()
  await mongoose.connection.close()
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 4: npm script**

Add to `package.json` scripts:

```json
"rollup-metrics": "ts-node ./src/jobs/rollupMetricsCli.ts"
```

- [ ] **Step 5: Commit**

```bash
git add src/jobs/scheduler.ts src/jobs/rollupMetricsCli.ts package.json package-lock.json
git commit -m "feat(scheduler): node-cron wiring + CLI entrypoint for rollups"
```

### Task 5.3: Boot hook into `src/index.ts`

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Import + start + stop**

Add near existing imports:

```ts
import { readThresholds } from './utils/thresholds'
import { startScheduler, stopScheduler } from './jobs/scheduler'
```

After `dotenv.config()`, early boot-time log:

```ts
const thresholds = readThresholds()
console.log(`[boot] thresholds k=${thresholds.k} minN=${thresholds.minN} privacyMode=${thresholds.privacyMode}`)
```

After `connectDB()`, start the scheduler:

```ts
startScheduler()
```

In the `shutdown` function, add as the first line:

```ts
stopScheduler()
```

- [ ] **Step 2: Smoke check**

```bash
npm run dev
```

Expected: logs show "thresholds k=5 minN=20 privacyMode=production" and "nightly rollup scheduled for 02:00 Europe/London".

Kill the server.

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat(boot): apply thresholds guard and start rollup scheduler"
```

---

## Phase 6 — Existing endpoint deltas

### Task 6.1: Verify-therapist requires `therapistTier` + audit

**Files:**
- Modify: `src/controllers/userController.ts`

- [ ] **Step 1: Update `adminVerifyTherapist`**

Locate the function and replace with:

```ts
const adminVerifyTherapist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id
    const { therapistId, therapistTier } = req.body as { therapistId?: string; therapistTier?: 'cbt' | 'pwp' }

    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ message: 'Not logged in' })
      return
    }
    if (!user.roles.includes(UserRole.ADMIN)) {
      res.status(403).json({ message: 'Only admins can verify therapists' })
      return
    }
    if (!therapistTier || !['cbt', 'pwp'].includes(therapistTier)) {
      res.status(400).json({ message: 'therapistTier is required and must be cbt or pwp' })
      return
    }

    const therapist = await User.findById(therapistId)
    if (!therapist) {
      res.status(404).json({ message: 'Therapist not found' })
      await logAdminAction(req, {
        action: 'therapist.verified',
        resourceType: 'therapist',
        resourceId: therapistId ?? null,
        outcome: 'failure',
        context: { reason: 'not_found' },
      })
      return
    }
    if (!therapist.roles.includes(UserRole.THERAPIST)) {
      res.status(403).json({ message: 'Only therapists can be verified' })
      await logAdminAction(req, {
        action: 'therapist.verified',
        resourceType: 'therapist',
        resourceId: therapist._id,
        outcome: 'failure',
        context: { reason: 'not_a_therapist' },
      })
      return
    }

    therapist.isVerifiedTherapist = true
    therapist.therapistTier = therapistTier
    await therapist.save()

    await logAdminAction(req, {
      action: 'therapist.verified',
      resourceType: 'therapist',
      resourceId: therapist._id,
      outcome: 'success',
      context: { therapistTier },
    })

    res.status(200).json({ message: 'Therapist verified successfully', therapist })
  } catch (error) {
    errorHandler(res, error)
  }
}
```

Add import at top:

```ts
import { logAdminAction } from '../utils/audit'
```

- [ ] **Step 2: Commit**

```bash
git add src/controllers/userController.ts
git commit -m "feat(admin): verify-therapist now requires therapistTier and emits audit"
```

### Task 6.2: Unverify-therapist endpoint

**Files:**
- Modify: `src/controllers/userController.ts`
- Modify: `src/routes/userRoute.ts`

- [ ] **Step 1: Controller**

Append to `userController.ts`:

```ts
const adminUnverifyTherapist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id
    const { therapistId } = req.body as { therapistId?: string }

    const user = await User.findById(userId)
    if (!user || !user.roles.includes(UserRole.ADMIN)) {
      res.status(403).json({ message: 'Only admins can unverify therapists' })
      return
    }

    const therapist = await User.findById(therapistId)
    if (!therapist || !therapist.roles.includes(UserRole.THERAPIST)) {
      res.status(404).json({ message: 'Therapist not found' })
      await logAdminAction(req, {
        action: 'therapist.unverified',
        resourceType: 'therapist',
        resourceId: therapistId ?? null,
        outcome: 'failure',
        context: { reason: 'not_found' },
      })
      return
    }

    therapist.isVerifiedTherapist = false
    // Keep therapistTier so we remember their category; unset only on request.
    await therapist.save()

    await logAdminAction(req, {
      action: 'therapist.unverified',
      resourceType: 'therapist',
      resourceId: therapist._id,
      outcome: 'success',
    })

    res.status(200).json({ message: 'Therapist unverified', therapist })
  } catch (error) {
    errorHandler(res, error)
  }
}
```

Add to the `export` block: `adminUnverifyTherapist`.

- [ ] **Step 2: Route**

In `src/routes/userRoute.ts`, import `adminUnverifyTherapist` and add:

```ts
router.post('/unverify', adminUnverifyTherapist)
```

- [ ] **Step 3: Commit**

```bash
git add src/controllers/userController.ts src/routes/userRoute.ts
git commit -m "feat(admin): add unverify-therapist endpoint with audit"
```

### Task 6.3: Relax `getUser` auth for admin + audit

**Files:**
- Modify: `src/controllers/userController.ts`

- [ ] **Step 1: Locate `getUser` and update**

The existing endpoint returns the logged-in user. Add support for `/:id` lookup when caller is admin.

```ts
const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterId = req.user?._id
    const requester = await User.findById(requesterId)
    if (!requester) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    // If a param id is given, only admin can look up someone else
    const targetIdParam = req.params.id
    const targetId = targetIdParam && targetIdParam !== 'me' ? targetIdParam : requesterId?.toString()

    if (targetId !== requesterId?.toString() && !requester.roles.includes(UserRole.ADMIN)) {
      res.status(403).json({ message: 'Admin access required' })
      return
    }

    const target = await User.findById(targetId)
    if (!target) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    if (requester.roles.includes(UserRole.ADMIN) && targetId !== requesterId?.toString()) {
      await logAdminAction(req, {
        action: 'user.viewed',
        resourceType: 'user',
        resourceId: target._id,
        outcome: 'success',
      })
    }

    res.status(200).json(target)
  } catch (error) {
    errorHandler(res, error)
  }
}
```

Also add a route to accept `/:id` param in `src/routes/userRoute.ts`:

```ts
router.get('/:id', getUser)
```

(Make sure this is placed after more specific `router.get('/...')` routes to avoid shadowing.)

- [ ] **Step 2: Commit**

```bash
git add src/controllers/userController.ts src/routes/userRoute.ts
git commit -m "feat(admin): relax getUser for admin lookups; emit user.viewed"
```

### Task 6.4: Relax patient-timeline endpoints + emit `patient.attemptsViewed`

**Files:**
- Modify: `src/controllers/attemptsController.ts`

- [ ] **Step 1: Locate `getPatientModuleTimeline` and `getPatientModules`**

At the top of each, after existing auth checks, modify the "is this therapist authorised for this patient?" check to also allow admins. Where the function currently rejects a non-owning therapist, add:

```ts
// Replace existing "is therapist of patient?" with:
const isOwningTherapist = therapist?.patients?.some((p) => p.equals(patientId))
const isAdmin = requester?.roles?.includes('admin')
if (!isOwningTherapist && !isAdmin) {
  res.status(403).json({ message: 'Forbidden' })
  return
}

if (isAdmin && !isOwningTherapist) {
  await logAdminAction(req, {
    action: 'patient.attemptsViewed',
    resourceType: 'patient',
    resourceId: patientId,
    outcome: 'success',
  })
}
```

Apply the same pattern to both endpoints. Import `logAdminAction`.

- [ ] **Step 2: Commit**

```bash
git add src/controllers/attemptsController.ts
git commit -m "feat(admin): allow admin to view patient timelines; emit audit"
```

### Task 6.5: Wire `module.created` audit into `createModule`

**Files:**
- Modify: `src/controllers/moduleController.ts`

- [ ] **Step 1: After the successful `Module.create(...)` call, emit audit**

```ts
await logAdminAction(req, {
  action: 'module.created',
  resourceType: 'module',
  resourceId: newModule._id,
  outcome: 'success',
  context: { title: newModule.title, type: newModule.type },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/controllers/moduleController.ts
git commit -m "feat(admin): emit module.created audit event"
```

---

## Phase 7 — New admin endpoints

### Task 7.1: Admin router scaffold

**Files:**
- Create: `src/routes/adminRoute.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Router skeleton**

```ts
// src/routes/adminRoute.ts
import express from 'express'
import authorizeAdmin from '../middleware/authorizeAdmin'

const router = express.Router()

router.use(authorizeAdmin)

// Routes added in subsequent tasks

export default router
```

- [ ] **Step 2: Mount in `index.ts`**

```ts
import adminRouter from './routes/adminRoute'
// ...
app.use('/api/admin', authenticateUser, adminRouter)
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/adminRoute.ts src/index.ts
git commit -m "feat(admin): mount /api/admin router behind auth+admin middleware"
```

### Task 7.2: `/overview` endpoint

**Files:**
- Create: `src/controllers/adminController.ts`
- Create: `src/controllers/adminController.test.ts`
- Create: `src/test-utils/app.ts`
- Modify: `src/routes/adminRoute.ts`

- [ ] **Step 1: Test-app factory**

```ts
// src/test-utils/app.ts
import express from 'express'
import cookieParser from 'cookie-parser'
import authRouter from '../routes/authRoute'
import userRouter from '../routes/userRoute'
import adminRouter from '../routes/adminRoute'
import authenticateUser from '../middleware/authMiddleware'

export const buildTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api', authRouter)
  app.use('/api/user', authenticateUser, userRouter)
  app.use('/api/admin', authenticateUser, adminRouter)
  return app
}
```

- [ ] **Step 2: Failing test for `/overview`**

```ts
// src/controllers/adminController.test.ts
import request from 'supertest'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { buildTestApp } from '../test-utils/app'
import { createUser, createProgram, createQuestionnaireModule, createAttempt } from '../test-utils/factories'

const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '7d' })

describe('GET /api/admin/overview', () => {
  beforeAll(() => { process.env.JWT_SECRET = 'test-secret' })

  it('403s for non-admin', async () => {
    const u = await createUser({ role: 'patient' })
    const res = await request(buildTestApp())
      .get('/api/admin/overview')
      .set('Cookie', [`token=${signToken(u._id.toString())}`])
    expect(res.status).toBe(403)
  })

  it('returns populated overview shape for admin', async () => {
    const admin = await createUser({ role: 'admin' })
    const programme = await createProgram('Depression')
    const phq9 = await createQuestionnaireModule({
      programId: programme._id,
      title: 'PHQ-9',
      instrument: 'phq9',
      clinicalCutoff: 10,
      reliableChangeDelta: 6,
    })
    const patient = await createUser({ role: 'patient' })
    await createAttempt({
      userId: patient._id,
      programId: programme._id,
      moduleId: phq9._id,
      totalScore: 12,
      completedAt: new Date(),
    })

    const res = await request(buildTestApp())
      .get('/api/admin/overview')
      .set('Cookie', [`token=${signToken(admin._id.toString())}`])

    expect(res.status).toBe(200)
    expect(res.body.asOf).toBeDefined()
    expect(res.body.privacyMode).toMatch(/production|reduced/)
    expect(res.body.operational.users.total).toBeGreaterThanOrEqual(2)
    expect(res.body.operational.work.completedAttemptsLast7d).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(res.body.programmes)).toBe(true)
    expect(res.body.verificationQueue).toEqual({ count: expect.any(Number), oldest: expect.any(Array) })
  })
})
```

- [ ] **Step 3: Implement controller**

```ts
// src/controllers/adminController.ts
import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { DateTime } from 'luxon'
import User from '../models/userModel'
import ModuleAttempt from '../models/moduleAttemptModel'
import ModuleAssignment from '../models/moduleAssignmentModel'
import AdminAuditEvent from '../models/adminAuditEventModel'
import JobRun from '../models/jobRunModel'
import Program from '../models/programModel'
import Module from '../models/moduleModel'
import MetricsRollup from '../models/metricsRollupModel'
import { readThresholds } from '../utils/thresholds'
import { applySuppression } from '../utils/suppression'
import { errorHandler } from '../utils/errorHandler'

const ZONE = 'Europe/London'

export const getAdminOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date()
    const thresholds = readThresholds()

    const londonNow = DateTime.fromJSDate(now, { zone: ZONE })
    const thisWeekStart = londonNow.startOf('week').toJSDate()
    const lastWeekStart = londonNow.startOf('week').minus({ weeks: 1 }).toJSDate()
    const sevenDaysAgo = londonNow.minus({ days: 7 }).toJSDate()
    const fourteenDaysAgo = londonNow.minus({ days: 14 }).toJSDate()
    const thirtyDaysAgo = londonNow.minus({ days: 30 }).toJSDate()
    const sixtyDaysAgo = londonNow.minus({ days: 60 }).toJSDate()
    const ninetyDaysAgo = londonNow.minus({ days: 90 }).toJSDate()

    // Users
    const [
      total,
      patients,
      therapistsTotal,
      therapistsVerified,
      therapistsUnverified,
      newThisWeek,
      newLastWeek,
      zeroPatientsCount,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ roles: 'patient' }),
      User.countDocuments({ roles: 'therapist' }),
      User.countDocuments({ roles: 'therapist', isVerifiedTherapist: true }),
      User.countDocuments({ roles: 'therapist', isVerifiedTherapist: false }),
      User.countDocuments({ createdAt: { $gte: thisWeekStart } }),
      User.countDocuments({ createdAt: { $gte: lastWeekStart, $lt: thisWeekStart } }),
      User.countDocuments({ roles: 'therapist', patients: { $size: 0 } }),
    ])

    // Active users (30d and previous 30d)
    const activeLast30dDocs = await ModuleAttempt.distinct('user', {
      status: 'submitted',
      completedAt: { $gte: thirtyDaysAgo },
    })
    const activeLast30dPreviousDocs = await ModuleAttempt.distinct('user', {
      status: 'submitted',
      completedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    })

    // Work
    const [completedLast7d, completedPreviousWeek, stalled7d] = await Promise.all([
      ModuleAttempt.countDocuments({ status: 'submitted', completedAt: { $gte: sevenDaysAgo } }),
      ModuleAttempt.countDocuments({
        status: 'submitted',
        completedAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      }),
      ModuleAttempt.countDocuments({ status: 'started', lastInteractionAt: { $lt: sevenDaysAgo } }),
    ])

    const byTypeAgg = await ModuleAttempt.aggregate([
      { $match: { status: 'submitted', completedAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$moduleType', count: { $sum: 1 } } },
      { $project: { _id: 0, moduleType: '$_id', count: 1 } },
    ])

    // Orphaned assignments: therapist user missing OR not verified
    const verifiedTherapistIds = (await User.find(
      { roles: 'therapist', isVerifiedTherapist: true },
      { _id: 1 }
    ).lean()).map((u) => u._id)
    const orphanedAssignments = await ModuleAssignment.countDocuments({
      therapist: { $exists: true, $ne: null, $nin: verifiedTherapistIds },
    })

    // Audit events in last 7d
    const auditEventsLast7d = await AdminAuditEvent.countDocuments({ at: { $gte: sevenDaysAgo } })

    // Programme summaries (last 90d window) — read rollups, primary instrument per programme
    const programmes = await Program.find({}, { _id: 1, title: 1 }).lean()
    const moduleByProgramme = await Module.find(
      { instrument: { $ne: null } },
      { _id: 1, program: 1, instrument: 1, clinicalCutoff: 1 }
    ).lean()

    const programmeCards = await Promise.all(
      programmes.map(async (p) => {
        const enrolledUsers = (
          await ModuleAttempt.distinct('user', { program: p._id })
        ).length
        const primary = moduleByProgramme.find(
          (m) => m.program.toString() === p._id.toString()
        )
        if (!primary) {
          return {
            programmeId: p._id.toString(),
            title: p.title,
            enrolledUsers,
            outcomes: null,
          }
        }
        // Aggregate rollups over last 90d (sum of buckets)
        const buckets = await MetricsRollup.find({
          'dimension.programmeId': p._id,
          'dimension.careTier': null,
          'dimension.instrument': primary.instrument,
          'bucket.startsAt': { $gte: ninetyDaysAgo },
        }).lean()

        const sumFor = (metric: string) => {
          const rows = buckets.filter((b) => b.metric === metric)
          const numerator = rows.reduce((s, r) => s + r.numerator, 0)
          const denominator = rows.reduce((s, r) => s + r.denominator, 0)
          return applySuppression({ numerator, denominator }, thresholds)
        }

        return {
          programmeId: p._id.toString(),
          title: p.title,
          enrolledUsers,
          outcomes: {
            window: 'last_90d' as const,
            instrument: primary.instrument,
            recovery: sumFor('recovery'),
            reliableImprovement: sumFor('reliable_improvement'),
            reliableRecovery: sumFor('reliable_recovery'),
          },
        }
      })
    )

    // Verification queue: oldest 5 unverified therapists
    const oldest = await User.find(
      { roles: 'therapist', isVerifiedTherapist: false },
      { _id: 1, username: 1, email: 1, name: 1, createdAt: 1, therapistTier: 1 }
    )
      .sort({ createdAt: 1 })
      .limit(5)
      .lean()

    const lastRollup = await JobRun.findOne(
      { job: 'rollupMetrics', status: 'success' },
      { completedAt: 1 }
    )
      .sort({ completedAt: -1 })
      .lean()

    res.status(200).json({
      asOf: now.toISOString(),
      rollupAsOf: lastRollup?.completedAt ? lastRollup.completedAt.toISOString() : null,
      privacyMode: thresholds.privacyMode,
      operational: {
        users: {
          total,
          patients,
          therapists: {
            total: therapistsTotal,
            verified: therapistsVerified,
            unverified: therapistsUnverified,
            zeroPatients: zeroPatientsCount,
          },
          newThisWeek,
          newLastWeek,
          activeLast30d: activeLast30dDocs.length,
          activeLast30dPrevious: activeLast30dPreviousDocs.length,
        },
        work: {
          completedAttemptsLast7d: completedLast7d,
          completedAttemptsPreviousWeek: completedPreviousWeek,
          stalledAttempts7d: stalled7d,
          orphanedAssignments,
          byType: byTypeAgg,
        },
        audit: {
          eventsLast7d: auditEventsLast7d,
        },
      },
      programmes: programmeCards,
      verificationQueue: {
        count: therapistsUnverified,
        oldest: oldest.map((u) => ({
          userId: u._id.toString(),
          username: u.username,
          email: u.email,
          name: u.name,
          createdAt: u.createdAt.toISOString(),
          therapistTier: u.therapistTier ?? null,
        })),
      },
    })
  } catch (error) {
    errorHandler(res, error)
  }
}
```

- [ ] **Step 4: Route**

In `src/routes/adminRoute.ts`:

```ts
import { getAdminOverview } from '../controllers/adminController'
router.get('/overview', getAdminOverview)
```

- [ ] **Step 5: Run tests**

```bash
npm test -- adminController
```

- [ ] **Step 6: Commit**

```bash
git add src/controllers/adminController.ts src/controllers/adminController.test.ts src/routes/adminRoute.ts src/test-utils/app.ts
git commit -m "feat(admin): GET /api/admin/overview with operational stats + programme cards"
```

### Task 7.3: `/outcomes` endpoint

**Files:**
- Create: `src/controllers/adminOutcomesController.ts`
- Create: `src/controllers/adminOutcomesController.test.ts`
- Modify: `src/routes/adminRoute.ts`

- [ ] **Step 1: Failing test**

```ts
// src/controllers/adminOutcomesController.test.ts
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { buildTestApp } from '../test-utils/app'
import { createUser } from '../test-utils/factories'
import MetricsRollup from '../models/metricsRollupModel'
import mongoose from 'mongoose'

const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '7d' })

describe('GET /api/admin/outcomes', () => {
  beforeAll(() => { process.env.JWT_SECRET = 'test-secret' })

  it('returns empty series for instrument with no data', async () => {
    const admin = await createUser({ role: 'admin' })
    const res = await request(buildTestApp())
      .get('/api/admin/outcomes?instrument=phq9&granularity=month')
      .set('Cookie', [`token=${signToken(admin._id.toString())}`])
    expect(res.status).toBe(200)
    expect(res.body.dimension.instrument).toBe('phq9')
    expect(res.body.series).toEqual([])
  })

  it('400s on missing instrument', async () => {
    const admin = await createUser({ role: 'admin' })
    const res = await request(buildTestApp())
      .get('/api/admin/outcomes')
      .set('Cookie', [`token=${signToken(admin._id.toString())}`])
    expect(res.status).toBe(400)
  })

  it('returns series from rollup rows', async () => {
    const admin = await createUser({ role: 'admin' })
    const bucket = {
      granularity: 'month' as const,
      startsAt: new Date('2026-03-01T00:00:00Z'),
      endsAt: new Date('2026-04-01T00:00:00Z'),
    }
    await MetricsRollup.create({
      metric: 'recovery',
      dimension: { programmeId: null, careTier: null, instrument: 'phq9' },
      bucket,
      numerator: 15,
      denominator: 30,
      n: 30,
      computedAt: new Date(),
      schemaVersion: 1,
    })
    // Override thresholds so 30 is above min
    process.env.K_ANONYMITY_THRESHOLD = '1'
    process.env.METRICS_MIN_N_FOR_DISPLAY = '1'

    const from = '2026-03-01T00:00:00Z'
    const to = '2026-04-30T00:00:00Z'
    const res = await request(buildTestApp())
      .get(`/api/admin/outcomes?instrument=phq9&granularity=month&from=${from}&to=${to}`)
      .set('Cookie', [`token=${signToken(admin._id.toString())}`])

    expect(res.status).toBe(200)
    expect(res.body.series.length).toBe(2) // March + April
    const march = res.body.series[0]
    expect(march.recovery.rate).toBeCloseTo(0.5)
    expect(march.recovery.suppressed).toBe(false)
    // April has no data → zero-denominator bucket
    expect(res.body.series[1].recovery.n).toBe(0)
    expect(res.body.series[1].recovery.suppressed).toBe(true)
  })
})
```

- [ ] **Step 2: Implement**

```ts
// src/controllers/adminOutcomesController.ts
import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { DateTime } from 'luxon'
import MetricsRollup from '../models/metricsRollupModel'
import JobRun from '../models/jobRunModel'
import { readThresholds } from '../utils/thresholds'
import { applySuppression } from '../utils/suppression'
import { enumerateBuckets } from '../utils/londonBuckets'
import { errorHandler } from '../utils/errorHandler'
import type { CareTier, Granularity, Instrument, MetricName } from '../shared-types/types'

const INSTRUMENTS: Instrument[] = ['phq9', 'gad7', 'pdss']
const CARE_TIERS_ALL: CareTier[] = ['self_help', 'cbt_guided', 'pwp_guided']
const GRANULARITIES: Granularity[] = ['week', 'month']

export const getAdminOutcomes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instrument, programmeId, careTier, granularity, from, to } = req.query as Record<string, string>

    if (!instrument || !INSTRUMENTS.includes(instrument as Instrument)) {
      res.status(400).json({ message: 'instrument query param required and must be a known instrument' })
      return
    }
    const gran: Granularity = (GRANULARITIES.includes(granularity as Granularity) ? granularity : 'month') as Granularity
    const programmeIdNorm =
      programmeId && programmeId !== 'all' ? new mongoose.Types.ObjectId(programmeId) : null
    const careTierNorm: CareTier | null =
      careTier && careTier !== 'all' && CARE_TIERS_ALL.includes(careTier as CareTier)
        ? (careTier as CareTier)
        : null

    const now = new Date()
    const defaultFrom =
      gran === 'month'
        ? DateTime.fromJSDate(now, { zone: 'Europe/London' }).minus({ months: 12 }).toJSDate()
        : DateTime.fromJSDate(now, { zone: 'Europe/London' }).minus({ weeks: 12 }).toJSDate()
    const fromDate = from ? new Date(from) : defaultFrom
    const toDate = to ? new Date(to) : now
    if (fromDate.getTime() > toDate.getTime()) {
      res.status(400).json({ message: 'from must be <= to' })
      return
    }

    const buckets = enumerateBuckets({ from: fromDate, to: toDate, granularity: gran })
    const thresholds = readThresholds()

    // Single query for all relevant rollup rows
    const rollups = await MetricsRollup.find({
      'dimension.programmeId': programmeIdNorm,
      'dimension.careTier': careTierNorm,
      'dimension.instrument': instrument,
      'bucket.granularity': gran,
      'bucket.startsAt': { $gte: fromDate },
      'bucket.endsAt': { $lte: toDate },
    }).lean()

    const rowAt = (metric: MetricName, startsAt: Date) =>
      rollups.find(
        (r) => r.metric === metric && r.bucket.startsAt.getTime() === startsAt.getTime()
      )

    const series = buckets.map((b) => {
      const rec = rowAt('recovery', b.startsAt)
      const rel = rowAt('reliable_improvement', b.startsAt)
      const relRec = rowAt('reliable_recovery', b.startsAt)
      return {
        bucket: { startsAt: b.startsAt.toISOString(), endsAt: b.endsAt.toISOString() },
        recovery: applySuppression(
          { numerator: rec?.numerator ?? 0, denominator: rec?.denominator ?? 0 },
          thresholds
        ),
        reliableImprovement: applySuppression(
          { numerator: rel?.numerator ?? 0, denominator: rel?.denominator ?? 0 },
          thresholds
        ),
        reliableRecovery: applySuppression(
          { numerator: relRec?.numerator ?? 0, denominator: relRec?.denominator ?? 0 },
          thresholds
        ),
      }
    })

    const lastRollup = await JobRun.findOne({ job: 'rollupMetrics', status: 'success' })
      .sort({ completedAt: -1 })
      .lean()

    res.status(200).json({
      asOf: now.toISOString(),
      rollupAsOf: lastRollup?.completedAt ? lastRollup.completedAt.toISOString() : null,
      privacyMode: thresholds.privacyMode,
      dimension: {
        programmeId: programmeIdNorm ? programmeIdNorm.toString() : null,
        careTier: careTierNorm,
        instrument,
      },
      range: { from: fromDate.toISOString(), to: toDate.toISOString(), granularity: gran },
      series,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}
```

- [ ] **Step 3: Route**

In `adminRoute.ts`:

```ts
import { getAdminOutcomes } from '../controllers/adminOutcomesController'
router.get('/outcomes', getAdminOutcomes)
```

- [ ] **Step 4: Run tests**

```bash
npm test -- adminOutcomesController
```

- [ ] **Step 5: Commit**

```bash
git add src/controllers/adminOutcomesController.ts src/controllers/adminOutcomesController.test.ts src/routes/adminRoute.ts
git commit -m "feat(admin): GET /api/admin/outcomes with bucketed IAPT series"
```

### Task 7.4: `/programmes/:id` endpoint

**Files:**
- Create: `src/controllers/adminProgrammesController.ts`
- Create: `src/controllers/adminProgrammesController.test.ts`
- Modify: `src/routes/adminRoute.ts`

- [ ] **Step 1: Failing test**

```ts
// src/controllers/adminProgrammesController.test.ts
import request from 'supertest'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { buildTestApp } from '../test-utils/app'
import { createUser, createProgram, createQuestionnaireModule } from '../test-utils/factories'

const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '7d' })

describe('GET /api/admin/programmes/:id', () => {
  beforeAll(() => { process.env.JWT_SECRET = 'test-secret' })

  it('404s unknown programme', async () => {
    const admin = await createUser({ role: 'admin' })
    const fake = new mongoose.Types.ObjectId().toString()
    const res = await request(buildTestApp())
      .get(`/api/admin/programmes/${fake}`)
      .set('Cookie', [`token=${signToken(admin._id.toString())}`])
    expect(res.status).toBe(404)
  })

  it('returns programme detail with empty outcomes for new programme', async () => {
    const admin = await createUser({ role: 'admin' })
    const prog = await createProgram('Depression')
    await createQuestionnaireModule({
      programId: prog._id,
      title: 'PHQ-9',
      instrument: 'phq9',
      clinicalCutoff: 10,
      reliableChangeDelta: 6,
    })
    const res = await request(buildTestApp())
      .get(`/api/admin/programmes/${prog._id.toString()}`)
      .set('Cookie', [`token=${signToken(admin._id.toString())}`])
    expect(res.status).toBe(200)
    expect(res.body.programme.title).toBe('Depression')
    expect(res.body.outcomesByInstrument.length).toBe(1)
    expect(res.body.outcomesByInstrument[0].instrument).toBe('phq9')
    expect(res.body.outcomesByInstrument[0].overall.recovery.n).toBe(0)
    expect(res.body.outcomesByInstrument[0].overall.recovery.suppressed).toBe(true)
  })
})
```

- [ ] **Step 2: Implement**

```ts
// src/controllers/adminProgrammesController.ts
import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { DateTime } from 'luxon'
import Program from '../models/programModel'
import Module from '../models/moduleModel'
import ModuleAttempt from '../models/moduleAttemptModel'
import MetricsRollup from '../models/metricsRollupModel'
import JobRun from '../models/jobRunModel'
import User from '../models/userModel'
import { readThresholds } from '../utils/thresholds'
import { applySuppression } from '../utils/suppression'
import { deriveCareTier } from '../utils/careTier'
import { errorHandler } from '../utils/errorHandler'
import type { CareTier, Instrument, MetricName } from '../shared-types/types'

const CARE_TIERS: CareTier[] = ['self_help', 'cbt_guided', 'pwp_guided']

export const getAdminProgrammeDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid programme id' })
      return
    }
    const programme = await Program.findById(id)
    if (!programme) {
      res.status(404).json({ message: 'Programme not found' })
      return
    }

    const thresholds = readThresholds()
    const now = new Date()
    const londonNow = DateTime.fromJSDate(now, { zone: 'Europe/London' })
    const ninetyDaysAgo = londonNow.minus({ days: 90 }).toJSDate()
    const sevenDaysAgo = londonNow.minus({ days: 7 }).toJSDate()

    // Enrolment — distinct users who have any attempt in this programme
    const enrolledUsers = await ModuleAttempt.distinct('user', { program: programme._id })
    // Care tier breakdown — look at each enrolled user's attempts
    const therapists = (await User.find(
      { roles: 'therapist' },
      { _id: 1, therapistTier: 1 }
    ).lean()) as unknown as Array<{ _id: mongoose.Types.ObjectId; therapistTier?: 'cbt' | 'pwp' }>
    const tierLookup: Record<string, 'cbt' | 'pwp' | undefined> = {}
    for (const t of therapists) tierLookup[t._id.toString()] = t.therapistTier

    // Pick one attempt per user to determine tier (latest attempt's therapist)
    const tierByUser = await ModuleAttempt.aggregate([
      { $match: { program: programme._id } },
      { $sort: { completedAt: -1 } },
      { $group: { _id: '$user', therapist: { $first: '$therapist' } } },
    ])

    const enrolByTier: Record<CareTier, number> = { self_help: 0, cbt_guided: 0, pwp_guided: 0 }
    for (const row of tierByUser) {
      const tier = deriveCareTier({
        attemptTherapistId: row.therapist ? row.therapist.toString() : null,
        therapistTierLookup: tierLookup,
      })
      enrolByTier[tier]++
    }

    // Clinical modules in this programme
    const modules = await Module.find(
      { program: programme._id, instrument: { $ne: null } },
      { instrument: 1, clinicalCutoff: 1, reliableChangeDelta: 1 }
    ).lean()
    const byInstrument = await Promise.all(
      modules.map(async (m) => {
        const sumFor = async (metric: MetricName, tier: CareTier | null) => {
          const rows = await MetricsRollup.find({
            metric,
            'dimension.programmeId': programme._id,
            'dimension.careTier': tier,
            'dimension.instrument': m.instrument as Instrument,
            'bucket.startsAt': { $gte: ninetyDaysAgo },
          }).lean()
          const numerator = rows.reduce((s, r) => s + r.numerator, 0)
          const denominator = rows.reduce((s, r) => s + r.denominator, 0)
          return applySuppression({ numerator, denominator }, thresholds)
        }
        const overall = {
          recovery: await sumFor('recovery', null),
          reliableImprovement: await sumFor('reliable_improvement', null),
          reliableRecovery: await sumFor('reliable_recovery', null),
        }
        const byCareTier = await Promise.all(
          CARE_TIERS.map(async (tier) => ({
            careTier: tier,
            recovery: await sumFor('recovery', tier),
            reliableImprovement: await sumFor('reliable_improvement', tier),
            reliableRecovery: await sumFor('reliable_recovery', tier),
          }))
        )
        return {
          instrument: m.instrument as Instrument,
          cutoff: m.clinicalCutoff as number,
          reliableChangeDelta: m.reliableChangeDelta ?? null,
          window: 'last_90d' as const,
          overall,
          byCareTier,
        }
      })
    )

    // Work (programme-scoped)
    const programmeModuleIds = (await Module.find({ program: programme._id }, { _id: 1 }).lean()).map((m) => m._id)
    const [completedLast7d, stalled7d, byTypeAgg] = await Promise.all([
      ModuleAttempt.countDocuments({
        status: 'submitted',
        module: { $in: programmeModuleIds },
        completedAt: { $gte: sevenDaysAgo },
      }),
      ModuleAttempt.countDocuments({
        status: 'started',
        module: { $in: programmeModuleIds },
        lastInteractionAt: { $lt: sevenDaysAgo },
      }),
      ModuleAttempt.aggregate([
        {
          $match: {
            status: 'submitted',
            module: { $in: programmeModuleIds },
            completedAt: { $gte: sevenDaysAgo },
          },
        },
        { $group: { _id: '$moduleType', count: { $sum: 1 } } },
        { $project: { _id: 0, moduleType: '$_id', count: 1 } },
      ]),
    ])

    const lastRollup = await JobRun.findOne({ job: 'rollupMetrics', status: 'success' })
      .sort({ completedAt: -1 })
      .lean()

    res.status(200).json({
      asOf: now.toISOString(),
      rollupAsOf: lastRollup?.completedAt ? lastRollup.completedAt.toISOString() : null,
      privacyMode: thresholds.privacyMode,
      programme: { _id: programme._id.toString(), title: programme.title, description: programme.description },
      enrolment: {
        total: enrolledUsers.length,
        byCareTier: CARE_TIERS.map((t) => ({ careTier: t, count: enrolByTier[t] })),
      },
      outcomesByInstrument: byInstrument,
      work: {
        completedAttemptsLast7d: completedLast7d,
        stalledAttempts7d: stalled7d,
        byType: byTypeAgg,
      },
    })
  } catch (error) {
    errorHandler(res, error)
  }
}
```

- [ ] **Step 3: Route**

In `adminRoute.ts`:

```ts
import { getAdminProgrammeDetail } from '../controllers/adminProgrammesController'
router.get('/programmes/:id', getAdminProgrammeDetail)
```

- [ ] **Step 4: Run tests**

```bash
npm test -- adminProgrammesController
```

- [ ] **Step 5: Commit**

```bash
git add src/controllers/adminProgrammesController.ts src/controllers/adminProgrammesController.test.ts src/routes/adminRoute.ts
git commit -m "feat(admin): GET /api/admin/programmes/:id with per-instrument/per-tier outcomes"
```

### Task 7.5: `/audit` endpoint

**Files:**
- Create: `src/controllers/adminAuditController.ts`
- Create: `src/controllers/adminAuditController.test.ts`
- Modify: `src/routes/adminRoute.ts`

- [ ] **Step 1: Failing test**

```ts
// src/controllers/adminAuditController.test.ts
import request from 'supertest'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { buildTestApp } from '../test-utils/app'
import { createUser } from '../test-utils/factories'
import AdminAuditEvent from '../models/adminAuditEventModel'

const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '7d' })

describe('GET /api/admin/audit', () => {
  beforeAll(() => { process.env.JWT_SECRET = 'test-secret' })

  it('returns events newest-first, paginated by cursor', async () => {
    const admin = await createUser({ role: 'admin' })
    const now = new Date()
    for (let i = 0; i < 3; i++) {
      await AdminAuditEvent.create({
        actorId: admin._id,
        actorRole: 'admin',
        impersonatorId: null,
        action: 'admin.loggedIn',
        resourceType: 'system',
        resourceId: null,
        outcome: 'success',
        at: new Date(now.getTime() - i * 1000),
      })
    }
    const res = await request(buildTestApp())
      .get('/api/admin/audit?limit=2')
      .set('Cookie', [`token=${signToken(admin._id.toString())}`])
    expect(res.status).toBe(200)
    expect(res.body.events.length).toBe(2)
    expect(res.body.nextCursor).toBeTruthy()
  })
})
```

- [ ] **Step 2: Implement**

```ts
// src/controllers/adminAuditController.ts
import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import AdminAuditEvent from '../models/adminAuditEventModel'
import User from '../models/userModel'
import { errorHandler } from '../utils/errorHandler'

export const getAdminAudit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { actorId, action, resourceType, resourceId, cursor, limit } = req.query as Record<string, string>
    const lim = Math.min(200, Math.max(1, Number(limit) || 50))

    const filter: Record<string, unknown> = {}
    if (actorId && mongoose.Types.ObjectId.isValid(actorId)) filter.actorId = new mongoose.Types.ObjectId(actorId)
    if (action) filter.action = action
    if (resourceType) filter.resourceType = resourceType
    if (resourceId && mongoose.Types.ObjectId.isValid(resourceId)) filter.resourceId = new mongoose.Types.ObjectId(resourceId)
    if (cursor) filter.at = { $lt: new Date(cursor) }

    const rows = await AdminAuditEvent.find(filter).sort({ at: -1 }).limit(lim + 1).lean()
    const hasMore = rows.length > lim
    const slice = hasMore ? rows.slice(0, lim) : rows

    const actorIds = Array.from(new Set(slice.map((e) => e.actorId.toString())))
    const actors = await User.find({ _id: { $in: actorIds } }, { _id: 1, username: 1, name: 1 }).lean()
    const actorById = new Map(actors.map((a) => [a._id.toString(), a]))

    const events = slice.map((e) => {
      const a = actorById.get(e.actorId.toString())
      return {
        _id: e._id.toString(),
        actorId: e.actorId.toString(),
        actor: a
          ? { _id: a._id.toString(), username: a.username, name: a.name }
          : { _id: e.actorId.toString(), username: 'unknown' },
        actorRole: e.actorRole,
        impersonatorId: e.impersonatorId ? e.impersonatorId.toString() : null,
        action: e.action,
        resourceType: e.resourceType,
        resourceId: e.resourceId ? e.resourceId.toString() : null,
        outcome: e.outcome,
        context: e.context,
        ip: e.ip,
        userAgent: e.userAgent,
        at: e.at.toISOString(),
      }
    })

    res.status(200).json({
      success: true,
      events,
      nextCursor: hasMore ? slice[slice.length - 1].at.toISOString() : null,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}
```

- [ ] **Step 3: Route**

```ts
import { getAdminAudit } from '../controllers/adminAuditController'
router.get('/audit', getAdminAudit)
```

- [ ] **Step 4: Run tests**

```bash
npm test -- adminAuditController
```

- [ ] **Step 5: Commit**

```bash
git add src/controllers/adminAuditController.ts src/controllers/adminAuditController.test.ts src/routes/adminRoute.ts
git commit -m "feat(admin): GET /api/admin/audit paginated + filterable"
```

### Task 7.6: `/system/health`

**Files:**
- Modify: `src/controllers/adminController.ts`
- Modify: `src/routes/adminRoute.ts`

- [ ] **Step 1: Controller**

Append to `adminController.ts`:

```ts
export const getAdminSystemHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    const lastRun = await JobRun.findOne({ job: 'rollupMetrics' })
      .sort({ startedAt: -1 })
      .lean()
    const auditEventsTotal = await AdminAuditEvent.estimatedDocumentCount()
    res.status(200).json({
      rollupLastRun: lastRun
        ? {
            startedAt: lastRun.startedAt.toISOString(),
            completedAt: lastRun.completedAt ? lastRun.completedAt.toISOString() : null,
            status: lastRun.status,
            rowsWritten: lastRun.rowsWritten,
          }
        : null,
      auditEventsTotal,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}
```

- [ ] **Step 2: Route**

```ts
import { getAdminSystemHealth } from '../controllers/adminController'
router.get('/system/health', getAdminSystemHealth)
```

- [ ] **Step 3: Commit**

```bash
git add src/controllers/adminController.ts src/routes/adminRoute.ts
git commit -m "feat(admin): GET /api/admin/system/health"
```

---

## Phase 8 — Dev seed

### Task 8.1: `seedAdminDev`

**Files:**
- Create: `src/seeds/seedAdminDev.ts`
- Modify: `package.json`

- [ ] **Step 1: Write seed**

```ts
// src/seeds/seedAdminDev.ts
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import User from '../models/userModel'
import Program from '../models/programModel'
import Module from '../models/moduleModel'
import ModuleAttempt from '../models/moduleAttemptModel'

dotenv.config()

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run dev seed in production')
  process.exit(1)
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI as string)

  const depression = await Program.findOne({ title: /depression/i })
  const gad = await Program.findOne({ title: /anxiety/i })
  const phq9 = await Module.findOne({ instrument: 'phq9' })
  const gad7 = await Module.findOne({ instrument: 'gad7' })
  if (!depression || !gad || !phq9 || !gad7) {
    console.error('Missing Depression/GAD programme or PHQ-9/GAD-7 modules. Run seed-all + seed:clinical-metadata first.')
    process.exit(1)
  }

  // 3 therapists
  const therapists = await Promise.all(
    ['cbt', 'pwp', 'cbt'].map(async (tier, i) =>
      User.create({
        username: `dev_ther_${i}`,
        email: `dev_ther_${i}@test.bwell`,
        password: await bcrypt.hash('devpass1234', 10),
        roles: ['therapist'],
        isVerifiedTherapist: true,
        therapistTier: tier,
      })
    )
  )

  // 30 patients: 10 self-help, 10 CBT, 10 PWP
  const patients = await Promise.all(
    Array.from({ length: 30 }).map(async (_, i) => {
      const assignment = i < 10 ? null : i < 20 ? therapists[0] : therapists[1]
      return User.create({
        username: `dev_pat_${i}`,
        email: `dev_pat_${i}@test.bwell`,
        password: await bcrypt.hash('devpass1234', 10),
        roles: ['patient'],
        therapist: assignment?._id,
      })
    })
  )

  // 8 weekly attempts per patient per instrument
  const now = new Date()
  for (const p of patients) {
    const baselinePHQ = rand(12, 22)
    const baselineGAD = rand(10, 18)
    // 40% reach recovery (cross threshold in last attempt)
    const willRecover = Math.random() < 0.4

    for (let w = 0; w < 8; w++) {
      const completedAt = new Date(now.getTime() - (8 - w) * 7 * 24 * 60 * 60 * 1000 + rand(0, 6 * 3600 * 1000))
      const progression = willRecover ? (baselinePHQ * (1 - (w + 1) / 9)) : baselinePHQ - rand(0, 3)
      const phqScore = Math.max(0, Math.round(progression + rand(-2, 2)))
      const gadScore = Math.max(0, Math.round(baselineGAD - (willRecover ? w * 1.2 : rand(0, 2))))

      for (const [mod, score, prog] of [
        [phq9, phqScore, depression._id],
        [gad7, gadScore, gad._id],
      ] as const) {
        await ModuleAttempt.create({
          user: p._id,
          therapist: p.therapist,
          program: prog,
          module: mod._id,
          moduleType: 'questionnaire',
          status: 'submitted',
          startedAt: completedAt,
          completedAt,
          lastInteractionAt: completedAt,
          totalScore: score,
        })
      }
    }
  }

  console.log(`✔ seeded ${therapists.length} therapists, ${patients.length} patients, ~${patients.length * 8 * 2} attempts`)
  await mongoose.connection.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: npm script**

```json
"seed:admin-dev": "ts-node ./src/seeds/seedAdminDev.ts"
```

- [ ] **Step 3: Run against dev DB**

```bash
npm run seed:admin-dev
```

Expected: prints seeded counts; admin endpoints now return populated data.

- [ ] **Step 4: Commit**

```bash
git add src/seeds/seedAdminDev.ts package.json
git commit -m "feat(seed): dev-only admin dataset with realistic recovery distribution"
```

---

## Phase 9 — Shared types v2 + publish

After all endpoints are built and stable, publish the response-shape types.

### Task 9.1: Response types

**Files:**
- Modify: `src/shared-types/types.ts`

- [ ] **Step 1: Append full response types**

Add the four response types from spec §6. Copy directly from the spec — do not paraphrase.

Response types to add:

```ts
// ==================================
// Admin — response shapes (v2)
// ==================================
export type AdminOverviewResponse = {
  asOf: string
  rollupAsOf: string | null
  privacyMode: PrivacyMode
  operational: {
    users: {
      total: number
      patients: number
      therapists: { total: number; verified: number; unverified: number; zeroPatients: number }
      newThisWeek: number
      newLastWeek: number
      activeLast30d: number
      activeLast30dPrevious: number
    }
    work: {
      completedAttemptsLast7d: number
      completedAttemptsPreviousWeek: number
      stalledAttempts7d: number
      orphanedAssignments: number
      byType: Array<{ moduleType: ModuleType; count: number }>
    }
    audit: { eventsLast7d: number }
  }
  programmes: Array<{
    programmeId: string
    title: string
    enrolledUsers: number
    outcomes: {
      window: 'last_90d'
      instrument: Instrument
      recovery: OutcomeResult
      reliableImprovement: OutcomeResult
      reliableRecovery: OutcomeResult
    } | null
  }>
  verificationQueue: {
    count: number
    oldest: Array<{
      userId: string
      username: string
      email: string
      name?: string
      createdAt: string
      therapistTier: TherapistTier | null
    }>
  }
}

export type AdminOutcomesResponse = {
  asOf: string
  rollupAsOf: string | null
  privacyMode: PrivacyMode
  dimension: {
    programmeId: string | null
    careTier: CareTier | null
    instrument: Instrument
  }
  range: { from: string; to: string; granularity: Granularity }
  series: Array<{
    bucket: { startsAt: string; endsAt: string }
    recovery: OutcomeResult
    reliableImprovement: OutcomeResult
    reliableRecovery: OutcomeResult
  }>
}

export type AdminProgrammeDetailResponse = {
  asOf: string
  rollupAsOf: string | null
  privacyMode: PrivacyMode
  programme: { _id: string; title: string; description: string }
  enrolment: {
    total: number
    byCareTier: Array<{ careTier: CareTier; count: number }>
  }
  outcomesByInstrument: Array<{
    instrument: Instrument
    cutoff: number
    reliableChangeDelta: number | null
    window: 'last_90d'
    overall: {
      recovery: OutcomeResult
      reliableImprovement: OutcomeResult
      reliableRecovery: OutcomeResult
    }
    byCareTier: Array<{
      careTier: CareTier
      recovery: OutcomeResult
      reliableImprovement: OutcomeResult
      reliableRecovery: OutcomeResult
    }>
  }>
  work: {
    completedAttemptsLast7d: number
    stalledAttempts7d: number
    byType: Array<{ moduleType: ModuleType; count: number }>
  }
}

export type AdminAuditEvent = {
  _id: string
  actorId: string
  actor: { _id: string; username: string; name?: string }
  actorRole: 'admin'
  impersonatorId: string | null
  action: AuditedAction
  resourceType: string
  resourceId: string | null
  outcome: 'success' | 'failure'
  context?: Record<string, unknown>
  ip?: string
  userAgent?: string
  at: string
}

export type AdminAuditResponse = {
  success: true
  events: Array<AdminAuditEvent>
  nextCursor: string | null
}

export type AdminSystemHealthResponse = {
  rollupLastRun:
    | {
        startedAt: string
        completedAt: string | null
        status: 'success' | 'partial' | 'failure'
        rowsWritten: number
      }
    | null
  auditEventsTotal: number
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shared-types/types.ts
git commit -m "feat(shared-types): add admin response types (v2)"
```

### Task 9.2: Publish v2

- [ ] **Step 1: Bump + publish**

```bash
npm --prefix src/shared-types version minor
npm run publish
```

- [ ] **Step 2: Commit version**

```bash
git add src/shared-types/package.json
git commit -m "chore(shared-types): publish v2 admin response types"
```

- [ ] **Step 3: FE sync (informational)**

FE dev runs `npm run update-types` in `/Users/milobedini/Documents/git/bwell` to pick up v2.

---

## Phase 10 — Legacy endpoint deprecation note

### Task 10.1: Deprecation comment on old `adminStats`

**Files:**
- Modify: `src/controllers/userController.ts`

- [ ] **Step 1: Add deprecation comment above `adminStats`**

```ts
// DEPRECATED: superseded by GET /api/admin/overview. Kept for one release to avoid FE outage.
// Remove after FE v2 ships and has been live for at least 7 days.
const adminStats = async (...) => { ... }
```

Do not remove the endpoint or its route.

- [ ] **Step 2: Commit**

```bash
git add src/controllers/userController.ts
git commit -m "docs(admin): mark legacy adminStats endpoint as deprecated"
```

---

## Shared-types publish checkpoints

| Publish | After task | Contents |
|---|---|---|
| v1 — admin primitives | 1.3 | `Instrument`, `CareTier`, `TherapistTier`, `AuditedAction`, `MetricName`, `PrivacyMode`, `Granularity`, `OutcomeResult`; `Module` + `AuthUser`/`UsersListItem` extensions |
| v2 — admin response types | 9.2 | `AdminOverviewResponse`, `AdminOutcomesResponse`, `AdminProgrammeDetailResponse`, `AdminAuditEvent`, `AdminAuditResponse`, `AdminSystemHealthResponse` |

After each publish, FE runs `npm run update-types` in `/Users/milobedini/Documents/git/bwell`.

---

## Environment variables (summary)

Add to BE `.env` (dev). Production values omitted if equal to defaults.

```
K_ANONYMITY_THRESHOLD=1              # dev ONLY; omit in production (defaults to 5)
METRICS_MIN_N_FOR_DISPLAY=1          # dev ONLY; omit in production (defaults to 20)
ROLLUP_JOB_ENABLED=true              # set false only when disabling the nightly cron
```

Production boot-guard: if `NODE_ENV=production` and either value is below its default, a warning is logged and the defaults are forced. See `src/utils/thresholds.ts`.

---

## Test plan

Unit tests live beside the module they test (`*.test.ts`). Integration tests for rollups and endpoints live in `src/jobs/*.test.ts` and `src/controllers/*.test.ts` respectively.

### Unit

- **`thresholds.test.ts`** — defaults, env overrides, production guard, privacyMode computation.
- **`suppression.test.ts`** — below-k, below-minN, happy path, zero denominator, zero numerator.
- **`careTier.test.ts`** — all branches incl. missing/null fallback.
- **`londonBuckets.test.ts`** — Monday boundary, DST transitions, contiguous enumeration.
- **`iaptPairing.test.ts`** — baseline/endpoint selection, denominator rules, missing delta, multi-user aggregation.
- **`audit.test.ts`** — event write shape, null resourceId, error swallowing.

### Integration

- **`rollupMetrics.test.ts`** — platform/per-programme/per-careTier rollups for PHQ-9; idempotency on re-run; bucket boundary DST; missing `reliableChangeDelta` skips rows.
- **`adminController.test.ts`** — `GET /overview`: non-admin 403s; admin returns expected shape; `rollupAsOf` null when no job has run; empty-state zeros.
- **`adminOutcomesController.test.ts`** — missing instrument 400; empty series; suppression at zero denominator; cross-bucket series assembly.
- **`adminProgrammesController.test.ts`** — unknown id 404; new programme returns suppressed outcomes; per-tier breakdown rows present.
- **`adminAuditController.test.ts`** — pagination with `nextCursor`; filter composition (actorId + action); newest-first ordering.
- **`verify-therapist` integration** — emits both success and failure audit events; rejects missing `therapistTier`.

Run all tests:

```bash
npm test
```

Expected: all suites pass. First run downloads `mongodb-memory-server` binary (30–60s). Subsequent runs cached.

---

## Observability

- **Boot log** (`src/index.ts`): `[boot] thresholds k=5 minN=20 privacyMode=production` (or dev values).
- **Scheduler log** (`src/jobs/scheduler.ts`): on boot, logs schedule; on each run, logs start and end.
- **Rollup log** (`src/jobs/rollupMetrics.ts`): per-run `JobRun` doc with `{ startedAt, completedAt, status, rowsWritten, errors }`.
- **Audit collection** — every admin write emits a row via `logAdminAction()`; failures swallowed but `console.error`'d.
- **`/api/admin/system/health`** — exposes `rollupLastRun` + `auditEventsTotal` for ops checks; no UI commitment in MVP.

---

## Out of scope for this plan

Do not build any of these even if tempted. They live in `docs/plans/admin-future.md` and require a separate brainstorm:

- Owner tier above admin
- Impersonation (token propagation, write blocking, etc.)
- Admin-triggered password reset
- Soft-delete / GDPR erasure workflow
- Role change (grant / revoke)
- Per-therapist outcome metrics
- Data-quality dashboard
- Programme catalogue editor UI
- Export / DSAR workflow
- Per-resource access restriction
- Episode-of-care concept
- Tier-at-time fidelity for rollups
- Rollup / audit archival
- Multi-role user semantics
- Audit log retention policy enforcement
- Additional instruments (OCI-R, IES-R, Mini-SPIN, HAI, etc.)

---

## Completion criteria

- All 10 phases committed on `main` (BE repo).
- `npm test` green.
- `npm run lint` / `npm run build` green.
- `npm run seed:clinical-metadata` run against dev DB.
- `npm run seed:admin-dev` run against dev DB.
- Shared-types v1 and v2 published; FE has run `npm run update-types`.
- Admin dev user can hit `GET /api/admin/overview`, `GET /api/admin/outcomes?instrument=phq9`, `GET /api/admin/programmes/:id`, `GET /api/admin/audit` and see populated responses.
