import { Switch, Route } from "wouter";

function MinimalProductPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold">Product Page Test</h1>
      <p>This is a minimal product page to test if React is working.</p>
    </div>
  );
}

function MinimalHomePage() {
  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <h1 className="text-3xl font-bold">Home Page Test</h1>
      <p>This is a minimal home page to test if React is working.</p>
      <a href="/product/test" className="text-blue-600 underline">Go to Product Page</a>
    </div>
  );
}

export default function MinimalApp() {
  return (
    <Switch>
      <Route path="/" component={MinimalHomePage} />
      <Route path="/product/:slug" component={MinimalProductPage} />
    </Switch>
  );
}