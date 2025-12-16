// src/App.tsx

import React, { useState } from 'react';
import { Tabs } from './components/common/Tabs';
import { RegionList } from './components/regions/RegionList';
import { ManagerList } from './components/managers/ManagerList';
import { LifeguardList } from './components/lifeguards/LifeguardList';

const tabs = [
  { id: 'regions', label: 'Regions' },
  { id: 'managers', label: 'Managers' },
  { id: 'lifeguards', label: 'Lifeguards' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('regions');
  const [refreshSignal, setRefreshSignal] = useState(0);

  const handleDataChange = () => {
    // Bump signal so all lists re-fetch when data changes
    setRefreshSignal((prev) => prev + 1);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Admin Portal</h1>
        <span>
          Manage Regions, Managers & Lifeguards
        </span>
      </header>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="tab-content">
        {activeTab === 'regions' && (
          <RegionList refreshSignal={refreshSignal} onDataChange={handleDataChange} />
        )}
        {activeTab === 'managers' && (
          <ManagerList refreshSignal={refreshSignal} onDataChange={handleDataChange} />
        )}
        {activeTab === 'lifeguards' && (
          <LifeguardList refreshSignal={refreshSignal} onDataChange={handleDataChange} />
        )}
      </div>
    </div>
  );
};

export default App;
