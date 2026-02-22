-- Allow users to update their own chat messages (needed for saving summaries)
CREATE POLICY "Users can update their own chat messages"
ON public.chat_messages
FOR UPDATE
USING (auth.uid() = user_id);