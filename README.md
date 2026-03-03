small update:
We're working on just polishing stuff.
Def-Dev is first - we've already finished that.

We're working on polishing the docs and the main moving forward

We're sorry for the lack of updates this past month - school's been hitting us hard

We promise we're working on it!

---
## Quick viewable status:


Online/offline:
### CURRENTLY ONLINE!
primary: `urbanshade.aswd.dev`

secondary: `urbanshade-os.vercel.app/` (Note: urbanshade.vercel.app will take you to a Pressure inspired gambling website.)

Update cycle: every 2nd week on Friday - Sunday we push an update (hopefully)

---
## What is this in the first place?

Urbanshade OS is a browser-first operating system project focused on a playful, developer-friendly desktop environment with a strong emphasis on documentation, package distribution (UUR), and developer tooling.

### Highlights - Bigger features you should know about

- Online Accounts & Cloud Sync (Introduced in v2.6, improved in v2.7)
  - Full Supabase-backed online account system: sign up / sign in, profile (display name + avatar), and account management.
  - Automatic and manual sync of settings, desktop icons, installed apps, and system state.
  - Visual sync indicators in the taskbar and Start Menu; UUR submissions can sync to Supabase cloud storage.
  - Better feedback and status display for cloud operations.

- UUR Manager & Package Ecosystem (Introduced in V2.5)
  - UUR Manager app (desktop + terminal access) for discovering, submitting, installing, and running packages.
  - Built-in sample packages (Hello World, System Info) and a GitHub-based submission + review workflow for community contributions.
  - Redesigned UUR Manager UI (v2.7): sidebar navigation, category filters, richer package cards, search improvements, and a statistics dashboard.
  - Real-time submission status backed by cloud storage.

- DEF-DEV (Developer Mode) Overhaul (Base made in V2.1, made public in V2.3)
  - Comprehensive DEF-DEV documentation and a multi-tab terminal experience (Console, Actions, Storage, Terminal).
  - New DEF-DEV Terminal with command queue and remote execution support; action monitoring with persistence and consent flows.
  - First-boot DEF-DEV setup with explicit consent, alternative dev storage for development, and improved crash entry workflows.

- Bugcheck / Crash Handling
  - New BugcheckScreen with severity levels, readable explanations, stack trace capture, and automatic bugcheck logging to DEF-DEV.
  - Styled crash screens for testing and clearer separation from real OS bugchecks.

- Documentation System (v2.2+)
  - Full in-app documentation with multiple guide pages: Getting Started, Core Apps, Facility Apps, Terminal commands, Advanced Features, Shortcuts, Troubleshooting, and more.
  - Multi-version changelog viewer and improved navigation across docs.

- Recovery, BIOS, and Installer Improvements (v2.1)
  - Modernized BIOS/UEFI interface, recovery mode with consistent theming, reboot options (including BIOS and Recovery shortcuts), and a proper app installer.
  - File Reader gained editing features and better integration with "Open with" workflows.

- Foundation & Architecture (Since v2.0)
  - Complete rewrite to a modern stack: React + TypeScript + Tailwind CSS, Vite build system, and a component-driven architecture for performance and maintainability.

--- Other notable improvements
- Admin tooling and command queue (maintenance, safe mode, logout, and package helpers).
- Diagnostics and system health monitoring pages.
- Visual and UX polish across windows, taskbar, start menu, and animations.
- Ongoing bug fixes and quality-of-life updates (username display in Start Menu, copyright year, consistent versioning).

This has been being built by me, and some help from my friends and lovable.dev, since January 27, 2025. This has been my largest project to date. It was private until around
september, when since then its been public for everyone to contribiute and use, which is right around when V2.0 dropped.

## Where to find the full changelog
The full changelog can be found in the site!
Thank you for checking out Urbanshade OS - A *"passion project"*! contributors and community involvement are welcome!


## How to setup localy:

1. Download this repo
2. Download node.js (needed instantly)
3. Install miniweb (Or if you have python, get a python script that can run localhost. This setup will run over how to setup with miniweb)
4. After installing node.js, go to repo folder, open cmd and do `npm install` (This gets all the dependencies)
5. After getting the dependencies, do `npm run build` If you dont see any red text, there should be a dist\ folder.
6. Goto dist\ and put all the contents into a folder `htdocs`
7. Put miniweb in the folder where `htdocs` is located
8. Run miniweb

