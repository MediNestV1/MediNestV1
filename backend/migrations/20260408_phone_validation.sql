/* 
  MediNest Database Migration
  Task: Add Phone Number Validation (Robust Version)
  Description: Enforces that the 'contact' field in 'patients' table is exactly 10 digits.
               Cleans existing data by removing non-digits and trimming prefixes.
*/

-- 1. Clean existing data: remove all non-numeric characters (spaces, +, -, etc)
UPDATE patients 
SET contact = regexp_replace(contact, '\D', '', 'g')
WHERE contact ~ '\D'; 

-- 2. Handle prefixes: if the number is > 10 digits (e.g., 91XXXXXXXXXX), keep the last 10
UPDATE patients 
SET contact = RIGHT(contact, 10)
WHERE length(contact) > 10;

-- 3. Add the check constraint
-- We use NOT VALID so the migration succeeds even if some rows are < 10 digits.
-- Those rows will need manual fixing, but new data will be strictly validated.
ALTER TABLE patients
DROP CONSTRAINT IF EXISTS contact_length_check;

ALTER TABLE patients
ADD CONSTRAINT contact_length_check
CHECK (contact ~ '^[0-9]{10}$')
NOT VALID;

-- Optional: Add a comment to the constraint
COMMENT ON CONSTRAINT contact_length_check ON patients IS 'Ensures patient contact numbers are exactly 10 digits. Cleaned existing data during application.';
