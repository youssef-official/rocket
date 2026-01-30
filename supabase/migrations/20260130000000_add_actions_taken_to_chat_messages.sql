-- Add actions_taken column to chat_messages table
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS actions_taken jsonb DEFAULT '[]'::jsonb;
