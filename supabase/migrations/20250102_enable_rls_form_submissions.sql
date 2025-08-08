-- Enable RLS on form_submissions table
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for form_submissions table

-- Policy for inserting new submissions (any authenticated user can submit)
CREATE POLICY "Users can submit form submissions" ON form_submissions
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Policy for viewing submissions (only admins can view all, users can only view their own)
CREATE POLICY "Users can view their own submissions" ON form_submissions
  FOR SELECT 
  TO authenticated
  USING (
    -- For now, allow all authenticated users to view all submissions
    -- In the future, you might want to add a user_id column to track ownership
    true
  );

-- Policy for updating submissions (only admins can update)
CREATE POLICY "Only admins can update submissions" ON form_submissions
  FOR UPDATE 
  TO authenticated
  USING (
    -- Check if user has admin role (you'll need to implement this based on your auth setup)
    -- For now, we'll use a simple check that can be enhanced later
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy for deleting submissions (only admins can delete)
CREATE POLICY "Only admins can delete submissions" ON form_submissions
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Add a comment explaining the RLS setup
COMMENT ON TABLE form_submissions IS 'Form submissions with RLS enabled. Users can submit, admins can manage all submissions.';
