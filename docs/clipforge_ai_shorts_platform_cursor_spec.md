# ClipForge — AI Short-Form Video Repurposing Platform

## 1. Product Summary

**ClipForge** is a web-first application that accepts a long-form video source URL, analyzes the video, identifies high-potential short-form moments, automatically generates 30–60 second vertical clips, adds captions and social metadata, and publishes or exports those clips to YouTube Shorts, TikTok, and Instagram Reels.

The application should support:

- YouTube video links
- Vimeo links
- Direct MP4 / MOV / video URLs
- Uploaded video files
- Future connectors for cloud storage, podcasts, livestream recordings, webinars, and internal media libraries

The long-term vision is to become a creator automation platform that can discover trending long-form videos, extract high-retention moments, generate platform-native shorts, and publish them with minimal manual editing.

---

## 2. Core Concept

The user workflow should feel simple:

1. Paste a video link or select a trending video from the discovery page.
2. The system downloads or imports the video where allowed.
3. The system transcribes the audio.
4. The AI engine identifies strong short-form moments.
5. The video engine creates vertical 9:16 clips.
6. The app adds burned-in captions, smart crop, hook text, branding, and optional CTA.
7. The user reviews the generated clips.
8. The user either edits, exports, schedules, or publishes directly to connected social platforms.

The product should not be designed as a raw “video downloader.” It should be designed as a **creator-owned repurposing and publishing workflow**. This matters for compliance, copyright risk, and long-term product positioning.

---

## 3. Important Compliance Positioning

This project must include a clear rights and compliance layer.

### 3.1 Approved Input Sources

The app should encourage the user to process:

- Their own YouTube videos
- Their own Vimeo videos
- Videos where they have explicit permission
- Royalty-free / Creative Commons videos
- Internal company videos
- Podcasts, webinars, training videos, interviews, and livestream recordings they own

### 3.2 Risky Input Sources

The app should warn the user before processing:

- Other creators’ YouTube videos
- Music videos
- TV/movie/sports clips
- Copyrighted content
- Platform-restricted videos
- Videos with licensed music
- Private or paywalled content

### 3.3 User Acknowledgement

Before generating clips from a third-party URL, show a modal:

> “Please confirm you own this content or have permission to repurpose it. ClipForge does not grant rights to reuse third-party videos.”

### 3.4 Technical Guardrails

The MVP should include:

- Rights confirmation checkbox
- Source ownership metadata
- Original source URL tracking
- Generated clip audit trail
- Optional watermark / source attribution
- Per-platform compliance notes before publishing
- Ability to disable unsupported sources

---

## 4. Platform Reality Check

### 4.1 YouTube Shorts

YouTube Shorts can be uploaded through the normal YouTube Data API video upload flow. There is no separate “Shorts API.” A vertical/square short video is treated as a Short by YouTube based on format and metadata.

Current practical requirements:

- Use YouTube Data API `videos.insert`
- Upload vertical 9:16 video
- Target 30–60 seconds for MVP
- Add `#Shorts` in title or description
- Use OAuth for the creator’s YouTube channel
- Be aware that unverified API projects may upload videos as private until the project passes Google’s API review/audit

### 4.2 TikTok

TikTok supports direct video posting through the Content Posting API, but this is stricter than YouTube.

Important constraints:

- Requires TikTok developer app
- Requires user OAuth
- Requires explicit user consent
- Direct Post requires required UX and metadata steps
- Unaudited clients may be restricted to private visibility
- Public direct posting requires successful TikTok audit

MVP strategy:

- Build TikTok OAuth + direct post abstraction
- Support “export for TikTok” fallback
- Support “send to TikTok draft” if available through approved flow
- Add status flags for `PRIVATE_ONLY`, `DIRECT_POST_READY`, and `REQUIRES_AUDIT`

### 4.3 Instagram Reels

Instagram Reels publishing should use Meta’s Graph API content publishing workflow.

Important constraints:

- Requires Instagram Business or Professional account connected to a Facebook Page
- Requires Meta app setup and permissions
- Publishing is usually a multi-step process:
  - Create media container
  - Poll/check processing status
  - Publish media container
- API-based publishing may have platform-specific video processing/compression behavior

MVP strategy:

- Treat Instagram as an official connected account provider
- Require account eligibility check
- Store publish container IDs and processing status
- Provide “export reel file + caption” fallback if publishing fails

---

## 5. Desktop vs Web Recommendation

The strongest architecture is **web-first with a local optional desktop companion**, not a pure Electron/Tauri-only product.

### 5.1 Recommended Primary App

Use:

