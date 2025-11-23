-- Create email test logs table for auditing test email sends
CREATE TABLE email_test_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tested_by UUID NOT NULL,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  custom_html TEXT,
  resend_email_id TEXT,
  status TEXT NOT NULL, -- 'sent' | 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_email_test_logs_tested_by ON email_test_logs(tested_by);
CREATE INDEX idx_email_test_logs_created_at ON email_test_logs(created_at DESC);

-- Enable RLS
ALTER TABLE email_test_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view test logs
CREATE POLICY "super_admins_view_test_logs" 
  ON email_test_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- System can insert test logs
CREATE POLICY "system_insert_test_logs" 
  ON email_test_logs FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));