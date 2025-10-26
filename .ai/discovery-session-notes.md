# Discovery Session Notes - AAT Study Platform
**Date:** 2025-10-25
**Session:** Party Mode Brainstorming + Q&A

---

## DECISIONS MADE

### Project Scope
- **Product Vision:** Full adaptive learning platform for AAT certifications (L2/L3/L4) with future expansion to ACCA
- **MVP Scope:** Option 1 - Full Adaptive MVP (complete adaptive learning engine)
- **Quality Bar:** Production-grade from day one (not just personal tool)
- **Timeline:** Flexible - build it right, no artificial deadlines
- **Development Approach:** Joe (PO/QA) + Claude Code (Dev), approval gates at each task, no YOLO mode

### Content & Materials

**Q1: Module Count**
- 4 modules in AAT Level 2

**Q2: Module Order**
1. Introduction to Bookkeeping (ITBK)
2. Principles of Bookkeeping Controls (POBC)
3. Principles of Costing (PCTN)
4. The Business Environment (BENV)
- **Tool allows dynamic module selection** (not forced sequence)

**Q3: Starting Point**
- Fresh start with diagnostic assessment to baseline existing knowledge

**Q4: Timeline**
- AAT L2: 1 month per module (4 months total)
- AAT L3/L4: 2-3 months per module (more complex)
- Flexible based on exam bookings

**Q8: Content Materials**
- **Source:** Eagle Education training materials
- **Structure per module:**
  - Study Buddy PDF (condensed guide)
  - 2-3 Chapter PDFs (detailed content)
- **Student Handbook:** Eagle Student Handbook AAT June 2023
- **L3/L4:** Folders exist, content to be added during development phases

**Q21: Content Strategy**
- Web scraping = development research activity (NOT product feature)
- Tool uses curated content library only
- **Supplementary materials sourcing:**
  - Mock exams scraped/purchased during research phase
  - Question banks extracted and curated
  - Real questions used directly AND as AI generation training data
  - AI generates variations and gap-filling questions
- All content version controlled
- Quality validation: real vs AI questions labeled during testing phases

**Q42 & 42b: Build Strategy**
- Build extensible framework supporting multiple qualifications and modules
- Qualification → Module → Content hierarchy
- Config-driven (YAML/JSON)
- **MVP Content:** All 4 AAT L2 modules
- **Phase 2:** AAT L3 modules (materials added as Joe progresses)
- **Phase 3:** AAT L4 modules
- Developer workflow documented for adding new quals/modules

### Architecture & Technology

**Q17: Production Quality**
- Production-quality MVP even though initially personal use
- No shortcuts on UX, error handling, code quality
- Architected for commercialization from day one

**Q26: Development**
- Claude Code handles all implementation
- Stories written for AI agent consumption (hyper-detailed, explicit)
- Joe validates at task level, drives project direction
- Tech stack: Best-in-class, no legacy constraints

**Q27: Hosting & Deployment**
- **Phase 1 (Personal):** Self-hosted Docker Compose on server with Caddy/Nginx
- Globally accessible via domain + SSL
- PostgreSQL database (production parity)
- **Phase 2 (Commercial):** Migrate to Vercel + managed services

**Q33: UI/UX Quality**
- **Target:** Duolingo-level polish
- Beautiful, clean, unique, optimized for learning
- Delightful micro-interactions
- Gamification done right (not patronizing)
- **Platform-appropriate design** - rich desktop features, optimized mobile core (not mobile-first that limits desktop)

**Auth (Q31b):**
- Better Auth library
- Sign-in page only initially (no public registration)
- Users manually seeded
- Add sign-up flow when commercializing
- Full session management, protected routes

**Database:**
- PostgreSQL from day one (consistency across environments)

**Tech Stack Direction:**
- Python backend (FastAPI) for AI/ML
- Next.js frontend (mobile-first PWA)
- PostgreSQL + Redis
- Docker Compose orchestration
- Caddy for reverse proxy + SSL

### Adaptive Learning Features (FULL SCOPE)

**Q10 & Q11: Study Patterns**
- **Flexible scheduling** - asked during onboarding questionnaire
- **Multiple study modes:**
  - Deep focus (1-2 hours)
  - Standard (30-45 min)
  - Quick review (15-20 min)
  - Micro-learning (5-10 min)