- **Next.js / React** for the main web app
- **Node.js API** for orchestration
- **Python/FastAPI worker services** for video/AI processing
- **PostgreSQL** for application data
- **Redis + BullMQ** for background jobs
- **Object storage** for videos/clips
- **FFmpeg** for video processing
- **Whisper / Faster-Whisper** for transcription
- **LLM layer** for clip scoring, titles, captions, hashtags, and descriptions

### 5.2 Why Not Pure Electron/Tauri First?

A pure desktop app is attractive because local FFmpeg is powerful, but direct social publishing, OAuth, scheduling, multi-user accounts, queues, and cloud storage are much easier in a web/SaaS architecture.

A desktop app becomes relevant when:

- The user wants local processing of large videos
- The user wants privacy-first local transcription
- The user wants to process files without uploading full videos
- The user wants an always-on creator workstation

### 5.3 Recommended Desktop Strategy

Build the MVP as a web app. Later add:

- **Tauri companion app** for local video processing
- Local FFmpeg execution
- Local Whisper transcription
- Watch-folder ingestion
- Local cache and upload accelerator
- Secure handoff back to the cloud backend

### 5.4 Electron vs Tauri

If choosing a desktop shell:

- Use **Tauri** if you want lightweight packaging, lower memory, Rust-side native power, and a cleaner distribution model.
- Use **Electron** if you want a Node-heavy desktop runtime, easier spawning of Node-based tools, and faster familiarity for a JavaScript-heavy team.

For this project, **Tauri is the better long-term desktop companion**, while the core application should remain web-based.

---

## 6. Target Users

### 6.1 Primary Users

- YouTubers repurposing long-form videos into Shorts
- Podcasters creating clips from interviews
- Coaches and educators creating micro-content
- Real estate marketers creating listing clips
- Course creators
- Agencies managing multiple client channels
- Businesses repurposing webinars and demos

### 6.2 User Personas

#### Solo Creator

Needs quick conversion of long-form videos into short clips with captions and posting.

#### Social Media Manager

Needs batch generation, scheduling, review queues, and multi-platform publishing.

#### Agency

Needs client workspaces, brand templates, approval workflows, and team permissions.

#### Business Owner

Needs simple “paste link, generate clips, approve” workflow with minimal editing.

---

## 7. Product Name Options

Recommended name: **ClipForge**

Other possible names:

- ShortForge
- ReelForge
- VidForge
- ClipPilot
- ShortSmith
- ReelMiner
- ClipFoundry
- TrendForge
- SnipFlow

Brand direction:

- Dark creator dashboard
- Neon accent or burnt-orange “forge” accent
- Timeline + waveform visual identity
- AI-assisted but creator-controlled

---

## 8. MVP Feature Set

### 8.1 Source Import

MVP must support:

- YouTube URL
- Direct video URL
- Manual file upload

Nice-to-have:

- Vimeo URL
- Google Drive link
- Dropbox link
- Zoom recording link
- RSS podcast episode link

### 8.2 Video Metadata Extraction

For each source, extract:

- Title
- Description
- Thumbnail
- Duration
- Channel/source name
- Source platform
- Source URL
- Language
- Resolution
- FPS
- Audio availability

### 8.3 Transcription

Generate transcript with:

- Word-level timestamps
- Sentence-level segments
- Speaker diarization later
- Language detection
- Confidence scores

Preferred MVP engine:

- Local/dev: Faster-Whisper
- Cloud option: OpenAI transcription, Deepgram, AssemblyAI, or equivalent

### 8.4 AI Clip Detection

The system should identify candidate clips by analyzing:

- Transcript hooks
- Topic shifts
- Emotional intensity
- Question/answer moments
- Story arcs
- Punchlines
- Educational “aha” moments
- Strong claims
- High-density insight segments
- Named entities
- Sentiment shifts
- Audio energy
- Visual scene changes

Each generated candidate should include:

- Start time
- End time
- Duration
- Transcript excerpt
- Hook score
- Virality score
- Clarity score
- Standalone context score
- Platform fit score
- Suggested title
- Suggested caption
- Suggested hashtags
- Reason why this clip was selected

### 8.5 Clip Length Rules

Default:

- Minimum: 30 seconds
- Maximum: 60 seconds

Configurable presets:

- YouTube Shorts: 30–60 seconds by default, support up to platform limits later
- TikTok: 30–60 seconds by default
- Instagram Reels: 30–60 seconds by default
- Custom: 15–180 seconds

### 8.6 Vertical Video Generation

Output clips as:

