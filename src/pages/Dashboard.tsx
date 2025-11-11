import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Link } from "react-router-dom";
import { formatDistance } from "date-fns";
import { FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: "submitted" | "in_review" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  created_at: string;
  complaint_categories: { name: string } | null;
}

interface Stats {
  total: number;
  pending: number;
  resolved: number;
  inProgress: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, resolved: 0, inProgress: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const fetchComplaints = async () => {
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
          complaint_categories (name)
        `)
        .eq("student_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setComplaints(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const pending = data?.filter(c => c.status === "submitted" || c.status === "in_review").length || 0;
      const inProgress = data?.filter(c => c.status === "in_progress").length || 0;
      const resolved = data?.filter(c => c.status === "resolved" || c.status === "closed").length || 0;
      
      setStats({ total, pending, resolved, inProgress });
    } catch (error: any) {
      toast.error("Failed to fetch complaints");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Total Complaints", value: stats.total, icon: FileText, color: "text-primary" },
    { title: "Pending", value: stats.pending, icon: Clock, color: "text-warning" },
    { title: "In Progress", value: stats.inProgress, icon: AlertCircle, color: "text-primary" },
    { title: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-success" },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your complaints...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Complaints</h1>
          <p className="text-muted-foreground">
            Track and manage your submitted complaints
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Complaints</h2>
          {complaints.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  You haven't submitted any complaints yet
                </p>
                <Link 
                  to="/complaint/new"
                  className="text-primary hover:underline font-medium"
                >
                  Submit your first complaint
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {complaints.map((complaint) => (
                <Link key={complaint.id} to={`/complaint/${complaint.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="line-clamp-1 mb-2">
                            {complaint.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {complaint.description}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <StatusBadge status={complaint.status} />
                          <PriorityBadge priority={complaint.priority} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {complaint.complaint_categories?.name || "Uncategorized"}
                        </span>
                        <span>
                          {formatDistance(new Date(complaint.created_at), new Date(), { addSuffix: true })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
