-- Add user_id column to form_submissions table for better ownership tracking
ALTER TABLE form_submissions 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on user_id for better performance
CREATE INDEX idx_form_submissions_user_id ON form_submissions(user_id);

-- Update the RLS policies to use user_id for better security

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own submissions" ON form_submissions;

-- Create new policy for viewing submissions (users can only view their own)
CREATE POLICY "Users can view their own submissions" ON form_submissions
  FOR SELECT 
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Update insert policy to automatically set user_id
DROP POLICY IF EXISTS "Users can submit form submissions" ON form_submissions;

CREATE POLICY "Users can submit form submissions" ON form_submissions
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Add a trigger to automatically set user_id on insert if not provided
CREATE OR REPLACE FUNCTION set_user_id_on_form_submission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_user_id_on_form_submission_trigger
  BEFORE INSERT ON form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_on_form_submission();

-- Add comment explaining the enhanced security
COMMENT ON COLUMN form_submissions.user_id IS 'References the user who submitted this form. Automatically set on insert.';
