-- Create chat_messages table for realtime communication
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX idx_chat_messages_complaint_id ON public.chat_messages(complaint_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Students can view messages for their complaints, admins can view all
CREATE POLICY "Users can view messages for their complaints"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.complaints
    WHERE complaints.id = chat_messages.complaint_id
    AND (complaints.student_id = auth.uid() OR is_admin(auth.uid()))
  )
);

-- Users can send messages to complaints they have access to
CREATE POLICY "Users can send messages to accessible complaints"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.complaints
    WHERE complaints.id = chat_messages.complaint_id
    AND (complaints.student_id = auth.uid() OR is_admin(auth.uid()))
  )
);

-- Users can mark their own messages as read
CREATE POLICY "Users can update their own messages"
ON public.chat_messages
FOR UPDATE
USING (user_id = auth.uid());

-- Enable realtime
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;