- 1080x1920
- 9:16 aspect ratio
- H.264 MP4
- AAC audio
- 30 FPS default
- Social-safe bitrate preset

Cropping modes:

1. Center crop
2. Smart face crop
3. Speaker tracking crop
4. Split layout
5. Podcast layout
6. Gameplay layout
7. Screen recording layout
8. Manual crop override

### 8.7 Caption Rendering

Caption features:

- Burned-in subtitles
- Word-by-word highlight
- Multi-line caption layout
- Safe-area aware positioning
- Font presets
- Emoji emphasis optional
- Brand color support
- Profanity masking optional

Caption styles:

- Minimal white text with shadow
- TikTok-style word highlight
- Podcast bold headline style
- Educational clean style
- Corporate branded style
- High-energy creator style

### 8.8 Hook Overlay

Add optional first 2–3 second hook text:

Examples:

- “This changes everything…”
- “Most people get this wrong”
- “Here’s the fastest way to understand this”
- “Watch this before you try it”
- “The mistake nobody talks about”

The AI should suggest hooks but allow the user to edit.

### 8.9 Clip Review UI

The review screen should show:

- Source video player
- Candidate clip list
- Clip timeline
- Transcript segment
- AI score
- Reason selected
- Editable title
- Editable caption
- Editable hashtags
- Platform selection
- Generate preview button
- Approve / reject / regenerate actions

### 8.10 Publishing

MVP publishing targets:

- YouTube Shorts
- TikTok
- Instagram Reels

Publishing modes:

- Publish now
- Save as draft where supported
- Schedule later
- Export file only
- Export metadata package

Publishing metadata:

- Title
- Description/caption
- Hashtags
- Visibility/privacy
- Thumbnail/cover frame
- Platform-specific settings
- Disclosure/attribution notes

### 8.11 Discovery Landing Page

The landing page should include a discovery module that helps users find popular videos to clip.

Discovery sources:

- YouTube most popular videos by region/category
- YouTube search by keyword
- User’s own channel videos
- Manually added watchlist channels
- Later: RSS, podcast charts, Google Trends, TikTok trend research, Instagram trend research where API-supported

Important: The discovery feature should not imply that users automatically have rights to repurpose any popular video. Add visible “rights required” messaging.

Discovery filters:

- Region
- Category
- Keyword
- Duration
- Published date
- View count
- Channel
- Language
- Topic
- Sort by relevance / popularity / freshness

Discovery card fields:

- Thumbnail
- Title
- Channel
- Views
- Published date
- Duration
- Category
- “Analyze” button
- “Add to Watchlist” button
- “Open Source” button
- Rights status: Own / Permission Required / Unknown

---

## 9. Nice-to-Have Features After MVP

### 9.1 Brand Kits

Each workspace can define:

- Logo
- Watermark
- Fonts
- Colors
- Caption style
- Intro/outro
- CTA style
- Default hashtags
- Default posting schedule

### 9.2 Multi-Clip Batch Mode

For one long video, generate:

- Top 3 clips
- Top 5 clips
- Top 10 clips
- Themed clips
- Clips by speaker
- Clips by topic

### 9.3 Content Calendar

Features:

- Calendar view
- Platform queue
- Draft status
- Failed publishing retries
- Best posting time suggestions
- Campaign grouping

### 9.4 AI Content Pack

For each clip, generate:

- YouTube title
- YouTube description
- TikTok caption
- Instagram caption
- Hashtag sets
- Pinned comment
- LinkedIn post
- Twitter/X post
- Blog snippet
- Newsletter snippet

### 9.5 Analytics Feedback Loop

Track performance:

- Views
- Likes
- Comments
- Shares
- Watch time
- Retention
- Click-through where available
- Platform response

Use this to improve future clip scoring.

### 9.6 Auto-Repurpose Agent

A scheduled agent can:

- Watch selected YouTube channels
- Detect new uploads
- Import the video
- Generate candidate clips
- Notify user for approval
- Publish approved clips

---

## 10. Recommended Architecture

## 10.1 High-Level Architecture

```txt
┌────────────────────────────────────────────────────────────────────┐
│                            Web Frontend                            │
│                    Next.js / React / Tailwind                      │
└───────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                          API Gateway                               │
│                  Node.js / NestJS or Next API                      │
│                                                                    │
│  Auth | Workspaces | Billing | Sources | Jobs | Publishing          │
└───────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                         Job Queue Layer                            │
│                         Redis + BullMQ                             │
└───────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                         Worker Services                            │
│                                                                    │
│  Import Worker     → downloads/imports video metadata/content       │
│  Transcribe Worker → Whisper/Faster-Whisper                         │
│  Analyze Worker    → LLM + heuristics scoring                       │
│  Render Worker     → FFmpeg vertical clip generation                │
│  Publish Worker    → YouTube/TikTok/Instagram posting               │
└───────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                         Storage + Database                         │
│                                                                    │
│  PostgreSQL → relational app data                                   │
│  Redis      → queues/cache                                          │
│  S3/R2      → source videos, generated clips, thumbnails            │
│  Vector DB  → transcript semantic search / clip memory              │
└────────────────────────────────────────────────────────────────────┘
```

