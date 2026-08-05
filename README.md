# ReleaseIQ

ReleaseIQ is an AI-powered mobile app release readiness and quality assurance platform for Android and iOS teams. It helps developers, QA engineers, and software teams check whether an app is ready for release before submitting it to the Google Play Store or Apple App Store.

The platform brings release checks into one dashboard: app details, privacy policy review, permission analysis, compliance findings, QA test case generation, readiness scoring, reports, and project history.

## Problem We Are Solving

Mobile app releases require teams to manually verify permissions, privacy policy content, store guideline requirements, QA artifacts, release notes, and compliance risks. This process is repetitive, fragmented, and easy to miss under deadline pressure.

ReleaseIQ aims to make this process structured, faster, and more reliable by combining release workflow management with AI-assisted analysis.

## What We Are Building

The final product will be a production-like SaaS web application with these core modules:

- User authentication
- Dashboard
- Project management
- App detail upload
- Privacy policy upload and validation
- Android manifest upload
- Permission analysis
- AI compliance analysis
- AI test case generator
- Release readiness assessment
- Report generation
- Project history

## Current Phase

We are currently building the frontend UI only.

At this stage:

- Backend is not implemented yet.
- AI analysis is not implemented yet.
- Database is not connected yet.
- All product data is mocked through frontend JSON/data files.
- The goal is to finalize UI/UX, product flow, and clean frontend architecture first.

## Tech Stack

### Frontend

- React.js
- TypeScript
- Tailwind CSS
- shadcn/ui-inspired component structure
- Lucide React icons
- Vite

### Future Backend

- FastAPI
- Python
- PostgreSQL

### Future AI Layer

- LangChain
- LangGraph
- OpenAI, Gemini, or open-source LLMs

### Future Testing

- Pytest
- Postman
- Playwright

### Future Cloud

- AWS

## How We Are Going To Build It

We will build ReleaseIQ iteratively, module by module.

### Phase 1: Documentation and Product Planning

- Finalize SRS
- Define functional and non-functional requirements
- Define user roles and user stories
- Design product flow and information architecture
- Plan database schema and API contracts

Documentation is available in:

```text
docs/ReleaseIQ_Documentation.md
```

### Phase 2: Frontend UI With Mock Data

- Build responsive SaaS dashboard layout
- Create reusable UI components
- Add mock project data
- Build dashboard, project, upload, compliance, permission, QA, report, and history screens
- Keep code modular and ready for backend integration

### Phase 3: Backend API

- Create FastAPI backend
- Add PostgreSQL database
- Implement authentication
- Replace mock data with real API calls
- Add file upload handling for privacy policy and manifest files

### Phase 4: AI Integration

- Add AI-based compliance analysis
- Add privacy policy validation
- Add permission risk explanations
- Generate QA test cases using LLMs
- Generate release readiness recommendations

### Phase 5: Testing and Production Readiness

- Add frontend and backend tests
- Add API testing through Postman
- Add Playwright end-to-end tests
- Improve accessibility and responsiveness
- Prepare deployment setup

## Current Frontend Setup

### Prerequisites

Before running the project, install:

- Node.js 20 or later
- npm
- Git

Check your installed versions:

```bash
node -v
npm -v
git --version
```

### Clone the Repository

```bash
git clone https://github.com/Parth-Gupta-github/ReleaseIQ.git
cd ReleaseIQ
```

If you already have the project locally, open the project folder:

```bash
cd F:\Music\ReleaseIQ
```

### Install Dependencies

Install dependencies:

```bash
npm install
```

This creates the `node_modules` folder and installs React, Vite, Tailwind CSS, TypeScript, and other frontend dependencies.

### Start Development Server

Run the development server:

```bash
npm run dev
```

By default, Vite starts the app at:

```text
http://localhost:5173/
```

Open this URL in your browser to view the ReleaseIQ UI.

### Build the Project

Build for production:

```bash
npm run build
```

This checks TypeScript and creates an optimized `dist/` build.

### Preview Production Build

Preview the production build:

```bash
npm run preview
```

### Useful Commands

```bash
npm install      # Install project dependencies
npm run dev      # Start local development server
npm run build    # Create production build
npm run preview  # Preview production build locally
```

### Troubleshooting

If dependencies are missing or the app does not start, run:

```bash
npm install
```

If the Vite port is already in use, Vite will show another available URL in the terminal.

If TypeScript or build errors appear, run:

```bash
npm run build
```

Then check the terminal output for the exact file and line number.

## Project Structure

```text
ReleaseIQ/
+-- docs/
|   +-- README.md
|   +-- ReleaseIQ_Documentation.md
+-- src/
|   +-- components/
|   +-- data/
|   +-- lib/
|   +-- App.tsx
|   +-- main.tsx
|   +-- styles.css
+-- index.html
+-- package.json
+-- tailwind.config.js
+-- tsconfig.json
+-- vite.config.ts
```

## Development Approach

The project will follow modern software engineering practices:

- Component-based frontend architecture
- Type-safe development with TypeScript
- Mock-first UI development
- Clear separation between UI, data, and utility logic
- Scalable folder structure
- Documentation-first planning
- Incremental module development

## Status

Initial documentation and initial dashboard UI have been started. The next frontend modules will be added one by one after each screen flow is refined.
