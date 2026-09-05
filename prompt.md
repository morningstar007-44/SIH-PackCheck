

# PACKCHECK — COMPLETE BUILD SPECIFICATION

## For AI Agent Execution

---

## PREAMBLE — READ THIS FIRST

You are about to build a complete, functional, production-grade web application called **PackCheck**. This is not a mockup. This is not a design exercise. This is not a static prototype. You are building a real, working application that a person can open in a browser, scan an actual product package, and receive a genuine compliance inspection result.

You must act as a full-stack engineering team. You are simultaneously the frontend engineer, backend engineer, database architect, OCR integration engineer, rule engine developer, UI/UX designer, accessibility engineer, security engineer, and QA tester.

**Do not ask questions. Make decisions. Build the product.**

---

## SECTION 1 — PRODUCT DEFINITION

### 1.1 — What Is PackCheck?

PackCheck is a web application that helps Legal Metrology inspectors verify whether product packaging declarations comply with the Legal Metrology (Packaged Commodities) Rules. An inspector opens the app, scans or photographs a product package, and the system extracts text from the image, identifies mandatory declarations (manufacturer name, net quantity, MRP, manufacturing date, etc.), checks each declaration against a rule engine, and produces a compliance report.

### 1.2 — Tagline

"Package inspection, made simpler."

### 1.3 — Core Value Proposition

Replace manual, error-prone visual inspection of product packages with a structured, evidence-based digital workflow. The system assists the inspector — it does not replace the inspector's judgment.

---

## SECTION 2 — TECHNOLOGY STACK (EXPLICIT)

You must use the following stack. Do not deviate.

### 2.1 — Frontend Framework

**React** with **TypeScript**. Use Vite as the build tool. Do not use Create React App. Do not use Next.js unless you have a strong architectural reason and explain it.

### 2.2 — Styling

**Tailwind CSS**. No CSS-in-JS libraries. No styled-components. No Material UI. No Ant Design. No Chakra UI. Use Tailwind utility classes directly. If you need component abstractions, build them yourself with Tailwind.

### 2.3 — Icons

**Lucide React** only. No other icon library. No Font Awesome. No Hero Icons. No custom SVG icon sets. Lucide provides clean, simple, professional icons that match the design philosophy.

### 2.4 — Routing

**React Router v6**. Standard client-side routing.

### 2.5 — State Management

**React Context + useReducer** for global state (auth, current inspection). **Local component state** (useState) for UI state. Do not install Redux, Zustand, Jotai, or MobX. The application is not complex enough to warrant external state management.

### 2.6 — Backend & Database

**Supabase**. This is mandatory. You will use Supabase for:

- **Authentication** — real email/password login and logout
- **Database** — PostgreSQL via Supabase for storing inspections, results, and user data
- **Storage** — Supabase Storage for uploaded/captured package images
- **Row Level Security** — every table must have RLS policies so users can only access their own data

### 2.7 — OCR

**Tesseract.js** as the primary OCR engine. This runs entirely in the browser. No server required. No external API key required. This is critical because it means the demo works without any third-party OCR service.

Additionally, create an abstraction layer (an OCR service interface) so that Tesseract.js can be swapped for Google Cloud Vision, AWS Textract, or any other OCR provider in production. The interface must be:

```typescript
interface OCRService {
  extractText(image: File | Blob): Promise<OCRResult>;
}

interface OCRResult {
  fullText: string;
  confidence: number;
  blocks: Array<{
    text: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
}
```

### 2.8 — Declaration Extraction

After OCR produces raw text, a **declaration extraction service** parses the text into structured fields. This service uses pattern matching (regex), keyword detection, and heuristic rules. It does NOT require an LLM. Build it with pure TypeScript logic.

If you want to add an optional LLM-powered extraction path for higher accuracy, create it behind the same interface. But the default path must work without any API key.

### 2.9 — PDF Generation

**jsPDF** or **@react-pdf/renderer**. The PDF must be generated client-side. The user clicks "Download PDF" and gets an actual PDF file containing the real inspection data.

### 2.10 — Camera

**Native browser API**: `navigator.mediaDevices.getUserMedia()`. No third-party camera libraries. Handle all permission states, device enumeration, and fallbacks yourself.

---

## SECTION 3 — SUPABASE CONFIGURATION (DETAILED)

### 3.1 — Environment Variables

Create a `.env` file at the project root. This file must be in `.gitignore`. Never commit it.

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**CRITICAL SECURITY RULES:**

1. Never hardcode Supabase URL or keys anywhere in the source code
2. Always read from `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`
3. The anon key is a *public* key — it is designed to be used in frontends. But it must still be in `.env` for configurability
4. Never expose the `service_role` key in frontend code. If you need it, it goes in a server-side function only
5. Create a `.env.example` file with placeholder values so other developers know what variables are needed:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3.2 — Supabase Client Initialization

Create a single file `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env and fill in your values.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3.3 — Database Schema

Create these tables in Supabase. Provide the SQL migration.

**Table: profiles**

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'inspector',
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

**Table: inspections**

```sql
CREATE TABLE inspections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_name TEXT,
  inspection_date TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  compliance_score NUMERIC(5,2),
  overall_result TEXT CHECK (overall_result IN ('compliant', 'non_compliant', 'requires_review')),
  image_urls TEXT[],
  ocr_raw_text TEXT,
  ocr_confidence NUMERIC(5,2),
  extracted_declarations JSONB,
  rule_results JSONB,
  total_rules_checked INTEGER DEFAULT 0,
  rules_passed INTEGER DEFAULT 0,
  rules_failed INTEGER DEFAULT 0,
  rules_review INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inspections"
  ON inspections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inspections"
  ON inspections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inspections"
  ON inspections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inspections"
  ON inspections FOR DELETE
  USING (auth.uid() = user_id);
```

**Table: rule_sets**

```sql
CREATE TABLE rule_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rule_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view rule sets"
  ON rule_sets FOR SELECT
  TO authenticated
  USING (true);
```

**Storage Bucket:**

Create a storage bucket called `inspection-images` with the following policy:

- Authenticated users can upload to their own folder (`user_id/`)
- Authenticated users can read their own files
- No public access

### 3.4 — Authentication Flow

Use Supabase Auth with email/password. Implement:

1. **Sign Up** — email + password + full name
2. **Sign In** — email + password
3. **Sign Out** — clear session
4. **Auth State Listener** — `supabase.auth.onAuthStateChange()` to reactively update the UI
5. **Protected Routes** — wrap authenticated pages in a guard component that redirects to login if no session exists
6. **Profile Creation** — on sign up, automatically insert a row into the `profiles` table using a Supabase database trigger or client-side logic after sign up

**Auth Context:**

Create `src/contexts/AuthContext.tsx` that provides:

```typescript
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

---

## SECTION 4 — APPLICATION ARCHITECTURE