---

## 10.2 Suggested Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Zustand or Redux Toolkit
- React Query / TanStack Query
- Video.js or custom HTML5 video player
- Wavesurfer.js for audio waveform/timeline
- Remotion optional for advanced preview rendering

### Backend API

Preferred:

- Node.js + NestJS

Alternative:

- Next.js API routes for MVP

Backend responsibilities:

- Auth
- Workspaces
- Source ingestion records
- Job orchestration
- Connected accounts
- Publishing status
- Billing
- Admin dashboards

### Worker Layer

Use Python for video and AI-heavy work:

- FastAPI for worker control endpoints
- Celery or BullMQ-compatible worker model
- FFmpeg
- OpenCV
- PySceneDetect
- Faster-Whisper
- MoviePy only for simple utilities, not heavy rendering
- PyTorch where needed
- MediaPipe for face detection/tracking
- spaCy or similar for NLP heuristics

### Queue

- Redis
- BullMQ

### Database

- PostgreSQL
- Prisma ORM or Drizzle ORM

### Object Storage

Use one:

- Cloudflare R2
- AWS S3
- Backblaze B2
- MinIO for local development

### Auth

- Clerk
- Auth.js
- Supabase Auth
- Custom OAuth if needed

Recommended MVP:

- Auth.js or Clerk

### Billing

Later:

- Stripe
- Usage-based billing by render minutes
- Plan limits by generated clips, upload minutes, and connected accounts

---

## 11. Data Model

### 11.1 User

```ts
type User = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};
```

### 11.2 Workspace

```ts
type Workspace = {
  id: string;
  name: string;
  ownerId: string;
  plan: "free" | "creator" | "agency" | "enterprise";
  createdAt: Date;
  updatedAt: Date;
};
```

### 11.3 SourceVideo

```ts
type SourceVideo = {
  id: string;
  workspaceId: string;
  sourceType: "youtube" | "vimeo" | "direct_url" | "upload";
  sourceUrl: string;
  sourcePlatformId?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  fps?: number;
  language?: string;
  status:
    | "pending"
    | "importing"
    | "imported"
    | "transcribing"
    | "analyzing"
    | "ready"
    | "failed";
  rightsStatus: "owned" | "licensed" | "permission_required" | "unknown";
  createdAt: Date;
  updatedAt: Date;
};
```

### 11.4 TranscriptSegment

```ts
type TranscriptSegment = {
  id: string;
  sourceVideoId: string;
  startMs: number;
  endMs: number;
  text: string;
  words?: TranscriptWord[];
  confidence?: number;
  speakerLabel?: string;
};
```

### 11.5 ClipCandidate

```ts
type ClipCandidate = {
  id: string;
  sourceVideoId: string;
  startMs: number;
  endMs: number;
  durationSeconds: number;
  transcriptExcerpt: string;
  hookScore: number;
  viralityScore: number;
  clarityScore: number;
  standaloneScore: number;
  platformFitScore: number;
  overallScore: number;
  reasonSelected: string;
  suggestedHook: string;
  suggestedTitle: string;
  suggestedCaption: string;
  suggestedHashtags: string[];
  status: "candidate" | "approved" | "rejected" | "rendered" | "published";
  createdAt: Date;
  updatedAt: Date;
};
```

### 11.6 RenderedClip

```ts
type RenderedClip = {
  id: string;
  clipCandidateId: string;
  workspaceId: string;
  outputUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  durationSeconds: number;
  renderPreset: string;
  captionStyleId?: string;
  status: "queued" | "rendering" | "ready" | "failed";
  createdAt: Date;
  updatedAt: Date;
};
```

### 11.7 ConnectedAccount

```ts
type ConnectedAccount = {
  id: string;
  workspaceId: string;
  platform: "youtube" | "tiktok" | "instagram";
  accountName: string;
  externalAccountId: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted?: string;
  tokenExpiresAt?: Date;
  scopes: string[];
  status: "connected" | "expired" | "revoked" | "requires_review";
  createdAt: Date;
  updatedAt: Date;
};
```

