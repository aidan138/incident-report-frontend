// src/components/incidents/IncidentList.tsx

import React, { useEffect, useState, useMemo } from 'react';
import type { IncidentSummary, RegionRead } from '../../types/portal';
import { listIncidents, deleteIncident } from '../../api/incidents';
import { listRegions } from '../../api/regions';

interface IncidentListProps {
  refreshSignal: number;
  onDataChange: () => void;
}

interface IncidentGroup {
  groupId: string;
  incidents: IncidentSummary[];
}

export const IncidentList: React.FC<IncidentListProps> = ({ refreshSignal, onDataChange }) => {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [allRegions, setAllRegions] = useState<RegionRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchName, setSearchName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'done' | 'unfinished'>('all');

  // Expanded groups/incidents state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [incidentsData, regionsData] = await Promise.all([
        listIncidents(),
        listRegions(),
      ]);
      setIncidents(incidentsData);
      setAllRegions(regionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshSignal]);

  const getRegionSlug = (regionId: string): string => {
    const region = allRegions.find((r) => r.id === regionId || r.pk === regionId);
    return region?.slug ?? 'Unknown';
  };

  const getStatusDisplay = (state: string): { label: string; className: string } => {
    if (state === 'done') {
      return { label: 'Done', className: 'badge done' };
    }
    return { label: 'Unfinished', className: 'badge unfinished' };
  };

  // Filter and group incidents
  const filteredAndGroupedIncidents = useMemo(() => {
    // First filter incidents
    let filtered = incidents.filter((incident) => {
      // Search by name
      if (searchName && !incident.person_involved_name.toLowerCase().includes(searchName.toLowerCase())) {
        return false;
      }
      // Filter by date
      if (filterDate && incident.date_of_incident !== filterDate) {
        return false;
      }
      // Filter by region
      if (filterRegion && incident.region_id !== filterRegion) {
        return false;
      }
      // Filter by status
      if (filterStatus === 'done' && incident.state !== 'done') {
        return false;
      }
      if (filterStatus === 'unfinished' && incident.state === 'done') {
        return false;
      }
      return true;
    });

    // Group by group_id
    const groupMap = new Map<string, IncidentSummary[]>();
    filtered.forEach((incident) => {
      const groupId = incident.group_id;
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, []);
      }
      groupMap.get(groupId)!.push(incident);
    });

    // Convert to array and sort by most recent date
    const groups: IncidentGroup[] = Array.from(groupMap.entries()).map(([groupId, incidents]) => ({
      groupId,
      incidents: incidents.sort((a, b) =>
        new Date(b.date_of_incident).getTime() - new Date(a.date_of_incident).getTime()
      ),
    }));

    // Sort groups by most recent incident date
    groups.sort((a, b) => {
      const aDate = new Date(a.incidents[0].date_of_incident).getTime();
      const bDate = new Date(b.incidents[0].date_of_incident).getTime();
      return bDate - aDate;
    });

    return groups;
  }, [incidents, searchName, filterDate, filterRegion, filterStatus]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this incident?')) return;
    try {
      await deleteIncident(id);
      setIncidents((prev) => prev.filter((inc) => inc.id !== id));
      onDataChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete incident');
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearchName('');
    setFilterDate('');
    setFilterRegion('');
    setFilterStatus('all');
  };

  const hasActiveFilters = searchName || filterDate || filterRegion || filterStatus !== 'all';

  return (
    <div className="entity-section">
      <div className="section-header">
        <h2>Incidents</h2>
      </div>

      {/* Filters */}
      <div className="incidents-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Search by Name</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Person involved..."
            />
          </div>
          <div className="filter-group">
            <label>Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Region</label>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
            >
              <option value="">All Regions</option>
              {allRegions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.slug}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'done' | 'unfinished')}
            >
              <option value="all">All</option>
              <option value="done">Done</option>
              <option value="unfinished">Unfinished</option>
            </select>
          </div>
          {hasActiveFilters && (
            <div className="filter-group filter-actions">
              <label>&nbsp;</label>
              <button className="secondary small" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && <div className="loading">Loading incidents...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && filteredAndGroupedIncidents.length === 0 && (
        <div className="empty">
          {hasActiveFilters ? 'No incidents match your filters.' : 'No incidents yet.'}
        </div>
      )}

      {!loading && filteredAndGroupedIncidents.length > 0 && (
        <div className="incidents-list">
          {filteredAndGroupedIncidents.map((group) => {
            const isExpanded = expandedGroups.has(group.groupId);
            const isSingleIncident = group.incidents.length === 1;
            const primaryIncident = group.incidents[0];
            const statusInfo = getStatusDisplay(primaryIncident.state);

            return (
              <div key={group.groupId} className="incident-group">
                <div
                  className={`incident-group-header ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleGroup(group.groupId)}
                >
                  <div className="incident-group-toggle">
                    <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                  <div className="incident-group-info">
                    <div className="incident-group-title">
                      <span className="person-name">{primaryIncident.person_involved_name}</span>
                      {!isSingleIncident && (
                        <span className="badge group-count">{group.incidents.length} incidents</span>
                      )}
                      <span className={statusInfo.className}>{statusInfo.label}</span>
                    </div>
                    <div className="incident-group-meta">
                      <span>Date: {new Date(primaryIncident.date_of_incident).toLocaleDateString()}</span>
                      <span className="separator">|</span>
                      <span>Region: {getRegionSlug(primaryIncident.region_id)}</span>
                      <span className="separator">|</span>
                      <span>Employee: {primaryIncident.employee_completing_report}</span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="incident-group-content">
                    {group.incidents.map((incident) => {
                      const incidentStatus = getStatusDisplay(incident.state);
                      return (
                        <div key={incident.id} className="incident-card">
                          <div className="incident-card-header">
                            <div className="incident-card-title">
                              <span className="incident-date">
                                {new Date(incident.date_of_incident).toLocaleDateString()}
                              </span>
                              <span className={incidentStatus.className}>{incidentStatus.label}</span>
                            </div>
                            <button
                              className="danger small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(incident.id);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                          <div className="incident-details">
                            <div className="detail-row">
                              <span className="detail-label">Person Involved:</span>
                              <span className="detail-value">{incident.person_involved_name}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Region:</span>
                              <span className="detail-value">{getRegionSlug(incident.region_id)}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Employee:</span>
                              <span className="detail-value">{incident.employee_completing_report}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Created:</span>
                              <span className="detail-value">
                                {new Date(incident.created).toLocaleString()}
                              </span>
                            </div>
                            <div className="detail-row full-width">
                              <span className="detail-label">Summary:</span>
                              <span className="detail-value summary">{incident.incident_summary}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
