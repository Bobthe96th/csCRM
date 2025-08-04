-- Create the whatsapp_inbox table
CREATE TABLE whatsapp_inbox (
  id SERIAL PRIMARY KEY,
  sender_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  agent TEXT CHECK (agent IN ('AI', 'Human')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE whatsapp_inbox ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for testing)
CREATE POLICY "Enable read access for all users" ON whatsapp_inbox
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON whatsapp_inbox
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON whatsapp_inbox
  FOR UPDATE USING (true);

-- Insert test data
INSERT INTO whatsapp_inbox (sender_number, message_text, direction, agent, status)
VALUES 
  ('+1234567890', 'Hello, I need help with my order', 'inbound', 'AI', 'open'),
  ('+1234567890', 'My order number is #12345', 'inbound', 'AI', 'open'),
  ('+9876543210', 'Hi, when will my delivery arrive?', 'inbound', 'AI', 'open');

-- Insert test outbound messages
INSERT INTO whatsapp_inbox (sender_number, message_text, direction, agent, status)
VALUES 
  ('+1234567890', 'Thank you for contacting us. I can help you with your order.', 'outbound', 'AI', 'open'),
  ('+9876543210', 'Your delivery is scheduled for tomorrow between 2-4 PM.', 'outbound', 'Human', 'open'); 