- Tool adapts content chunking to selected mode

**Adaptive Engine Requirements:**
1. **Onboarding Questionnaire:**
   - Study time preferences (time of day, frequency)
   - Session length preferences (micro/short/medium/long)
   - Learning style assessment
   - Availability commitment (hours per week)
   - Exam deadline
   - **Notification preferences:**
     - Push notifications (default enabled)
     - Email reminders (optional)
     - Calendar integration (Outlook/iOS/Gmail) (optional)

2. **Performance-Based Adaptation:**
   - Track quiz/assessment performance per topic
   - Identify weak areas (< threshold accuracy)
   - Auto-inject remedial lessons
   - Increase practice for weak areas
   - Reduce focus on mastered topics

3. **Dynamic Study Plan Recalibration:**
   - After checkpoints: analyze performance
   - Regenerate plan based on mastery/struggles
   - Account for time remaining
   - Track compliance vs planned
   - Suggest study style changes if needed

4. **Notification/Reminder System:**
   - Scheduled per user preferences
   - Adaptive frequency
   - Multiple channels (email, push)

**Q14: Motivation Mechanics**
- **Mix of:** Accountability, gamification, achievement tracking
- **User profile:** Loses concentration easily
- **Design principle:** Must be highly engaging experience
- Visual progress, streaks, mastery badges
- Celebration moments for milestones

**Q24: Success Metrics**
- Subjective confidence/preparedness (self-rating)
- Pop quiz performance trends (improvement over time)
- Mock exam scores
- Actual AAT exam results
- Combination of leading + lagging indicators

### System Architecture Components

**Core Systems:**
- Content Management (qualification/module framework)
- **RAG Knowledge Base System** (CRITICAL - grounds all AI in approved content)
  - PDF Ingestion Pipeline
  - Text extraction & chunking
  - Vector database for semantic search
  - Embedding generation
- Diagnostic Assessment Engine
- Study Plan Generator
- Adaptive Learning Engine
- Performance Analytics
- Questionnaire System
- Lesson Delivery (multi-mode)
- Quiz/Assessment Engine (RAG-powered)
- Notification/Reminder System
- Spaced Repetition (SM-2 or FSRS)

**Advanced Features:**
- Weak area identification
- Performance prediction (exam readiness)
- Content recommendation
- Study plan optimization
- Trend analysis & visualization

---

## QUESTIONS STILL TO ANSWER

### Context & Background
- **Q5: Past Study Methods**
  - **Tried:** Self-learning, textbooks
  - **Result:** Not engaging enough (failed to stick)
  - **Implication:** Tool MUST be highly interactive and engaging
  - **Research needed:** Gamification mechanics, engagement patterns, effective study methods
- **Q6 & Q7: User Rollout Strategy**
  - **Phase 1:** Personal use (Joe only)
  - **Phase 2:** Staff testing (if successful with personal use)
  - **Phase 3:** Commercial launch (if staff validation successful)
  - **Implication:** Multi-user architecture required, user management, analytics for aggregate data
- **Q9: Content Rights & Licensing**
  - **Eagle Education materials:** Legal for personal use (Phase 1 & 2)
  - **Commercial transition requirement:** Must develop original content (cannot use Eagle Education materials)
  - **Research phase purpose:** Build knowledge base + sourced materials for future original content creation
  - **Risk mitigation:** Research phase identifies supplementary open/licensable materials

### User Behavior
- **Q12: Study Locations**
  - **Mix of environments** (home, commute, work breaks, public spaces, on-the-go)
  - **Device strategy:** Fully responsive across desktop/tablet/mobile
  - **Mobile is accessibility feature** - ensures people without desktops can still use tool
  - **Mobile-first UI patterns** but NOT mobile-only (desktop remains primary for deep study)
  - **Implication:** Responsive PWA, touch-optimized, but rich desktop experience too
