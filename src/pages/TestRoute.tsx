import React from 'react';

const TestRoute = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          ✅ Routing Works!
        </h1>
        <p className="text-muted-foreground mb-4">
          If you can see this page, client-side routing is working correctly.
        </p>
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Current URL:</h2>
          <code className="text-sm bg-muted px-2 py-1 rounded">
            {window.location.href}
          </code>
        </div>
      </div>
    </div>
  );
};

export default TestRoute;
