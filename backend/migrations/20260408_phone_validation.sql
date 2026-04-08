/* 
  MediNest Database Migration
  Task: Add Phone Number Validation
  Description: Enforces that the 'contact' field in 'patients' table is exactly 10 digits.
*/

-- Add a check constraint to the patients table
-- This regex ensure the contact is exactly 10 digits (0-9)
ALTER TABLE patients
ADD CONSTRAINT contact_length_check
CHECK (contact ~ '^[0-9]{10}$');

-- Optional: Add a comment to the constraint
COMMENT ON CONSTRAINT contact_length_check ON patients IS 'Ensures patient contact numbers are exactly 10 digits.';