### 4.1 — Folder Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI primitives (Button, Input, Badge, Card, etc.)
│   ├── layout/                # Shell, Sidebar, Header, MobileNav
│   ├── camera/                # CameraCapture, CameraPreview, CameraPermissionDenied
│   ├── inspection/            # InspectionCard, DeclarationRow, ComplianceBadge
│   ├── evidence/              # EvidenceViewer, ImageAnnotation
│   └── report/                # ReportPreview, ReportPDF
├── pages/
│   ├── LoginPage.tsx
│   ├── SignUpPage.tsx
│   ├── OverviewPage.tsx
│   ├── NewInspectionPage.tsx
│   ├── CameraPage.tsx
│   ├── ImagePreviewPage.tsx
│   ├── ProcessingPage.tsx
│   ├── InspectionResultPage.tsx
│   ├── EvidenceReviewPage.tsx
│   ├── HistoryPage.tsx
│   ├── ReportPage.tsx
│   ├── RulesPage.tsx
│   └── SettingsPage.tsx
├── services/
│   ├── ocr/
│   │   ├── types.ts           # OCRService interface, OCRResult type
│   │   ├── tesseractService.ts # Tesseract.js implementation
│   │   └── index.ts           # Export the active service
│   ├── extraction/
│   │   ├── types.ts           # ExtractedDeclarations type
│   │   ├── patternExtractor.ts # Regex/heuristic extraction
│   │   └── index.ts
│   ├── rules/
│   │   ├── types.ts           # Rule, RuleResult types
│   │   ├── engine.ts          # Rule evaluation engine
│   │   ├── defaultRules.ts    # Default Legal Metrology rules
│   │   └── index.ts
│   ├── inspection/
│   │   ├── inspectionService.ts # Orchestrates OCR → extraction → rules → storage
│   │   └── index.ts
│   ├── report/
│   │   ├── pdfGenerator.ts    # PDF report generation
│   │   └── index.ts
│   └── storage/
│       ├── imageService.ts    # Upload/retrieve images from Supabase Storage
│       └── index.ts
├── contexts/
│   ├── AuthContext.tsx
│   └── InspectionContext.tsx
├── hooks/
│   ├── useCamera.ts           # Camera access, stream management
│   ├── useInspection.ts       # Current inspection state
│   ├── useInspections.ts      # Inspection history queries
│   └── useMediaQuery.ts       # Responsive breakpoints
├── lib/
│   ├── supabase.ts
│   └── constants.ts
├── types/
│   ├── inspection.ts
│   ├── declarations.ts
│   ├── rules.ts
│   └── user.ts
├── utils/
│   ├── imageUtils.ts          # Resize, compress, validate images
│   ├── formatters.ts          # Date, number, percentage formatting
│   └── validators.ts          # Input validation
├── data/
│   └── sampleInspections.ts   # Demo data for empty states / development
├── App.tsx
├── main.tsx
└── index.css
```

### 4.2 — Separation of Concerns

This is non-negotiable:

- **Pages** handle layout and orchestration only. They call services and pass data to components.
- **Components** handle rendering only. They receive props and emit events. They do not call Supabase directly. They do not run OCR. They do not evaluate rules.
- **Services** handle all business logic. OCR, extraction, rule evaluation, database operations, image processing, PDF generation — all live in services.
- **Hooks** are thin wrappers that connect services to React's lifecycle. They manage loading/error states and expose clean interfaces to pages.
- **Contexts** hold global state (auth, current inspection session).

If you catch yourself writing a Supabase query inside a component's JSX: STOP. Move it to a service. Call the service from a hook. Use the hook in the component.

---

## SECTION 5 — DESIGN SYSTEM (EXHAUSTIVE)

### 5.1 — Design Philosophy

The application must look like it was designed by a senior product designer at a government technology agency. Think: GOV.UK design system. Think: well-designed enterprise inspection software. Think: a tool that a 55-year-old government inspector picks up and understands in 10 seconds.

**It must NOT look like:**
- A Silicon Valley AI startup
- A crypto dashboard
- A cybersecurity command center
- A ChatGPT wrapper
- A hackathon project
- A template from Dribbble

**It MUST look like:**
- A professional inspection tool
- A government compliance system
- An enterprise document verification platform
- Something a human designer carefully crafted

### 5.2 — Color Palette (EXACT VALUES)

```css
/* Backgrounds */
--bg-primary: #FFFFFF;
--bg-secondary: #F8F9FA;
--bg-tertiary: #F1F3F5;

/* Text */
--text-primary: #212529;
--text-secondary: #495057;
--text-tertiary: #868E96;
--text-inverse: #FFFFFF;

/* Borders */
--border-light: #E9ECEF;
--border-default: #DEE2E6;
--border-strong: #CED4DA;

/* Accent */
--accent-primary: #1971C2;
--accent-primary-hover: #1864AB;
--accent-primary-light: #E7F0F9;

/* Status */
--status-pass: #2B8A3E;
--status-pass-bg: #EBFBEE;
--status-fail: #C92A2A;
--status-fail-bg: #FFF5F5;
--status-review: #E67700;
--status-review-bg: #FFF9DB;
--status-info: #1971C2;
--status-info-bg: #E7F5FF;

