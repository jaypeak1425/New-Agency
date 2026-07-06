-- Owner directive 2026-07-06: Case Atlas is $297/mo ($2,970/yr) globally.
-- Plan IDs embed the price, so the default and any existing rows move too.
ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET DEFAULT 'agent_monthly_297';
UPDATE "subscriptions" SET "plan" = 'agent_monthly_297' WHERE "plan" = 'agent_monthly_97';
UPDATE "subscriptions" SET "plan" = 'agent_annual_2970' WHERE "plan" = 'agent_annual_970';