- **Q13: What Derails Study Plans - CRITICAL INSIGHT**
  - **Primary user has ADHD characteristics:**
    - Struggles to stick with non-engaging content
    - Gets bored very easily
    - **When engaged → hyperfocus state** (superpower to leverage!)
  - **CORE DESIGN CONSTRAINT:** Tool MUST maintain engagement or user will abandon
  - **Design Implications:**
    - Dopamine-driven reward system (instant gratification)
    - Variable rewards (unpredictability maintains interest)
    - Immediate feedback loops
    - Bite-sized default, hyperfocus mode available
    - Novelty and variety in question formats
    - Visual progress (satisfying to watch)
    - Minimal friction to start sessions (remove barriers)
    - Momentum preservation (make it hard to quit mid-session)
    - **This is NOT nice-to-have - this is MAKE-OR-BREAK**
- **Q15: Notification/Reminder Preferences**
  - **Default:** Push notifications (browser/PWA)
  - **Optional integrations:**
    - Email reminders
    - Calendar blocks (Outlook, iOS Calendar, Gmail Calendar)
  - **Collection timing:** Part of onboarding questionnaire (before study plan generation)
  - **Implication:** Study plan generator needs calendar integration API, email service, push notification service
- Q16: Prefer gamification or serious professional tracking? (ANSWERED: mix/gamification)

### Product Scope
- **Q18: Platform Strategy**
  - **MVP:** Progressive Web App (PWA) - responsive across desktop/tablet/mobile
  - **Future (Commercial):** Native iOS/Android apps
  - **Platform-Appropriate Features:**
    - **Desktop:** Rich analytics, side-by-side layouts, detailed dashboards, multi-panel views (leverage screen real estate)
    - **Mobile/Tablet:** Core features optimized for touch, simplified views, essential tracking
    - **Native apps:** Core mobile experience + offline-first + native notifications (some desktop features may not translate)
  - **Design Philosophy:** Not strictly mobile-first - design optimal experience per platform, don't limit desktop by mobile constraints
  - **Implication:** Responsive design with conditional feature rendering based on screen size/capabilities
- **Q19: Offline Study Strategy**
  - **Primary mode:** Online-required (AI features need connectivity)
  - **Optional offline mode (future enhancement):**
    - Pre-download content for flights/trains/no-connectivity scenarios
    - Static question sets (pre-generated, not adaptive)
    - Simple answer validation (no AI explanations)
    - Progress saved locally, synced when reconnected
    - Degraded experience (no AI assistance, no adaptive features)
  - **MVP:** Online-only, add offline mode as Phase 2 feature if needed
  - **Implication:** Service workers for PWA, but not critical path for MVP
- **Q20: Social Features**
  - **Phase 1 & 2 (Personal/Staff):** No social features (not applicable for small user base)
  - **Phase 3 (Commercial):** Consider social features when there's critical mass:
    - Leaderboards (competitive motivation for ADHD)
    - Study groups (peer accountability)
    - Shared achievements/progress
  - **MVP:** Pure solo experience, architecture can support future social features
- **Q22: Mock Exam & Question Strategy**
  - **Research phase activity:** Scrape/source real AAT mock exams and question banks
  - **Question sourcing approach:**
    - Use real questions from scraped materials
    - Use real questions as basis/patterns for AI-generated questions
    - AI generates additional questions to fill gaps and enable adaptive variation
  - **Testing phase (Personal/Staff - Phase 1 & 2):**
    - Questions labeled as "Real" or "AI-Generated" (for quality validation)
    - Allows Joe/staff to assess AI question quality vs real exams
  - **Commercial phase:**
    - No labels - seamless blend of real and AI questions
    - Users don't need to know source
  - **Implication:** Question metadata includes source type, conditional display in testing mode
- **Q23: Content Curation vs Automation**
  - **Production behavior:** Fully automated AI question generation (on-the-fly, no manual review)
  - **Development/Testing validation:**
    - Spot-check AI-generated questions during Phase 1 & 2
    - Manual review of samples to validate quality
    - Compare AI questions against real exam patterns
    - Build confidence in prompt engineering and quality
  - **Quality gates:**
    - During testing: Joe/staff can flag bad questions for analysis
    - Feedback loop improves prompts/generation logic
    - Once validated, trust the system in production
  - **Implication:** Question flagging/feedback system for testing phases, analytics on question quality