/* Surfaces */
--surface-elevated: #FFFFFF;
--surface-sunken: #F8F9FA;
```

Translate these to Tailwind config. Extend the default Tailwind theme.

**ABSOLUTELY NO GRADIENTS.** Every background, button, card, header, and surface uses a flat solid color. If you even consider writing `bg-gradient-to-r`: stop. Use a flat color.

### 5.3 — Typography

Use the system font stack for maximum performance and native feel:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

**Type Scale:**

| Usage | Size | Weight | Line Height | Color |
|---|---|---|---|---|
| Page Title | 24px (text-2xl) | 600 (semibold) | 1.3 | text-primary |
| Page Subtitle | 14px (text-sm) | 400 (normal) | 1.5 | text-secondary |
| Section Header | 16px (text-base) | 600 (semibold) | 1.4 | text-primary |
| Body | 14px (text-sm) | 400 (normal) | 1.5 | text-primary |
| Small/Caption | 12px (text-xs) | 400 (normal) | 1.5 | text-tertiary |
| Label | 12px (text-xs) | 500 (medium) | 1.4 | text-secondary |
| Button | 14px (text-sm) | 500 (medium) | 1 | varies |
| Metric Value | 32px (text-3xl) | 700 (bold) | 1.2 | text-primary |

### 5.4 — Spacing

Use Tailwind's default spacing scale. Prefer multiples of 4px (p-1 = 4px, p-2 = 8px, p-3 = 12px, p-4 = 16px, p-6 = 24px, p-8 = 32px).

**Page padding:** `p-6` on desktop, `p-4` on mobile.

**Card padding:** `p-5` on desktop, `p-4` on mobile.

**Between sections:** `space-y-6` or `gap-6`.

**Between items in a list:** `space-y-3` or `gap-3`.

### 5.5 — Border Radius

Moderate. Not excessive.

- Buttons: `rounded-lg` (8px)
- Cards: `rounded-lg` (8px)
- Inputs: `rounded-lg` (8px)
- Badges: `rounded-md` (6px)
- Avatars: `rounded-full`

Do NOT use `rounded-3xl` or `rounded-[20px]` or any excessively rounded elements.

### 5.6 — Shadows

Minimal. Use only when necessary to create elevation.

- Cards that need elevation: `shadow-sm`
- Dropdowns/modals: `shadow-lg`
- Most elements: no shadow at all. Use borders instead.

### 5.7 — Borders

Use `border` with `border-light` or `border-default` color. 1px solid borders. This is the primary way to define element boundaries — not shadows, not background changes.

### 5.8 — Buttons

**Primary:**
```
bg-[#1971C2] text-white hover:bg-[#1864AB] 
font-medium text-sm px-4 py-2.5 rounded-lg
border-none cursor-pointer
transition-colors duration-150
```

**Secondary:**
```
bg-white text-[#212529] border border-[#DEE2E6] 
hover:bg-[#F8F9FA]
font-medium text-sm px-4 py-2.5 rounded-lg
cursor-pointer transition-colors duration-150
```

**Destructive:**
```
bg-[#C92A2A] text-white hover:bg-[#A51111]
font-medium text-sm px-4 py-2.5 rounded-lg
border-none cursor-pointer transition-colors duration-150
```

**Ghost:**
```
bg-transparent text-[#495057] hover:bg-[#F1F3F5]
font-medium text-sm px-4 py-2.5 rounded-lg
border-none cursor-pointer transition-colors duration-150
```

Touch targets: minimum 44px height on mobile.

### 5.9 — Cards

```
bg-white border border-[#E9ECEF] rounded-lg p-5
```

No shadow by default. No hover effects unless the card is clickable. If clickable, add `hover:border-[#CED4DA] cursor-pointer transition-colors duration-150`.

### 5.10 — Input Fields

```
w-full bg-white border border-[#DEE2E6] rounded-lg px-3 py-2.5
text-sm text-[#212529] placeholder:text-[#ADB5BD]
focus:outline-none focus:ring-2 focus:ring-[#1971C2] focus:ring-offset-1 focus:border-[#1971C2]
transition-all duration-150
```

Labels above inputs. 4px gap between label and input.

### 5.11 — What NOT to Design

Do NOT create:
- Animated gradients
- Glowing borders or buttons
- Sparkle icons or emojis
- Purple/blue AI-themed color schemes
- Neural network visualizations
- Floating particle backgrounds
- Glassmorphism (blurred transparent cards)
- Neumorphism (soft extruded buttons)
- Dark mode cybersecurity themes
- Futuristic scan animations (no rotating circles, no laser lines, no holographic effects)
- Robot or brain mascots
- "AI-powered" badges
- Any text that says "AI" unless absolutely necessary in a technical context

If the design would look at home on an AI startup's landing page: **redesign it.**

---

## SECTION 6 — COMPLETE SCREEN SPECIFICATIONS

### SCREEN 1 — Login Page

**Route:** `/login`

**Layout:** Centered card on a neutral background.

**Content:**

```
[PackCheck logo — simple text mark, no graphic logo]

PackCheck

Package inspection, made simpler.

─────────────────────────────────

Email
[_________________________]

Password
[_________________________]

[ Sign In ]                    (full width, primary button)

Don't have an account? Sign up

─────────────────────────────────
```

**Behavior:**
- Call `supabase.auth.signInWithPassword({ email, password })`
- Show inline error messages below the relevant field: "Invalid email or password"
- Show loading state on the Sign In button while authenticating
- On success, redirect to `/overview`
- If already authenticated (session exists), redirect to `/overview` immediately

**Sign Up Page (`/signup`):**
Same layout with additional "Full Name" field. After sign up, insert profile row and redirect to `/overview`.

**Technical notes:**
- Use the `AuthContext` to manage auth state
- Use a `ProtectedRoute` wrapper component that checks `user` from `AuthContext` and redirects unauthenticated users to `/login`

### SCREEN 2 — Overview Page

**Route:** `/overview`

**Layout:** Sidebar on desktop, bottom nav or drawer on mobile. Main content area.

**Content:**

```
Overview
Review recent inspections and packages requiring attention.

[ + New Inspection ]           (primary button, top right)

─────────────────────────────────

[Total]     [Compliant]     [Issues]     [Review]
  47           39              5            3

─────────────────────────────────

Needs Attention
(List of inspections with status "requires_review" or "non_compliant")

Product          Date         Score    Status
DailyCare Soap   12 Jun 2025  72%     Requires Review
Kitchen Mixer    10 Jun 2025  65%     Potential Issue

─────────────────────────────────

Recent Inspections
(Last 10 inspections, sorted by date)

Product          Date         Score    Status
ABC Biscuits     14 Jun 2025  92%     Compliant
FreshGlow Shamp  13 Jun 2025  100%    Compliant
...
```

**Behavior:**
- Query `inspections` table from Supabase, filtered by `user_id`
- Compute metrics from actual data
- "New Inspection" navigates to `/inspection/new`
- Clicking a row navigates to `/inspection/:id/result`

**On first use (empty state):**
```
No inspections yet
Start your first package inspection to see results here.

[ New Inspection ]
```

**Technical note:** If there are no inspections yet AND this is a demo/development environment, you may seed the database with sample inspections. Create a utility function `seedSampleData()` that inserts 5-8 sample inspections with realistic data. But the primary workflow must always use real captured/uploaded images.

### SCREEN 3 — New Inspection Page

**Route:** `/inspection/new`

**Layout:** Centered content, simple.

**Content:**

```
New Inspection
Scan or upload a package image to begin.

─────────────────────────────────

┌─────────────────────────────┐
│                             │
│      📷                     │
│                             │
│   Scan with Camera          │
│   Use your device camera    │
│   to capture the package    │
│                             │
└─────────────────────────────┘

┌─────────────────────────────┐
│                             │
│      📁                     │
│                             │
│   Upload Image              │
│   Select a package image    │
│   from your device          │
│                             │
└─────────────────────────────┘
```

The two options should be equally prominent cards. Not one big and one small. Both are valid paths.

**Behavior:**
- "Scan with Camera" navigates to `/inspection/new/camera`
- "Upload Image" opens the native file picker (`<input type="file" accept="image/*">`)
- On file selected: validate the file (type, size), then navigate to `/inspection/new/preview` with the image in state

**File validation:**
- Accepted types: JPEG, PNG, WebP
- Maximum size: 10MB
- If invalid, show inline error: "Please select a JPEG, PNG, or WebP image under 10MB."

**Image compression:**
Before storing/processing, resize the image to a maximum dimension of 2000px (preserving aspect ratio) and compress to JPEG quality 85. Use `canvas` element for this. This happens in `imageUtils.ts`.

### SCREEN 4 — Camera Page

**Route:** `/inspection/new/camera`

**Layout:** Full-screen camera view.

**Implementation using `useCamera` hook:**

```typescript
// src/hooks/useCamera.ts

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  status: 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable' | 'error';
  facingMode: 'user' | 'environment';
  capture: () => Blob | null;
  switchCamera: () => void;
  stop: () => void;
  errorMessage: string | null;
}
```

**Camera initialization logic:**

1. Call `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } })`
2. On success: pipe stream to `<video>` element, set status to `active`
3. On `NotAllowedError`: set status to `denied`
4. On `NotFoundError` or `NotReadableError`: set status to `unavailable`
5. On any other error: set status to `error`, store error message

**Camera switching:**

1. Enumerate devices with `navigator.mediaDevices.enumerateDevices()`
2. Filter for `videoinput`
3. If more than one camera exists, show "Switch Camera" button
4. Toggle between `facingMode: 'user'` and `facingMode: 'environment'`
5. Stop current stream, request new stream with opposite facing mode

**Capture logic:**

1. Draw current video frame to a hidden `<canvas>` element
2. Call `canvas.toBlob(callback, 'image/jpeg', 0.9)`
3. Return the blob

**Screen layout (camera active):**

```
┌─────────────────────────────────────┐
│                                     │
│         [Live Camera Feed]          │
│                                     │
│    ┌───────────────────────┐        │
│    │                       │        │
│    │  (Guide frame —       │        │
│    │   subtle dashed       │        │
│    │   rectangle)          │        │
│    │                       │        │
│    └───────────────────────┘        │
│                                     │
│  Position the package inside        │
│  the frame                          │
│                                     │
│  [Cancel]   [⊙ Capture]  [↻ Flip]  │
│                                     │
└─────────────────────────────────────┘
```

The guide frame is a subtle dashed border overlay. NOT a glowing, animated, futuristic scanner frame. Just a simple dashed rectangle, white with slight opacity, so the user knows where to position the package.

**After capture (preview state):**

```
┌─────────────────────────────────────┐
│                                     │
│       [Captured Image]              │
│                                     │
│                                     │
│  [ Retake ]          [ Use Photo ]  │
│                                     │
└─────────────────────────────────────┘
```

"Retake" returns to live camera. "Use Photo" navigates to `/inspection/new/preview` with the captured blob.

**Permission denied state:**

```
Camera access was not granted.

To use the camera, allow camera access in your browser settings.

Alternatively, you can upload an image directly.

[ Upload Image ]     [ Try Again ]
```

**No camera available state:**

```
No camera detected on this device.

You can upload a package image instead.

[ Upload Image ]
```

**HTTPS requirement:** If the page is not served over HTTPS (and not localhost), camera access will fail. Detect this and show: "Camera access requires a secure connection (HTTPS). Please upload an image instead."

### SCREEN 5 — Image Preview Page

**Route:** `/inspection/new/preview`

**The image (captured or uploaded) is passed via state/context.**

**Layout:**

```
Image Preview
Review the captured image before starting inspection.

─────────────────────────────────

┌─────────────────────────────┐
│                             │
│     [Package Image]         │
│                             │
│     (zoomable, pannable)    │
│                             │
└─────────────────────────────┘

Image appears clear    ✓

[ Remove ]    [ Add Another Side ]

─────────────────────────────────

Product Name (optional)
[_________________________]

Category (optional)
[ Select... ▼ ]
  Food & Beverages
  Personal Care
  Household
  Electronics
  Other

─────────────────────────────────

[ ← Back ]            [ Start Inspection → ]
```

**Behavior:**
- The user can optionally enter a product name and category (helps with report generation)
- "Remove" clears the image and goes back to new inspection
- "Add Another Side" opens camera/upload again for a second image (back/side)
- "Start Inspection" triggers the processing pipeline

**Image zoom:** Use CSS `transform: scale()` with pinch-to-zoom on touch devices and scroll-to-zoom on desktop. Keep it simple — no complex image viewer library.

### SCREEN 6 — Processing Page

**Route:** `/inspection/:id/processing`

**This is where the actual work happens.**

**Layout:**

```
Inspecting Package
This usually takes a few seconds.

─────────────────────────────────

┌─────────────────┐
│                 │
│ [Small thumb-   │
│  nail of the    │
│  uploaded image]│
│                 │
└─────────────────┘

✓ Image received
✓ Preparing image
● Extracting text...
○ Identifying declarations
○ Checking compliance rules
○ Preparing result

─────────────────────────────────
```

Each step transitions from `○` (pending) to `●` (in progress — use a simple spinner, not an animated circle — just a small rotating Lucide `Loader2` icon) to `✓` (complete).

**WHAT ACTUALLY HAPPENS DURING PROCESSING:**

This is the most important technical section. Follow this exactly.

**Step 1: Image received**
The image blob is available. Mark as complete.

**Step 2: Preparing image**
- Resize image to max 2000px dimension using canvas
- Compress to JPEG quality 85
- Upload to Supabase Storage at path `{user_id}/{inspection_id}/original.jpg`
- Get public URL
- Create inspection record in Supabase with status `processing`
- Mark as complete

**Step 3: Extracting text (OCR)**
- Pass the image to the OCR service (Tesseract.js)
- Tesseract.js initialization: `Tesseract.createWorker('eng')`
- Call `worker.recognize(image)`
- Receive full text, confidence, and word-level bounding boxes
- Store raw OCR text in the inspection record
- Mark as complete

**Step 4: Identifying declarations**
- Pass the raw OCR text to the extraction service
- The extraction service searches for:
  - **Manufacturer/Packer name and address** — look for keywords: "Mfd by", "Manufactured by", "Packed by", "Packer", "Mfg by", followed by text
  - **Country of origin** — look for "Product of", "Made in", "Country of Origin"
  - **Net quantity** — look for patterns like `\d+\s*(g|gm|gms|kg|ml|l|ltr|litre|liter|cc|cm|mm|m)\b`
  - **MRP** — look for "MRP", "M.R.P", "Maximum Retail Price", followed by `₹?\s*\d+`
  - **Manufacturing date** — look for "Mfg", "Mfd", "Manufacturing Date", "Date of Manufacture", followed by date patterns
  - **Best before / Expiry** — look for "Best Before", "Use By", "Expiry", "Exp", followed by date or duration
  - **Batch/Lot number** — look for "Batch", "Lot", "B.No", followed by alphanumeric
  - **Generic/Common name** — look for "Common Name", or use product category heuristics
  - **Consumer care** — look for "Consumer Care", "Customer Care", "Helpline", "Toll Free", phone number patterns, email patterns
  - **FSSAI License** (for food products) — look for "FSSAI", "Lic No", 14-digit number pattern
  - **Nutritional information** — look for "Nutrition", "Energy", "Protein", "Fat", "Carbohydrate"
  - **Ingredients** — look for "Ingredients", followed by a list
  - **Allergen information** — look for "Allergen", "Contains", "May contain"

- For each field, record:
  - `field`: the field name
  - `detected`: boolean (was it found?)
  - `value`: the extracted value (string or null)
  - `confidence`: how confident the extraction is (0-1)
  - `rawMatch`: the exact text that was matched
  - `position`: character position in OCR text

- Return as structured JSON (`ExtractedDeclarations`)
- Mark as complete

**Step 5: Checking compliance rules**
- Load the active rule set
- For each rule, evaluate against extracted declarations
- See Section 7 for full rule engine specification
- Mark as complete

**Step 6: Preparing result**
- Compute compliance score: `(rules_passed / total_rules_checked) * 100`
- Determine overall result:
  - All rules pass → `compliant`
  - Any rule fails → `non_compliant`
  - No failures but some reviews → `requires_review`
- Update the inspection record in Supabase with all results
- Set status to `completed`
- Navigate to `/inspection/:id/result`

**Error handling during processing:**

If OCR fails:
```
Text extraction was unsuccessful.

The image may be unclear or contain text that could not be read.

[ Try Again ]    [ Upload Different Image ]
```

If any step fails:
- Update inspection status to `failed`
- Show a clear error message
- Offer to retry or upload a different image
- Never show a blank screen
- Never show a generic "Something went wrong"

### SCREEN 7 — Inspection Result Page

**Route:** `/inspection/:id/result`

**This is the most important screen. Spend the most design effort here.**

**Layout:**

```
Inspection Result

─────────────────────────────────

┌─────────────────────────────────────────────────────┐
│                                                     │
│  Product: ABC Biscuits                              │
│  Inspection: INS-2025-0048                          │
│  Date: 14 June 2025, 2:34 PM                       │
│                                                     │
│  ┌──────────────────┐                               │
│  │                  │                               │
│  │      92%         │      Compliant                │
│  │                  │                               │
│  │  Compliance      │      9 of 10 declarations     │
│  │  Score           │      verified                 │
│  │                  │                               │
│  └──────────────────┘                               │
│                                                     │
└─────────────────────────────────────────────────────┘

─────────────────────────────────

Declarations

Field              Value                    Status
───────────────────────────────────────────────────────
Manufacturer       ABC Foods Pvt. Ltd.      ✓ Verified
Generic Name       Biscuits                 ✓ Verified
Net Quantity       200 g                    ✓ Verified
MRP                ₹40.00                   ✓ Verified
Mfg. Date          Aug 2025                 ✓ Verified
Best Before        12 months from Mfg.      ✓ Verified
Batch No.          B2025-0842               ✓ Verified
FSSAI Lic.         10421999000125           ✓ Verified
Ingredients        Wheat flour, sugar...    ✓ Verified
Consumer Care      Not detected             ⚠ Review

─────────────────────────────────

Potential Issues                                    1

┌─────────────────────────────────────────────────────┐
│  ⚠  Consumer Care Details                          │
│                                                     │
│  Consumer care information was not confidently      │
│  identified in the submitted image. This is a       │
│  mandatory declaration under Rule 6.                │
│                                                     │
│  Manual verification is recommended.                │
│                                                     │
│  [ Review Evidence ]                                │
│                                                     │
└─────────────────────────────────────────────────────┘

─────────────────────────────────

[ Review Evidence ]    [ Generate Report ]    [ New Inspection ]
```

**Design notes for compliance score:**

The `92%` compliance score is displayed as a large number. Not a circular progress chart. Not a gauge. Not an animated counter. Just a big number with clean typography. Next to it, a text label: "Compliant" in green, or "Requires Review" in amber, or "Potential Issue" in red.

**Status badges:**

- ✓ Verified — green text, green-tinted background badge
- ⚠ Review — amber text, amber-tinted background badge
- ✗ Issue — red text, red-tinted background badge
- — Not Applicable — gray text, gray-tinted background badge

**Language rules (CRITICAL):**

Never use aggressive or definitive legal language. The system assists the inspector. It does not make legal determinations.

| DO use | DO NOT use |
|---|---|
| "Not detected" | "Missing" |
| "Requires review" | "Violation" |
| "Potential issue" | "Illegal" |
| "Could not be identified" | "Failed" |
| "Manual verification recommended" | "Non-compliant product" |
| "Not confidently identified" | "Penalty required" |

### SCREEN 8 — Evidence Review Page

**Route:** `/inspection/:id/evidence`

**Purpose:** Let the inspector see exactly what the system detected and where. This builds trust. Without evidence, the system is a black box. With evidence, it's a useful tool.

**Layout (desktop — two columns):**

```
Evidence Review

─────────────────────────────────

┌──────────────────┬──────────────────────────────────┐
│                  │                                  │
│  [Original       │  Declaration Detail              │
│   Package        │                                  │
│   Image]         │  Field: Manufacturer             │
│                  │  Detected Value: ABC Foods       │
│  (With high-     │                Pvt. Ltd.         │
│   lighted        │  Confidence: 94%                 │
│   regions for    │  Rule: LM-PC-001                 │
│   the selected   │  Requirement: Manufacturer       │
│   declaration)   │  name and address must be        │
│                  │  declared on the package.        │
│                  │  Status: ✓ Verified              │
│                  │                                  │
│                  │  Raw OCR Text:                   │
│                  │  "Mfd. by ABC Foods Pvt. Ltd.    │
│                  │   123 Industrial Area, Phase 2,  │
│                  │   New Delhi - 110020"            │
│                  │                                  │
└──────────────────┴──────────────────────────────────┘

Declarations List
(Clickable list on the side or below)

▸ Manufacturer        ✓
▸ Generic Name        ✓
▸ Net Quantity         ✓
▸ MRP                  ✓
▸ Consumer Care        ⚠  ← currently selected
```

**Behavior:**
- When the user clicks a declaration in the list, the right panel shows that declaration's detail
- If bounding box data is available from OCR, draw a highlight rectangle on the image at the position where that text was detected
- If bounding box data is not available, still show the raw OCR text and the detected value

**Mobile layout:** Stack vertically. Image on top (scrollable), declaration detail below.

### SCREEN 9 — Inspection History Page

**Route:** `/history`

**Layout:**

```
Inspection History

Search: [_________________________ 🔍]

Filters: [All Status ▼]  [All Categories ▼]  [Date Range ▼]

─────────────────────────────────

ID              Product           Date          Score    Status
────────────────────────────────────────────────────────────────
INS-2025-0048   ABC Biscuits      14 Jun 2025   92%     Compliant
INS-2025-0047   FreshGlow Shamp   13 Jun 2025   100%    Compliant
INS-2025-0046   DailyCare Soap    12 Jun 2025   72%     Review
INS-2025-0045   Premium Tea       11 Jun 2025   85%     Compliant
INS-2025-0044   Kitchen Mixer     10 Jun 2025   65%     Issue
INS-2025-0043   Organic Rice      9 Jun 2025    92%     Compliant
INS-2025-0042   Packaged Spices   8 Jun 2025    100%    Compliant

─────────────────────────────────

Showing 7 of 47 inspections          [← Previous]  [Next →]
```

**Behavior:**
- Query from Supabase with pagination (10 per page)
- Search filters by product name (case-insensitive `ilike`)
- Status filter: All, Compliant, Requires Review, Potential Issue
- Category filter: All, Food & Beverages, Personal Care, Household, Electronics, Other
- Click row → navigate to `/inspection/:id/result`

**Mobile:** Use card layout instead of table. Each inspection is a card showing product, date, score, status.

### SCREEN 10 — Report Page

**Route:** `/inspection/:id/report`

**Layout:** Show a preview of the report, then allow download.

**Report content:**

```
PackCheck — Inspection Report

──────────────────────────

Inspection Details

Inspection ID:      INS-2025-0048
Date:               14 June 2025, 2:34 PM
Inspector:          [User's full name]
Product:            ABC Biscuits
Category:           Food & Beverages

──────────────────────────

Compliance Summary

Score:              92%
Result:             Compliant
Rules Checked:      10
Passed:             9
Requires Review:    1
Failed:             0

──────────────────────────

Declaration Details

(Table of all declarations, values, and statuses)

──────────────────────────

Issues Identified

1. Consumer Care Details
   Consumer care information was not confidently
   identified in the submitted image.
   Severity: Medium
   Recommendation: Manual verification recommended.

──────────────────────────

Rule Set Applied

Legal Metrology (Packaged Commodities) Rules
Version: 2026

──────────────────────────

Disclaimer

This report is generated to assist in package inspection
and is intended as a preliminary assessment. Findings
should be manually verified by a qualified inspector
before any enforcement action. This report does not
constitute a legal determination.

──────────────────────────

Generated by PackCheck
[Date and time]
```

**Buttons:**

```
[ Download PDF ]    [ Print ]    [ Back to Result ]
```

**PDF generation:**

Use jsPDF. Generate a clean, well-formatted PDF that contains all the information above. The PDF should look professional — like a government inspection report. Use:
- Header with "PackCheck — Inspection Report"
- Consistent typography
- Table formatting for declarations
- No colors except status indicators
- Page numbers
- Generated timestamp

The PDF must contain ACTUAL data from the inspection. Not sample data.

### SCREEN 11 — Rules Page

**Route:** `/rules`

**Layout:**

```
Inspection Rules
Rules used to evaluate package compliance.

Active Rule Set:  Legal Metrology (Packaged Commodities) Rules
Version:          2026

─────────────────────────────────

Rule          Field              Requirement                          Severity
─────────────────────────────────────────────────────────────────────────────────
LM-PC-001     Manufacturer       Manufacturer name and address        High
                                  must be declared
LM-PC-002     Common Name        Common or generic name of the        High
                                  commodity must be declared
LM-PC-003     Net Quantity        Net quantity must be declared         High
                                  in standard units
LM-PC-004     MRP                Maximum Retail Price must be          High
                                  declared inclusive of all taxes
LM-PC-005     Mfg. Date          Date of manufacture or packing        High
                                  must be declared
LM-PC-006     Best Before         Best before or use by date           High
                                  must be declared
LM-PC-007     Consumer Care      Consumer care details must            Medium
                                  be declared
LM-PC-008     Country of Origin  Country of origin must be             Medium
                                  declared for imported goods
LM-PC-009     Batch/Lot No.      Batch or lot number must              Medium
                                  be declared
LM-PC-010     FSSAI License      FSSAI license number must be          High
                                  declared (food products only)
```

Clicking a rule row expands it to show:

```
LM-PC-001 — Manufacturer Details

Requirement:
The name and complete address of the manufacturer or packer,
and if the manufacturer is not the packer, the name and
address of the entity for whom the commodity has been
manufactured, must be declared on the package.

Reference:
Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(a)

Check Type:
Presence — the system checks whether manufacturer information
can be detected in the package text.

Severity:
High — this is a mandatory declaration.

Applicable To:
All packaged commodities
```

**This is a read-only reference page.** Do not build a rule editor. Do not build a visual rule builder. Inspectors view rules. They don't create them in this version.

### SCREEN 12 — Settings Page

**Route:** `/settings`

**Layout:**

```
Settings

─────────────────────────────────

Profile

Full Name
[_________________________]

Email
[_________________________ ] (read-only, from Supabase Auth)

Organization
[_________________________]

[ Save Profile ]

─────────────────────────────────

Inspection Preferences

Default Category
[ Select... ▼ ]

Image Quality
(○) Standard (faster processing)
(●) High (better accuracy)

─────────────────────────────────

Account

[ Sign Out ]
```

Minimal. Do not add unnecessary settings.

---

## SECTION 7 — RULE ENGINE (COMPLETE SPECIFICATION)

### 7.1 — Rule Data Structure

```typescript
interface Rule {
  id: string;                    // e.g., "LM-PC-001"
  field: string;                 // e.g., "manufacturer"
  name: string;                  // e.g., "Manufacturer Details"
  description: string;           // Full requirement text
  reference: string;             // Legal reference
  checkType: 'presence' | 'format' | 'range' | 'conditional';
  severity: 'high' | 'medium' | 'low';
  applicableTo: string[];        // Categories: ["all"] or ["food", "personal_care"]
  formatPattern?: string;        // Regex pattern for format checks
  rangeMin?: number;             // For range checks
  rangeMax?: number;             // For range checks
  conditionalField?: string;     // For conditional checks
  conditionalValue?: string;     // For conditional checks
  isActive: boolean;
}
```

### 7.2 — Rule Evaluation

```typescript
interface RuleResult {
  ruleId: string;
  ruleName: string;
  field: string;
  status: 'pass' | 'fail' | 'review' | 'not_applicable';
  detectedValue: string | null;
  confidence: number;
  message: string;
  severity: 'high' | 'medium' | 'low';
}
```

### 7.3 — Evaluation Logic

```typescript
function evaluateRule(rule: Rule, declarations: ExtractedDeclarations, category: string): RuleResult {
  // 1. Check applicability
  if (!rule.applicableTo.includes('all') && !rule.applicableTo.includes(category)) {
    return { ...baseResult, status: 'not_applicable', message: 'Rule not applicable to this category' };
  }

  // 2. Get the declared value for this field
  const declaration = declarations[rule.field];

  // 3. Check based on checkType
  switch (rule.checkType) {
    case 'presence':
      if (!declaration || !declaration.detected) {
        if (declaration && declaration.confidence > 0.3) {
          return { ...baseResult, status: 'review', message: 'Value detected with low confidence. Manual verification recommended.' };
        }
        return { ...baseResult, status: 'fail', message: `${rule.name} was not detected on the package.` };
      }
      if (declaration.confidence < 0.7) {
        return { ...baseResult, status: 'review', message: 'Value detected but confidence is low. Manual verification recommended.' };
      }
      return { ...baseResult, status: 'pass', message: `${rule.name} detected and verified.`, detectedValue: declaration.value };

    case 'format':
      // Check if value matches expected format pattern
      // e.g., net quantity should match "number + unit" pattern
      ...

    case 'conditional':
      // Only check if a condition is met
      // e.g., FSSAI only applies to food products
      ...
  }
}
```

### 7.4 — Default Rule Set

Create a file `src/services/rules/defaultRules.ts` with at least 10 rules covering:

1. Manufacturer name and address
2. Common/generic name
3. Net quantity in standard units
4. Maximum Retail Price (MRP)
5. Date of manufacture or packing
6. Best before or use by date
7. Consumer care details
8. Country of origin (for imported goods)
9. Batch or lot number
10. FSSAI license number (food products)

Each rule must have complete data: id, field, name, description, reference, checkType, severity, applicableTo.

Store this rule set in Supabase `rule_sets` table on first run if it doesn't exist.

---

## SECTION 8 — OCR IMPLEMENTATION (DETAILED)

### 8.1 — Tesseract.js Setup

```typescript
// src/services/ocr/tesseractService.ts

import { createWorker } from 'tesseract.js';
import type { OCRService, OCRResult } from './types';

export class TesseractOCRService implements OCRService {
  private worker: Tesseract.Worker | null = null;

  async initialize(): Promise<void> {
    this.worker = await createWorker('eng');
  }

  async extractText(image: File | Blob): Promise<OCRResult> {
    if (!this.worker) {
      await this.initialize();
    }

    const result = await this.worker!.recognize(image);

    return {
      fullText: result.data.text,
      confidence: result.data.confidence,
      blocks: result.data.words.map(word => ({
        text: word.text,
        confidence: word.confidence,
        boundingBox: {
          x: word.bbox.x0,
          y: word.bbox.y0,
          width: word.bbox.x1 - word.bbox.x0,
          height: word.bbox.y1 - word.bbox.y0,
        },
      })),
    };
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
```

### 8.2 — OCR Service Abstraction

```typescript
// src/services/ocr/types.ts

export interface OCRService {
  extractText(image: File | Blob): Promise<OCRResult>;
}

export interface OCRResult {
  fullText: string;
  confidence: number;
  blocks: Array<{
    text: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}
```

```typescript
// src/services/ocr/index.ts

import { TesseractOCRService } from './tesseractService';
import type { OCRService } from './types';

// To switch OCR providers, change this line
export const ocrService: OCRService = new TesseractOCRService();
```

This abstraction means you can later create `GoogleVisionOCRService`, `AWSTextractOCRService`, etc., and swap them by changing one line.

---

## SECTION 9 — DECLARATION EXTRACTION (DETAILED)

### 9.1 — Extraction Patterns

```typescript
// src/services/extraction/patternExtractor.ts

export class PatternExtractor {
  extract(ocrText: string): ExtractedDeclarations {
    const text = ocrText; // Keep original for position tracking
    const normalized = ocrText.toLowerCase(); // For matching

    return {
      manufacturer: this.extractManufacturer(text, normalized),
      genericName: this.extractGenericName(text, normalized),
      netQuantity: this.extractNetQuantity(text, normalized),
      mrp: this.extractMRP(text, normalized),
      manufacturingDate: this.extractMfgDate(text, normalized),
      bestBefore: this.extractBestBefore(text, normalized),
      batchNumber: this.extractBatchNumber(text, normalized),
      consumerCare: this.extractConsumerCare(text, normalized),
      countryOfOrigin: this.extractCountryOfOrigin(text, normalized),
      fssaiLicense: this.extractFSSAI(text, normalized),
      ingredients: this.extractIngredients(text, normalized),
      allergenInfo: this.extractAllergenInfo(text, normalized),
    };
  }

  private extractMRP(text: string, normalized: string): DeclarationField {
    // Patterns to match:
    // "MRP ₹45.00"
    // "M.R.P. Rs. 45"
    // "MRP: Rs 45/-"
    // "Maximum Retail Price ₹45.00"
    // "MRP ₹ 45.00 (incl. of all taxes)"

    const patterns = [
      /M\.?R\.?P\.?\s*[:.]?\s*(?:Rs\.?|₹)\s*(\d+(?:\.\d{2})?)/i,
      /Maximum\s+Retail\s+Price\s*[:.]?\s*(?:Rs\.?|₹)\s*(\d+(?:\.\d{2})?)/i,
      /(?:Rs\.?|₹)\s*(\d+(?:\.\d{2})?)\s*\(?(?:incl|inclusive)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          detected: true,
          value: `₹${match[1]}`,
          confidence: 0.9,
          rawMatch: match[0],
          position: text.indexOf(match[0]),
        };
      }
    }

    return { detected: false, value: null, confidence: 0, rawMatch: null, position: null };
  }

  // Similar methods for each field...
  // Each method tries multiple regex patterns
  // Returns best match with confidence score
}
```

### 9.2 — Declaration Types

```typescript
// src/types/declarations.ts

export interface DeclarationField {
  detected: boolean;
  value: string | null;
  confidence: number;      // 0 to 1
  rawMatch: string | null;  // The exact text that matched
  position: number | null;  // Character position in OCR text
}

export interface ExtractedDeclarations {
  manufacturer: DeclarationField;
  genericName: DeclarationField;
  netQuantity: DeclarationField;
  mrp: DeclarationField;
  manufacturingDate: DeclarationField;
  bestBefore: DeclarationField;
  batchNumber: DeclarationField;
  consumerCare: DeclarationField;
  countryOfOrigin: DeclarationField;
  fssaiLicense: DeclarationField;
  ingredients: DeclarationField;
  allergenInfo: DeclarationField;
}
```

---

## SECTION 10 — RESPONSIVE DESIGN (DETAILED)

### 10.1 — Breakpoints

Use Tailwind's default breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### 10.2 — Navigation

**Desktop (lg and above):**
Fixed sidebar on the left, 240px wide. Contains:
- PackCheck text logo at top
- Navigation links: Overview, New Inspection, History, Rules, Settings
- Sign Out at bottom
- Active link has blue-tinted background, blue text

**Tablet and Mobile (below lg):**
- No sidebar
- Compact header with PackCheck text + hamburger menu icon
- Hamburger opens a slide-in drawer from the left with all navigation links
- Alternatively, use a bottom navigation bar on mobile with 4-5 key destinations

### 10.3 — Content Layout

**Desktop:** Max content width of 1200px, centered. Use `max-w-6xl mx-auto`.

**Mobile:** Full width with `px-4` padding.

**Tables on mobile:** Convert to card lists. Each row becomes a card showing key information stacked vertically.

### 10.4 — Touch Targets

All interactive elements (buttons, links, checkboxes, radio buttons) must have a minimum tappable area of 44x44px on mobile.

---

## SECTION 11 — ERROR HANDLING (COMPLETE)

### 11.1 — Every Possible Error State

**Camera permission denied:**
Show explanation + upload fallback button.

**Camera not available:**
Show explanation + upload fallback button.

**Camera not supported (HTTP):**
Show HTTPS requirement explanation + upload fallback button.

**File type not supported:**
"Please select a JPEG, PNG, or WebP image."

**File too large:**
"Image must be under 10MB. Please use a smaller image or reduce the resolution."

**OCR failed:**
"Text could not be extracted from this image. The image may be blurry, too dark, or contain text that is too small. Please try again with a clearer image."
[ Retry ] [ Upload Different Image ]

**OCR returned empty text:**
"No text was detected in this image. Please ensure the package label is visible and well-lit."
[ Retry ] [ Upload Different Image ]

**Network error during Supabase operations:**
"Unable to save inspection data. Please check your internet connection and try again."
[ Retry ]

**Supabase auth error:**
Show specific message: "Invalid email or password" or "An account with this email already exists."

**Unknown error:**
"An unexpected error occurred. Please try again."
[ Retry ] [ Go to Overview ]

Log all errors to console in development. In production, consider Sentry or similar (mention this in code comments but don't implement).

### 11.2 — Loading States

Every async operation shows a loading indicator:
- Buttons show a spinner (Lucide `Loader2` with `animate-spin`) and become disabled
- Full-page operations show the processing page with step indicators
- Data-loading pages show skeleton loading states (subtle gray rectangles pulsing with `animate-pulse`)

Never show a blank page while data is loading.

---

## SECTION 12 — ACCESSIBILITY

### 12.1 — Requirements

- All images have `alt` text
- All form inputs have associated `<label>` elements
- All buttons have descriptive text (not just icons). If icon-only, use `aria-label`
- Focus states are visible on all interactive elements (use Tailwind's `focus-visible:ring-2 focus-visible:ring-blue-500`)
- Color is never the only way to communicate status. Always include text labels with status badges
- Semantic HTML: use `<main>`, `<nav>`, `<header>`, `<section>`, `<table>`, `<thead>`, `<tbody>`, `<h1>`-`<h6>` appropriately
- Modals/dialogs trap focus and are dismissible with Escape
- Skip navigation link at the very top of the page
- Contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text)

### 12.2 — Keyboard Navigation

- Tab order follows logical document flow
- Enter/Space activate buttons
- Escape closes modals and drawers
- Arrow keys navigate within menus and lists where appropriate

---

## SECTION 13 — SECURITY

### 13.1 — Environment Variables

ALL sensitive configuration lives in `.env`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

`.gitignore` must include:
```
.env
.env.local
.env.production
```

### 13.2 — Row Level Security

Every Supabase table has RLS enabled. Users can only access their own data. This is enforced at the database level, not just in frontend queries.

### 13.3 — Input Validation

- Validate file types before uploading
- Validate file sizes before processing
- Sanitize any user-entered text before storing
- Do not render raw OCR text as HTML (use `textContent`, not `innerHTML`)

### 13.4 — Auth Guards

Every route except `/login` and `/signup` requires authentication. Unauthenticated requests redirect to `/login`. Use a `ProtectedRoute` wrapper component.

### 13.5 — API Key Safety

If you ever create a server-side function or edge function that uses a secret key:
- Never expose it in client code
- Use Supabase Edge Functions with environment variables
- Document this clearly in code comments

For this MVP, there should be NO secret keys in the frontend. The Supabase anon key is public by design but still lives in `.env` for configurability.

---

## SECTION 14 — PDF REPORT GENERATION

### 14.1 — Implementation

```typescript
// src/services/report/pdfGenerator.ts

import jsPDF from 'jspdf';

export function generateInspectionReport(inspection: Inspection): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PackCheck — Inspection Report', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Inspection details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Inspection Details', 20, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Inspection ID: ${inspection.id}`, 20, y); y += 6;
  doc.text(`Date: ${formatDate(inspection.inspection_date)}`, 20, y); y += 6;
  doc.text(`Product: ${inspection.product_name || 'Not specified'}`, 20, y); y += 6;

  // ... continue building the PDF with all inspection data

  // Disclaimer at the bottom
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'This report is generated to assist in package inspection and is intended as a preliminary assessment.',
    20, doc.internal.pageSize.getHeight() - 30,
    { maxWidth: pageWidth - 40 }
  );
  doc.text(
    'Findings should be manually verified by a qualified inspector before any enforcement action.',
    20, doc.internal.pageSize.getHeight() - 24,
    { maxWidth: pageWidth - 40 }
  );

  return doc;
}
```

The PDF must:
- Use actual inspection data, not sample data
- Be downloadable immediately
- Have professional formatting
- Include all declarations, statuses, and issues
- Include the disclaimer
- Include generation timestamp

---

## SECTION 15 — TESTING CHECKLIST

Before declaring the build complete, mentally walk through every one of these tests:

### End-to-End Flow
- [ ] Open app → see login page
- [ ] Sign up with email/password → profile created → redirected to overview
- [ ] Sign in → redirected to overview
- [ ] Overview shows empty state on first use
- [ ] Click "New Inspection" → new inspection page
- [ ] Click "Scan with Camera" → camera opens (if available)
- [ ] Camera shows live preview
- [ ] Capture image → preview shown
- [ ] "Use Photo" → image preview page
- [ ] "Start Inspection" → processing page
- [ ] Processing runs actual OCR on the captured image
- [ ] OCR extracts actual text from the image
- [ ] Extraction identifies actual declarations
- [ ] Rules evaluate actual declarations
- [ ] Result page shows actual compliance data
- [ ] Evidence page shows actual image with actual detected values
- [ ] "Generate Report" → report page with actual data
- [ ] "Download PDF" → downloads actual PDF with actual data
- [ ] Go to History → the inspection appears in the list
- [ ] Click the inspection → opens the result page
- [ ] Sign out → returns to login
- [ ] Try accessing a protected route while logged out → redirected to login

### Upload Flow
- [ ] On "New Inspection", click "Upload Image"
- [ ] Select a JPEG file → accepted
- [ ] Select a PNG file → accepted
- [ ] Select a GIF file → rejected with error message
- [ ] Select a 20MB file → rejected with error message
- [ ] Complete full inspection flow with uploaded image

### Camera Edge Cases
- [ ] Camera permission denied → shows fallback message + upload option
- [ ] No camera on device → shows message + upload option
- [ ] Switch camera button works (if multiple cameras)
- [ ] Cancel from camera → returns to new inspection page

### Error Cases
- [ ] OCR fails → shows error message + retry option
- [ ] Network disconnected → shows offline message
- [ ] Invalid login credentials → shows error message

### Responsive
- [ ] All screens usable at 375px width (mobile)
- [ ] All screens usable at 768px width (tablet)
- [ ] All screens usable at 1024px width (laptop)
- [ ] All screens usable at 1440px width (desktop)
- [ ] Navigation switches between sidebar and drawer correctly

### Accessibility
- [ ] Can tab through all interactive elements
- [ ] Focus states are visible
- [ ] Screen reader can parse all content
- [ ] Status is communicated through text, not just color

---

## SECTION 16 — WHAT NOT TO BUILD

Do NOT build any of the following:

- User management / admin panel
- Team collaboration features
- Real-time notifications
- AI chat assistant
- Dashboard analytics beyond simple counts
- Map view
- Barcode scanner (only OCR text)
- Product database lookup
- Comparison view
- Batch processing
- API for third parties
- Webhooks
- Email notifications
- Multi-language support (English only for MVP)
- Dark mode (light mode only for MVP)
- Onboarding tutorial
- Interactive product tour
- Animated transitions between pages
- Particle effects
- Any AI-themed visual elements

If a feature is not in this document: DO NOT BUILD IT.

---

## SECTION 17 — FINAL QUALITY STANDARDS

### The app must pass these subjective tests:

1. **Government inspector test:** A 55-year-old government inspector with basic smartphone skills opens the app. Can they complete an inspection in under 2 minutes without help? If not, simplify.

2. **30-second judge test:** A judge at a hackathon/demo day opens the app. Can they understand what it does and see it work within 30 seconds? If not, clarify.

3. **Is this AI?** Look at every screen. Does anything scream "AI product"? If so, redesign it. The AI is invisible. The interface is human.

4. **Does it actually work?** Take a photo of a real product (a biscuit packet, a shampoo bottle, a box of tea). Upload it. Does the system extract real text? Does it identify real declarations? Does it produce a real compliance result? If not, fix the OCR/extraction pipeline.

5. **Would I trust this?** Look at the evidence page. Can I see what the system detected and verify it against the image? If the evidence is unclear, improve it.

---

## SECTION 18 — START BUILDING

You now have every detail you need.

Begin with:
1. Project setup (Vite + React + TypeScript + Tailwind)
2. Supabase client + auth context
3. Routing + layout (sidebar/drawer)
4. Login/Signup pages
5. Overview page
6. New Inspection page
7. Camera implementation
8. Image preview page
9. OCR service (Tesseract.js)
10. Declaration extraction service
11. Rule engine
12. Processing page (orchestrating the full pipeline)
13. Inspection result page
14. Evidence review page
15. Inspection history page
16. Report page + PDF generation
17. Rules page
18. Settings page
19. Error handling for every edge case
20. Responsive refinement
21. Final polish

Do not skip steps. Do not leave placeholders. Do not create mock-only implementations. Build the real thing.

**Every button works. Every flow completes. Every error is handled. The product is real.**

Now build PackCheck.