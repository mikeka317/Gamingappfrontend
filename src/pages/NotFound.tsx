import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        {/* 404 Number with gaming theme */}
        <div className="space-y-4">
          <h1 className="text-8xl font-orbitron font-bold text-primary bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            404
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="text-2xl font-orbitron font-semibold">Page Not Found</h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-md">
            The page you're looking for doesn't exist or has been moved to another dimension.
          </p>
        </div>

        {/* Return Home Button */}
        <div className="pt-4">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-neon-orange hover:scale-105"
          >
            <Home className="h-5 w-5" />
            Return to Home
          </a>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground pt-4 border-t border-border/30">
          <p>Attempted path: <code className="bg-secondary px-2 py-1 rounded text-xs">{location.pathname}</code></p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
