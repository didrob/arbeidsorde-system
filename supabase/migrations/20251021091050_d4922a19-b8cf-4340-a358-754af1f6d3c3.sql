-- Add daily_capacity_hours to personnel table
ALTER TABLE public.personnel 
ADD COLUMN daily_capacity_hours DECIMAL(5,2) DEFAULT 7.5;

COMMENT ON COLUMN public.personnel.daily_capacity_hours IS 'Standard daily working capacity in hours (e.g., 7.5 for normal workday)';