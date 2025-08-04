# WhatsApp Chat Management System

A real-time WhatsApp chat management system built with Next.js, Supabase, and AI integration. This application allows human agents and AI to collaborate on managing WhatsApp conversations.

## Features

- **Real-time Chat Interface**: Live updates when new messages arrive
- **Conversation Management**: Group conversations by sender number
- **AI + Human Collaboration**: Seamless handoff between AI and human agents
- **Message Status Tracking**: Open, pending, and closed conversation states
- **Modern UI**: Clean, responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Authentication**: Supabase Auth (optional)

## Database Schema

The application expects a `whatsapp_inbox` table in Supabase with the following structure:

```sql
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

-- Enable Row Level Security (RLS)
ALTER TABLE whatsapp_inbox ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON whatsapp_inbox
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON whatsapp_inbox
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON whatsapp_inbox
  FOR UPDATE USING (auth.role() = 'authenticated');
```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd chatapp
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to your project dashboard
3. Navigate to SQL Editor
4. Run the database schema SQL above
5. Enable real-time for the `whatsapp_inbox` table:
   - Go to Database → Replication
   - Enable real-time for the `whatsapp_inbox` table

### 4. Get Supabase Credentials

1. Go to Settings → API in your Supabase dashboard
2. Copy the Project URL and anon/public key
3. Add them to your `.env.local` file

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

### Testing the Application

1. **Simulate Incoming Messages**: Manually insert test messages into Supabase:
   ```sql
   INSERT INTO whatsapp_inbox (sender_number, message_text, direction, agent, status)
   VALUES ('+1234567890', 'Hello, I need help with my order', 'inbound', 'AI', 'open');
   ```

2. **Test Human Replies**: Use the chat interface to send messages as a human agent

3. **Verify Real-time Updates**: Messages should appear instantly in the UI

### Conversation Flow

1. **Incoming Message**: WhatsApp message arrives → stored in Supabase
2. **AI Processing**: n8n workflow processes the message
3. **Auto-reply or Escalation**: AI responds or escalates to human
4. **Human Intervention**: Human agent can take over and respond
5. **Status Updates**: Messages are marked as open, pending, or closed

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main chat interface
├── components/
│   ├── Sidebar.tsx          # Conversation list
│   └── ChatWindow.tsx       # Message display and input
└── lib/
    └── supabase.ts          # Supabase client and types
```

## Future Enhancements

- [ ] **Authentication**: Add user login/signup with Supabase Auth
- [ ] **Message Filters**: Filter by status (All, Open, Pending, Closed)
- [ ] **File Attachments**: Support for images, documents
- [ ] **Message Search**: Search through conversation history
- [ ] **Agent Dashboard**: Analytics and performance metrics
- [ ] **Notification System**: Real-time notifications for new messages
- [ ] **Message Templates**: Pre-defined response templates
- [ ] **Export Conversations**: Download chat history

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details 