- **Q25: Success Criteria - Minimum Viable Outcome**
  - **Personal success metric:** Pass ALL AAT levels (Level 2, Level 3, Level 4) using this tool
  - **Implication:**
    - Tool must be effective enough to carry Joe through ~12+ months of studying
    - Must work for basic (L2) AND advanced (L3/L4) modules
    - Proves tool effectiveness across difficulty levels
    - If successful, validates commercial viability (if it worked for Joe's ADHD, it can work for others)
  - **MVP celebration milestones:**
    - ✅ Tool built and functional (ready to start L2 Module 1)
    - 🎯 Passed AAT Level 2 (all 4 modules) - validates basic effectiveness
    - 🏆 Passed AAT Level 3 - validates scaling to advanced content
    - 🚀 Passed AAT Level 4 - FULL SUCCESS, ready for commercial consideration

### Technical
- **Q28: AI API Budget & Model Strategy**
  - **Phase 1 - Development:** Gemini API free tier (zero cost during testing)
  - **Phase 2 - Evaluation:** OpenRouter (test multiple models - Claude, GPT-4, Gemini Pro, etc.)
  - **Phase 3 - Production:** Selected best-performing model based on:
    - Quality (question generation, explanations)
    - Cost per API call
    - Speed/latency
    - Works best for Joe's learning needs
  - **Implementation:** LangChain for model abstraction (easy switching via config)
  - **Cost optimization:**
    - Aggressive caching during development
    - Smart prompt engineering
    - Batch operations where possible
  - **Implication:** Model provider configurable via environment variables, architecture model-agnostic
- Q29: Preferred tech stack? (ANSWERED: best-in-class, Winston decides)
- **Q30: Calendar Integration Strategy**
  - **MVP approach:** Simple "Add to Calendar" functionality (no deep API integration)
  - **Implementation:**
    - Generate `.ics` (iCalendar) files for study sessions
    - Provide click-to-add links for popular calendars:
      - Google Calendar (web link)
      - Outlook (web link)
      - Apple/iOS (.ics download)
      - Generic (.ics download for any calendar app)
  - **User flow:** Study plan created → "Add to calendar" button → select calendar type → event added
  - **Benefits:** No OAuth, no API keys, universal compatibility, privacy-friendly
  - **Phase 2/3 enhancements:** Full calendar API integration for auto-sync, conflict detection
  - **Implication:** .ics file generation library, calendar link builders, no external calendar APIs for MVP
- Q31: Where should progress data live? (ANSWERED: PostgreSQL)
- **Q32: Third-Party Tool Integrations**
  - **MVP:** None - fully self-contained app
  - All features built in-app (notes, progress tracking, flashcards if needed)
  - No Notion, Todoist, Anki, Obsidian, or other external integrations
  - **Phase 2/3:** May add export capabilities (CSV, PDF) or API for power users
  - **Implication:** Simpler architecture, no external API dependencies beyond AI/calendar
- **Q34: AI Accuracy & Quality Assurance**
  - **MVP approach:** High-confidence validation (Option B)
    - Spot-check AI-generated content during Phase 1 & 2 testing
    - Validate prompt engineering produces accurate questions/explanations
    - Compare against real exam questions to ensure quality
    - Once prompts validated, trust the system in production
  - **Quality assurance process:**
    - Joe tests questions and flags inaccuracies
    - Iteratively refine prompts based on feedback
    - Build confidence that model outputs are exam-accurate
  - **Future commercial enhancement:**
    - Fine-tune or train specialized model for AAT question generation
    - Model trained on curated real questions + validated AI questions
    - Higher accuracy, lower cost per question, faster generation
  - **Risk mitigation:** Real questions prioritized for critical concepts, AI supplements
  - **Implication:** Question feedback/flagging system essential for Phase 1 & 2
- **Q35: Development Iteration Style**
  - **Option A:** Tight feedback loop (build → test immediately → fix → repeat)
  - Joe acts as beta tester throughout development
  - Test features as they're built, not after complete modules
  - Fast iteration cycles, immediate course correction
  - Aligns with BMad agile workflow and Claude Code approval gates
  - **Implication:** Feature branches, continuous testing, story-by-story validation
- Q37: Waterfall or agile? (ANSWERED: agile/iterative per BMad workflow - confirmed by Q35)
- **Q38: Content Validation & Knowledge Base Architecture**
  - **Validation approach:**
    - In-app mock tests (generated + real questions)
    - External official AAT mock tests (taken outside app)
    - Final actual exam results (ultimate validation)
  - **Knowledge Base Strategy - RAG (Retrieval Augmented Generation):**
    - **Source material:** Eagle Education PDFs = approved, exam-accurate content
    - **Implementation:**
      1. PDF text extraction (pdfplumber, LlamaParse for complex layouts)
      2. Intelligent chunking (by topic, concept, section)
      3. Generate embeddings (vector representations)
      4. Store in vector database (ChromaDB, Qdrant, or Pinecone)
    - **Question Generation with RAG:**
      - Retrieve relevant content chunks for topic
      - LLM generates questions GROUNDED in retrieved approved text
      - Prevents hallucination of incorrect accounting principles
    - **Answer Validation with RAG:**
      - Retrieve relevant content for question topic
      - LLM evaluates answer against source material
      - Explanations cite actual study material ("According to Chapter 2...")
  - **Benefits:**
    - AI grounded in exam-accurate approved content
    - Questions match syllabus exactly
    - Explanations reference user's actual textbooks
    - Scales across all modules (same pipeline for L2/L3/L4)
    - Quality controlled by source material quality
  - **Tech Stack:**
    - PDF extraction: pdfplumber or LlamaParse
    - Chunking: LangChain TextSplitter
    - Embeddings: OpenAI/Gemini/model-specific embeddings
    - Vector DB: ChromaDB (local, simple) or Qdrant (production scale)
    - Orchestration: LangChain RAG pipeline
  - **Implication:** RAG is CORE architecture component, not optional. All AI features depend on it.
- **Q39: Error Handling & Quality Gates**
  - **Phase 1 (Initial Development/Testing):**
    - **Zero tolerance** - wrong AI information is immediate blocker
    - Halt studying, investigate root cause, fix the system
    - Refine prompts, improve RAG retrieval, validate source chunks
    - Build confidence that system produces accurate content
  - **Phase 2 (Mature System - Once Validated):**
    - **Flag and continue** approach
    - Joe can flag issues but continue studying
    - Trust that system is mostly accurate (validated through Phase 1)
    - Flagged issues reviewed periodically, not blocking
    - Mock exams will catch any remaining issues
  - **Quality gate transition:**
    - Explicit decision point: "System is mature enough to trust"
    - Based on: X consecutive sessions with no errors, successful mock test results
    - Can revert to strict mode if quality degrades
  - **Implication:**
    - Error flagging system must support both modes
    - Analytics track error rates to validate maturity
    - Clear indicator when system is in "strict mode" vs "trusted mode"
- **Q40: Question Volume Strategy**
  - **Adaptive approach** - system determines based on performance, NOT fixed quantity
  - **Mastery-based progression:**
    - Initial diagnostic establishes baseline
    - System generates/serves questions until mastery demonstrated
    - Mastery criteria: X% accuracy over Y consecutive attempts on topic
    - Struggling topics get MORE questions automatically
    - Mastered topics get FEWER questions (efficiency)
  - **Question sourcing strategy:**
    - Seed with curated real questions (scraped during research)
    - AI generates additional questions on-demand for practice
    - Infinite practice capability (AI can always generate more)
    - Quality controlled by RAG (grounded in approved content)
  - **Benefits:**
    - Efficient for advanced learners (skip what you know)
    - Thorough for struggling learners (practice until mastery)
    - No artificial caps on practice
    - Personalized to each user's needs
  - **Implication:**
    - Mastery algorithm required (define "mastered" criteria)
    - On-demand question generation system
    - Performance tracking per topic/concept
    - Database must handle dynamic question sets (not pre-generated fixed sets)

---

## NEXT STEPS

1. ✅ Complete remaining discovery questions
2. ⏳ Create comprehensive Project Brief
3. ⏳ Execute deep research phase:
   - Adaptive learning algorithms
   - EdTech best practices
   - Spaced repetition (SM-2, FSRS)
   - Duolingo UX patterns
   - Question generation quality
   - AAT exam structure
   - Competitive landscape
4. ⏳ Update Project Brief with findings
5. ⏳ Create full-scope PRD
6. ⏳ Create production Architecture document
7. ⏳ Research & curate supplementary materials

---

## RESEARCH TOPICS IDENTIFIED

### Educational Technology
- **ADHD-Optimized Learning Design** (PRIMARY RESEARCH FOCUS)
  - ADHD learning strategies and best practices
  - Dopamine-driven engagement mechanics
  - Hyperfocus state triggers and maintenance
  - Variable reward schedules (intermittent reinforcement)
  - Instant feedback systems
  - Breaking through executive dysfunction barriers
  - Momentum preservation techniques
  - Novelty vs routine balance for ADHD
- **Gamification mechanics** (CRITICAL - textbooks failed for Joe)
  - Achievement psychology
  - Engagement hooks that work for easily-distracted learners
  - Duolingo's streak/reward systems (why it works for ADHD)
  - Progress visualization that motivates
  - Intrinsic vs extrinsic motivation design
- Adaptive learning algorithms (Khan Academy, Duolingo approaches)
- Spaced repetition systems (SM-2, FSRS 4.5)
- Learning science (Bloom's taxonomy, cognitive load theory, active recall)
- Mobile learning UX patterns
- Microlearning effectiveness (chunking strategies)

### Technical
- **PDF extraction for complex layouts** (CRITICAL - accounting PDFs have tables, formulas, charts)
  - Evaluate: pdfplumber vs LlamaParse vs PyMuPDF
  - Handle tables, financial statements, diagrams
  - Preserve structure for accurate chunking
- **RAG (Retrieval Augmented Generation) architecture** (CORE SYSTEM)
  - Vector database selection (ChromaDB vs Qdrant vs Pinecone)
  - Embedding models (OpenAI vs open-source)
  - Chunking strategies for educational content
  - Semantic search optimization
  - Citation/source tracking for explanations
- Question generation prompt engineering
- AI answer validation techniques
- Better Auth implementation
- Next.js PWA patterns
- Adaptive algorithm implementation

### AAT Specific
- Official syllabus structure (L2/L3/L4)
- Exam formats and pass rates
- Existing question banks (legal to use?)
- Common student pain points
- Mock exam sources

### Competitive Analysis
- Coursera, Udemy AAT courses
- AAT-specific platforms
- General study apps (Quizlet, Anki, RemNote)
- Accounting education tools

---

## KEY ARCHITECTURAL DECISIONS

1. **ADHD-optimized engagement is THE core design principle** (make-or-break)
2. **Multi-certification platform** (not AAT-only)
3. **Qualification → Module hierarchy**
4. **Config-driven content** (not admin panel)
5. **PostgreSQL for all environments**
6. **Mobile-first responsive design**
7. **Better Auth from day one**
8. **Docker Compose + Caddy deployment**
9. **Full adaptive learning engine in MVP**
10. **Production-quality standards throughout**
11. **Curated content library** (no live scraping)

---

## SCOPE CONFIRMATION

**BUILDING:** Full Adaptive Learning Platform (Option 1)
- Complete adaptive engine
- All intelligent features
- Production-quality codebase
- Duolingo-level UX
- Timeline: 3-6 months estimated

**NOT building incrementally** - going all-in on full vision.

---

## COMMERCIAL TRANSITION REQUIREMENTS

When moving from personal → commercial:
1. **Content licensing:** Replace Eagle Education materials with original or licensed content
2. **Deployment:** Migrate from self-hosted to Vercel/managed services
3. **User management:** Add sign-up flow, email verification, password reset
4. **Payment integration:** Subscription/pricing model
5. **Legal:** Terms of service, privacy policy, GDPR compliance
6. **Support:** Customer support infrastructure
7. **Analytics:** Aggregate user analytics, A/B testing

**Content Creation Strategy:**
- Research phase builds knowledge of AAT syllabus, question patterns, teaching methods
- Curated supplementary materials can inform original content
- May need subject matter experts (SMEs) for content validation
- Consider licensing arrangements with training providers
- **Future: Custom model training** - fine-tune specialized AAT question generation model for commercial phase

---

*Session continued...*
