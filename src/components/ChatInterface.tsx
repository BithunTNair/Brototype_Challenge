import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { Send, MessageCircle } from "lucide-react";
import { z } from "zod";

const messageSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(1000, "Message must be less than 1000 characters"),
});

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string } | null;
}

interface ChatInterfaceProps {
  complaintId: string;
}

export function ChatInterface({ complaintId }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (complaintId) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [complaintId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, message, created_at, user_id")
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.id, { full_name: p.full_name }]) || []
        );

        const messagesWithProfiles = data.map(msg => ({
          ...msg,
          profiles: profilesMap.get(msg.user_id) || null,
        }));

        setMessages(messagesWithProfiles);
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat_messages:${complaintId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `complaint_id=eq.${complaintId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", newMsg.user_id)
            .single();

          setMessages((prev) => [
            ...prev,
            {
              ...newMsg,
              profiles: profileData ? { full_name: profileData.full_name } : null,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = messageSchema.parse({ message: newMessage });
      
      if (!user) {
        toast.error("You must be logged in to send messages");
        return;
      }

      setSending(true);

      const { data, error } = await supabase.from("chat_messages").insert({
        complaint_id: complaintId,
        user_id: user.id,
        message: validated.message,
      }).select("id, message, created_at, user_id").single();

      if (error) throw error;

      // Optimistically add message to UI
      if (data) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        setMessages((prev) => [
          ...prev,
          {
            ...data,
            profiles: profileData ? { full_name: profileData.full_name } : null,
          },
        ]);
      }

      setNewMessage("");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to send message");
        console.error(error);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Live Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4 mb-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.user_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">
                          {msg.profiles?.full_name || "Unknown User"}
                        </span>
                        <span className="text-xs opacity-70">
                          {format(new Date(msg.created_at), "HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm break-words">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            maxLength={1000}
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}