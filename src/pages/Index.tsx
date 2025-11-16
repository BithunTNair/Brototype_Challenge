import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Clock, CheckCircle } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: FileText,
      title: "Easy Submission",
      description: "Submit complaints quickly with our intuitive form",
    },
    {
      icon: Clock,
      title: "Real-time Tracking",
      description: "Track your complaint status at every step",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security",
    },
    {
      icon: CheckCircle,
      title: "Quick Resolution",
      description: "Our team works to resolve issues promptly",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Bro VoiceBox
          </div>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4">
        <section className="py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Student Complaint Management System
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A transparent and efficient platform for Brototype students to submit,
            track, and resolve complaints with ease.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Submit a Complaint
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl bg-card border hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="py-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                  1
                </div>
                <h3 className="font-semibold">Submit</h3>
                <p className="text-sm text-muted-foreground">
                  Create a detailed complaint with relevant information
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                  2
                </div>
                <h3 className="font-semibold">Track</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor progress through our transparent status system
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                  3
                </div>
                <h3 className="font-semibold">Resolve</h3>
                <p className="text-sm text-muted-foreground">
                  Receive updates and resolution from our admin team
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 Brototype SCMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