It should be good to go now on `http://localhost:8080` or `localhost:8000`
(depends machine from machine, if one doesnt work try the other!


## Is this paid?


This is not paid in any way, shape, or form. You are free to use this as long as you follow the agreement.


## Unofficial/mutual agreement


"Am i allowed to copy this?"
Short answer: Yes - with respect.
Please follow these guidelines before using or redistributing any part of this project:

---

• 	Attribution: Do not claim the project (or major parts of it) as your own. Include a visible attribution line in your fork or derivative work. Example:


• 	"Based on Urbanshade by aswdBatch - https://github.com/aswdBatch/urbanshade-7e993958"


• 	Redistribution: Do not redistribute the project verbatim as your own project. If you redistribute, clearly state what you changed and keep a link back to the original repository.


• 	Modifications: You are welcome to modify the code. When you do, document the changes (what, why, and who made them) in a changelog or in commit messages.


• 	Commercial use: If you plan to use this in a commercial product or for large-scale distribution, please contact the maintainer first to discuss licensing and attribution.


• 	No explicit license yet: This repository currently does not include a formal license file. Copyright is retained by the author. If you want clearer permissions, request that a license (for example MIT or Apache-2.0) be added.


• 	Contributing back: If you improve something, please consider opening a pull request so improvements can benefit everyone.

---


## Reporting problems and giving suggestions
We value your feedback! To keep things organized, please open a single GitHub issue for each distinct bug or suggestion. Use the format below to make issues easy to triage and act on.
Issue Template (Copy and Paste)
---
Title: [Your Name] - [Feedback Title]

Type: Bugs / Suggestions / Questions

Description:

Use this issue to report all your bugs, suggestions, and questions together.

Keep everything organized with clear headings and bullet points.

Bugs:
- Short description
- Steps to reproduce:
  1. Step one
  2. Step two
- Expected vs actual result

Suggestions:
- Short description
- Why it would help
- Optional idea for improvement

Questions (optional):
- Any clarifications or uncertainties you’d like answered

Environment (optional):
- Browser / OS / version / device, if relevant

Attachments (optional):
- Screenshots, logs, or small code snippets that help explain the issue
---
Notes:
• 	Submit one issue per person.

• 	Inside that issue, you can list as many bugs, suggestions, and questions as you want.

• 	Be specific and concise — steps to reproduce and screenshots help a lot.

• 	If you prefer not to use GitHub Issues, you can leave a comment or open a discussion, but please follow the same format above.

Thank you for helping improve Urbanshade OS!
---
### Reporting CRITICAL Errors
This section is only for compile-time errors. For other bugs, please use the standard feedback template.
Steps Before Reporting:
1. 	Make sure you have all dependencies installed:

2. 	If the error still persists:
   
• 	Take a screenshot of the error.

• 	Copy both the command you ran () and the full error output.

• 	Send them to: `emailbot00noreply@gmail.com` using the template below.



Email Template
---
Subject: [Your github handle] - Critical Compile Error


Hello. I've encountered this error while compiling:

*Example error:*
C:\Path-here\Project-folder>npm run build


> vite_react_shadcn_ts@0.0.0 build
> vite build


vite v5.4.19 building for production...


*error*


Failed in (seconds) seconds.

C:\Path-here\Project-folder>

Screenshot: [attach screenshot file]
Environment:
- OS: [Windows / macOS / Linux / Android]
- Node.js version: [e.g. v18.17.0]
- npm version: [e.g. 9.6.7]
- Device: [Laptop / Phone / etc.]
---

Notes
• 	Only use this process for compile-time errors (build fails, dependency issues, etc.).

• 	For runtime bugs, UI glitches, or feature suggestions, please use the standard GitHub issue template.

• 	The more detail you provide (error logs, environment info, screenshots), the faster the issue can be diagnosed.

• 	This is ONLY meant for COMPILER ERRORS, and you must be using a supported Node.js version.
