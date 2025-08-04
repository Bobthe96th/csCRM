# WhatsApp Chat Management System - Setup Guide

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Supabase Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the following SQL to create the required table:

```sql
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
```

### 3. Enable Real-time

1. Go to Database → Replication in your Supabase dashboard
2. Enable real-time for the `whatsapp_inbox` table

### 4. Test Data

Insert some test messages to verify the setup:

```sql
-- Insert test inbound messages
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
```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Features Implemented

✅ **Phase 2: Frontend Setup**
- Next.js project with TypeScript
- Supabase client integration
- Environment variables configuration
- Modern UI with Tailwind CSS
- Conversation sidebar and chat window

✅ **Phase 3: Real-time Updates**
- Supabase real-time subscriptions
- Live message updates
- Status tracking (open, closed, pending)

✅ **Phase 4: Reply Flow**
- Human message sending interface
- Message direction tracking (inbound/outbound)
- Agent identification (AI/Human)

✅ **Phase 5: Polish the Inbox**
- Message timeline with timestamps
- Agent badges (AI/Human)
- Status indicators
- Responsive design

## Next Steps

### Phase 6: Testing & Deployment

1. **Test Real-time Updates**:
   - Insert messages in Supabase
   - Verify they appear instantly in the UI

2. **Test AI + Human Collaboration**:
   - Send messages as different agents
   - Verify proper display and status updates

3. **Deploy to Production**:
   - Deploy to Vercel or similar platform
   - Configure production environment variables

### Future Enhancements

- [ ] Authentication system
- [ ] Message filters (All, Open, Pending, Closed)
- [ ] File attachment support
- [ ] Message search functionality
- [ ] Analytics dashboard
- [ ] Notification system
- [ ] Message templates
- [ ] Export functionality

## Troubleshooting

### Common Issues

1. **Real-time not working**: Ensure real-time is enabled for the `whatsapp_inbox` table in Supabase
2. **Environment variables**: Make sure `.env.local` is in the root directory
3. **TypeScript errors**: Run `npm install` to ensure all dependencies are installed
4. **Build errors**: Check that all environment variables are properly set

### Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Supabase connection in the status indicator
3. Ensure the database schema is correctly set up
4. Check that real-time subscriptions are enabled 