# OrbisLoop — Landing Page

**Infrastructure for the Circular Economy**

OrbisLoop is a digital infrastructure platform transforming global waste into high-value circular supply chains. This repository contains the public-facing site, product concepts, and technical research that support the OrbisLoop platform direction.

---

## Repository Overview

This repository now serves two purposes:

1. **Public web presence** — the landing page and related frontend assets.
2. **AI infrastructure thesis** — research documents that explain how OrbisLoop can evolve into an intelligence layer for circular supply chains.

---

## Project Structure

```text
├── index.html                  # Main landing page
├── styles.css                  # Site styling
├── script.js                   # Minimal JavaScript interactions
├── public/                     # Static assets
├── app/                        # Next.js application prototype
├── platform/                   # Platform prototype / service workspace
├── research/                   # AI infrastructure direction and technical proof
│   ├── README.md
│   ├── system-architecture.md
│   ├── ai-roadmap.md
│   ├── computer-vision-workflow.md
│   └── forecasting-routing-simulation.ipynb
└── README.md                   # Repository overview
```

---

## Core Product Direction

OrbisLoop is positioned as **infrastructure for the circular economy**.

The platform direction is to connect material producers, aggregators, logistics operators, processors, and enterprise buyers through shared operational intelligence. Over time, the platform can support:

- material visibility across circular supply chains
- reverse logistics coordination
- contamination and quality detection
- forecasting of waste streams and recovery volumes
- optimization of pickup, routing, and processing decisions
- measurement of circularity and diversion outcomes

---

## AI Infrastructure Direction

The `research/` folder captures how OrbisLoop can mature from a digital platform into an **AI-enabled operating system for circular supply chains**.

Included artifacts:

- **System architecture diagram** — platform and ML system boundaries
- **AI roadmap** — staged path from analytics to automation
- **Sample computer vision workflow** — material classification and contamination detection
- **Forecasting/routing simulation notebook** — operational optimization proof-of-concept
- **AI infrastructure README** — narrative explaining the direction

This material is designed to make the repository a stronger public proof point for product strategy, systems thinking, and applied AI.

---

## Existing Site Sections

| Section | Description |
|---------|-------------|
| Hero | Main headline, CTAs, credibility badges, illustration |
| Social Proof | Animated supporter counter |
| Problem | The global waste problem with statistics |
| Solution | OrbisLoop introduction and pillars |
| How It Works | 4-step visual process |
| Platform Features | Feature cards with hover effects |
| Platform Diagram | Horizontal material flow |
| Technology Architecture | Layered backend architecture diagram |
| Industry Focus | Supermarket-first strategy |
| Market Opportunity | Circular economy opportunity framing |
| Early Partners | Partner category cards |
| Waitlist | Email signup form |
| Pilot Program | CTA for pilot applications |
| Founder Quote | Vision statement |
| Footer | Links and attribution |

---

## Waitlist Integration

The waitlist form submits to Buttondown using the configured OrbisLoop embed endpoint in `index.html`.

To use a different Buttondown account, replace the configured username in the form action URL.

---

## Notes

The materials in `research/` are intentionally lightweight, public-facing technical documents. They are meant to communicate architecture, product thinking, and AI direction rather than represent production-ready ML systems.

---

## License

© 2026 OrbisLoop. All rights reserved.
