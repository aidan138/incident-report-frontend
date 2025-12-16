// src/App.tsx

import React, { useState } from 'react';
import { RegionForm } from './components/RegionForm';
import { RegionList } from './components/RegionList';

const App: React.FC = () => {
  const [refreshSignal, setRefreshSignal] = useState(0);

  const handleCreated = () => {
    // bump signal so RegionList re-fetches
    setRefreshSignal((prev) => prev + 1);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Admin Portal – Regions</h1>
        <span>
          Backend: FastAPI &bull; Endpoints:{' '}
          <code>/regions/</code>, <code>/regions/&lt;id&gt;</code>
        </span>
      </header>

      <div className="grid-two-column">
        <RegionForm onCreated={handleCreated} />
        <RegionList refreshSignal={refreshSignal} />
      </div>
    </div>
  );
};

export default App;
