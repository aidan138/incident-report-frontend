// src/components/RegionList.tsx

import React, { useEffect, useState } from 'react';
import type { RegionRead } from '../types/portal';
import {
  listRegions,
  deleteRegion,
  updateRegionLocations,
} from '../api/regions';

interface RegionListProps {
  refreshSignal: number; // when this changes, refetch
}

export const RegionList: React.FC<RegionListProps> = ({ refreshSignal }) => {
  const [regions, setRegions] = useState<RegionRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // inline editing of locations
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);
  const [locationsText, setLocationsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const fetchRegions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRegions();
      setRegions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load regions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, [refreshSignal]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this region?')) return;
    try {
      await deleteRegion(id);
      setRegions((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete region');
    }
  };

  const startEditing = (region: RegionRead) => {
    setRowError(null);
    setEditingRegionId(region.id);
    setLocationsText(JSON.stringify(region.locations, null, 2));
  };

  const cancelEditing = () => {
    setEditingRegionId(null);
    setLocationsText('');
    setRowError(null);
  };

  const saveLocations = async (regionId: string) => {
    setRowError(null);

    let locations: Record<string, string>;
    try {
      locations = JSON.parse(locationsText);
      if (typeof locations !== 'object' || Array.isArray(locations)) {
        throw new Error('Locations must be a JSON object');
      }
    } catch (err) {
      setRowError(`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateRegionLocations(regionId, { locations });
      setRegions((prev) => prev.map((r) => (r.id === regionId ? updated : r)));
      cancelEditing();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Failed to update locations');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <h2>Regions</h2>
      {loading && <div>Loading regions…</div>}
      {error && <div className="error">{error}</div>}

      {!loading && regions.length === 0 && <div>No regions yet.</div>}

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
                return (
                  <tr key={region.id}>
                    <td>
                      <div>{region.slug}</div>
                      <div className="code-block" style={{ marginTop: 4 }}>
                        {region.id}
                      </div>
                    </td>
                    <td>
                      {isEditing ? (
                        <textarea
                          rows={6}
                          style={{ width: '100%' }}
                          value={locationsText}
                          onChange={(e) => setLocationsText(e.target.value)}
                        />
                      ) : (
                        <pre className="code-block">
{JSON.stringify(region.locations, null, 2)}
                        </pre>
                      )}
                    </td>
                    <td>
                      {region.managers.length === 0 && (
                        <span className="badge">No managers</span>
                      )}
                      {region.managers.map((m) => (
                        <span key={m.id} className="badge">
                          {m.name}
                        </span>
                      ))}
                    </td>
                    <td>
                      <div>{new Date(region.created).toLocaleString()}</div>
                    </td>
                    <td>
                      {isEditing ? (
                        <>
                          <div className="button-row">
                            <button
                              className="primary"
                              onClick={() => saveLocations(region.id)}
                              disabled={saving}
                            >
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button className="secondary" onClick={cancelEditing}>
                              Cancel
                            </button>
                          </div>
                          {rowError && (
                            <div className="error" style={{ marginTop: 4 }}>
                              {rowError}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="button-row">
                          <button
                            className="secondary"
                            onClick={() => startEditing(region)}
                          >
                            Edit locations
                          </button>
                          <button
                            className="danger"
                            onClick={() => handleDelete(region.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
