# SEO Strategy

## In scope
- Public home / landing page (`/`)
- Public ministry announcements page (`/ministry`)
- Public legal pages (`/privacy`, `/terms`)
- Shared crawlability assets (`robots.txt`, `sitemap.xml`, `llms.txt`, manifest, canonical signals)
- Other future public marketing or discovery pages that do not require authentication

## Out of scope
- Authenticated application routes (`/app/**`)
- Admin pages and moderation workflows
- Internal teacher/student/parent dashboards that require login

## Public-route notes
- The current source intends `/`, `/ministry`, `/privacy`, and `/terms` to be indexable.
- `/login`, `/register`, `/pending`, and `/rejected` are utility pages and should remain non-indexed.
- Public teacher profiles (`/teachers/:userId`) exist, but the current product strategy is to keep them out of search until profile-specific server-rendered HTML and metadata are available.

## Target audience
- Zimbabwean students preparing for ZIMSEC and Cambridge exams
- Teachers and parents supporting secondary-school exam preparation in Zimbabwe

## Primary keywords
- ZIMSEC exam prep
- Cambridge exam prep Zimbabwe
- past papers Zimbabwe
- AI tutor for ZIMSEC and Cambridge

## Canonical host expectation
- Production frontend target is Vercel; SEO signals should consistently use the production Vercel host unless the project later adopts a custom domain.

## Dismissed categories
- (None yet)
