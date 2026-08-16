# Testing sandbox

`clients.js` and `backend-info.js` return simulated, clearly-fake records
(see `db/supabase-setup.sql` for the seed data) behind the exact same
`requireSession` gate every real protected route uses. They exist so the
auth system can be attacked on purpose — direct calls without a cookie,
tampered cookies, brute-forcing `/api/unlock`, etc. — without risking real
data. Nothing under `/api/test/*` ever touches a table that holds anything
but seed placeholders.
