-- تعديل أعمدة جدول user_plans لتقبل القيم العشرية
ALTER TABLE public.user_plans 
  ALTER COLUMN monthly_credits TYPE NUMERIC(10,2),
  ALTER COLUMN daily_credits TYPE NUMERIC(10,2),
  ALTER COLUMN max_daily_credits TYPE NUMERIC(10,2),
  ALTER COLUMN credits_used_today TYPE NUMERIC(10,2),
  ALTER COLUMN total_credits_used TYPE NUMERIC(10,2);

-- التأكد من أن جدول credit_transactions يستخدم NUMERIC أيضاً (هو بالفعل كذلك ولكن للتأكيد)
ALTER TABLE public.credit_transactions 
  ALTER COLUMN credits_used TYPE NUMERIC(10,2);