### 11.8 PublishJob

```ts
type PublishJob = {
  id: string;
  renderedClipId: string;
  workspaceId: string;
  platform: "youtube" | "tiktok" | "instagram";
  connectedAccountId: string;
  title?: string;
  caption?: string;
  hashtags?: string[];
  visibility: "public" | "private" | "unlisted" | "draft";
  scheduledFor?: Date;
  status:
    | "draft"
    | "queued"
    | "publishing"
    | "processing"
    | "published"
    | "failed"
    | "requires_manual_action";
  externalPostId?: string;
  externalUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
};
```

---

## 12. Processing Pipeline

### 12.1 Pipeline Stages

```txt
INPUT URL / FILE
   ↓
SOURCE VALIDATION
   ↓
RIGHTS CONFIRMATION
   ↓
METADATA EXTRACTION
   ↓
VIDEO IMPORT / DOWNLOAD / FILE REGISTER
   ↓
AUDIO EXTRACTION
   ↓
TRANSCRIPTION
   ↓
SCENE + AUDIO ANALYSIS
   ↓
AI CLIP SCORING
   ↓
CANDIDATE CLIP CREATION
   ↓
USER REVIEW
   ↓
VERTICAL RENDER
   ↓
PLATFORM METADATA GENERATION
   ↓
PUBLISH / SCHEDULE / EXPORT
```

### 12.2 Job Types

```ts
type JobType =
  | "source.validate"
  | "source.import"
  | "source.extract_metadata"
  | "media.extract_audio"
  | "media.transcribe"
  | "media.detect_scenes"
  | "ai.score_clips"
  | "ai.generate_metadata"
  | "render.clip"
  | "publish.youtube"
  | "publish.tiktok"
  | "publish.instagram";
```

### 12.3 Job Status

```ts
type JobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "retrying";
```

---

## 13. AI Clip Detection Strategy

### 13.1 Heuristic Pass

Before using an LLM, score transcript windows using deterministic heuristics:

- Sentence completeness
- Start/end boundaries
- Strong hook phrases
- Question-answer pattern
- Emotional language
- Numbers/statistics
- Contrarian statements
- Storytelling indicators
- Clear subject matter
- Low dependency on previous context

### 13.2 Sliding Window Generation

Generate candidate windows:

- 30 seconds
- 45 seconds
- 60 seconds

Step size:

- 5 seconds for short videos
- 10 seconds for long videos

Avoid:

- Cutting mid-sentence
- Dead air
- Intros/outros
- Sponsor reads unless user enables
- Copyrighted music-heavy sections
- Low speech density areas

### 13.3 LLM Scoring Prompt

Use an LLM to score the top heuristic windows.

Prompt shape:

```md
You are an expert short-form video editor.

Analyze this transcript segment from a long-form video and determine whether it would work as a standalone 30–60 second short-form clip.

Score it from 0 to 100 across:
- Hook strength
- Standalone clarity
- Emotional impact
- Educational value
- Shareability
- Retention potential
- Platform fit for YouTube Shorts, TikTok, and Instagram Reels

Return strict JSON:
{
  "overallScore": number,
  "hookScore": number,
  "standaloneScore": number,
  "retentionScore": number,
  "platformFit": {
    "youtubeShorts": number,
    "tiktok": number,
    "instagramReels": number
  },
  "suggestedStartAdjustmentMs": number,
  "suggestedEndAdjustmentMs": number,
  "suggestedHook": string,
  "suggestedTitle": string,
  "suggestedCaption": string,
  "suggestedHashtags": string[],
  "reasonSelected": string,
  "warnings": string[]
}
```

### 13.4 Visual Scoring

Later enhance scoring with:

- Face detection
- Speaker activity
- Scene changes
- Slide changes
- Gesture/emotion detection
- Audio peaks
- Crowd/laughter/applause detection
- Visual text extraction

---

## 14. Rendering Requirements

### 14.1 FFmpeg Output Preset

Default render:

```txt
Format: MP4
Video codec: H.264
Audio codec: AAC
Resolution: 1080x1920
Aspect ratio: 9:16
FPS: 30
Pixel format: yuv420p
Audio sample rate: 44100 or 48000
```

### 14.2 Smart Crop Modes

#### Center Crop

Good for simple talking-head videos.

#### Face Tracking

Detect face bounding box and keep the speaker centered.

#### Split Layout

For podcasts/interviews:

```txt
┌─────────────────────┐
│      Speaker A       │
├─────────────────────┤
│      Speaker B       │
├─────────────────────┤
│      Captions        │
└─────────────────────┘
```

#### Screen + Presenter

