// ErrorBoundary.tsx
import React from 'react';

interface Props {}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children; 
  }
}
export default ErrorBoundary;
```

```typescript
// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Vote from './components/Vote';
import Results from './components/Results';
import AdminPanel from './components/AdminPanel';
import ErrorBoundary from './ErrorBoundary';

const NotFound: React.FC = () => {
  return (
    <div>
      <h2>404 Not Found</h2>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Vote />} />
            <Route path="/results" element={<Results />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </Router>
  );
};

export default App;