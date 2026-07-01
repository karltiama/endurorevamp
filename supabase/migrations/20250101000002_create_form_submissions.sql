-- Create form_submissions table
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('contact', 'suggestion', 'bug_report', 'general')),
  title TEXT, -- NULL for contact, required for suggestions
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'responded', 'resolved', 'archived')),
  category TEXT, -- 'feature_request', 'bug', 'question', 'feedback', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  admin_notes TEXT -- For internal tracking
);

-- Create indexes for better performance
CREATE INDEX idx_form_submissions_type ON form_submissions(type);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_created_at ON form_submissions(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_form_submissions_updated_at 
    BEFORE UPDATE ON form_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 