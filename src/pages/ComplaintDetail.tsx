import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, MessageCircle, User } from "lucide-react";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: "submitted" | "in_review" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
  resolution_summary: string | null;
  complaint_categories: { name: string } | null;
  profiles: { full_name: string } | null;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  is_internal: boolean;
  profiles: { full_name: string } | null;
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user, userRole } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  const isAdmin = userRole === "admin" || userRole === "super_admin";

  useEffect(() => {
    if (id) {
      fetchComplaint();
      fetchComments();
    }
  }, [id]);

  const fetchComplaint = async () => {
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select(`
          id,
          title,
          description,
          status,
          priority,
          created_at,
          updated_at,
          resolution_summary,
          student_id,
          complaint_categories (name)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setComplaint(null);
        setLoading(false);
        return;
      }

      // Fetch student profile separately
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.student_id)
        .maybeSingle();

      setComplaint({
        ...data,
        profiles: profileData ? { full_name: profileData.full_name } : null,
      });
    } catch (error: any) {
      toast.error("Failed to load complaint");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("complaint_comments")
        .select(`
          id,
          comment,
          created_at,
          is_internal,
          user_id
        `)
        .eq("complaint_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Fetch profiles for all comments
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.id, p.full_name]) || []
        );

        const commentsWithProfiles = data.map(comment => ({
          ...comment,
          profiles: { full_name: profilesMap.get(comment.user_id) || "Unknown" },
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from("complaint_comments")
        .insert({
          complaint_id: id,
          user_id: user?.id,
          comment: newComment,
          is_internal: false,
        });

      if (error) throw error;

      toast.success("Comment added successfully");
      setNewComment("");
      fetchComments();
    } catch (error: any) {
      toast.error("Failed to add comment");
      console.error(error);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading complaint...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!complaint) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Complaint not found</p>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const canComment = complaint.status !== "resolved" && complaint.status !== "closed";

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 mb-4">
              <CardTitle className="text-2xl">{complaint.title}</CardTitle>
              <div className="flex gap-2">
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {complaint.profiles?.full_name || "Unknown"}
              </span>
              <span>Category: {complaint.complaint_categories?.name || "Uncategorized"}</span>
              <span>Created: {format(new Date(complaint.created_at), "PPP")}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>
            </div>

            {complaint.resolution_summary && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-success">
                  Resolution Summary
                </h3>
                <p className="text-muted-foreground">{complaint.resolution_summary}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No comments yet</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-l-2 border-primary pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">
                        {comment.profiles?.full_name || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "PPp")}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{comment.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {canComment && (
              <div className="mt-6 space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={submittingComment || !newComment.trim()}
                >
                  {submittingComment ? "Adding..." : "Add Comment"}
                </Button>
              </div>
            )}

            {!canComment && (
              <p className="text-sm text-muted-foreground text-center py-4">
                This complaint is {complaint.status}. Comments are disabled.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