For tutorials:

```txt
┌─────────────────────┐
│    Screen Content    │
│                     │
├───────────┬─────────┤
│ Presenter │ Caption │
└───────────┴─────────┘
```

### 14.3 Caption Safe Areas

Keep captions away from platform UI overlays.

Default safe margins:

- Top: 180px
- Bottom: 320px
- Left: 80px
- Right: 80px

### 14.4 Watermark

Optional workspace watermark:

- Bottom-left
- Bottom-right
- Top-left
- Top-right
- Opacity 60–85%
- Avoid platform UI collision

---

## 15. UI / UX Specification

## 15.1 Visual Direction

Style:

- Dark SaaS dashboard
- Creator/editor feel
- Clean, high-contrast timeline UI
- Neon or burnt-orange accent
- Cards with soft borders
- Subtle motion
- Strong preview-first layout

Suggested palette:

```txt
Background: #0B0F17
Panel:      #111827
Panel 2:    #172033
Border:     #263244
Text:       #F8FAFC
Muted:      #94A3B8
Accent:     #F97316
Success:    #22C55E
Warning:    #FACC15
Danger:     #EF4444
```

---

## 15.2 Main Navigation

Left sidebar:

- Dashboard
- Discover
- New Project
- Projects
- Clips
- Calendar
- Connected Accounts
- Brand Kits
- Analytics
- Settings

---

## 15.3 Landing / Dashboard Page

The dashboard should contain:

1. Hero import card
2. Trending discovery panel
3. Recent projects
4. Scheduled posts
5. Processing queue
6. Connected account status

Hero import card:

```txt
Paste a video URL
[ https://youtube.com/watch?v=...                         ]
[ Analyze Video ]

Supported: YouTube, Vimeo, MP4 URL, Upload
```

Trending section:

```txt
Popular videos to analyze
[Region dropdown] [Category dropdown] [Search keyword] [Refresh]
```

Each card:

```txt
Thumbnail
Title
Channel
Views • Duration • Published date
[Analyze] [Add to Watchlist] [Open]
```

---

## 15.4 Project Creation Flow

Step 1: Source

- Paste URL
- Upload file
- Select from discovery
- Select from own connected YouTube channel

Step 2: Rights

- Own content
- Licensed content
- Permission required
- Unknown

Step 3: Clip Goals

- Educational
- Viral hooks
- Podcast highlights
- Product marketing
- Real estate
- Motivational
- Comedy
- News/commentary

Step 4: Output Platforms

- YouTube Shorts
- TikTok
- Instagram Reels

Step 5: Generate

- Clip count
- Clip length
- Caption style
- Brand kit
- Auto-render previews

---

## 15.5 Clip Review Page

Recommended layout:

```txt
┌───────────────────────────────────────────────────────────────┐
│ Project: Source Video Title                                   │
├───────────────────────┬───────────────────────────────────────┤
│ Source Preview         │ Candidate Clips                       │
│                       │                                       │
│ [Video Player]         │ [Clip 1 Score 91]                     │
│ [Timeline/Waveform]    │ [Clip 2 Score 87]                     │
│                       │ [Clip 3 Score 82]                     │
├───────────────────────┴───────────────────────────────────────┤
│ Transcript / Clip Editor                                      │
│                                                               │
│ Start: 00:04:12  End: 00:05:02  Duration: 50s                 │
│ Hook: [editable]                                              │
│ Caption: [editable]                                           │
│ Hashtags: [editable chips]                                    │
│                                                               │
│ [Reject] [Adjust Timing] [Render Preview] [Approve]           │
└───────────────────────────────────────────────────────────────┘
```

---

## 15.6 Render Preview Page

Show:

- Vertical preview player
- Caption style controls
- Crop controls
- Hook overlay editor
- Brand kit selector
- Platform safety preview
- Export/publish buttons

---

## 15.7 Publish Page

For each platform:

```txt
YouTube Shorts
Account: Connected / Expired
Title
Description
Visibility
Schedule
[Publish Now] [Schedule] [Export Only]

TikTok
Account: Connected / Requires Audit / Private Only
Caption
Privacy
Commercial content disclosure
[Publish Now] [Export/Draft]

Instagram Reels
Account: Connected / Not Eligible
Caption
Cover Frame
Schedule
[Publish Now] [Schedule] [Export Only]
```

---

## 16. API Design

### 16.1 Source APIs

```http
POST /api/sources/validate
POST /api/sources/import
GET  /api/sources/:id
GET  /api/sources/:id/transcript
GET  /api/sources/:id/candidates
```

### 16.2 Clip APIs

