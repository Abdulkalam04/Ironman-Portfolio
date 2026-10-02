# Abdul Kalam — Portfolio (Iron Man edition)

Next.js 16 + React 19 + Tailwind 4 + Framer Motion + Lenis. The Iron Man scroll-driven
frame sequences carry all of Abdul's portfolio content.

## Run
```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Edit your content
Everything (bio, stats, skills, projects, journey, education, certificates, links) lives in
**`src/lib/profile.ts`**. Scroll-card text for the hero is in `src/lib/hero.ts`.

## Page order
Hero (scroll) → About + Core Focus → Skills → Projects (+ case-study modal) →
Journey (scroll) → Education & Certificates → 3 mini-games → Resume CTA → Contact → Footer.

## Assets (`public/`)
`frames/`, `frames2/` (Iron Man sequences) · `videos/` · `project-assets/` · `images/` ·
`certificates/` (PDFs) · `resume/abdul-kalam-cv.pdf` · `favicon.svg`
