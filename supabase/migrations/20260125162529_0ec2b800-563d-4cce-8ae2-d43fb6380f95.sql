-- Add image_url column to chat_messages for storing uploaded images
ALTER TABLE public.chat_messages
ADD COLUMN image_url TEXT DEFAULT NULL;