```http
POST /api/clips/generate-candidates
POST /api/clips/:id/approve
POST /api/clips/:id/reject
POST /api/clips/:id/render
GET  /api/clips/:id
GET  /api/clips/:id/rendered
```

### 16.3 Publishing APIs

```http
GET  /api/accounts
POST /api/accounts/connect/:platform
DELETE /api/accounts/:id

POST /api/publish/youtube
POST /api/publish/tiktok
POST /api/publish/instagram

GET  /api/publish/jobs
GET  /api/publish/jobs/:id
POST /api/publish/jobs/:id/retry
```

### 16.4 Discovery APIs

```http
GET /api/discover/youtube/most-popular
GET /api/discover/youtube/search
GET /api/discover/youtube/channel/:channelId/videos
POST /api/discover/watchlist
GET /api/discover/watchlist
```

---

## 17. External Integrations

## 17.1 YouTube

Use cases:

- Search most popular videos
- Search videos by keyword
- Fetch video metadata
- Fetch own channel videos
- Upload Shorts

Required:

- Google Cloud project
- YouTube Data API v3 enabled
- OAuth consent screen
- YouTube upload scopes
- API audit for public uploads if required

## 17.2 TikTok

Use cases:

- Connect account
- Query creator info
- Upload/post video
- Check publish status

Required:

- TikTok developer app
- Content Posting API
- OAuth
- Required UX
- Audit for public posting

## 17.3 Instagram / Meta

Use cases:

- Connect Instagram Business/Professional account
- Create Reels media container
- Publish media
- Track status

Required:

- Meta developer app
- Facebook Login
- Instagram account linked to Facebook Page
- Required permissions
- Token refresh strategy

---

## 18. Security Requirements

### 18.1 Secrets

Never store plain OAuth tokens.

Use:

- KMS encryption
- Environment variable secrets
- Token encryption at rest
- Scoped platform permissions

### 18.2 Media Security

- Private object storage buckets
- Signed URLs
- Expiring upload links
- Virus/malware scanning for uploaded files
- File type validation
- Max file size limits
- Rate limits

### 18.3 Multi-Tenant Isolation

Every record must include:

- `workspaceId`
- Ownership checks
- Role-based permissions
- Per-workspace quotas

### 18.4 Abuse Prevention

Prevent:

- Processing copyrighted content without acknowledgement
- Mass scraping
- Unauthorized reposting
- Spammy posting behavior
- Platform ToS violations

Add:

- Rate limits
- Manual approval mode
- Posting frequency limits
- Audit logs

---

## 19. Local Development Setup

### 19.1 Monorepo Structure

```txt
clipforge/
  apps/
    web/
      package.json
      src/
    api/
      package.json
      src/
  services/
    worker-video/
      pyproject.toml
      app/
    worker-ai/
      pyproject.toml
      app/
  packages/
    shared/
    database/
    ui/
    config/
  infra/
    docker-compose.yml
    postgres/
    redis/
    minio/
  docs/
    architecture.md
    api.md
    platform-integrations.md
```

### 19.2 Local Docker Services

```yaml
services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
```

### 19.3 Required Local Binaries

- FFmpeg
- Python 3.11+
- Node.js 20+
- pnpm
- Docker
- Optional CUDA/MPS-compatible setup for local transcription acceleration

---

## 20. Cursor Implementation Plan

## Phase 1 — Foundation

Build:

- Monorepo
- Next.js web app
- Backend API
- PostgreSQL schema
- Redis queue
- Object storage adapter
- Auth
- Workspace model
- Basic dashboard

Acceptance criteria:

- User can sign in
- User can create/select workspace
- User can paste a URL
- Source record is created
- Job queue receives import job

---

## Phase 2 — Source Import

Build:

- YouTube URL parser
- Direct MP4 URL parser
- File upload
- Metadata extraction
- Rights confirmation modal
- Source video detail page

Acceptance criteria:

- User can import a source
- Metadata is visible
- Video can be played in the app
- Source status updates correctly

---

## Phase 3 — Transcription

Build:

- Audio extraction worker
- Faster-Whisper transcription worker
- Transcript storage
- Transcript viewer
- Word-level timestamp support

Acceptance criteria:

- User can transcribe imported video
- Transcript appears with timestamps
- Transcript segments map to video playback

---

## Phase 4 — AI Clip Candidate Generation

Build:

- Sliding window generator
- Heuristic scoring
- LLM scoring
- Candidate clip database records
- Candidate review UI

Acceptance criteria:

- App generates 5–10 candidate clips
- Each candidate has score and reason
- User can approve/reject candidates

