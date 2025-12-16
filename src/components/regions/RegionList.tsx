// src/components/regions/RegionList.tsx

import React, { useEffect, useState } from 'react';
import type { RegionRead, ManagerSummary, RegionPayload } from '../../types/portal';
import {
  listRegions,
  createRegion,
  updateRegion,
  deleteRegion,
  assignManagerToRegion,
  unassignManagerFromRegion,
} from '../../api/regions';
import { listManagers } from '../../api/managers';

interface RegionListProps {
  refreshSignal: number;
  onDataChange: () => void;
}

const sampleLocations = `{
  "loc1": "Main Pool",
  "loc2": "West Pool"
}`;

export const RegionList: React.FC<RegionListProps> = ({ refreshSignal, onDataChange }) => {
  const [regions, setRegions] = useState<RegionRead[]>([]);
  const [allManagers, setAllManagers] = useState<ManagerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newLocationsText, setNewLocationsText] = useState(sampleLocations);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Inline editing state
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);
  const [editSlug, setEditSlug] = useState('');
  const [editLocationsText, setEditLocationsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  // Manager assignment state
  const [assigningRegionId, setAssigningRegionId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [regionsData, managersData] = await Promise.all([
        listRegions(),
        listManagers(),
      ]);
      setRegions(regionsData);
      setAllManagers(managersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshSignal]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    let locations: Record<string, string>;
    try {
      locations = JSON.parse(newLocationsText);
      if (typeof locations !== 'object' || Array.isArray(locations)) {
        throw new Error('Locations must be a JSON object');
      }
    } catch (err) {
      setCreateError(`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    const payload: RegionPayload = {
      slug: newSlug.trim(),
      locations,
    };

    if (!payload.slug) {
      setCreateError('Slug is required');
      return;
    }

    setCreating(true);
    try {
      const newRegion = await createRegion(payload);
      setRegions((prev) => [...prev, newRegion]);
      setNewSlug('');
      setNewLocationsText(sampleLocations);
      setShowCreateForm(false);
      onDataChange();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create region');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this region? This will also delete all associated incident reports.')) return;
    try {
      await deleteRegion(id);
      setRegions((prev) => prev.filter((r) => r.id !== id));
      onDataChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete region');
    }
  };

  const startEditing = (region: RegionRead) => {
    setRowError(null);
    setEditingRegionId(region.id);
    setEditSlug(region.slug);
    setEditLocationsText(JSON.stringify(region.locations, null, 2));
    setAssigningRegionId(null);
  };

  const cancelEditing = () => {
    setEditingRegionId(null);
    setEditSlug('');
    setEditLocationsText('');
    setRowError(null);
  };

  const saveRegion = async (regionId: string) => {
    setRowError(null);

    let locations: Record<string, string>;
    try {
      locations = JSON.parse(editLocationsText);
      if (typeof locations !== 'object' || Array.isArray(locations)) {
        throw new Error('Locations must be a JSON object');
      }
    } catch (err) {
      setRowError(`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    if (!editSlug.trim()) {
      setRowError('Slug is required');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateRegion(regionId, {
        slug: editSlug.trim(),
        locations,
      });
      setRegions((prev) => prev.map((r) => (r.id === regionId ? updated : r)));
      cancelEditing();
      onDataChange();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Failed to update region');
    } finally {
      setSaving(false);
    }
  };

  const toggleManagerAssignment = async (region: RegionRead, manager: ManagerSummary) => {
    const isAssigned = region.managers.some((m) => m.id === manager.id);
    try {
      let updated: RegionRead;
      if (isAssigned) {
        updated = await unassignManagerFromRegion(region.id, manager.id);
      } else {
        updated = await assignManagerToRegion(region.id, manager.id);
      }
      setRegions((prev) => prev.map((r) => (r.id === region.id ? updated : r)));
      onDataChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update manager assignment');
    }
  };

  const toggleAssigning = (regionId: string) => {
    setAssigningRegionId(assigningRegionId === regionId ? null : regionId);
    setEditingRegionId(null);
  };

  return (
    <div className="entity-section">
      <div className="section-header">
        <h2>Regions</h2>
        <button
          className="primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ Add Region'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form">
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Slug</label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="e.g. seattle, north-bay"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Locations (JSON object)</label>
              <textarea
                rows={4}
                value={newLocationsText}
                onChange={(e) => setNewLocationsText(e.target.value)}
              />
            </div>
            <div className="button-row">
              <button type="submit" className="primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create Region'}
              </button>
            </div>
            {createError && <div className="error">{createError}</div>}
          </form>
        </div>
      )}

      {loading && <div className="loading">Loading regions...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && regions.length === 0 && <div className="empty">No regions yet.</div>}

      {!loading && regions.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Slug</th>
                <th>Locations</th>
                <th>Managers</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((region) => {
                const isEditing = editingRegionId === region.id;
                const isAssigning = assigningRegionId === region.id;
                return (
                  <React.Fragment key={region.id}>
                    <tr className={isEditing || isAssigning ? 'expanded' : ''}>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value)}
                            className="inline-edit"
                          />
                        ) : (
                          <>
                            <div className="primary-text">{region.slug}</div>
                            <div className="code-block small">{region.id}</div>
                          </>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <textarea
                            rows={4}
                            value={editLocationsText}
                            onChange={(e) => setEditLocationsText(e.target.value)}
                            className="inline-edit"
                          />
                        ) : (
                          <pre className="code-block">
                            {JSON.stringify(region.locations, null, 2)}
                          </pre>
                        )}
                      </td>
                      <td>
                        {region.managers.length === 0 ? (
                          <span className="badge muted">No managers</span>
                        ) : (
                          region.managers.map((m) => (
                            <span key={m.id} className="badge">
                              {m.name}
                            </span>
                          ))
                        )}
                      </td>
                      <td>{new Date(region.created).toLocaleDateString()}</td>
                      <td>
                        {isEditing ? (
                          <div className="button-row">
                            <button
                              className="primary small"
                              onClick={() => saveRegion(region.id)}
                              disabled={saving}
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button className="secondary small" onClick={cancelEditing}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="button-row">
                            <button
                              className="secondary small"
                              onClick={() => startEditing(region)}
                            >
                              Edit
                            </button>
                            <button
                              className={`secondary small ${isAssigning ? 'active' : ''}`}
                              onClick={() => toggleAssigning(region.id)}
                            >
                              Managers
                            </button>
                            <button
                              className="danger small"
                              onClick={() => handleDelete(region.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {isEditing && rowError && (
                      <tr className="error-row">
                        <td colSpan={5}>
                          <div className="error">{rowError}</div>
                        </td>
                      </tr>
                    )}
                    {isAssigning && (
                      <tr className="assignment-row">
                        <td colSpan={5}>
                          <div className="assignment-panel">
                            <strong>Assign Managers:</strong>
                            <div className="checkbox-group">
                              {allManagers.length === 0 ? (
                                <span className="muted">No managers available. Create one first.</span>
                              ) : (
                                allManagers.map((manager) => {
                                  const isAssigned = region.managers.some(
                                    (m) => m.id === manager.id
                                  );
                                  return (
                                    <label key={manager.id} className="checkbox-label">
                                      <input
                                        type="checkbox"
                                        checked={isAssigned}
                                        onChange={() => toggleManagerAssignment(region, manager)}
                                      />
                                      {manager.name} ({manager.email})
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
