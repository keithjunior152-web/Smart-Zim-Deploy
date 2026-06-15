-- ============================================================
-- SmartZim — Seed Data
-- Run after the schema migration. Seeds:
--   • Default curricula (ZIMSEC + Cambridge)
--   • Default payment settings row
-- ============================================================

-- Default curricula
INSERT INTO "curricula" ("code", "name", "country", "levels", "active", "sort_order")
VALUES
  (
    'ZIMSEC',
    'Zimbabwe School Examinations Council',
    'Zimbabwe',
    '[
      {"value":"primary","label":"Primary","grades":["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7"],"subjects":["Mathematics","English","Shona","Ndebele","General Paper","Environmental Science"]},
      {"value":"o_level","label":"O Level","grades":["Form 1","Form 2","Form 3","Form 4"],"subjects":["Mathematics","English Language","Shona","Ndebele","Physics","Chemistry","Biology","Geography","History","Commerce","Accounts","Agriculture","Combined Science","Additional Mathematics","Art","Music","Food & Nutrition"]},
      {"value":"a_level","label":"A Level","grades":["Lower 6","Upper 6"],"subjects":["Mathematics","Further Mathematics","Physics","Chemistry","Biology","Geography","History","Economics","Business Studies","Accounting","English Literature","Divinity","Computer Science"]}
    ]',
    true,
    1
  ),
  (
    'CAMBRIDGE',
    'Cambridge Assessment International Education',
    'Zimbabwe',
    '[
      {"value":"igcse","label":"IGCSE","grades":["Year 10","Year 11"],"subjects":["Mathematics","English as a Second Language","Physics","Chemistry","Biology","Geography","History","Economics","Business Studies","Computer Science","Art & Design","Music"]},
      {"value":"as_level","label":"AS Level","grades":["Year 12"],"subjects":["Mathematics","Physics","Chemistry","Biology","Geography","History","Economics","Business","Computer Science","English Literature"]},
      {"value":"a_level","label":"A Level","grades":["Year 13"],"subjects":["Mathematics","Further Mathematics","Physics","Chemistry","Biology","Geography","History","Economics","Business","Computer Science","English Literature"]}
    ]',
    true,
    2
  )
ON CONFLICT ("code") DO NOTHING;

-- Default payment settings (one row, updated via admin panel)
INSERT INTO "payment_settings" ("ecocash_number", "innbucks_number", "onemoney_number", "whatsapp_number", "instructions")
VALUES ('', '', '', '', 'To activate your subscription, send payment via EcoCash, InnBucks, or OneMoney to the number above, then upload your payment proof below.')
ON CONFLICT DO NOTHING;