---

## Phase 5 — Rendering

Build:

- FFmpeg render worker
- 9:16 crop presets
- Burned-in captions
- Hook overlay
- Preview player
- Render status updates

Acceptance criteria:

- User can render approved candidate
- Output is 1080x1920 MP4
- Captions are burned in
- Clip is playable and downloadable

---

## Phase 6 — Publishing

Build:

- Connected accounts page
- YouTube OAuth
- YouTube upload flow
- TikTok OAuth/posting abstraction
- Instagram OAuth/publishing abstraction
- Publish job model
- Export fallback

Acceptance criteria:

- User can connect YouTube
- User can publish/export a rendered clip
- Publish status is tracked
- Failures are visible and retryable

---

## Phase 7 — Discovery Page

Build:

- YouTube most-popular API integration
- Keyword search
- Region/category filters
- Discovery cards
- Add to project/import flow

Acceptance criteria:

- User can browse popular videos
- User can search videos
- User can start analysis from discovery item
- Rights warning appears for third-party videos

---

## Phase 8 — Polish

Build:

- Brand kits
- Caption presets
- Clip calendar
- Batch rendering
- Analytics basics
- Admin tools
- Quotas and plan limits

---

## 21. Cursor Prompt

Use this prompt inside Cursor to start the implementation:

```md
You are building ClipForge, a full-stack AI short-form video repurposing platform.

The application accepts a YouTube, Vimeo, direct video URL, or uploaded video file, transcribes the video, identifies high-potential 30–60 second clips, renders them as 1080x1920 vertical short-form videos with captions, and publishes or exports them to YouTube Shorts, TikTok, and Instagram Reels.

Build this as a production-oriented monorepo using:

- Next.js + React + TypeScript + Tailwind + shadcn/ui for the frontend
- Node.js/NestJS or Next API for the backend API
- PostgreSQL + Prisma for persistence
- Redis + BullMQ for jobs
- Python worker services for video/AI processing
- FFmpeg for rendering
- Faster-Whisper for transcription
- Object storage adapter for generated media

Important implementation priorities:

1. Do not build this as a raw downloader. Build it as a rights-aware creator repurposing workflow.
2. Add a rights confirmation step before processing third-party URLs.
3. Track every source URL, source platform, workspace, and generated clip.
4. Use job queues for all heavy operations.
5. Create clean boundaries between API, worker, database, and UI.
6. Start with YouTube URL, direct MP4 URL, and file upload support.
7. Generate candidate clips from transcripts using heuristic scoring first, then LLM scoring.
8. Render approved clips as vertical 9:16 MP4 files.
9. Build publishing abstractions with fallback export mode for platforms requiring review/audit.
10. Keep platform connectors modular.

Start by creating the monorepo structure, database schema, core API routes, dashboard UI, source import flow, and job queue foundation.
```

---

## 22. MVP Acceptance Criteria

The MVP is complete when:

- User can sign in
- User can create a workspace
- User can paste a YouTube/direct video URL or upload a video
- User confirms rights/permission
- System extracts metadata
- System transcribes the video
- System generates 5–10 candidate clips
- User can approve/reject candidates
- System renders vertical clips with captions
- User can download clips
- User can connect YouTube and attempt Shorts upload
- TikTok and Instagram have connector scaffolds and export fallback
- Discovery page can show YouTube most-popular/search results
- All major operations are queued and status-tracked

---

## 23. Suggested Future Business Model

### Free

- 3 clips/month
- Watermarked exports
- Manual download only

### Creator

- 100 clips/month
- No watermark
- YouTube publishing
- Basic brand kit

### Pro

- 500 clips/month
- TikTok/Instagram connectors
- Scheduling
- Batch generation
- Advanced captions

### Agency

- Multi-workspace
- Client approvals
- Team roles
- White-label exports
- Analytics dashboard

### Enterprise

- Private deployment
- Custom integrations
- SSO
- Dedicated storage
- Compliance controls

---

## 24. Final Product Direction

ClipForge should be positioned as:

> “Turn long-form videos into platform-ready Shorts, Reels, and TikToks with AI-assisted clipping, captions, and publishing.”

The strongest version of the product is not just a clip generator. It is a complete short-form content operations platform:

- Discovery
- Import
- Rights confirmation
- Transcription
- AI clip selection
- Smart vertical rendering
- Caption styling
- Brand templates
- Approval workflow
- Publishing
- Scheduling
- Analytics
- Feedback loop

Build the MVP around reliability, compliance, and great clip quality. Then expand into automation, scheduling, brand kits, and analytics.
