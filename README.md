# The K App V2 (MentorME)

**Zero Trust AI Action Engine & Talent Matching Platform**

MentorME is a career readiness and talent matching platform designed to bridge the gap between international candidate capability and verified employer demand. By replacing noisy, unstructured resumes with a strict capability taxonomy and constrained AI, the platform provides transparent skill gap analysis, actionable roadmap generation, and a consent-first employer pipeline integrated with cohort-based peer communities.

🔗 **Live Demo:** [https://mentorme-mt31.onrender.com/](https://mentorme-mt31.onrender.com/)

---

## 🏗️ Core Architecture & Features

* **Strict 3x3x3 Taxonomy:** Eliminates free-text hallucination by constraining technical skills, languages, and regional dialect contexts to verified arrays enforced by backend middleware (`validateConstraints`).
* **Deterministic Filtering & Gap Analysis:** Combines upfront rule-based checks (work rights, location, prerequisites) with vector embeddings to calculate objective alignment scores against live role requirements.
* **Constrained AI Action Engine:** Integrates a bounded Claude 3.5 Sonnet pipeline to translate capability gaps into deterministic, 3-step action roadmaps tied to measurable evidence.
* **Consent-First Employer Pipeline:** Allows employers to evaluate validated competencies and express interest while keeping candidate identities protected until mutual consent is established.
* **Cohort Community Integration:** Dynamically embeds Discord community links across student action plans and employer job listings to drive peer collaboration and guided upskilling.

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js, TypeScript
* **AI & Embeddings:** OpenAI API (vector embeddings), Anthropic Claude 3.5 Sonnet (constrained roadmap generation)
* **Frontend:** Responsive HTML5/CSS3 single-page application served statically via Express (`public/index.html`)
* **Hosting:** Render

---

## 📂 Project Structure

```text
The_K_App/
├── public/                 # Static frontend assets (index.html)
├── src/
│   ├── data/               # In-memory stores and taxonomies/constraints
│   ├── pipeline/           # Vector analysis and AI generation logic
│   ├── routes/             # API routes (analyze.ts, employer.ts)
│   └── server.ts           # Express server entry point
├── package.json
├── tsconfig.json
└── render.yaml             # Render deployment configuration
