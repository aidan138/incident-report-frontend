// src/components/lifeguards/LifeguardList.tsx

import React, { useEffect, useState } from 'react';
import type { LifeguardRead, LifeguardPayload, RegionRead } from '../../types/portal';
import {
  listLifeguards,
  createLifeguard,
  updateLifeguard,
  deleteLifeguard,
} from '../../api/lifeguards';
import { listRegions } from '../../api/regions';

interface LifeguardListProps {
  refreshSignal: number;
  onDataChange: () => void;
}

export const LifeguardList: React.FC<LifeguardListProps> = ({ refreshSignal, onDataChange }) => {
  const [lifeguards, setLifeguards] = useState<LifeguardRead[]>([]);
  const [allRegions, setAllRegions] = useState<RegionRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRegionId, setNewRegionId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Inline editing state
  const [editingLifeguardId, setEditingLifeguardId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRegionId, setEditRegionId] = useState('');
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lifeguardsData, regionsData] = await Promise.all([
        listLifeguards(),
        listRegions(),
      ]);
      setLifeguards(lifeguardsData);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newName.trim()) {
      setCreateError('Name is required');
      return;
    }
    if (!newPhone.trim()) {
      setCreateError('Phone is required');
      return;
    }
    if (!newRegionId) {
      setCreateError('Please select a region');
      return;
    }

    const payload: LifeguardPayload = {
      name: newName.trim(),
      phone: newPhone.trim(),
      region_id: newRegionId,
    };

    setCreating(true);
    try {
      const newLifeguard = await createLifeguard(payload);
      setLifeguards((prev) => [...prev, newLifeguard]);
      setNewName('');
      setNewPhone('');
      setNewRegionId('');
      setShowCreateForm(false);
      onDataChange();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create lifeguard');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this lifeguard?')) return;
    try {
      await deleteLifeguard(id);
      setLifeguards((prev) => prev.filter((lg) => lg.id !== id));
      onDataChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete lifeguard');
    }
  };

  const startEditing = (lifeguard: LifeguardRead) => {
    setRowError(null);
    setEditingLifeguardId(lifeguard.id);
    setEditName(lifeguard.name);
    setEditPhone(lifeguard.phone);
    setEditRegionId(lifeguard.region_id);
  };

  const cancelEditing = () => {
    setEditingLifeguardId(null);
    setEditName('');
    setEditPhone('');
    setEditRegionId('');
    setRowError(null);
  };

  const saveLifeguard = async (lifeguardId: string) => {
    setRowError(null);

    if (!editName.trim()) {
      setRowError('Name is required');
      return;
    }
    if (!editPhone.trim()) {
      setRowError('Phone is required');
      return;
    }
    if (!editRegionId) {
      setRowError('Please select a region');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateLifeguard(lifeguardId, {
        name: editName.trim(),
        phone: editPhone.trim(),
        region_id: editRegionId,
      });
      setLifeguards((prev) => prev.map((lg) => (lg.id === lifeguardId ? updated : lg)));
      cancelEditing();
      onDataChange();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Failed to update lifeguard');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="entity-section">
      <div className="section-header">
        <h2>Lifeguards</h2>
        <button
          className="primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ Add Lifeguard'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form">
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +1-555-000-1234"
                />
              </div>
              <div className="form-group">
                <label>Region</label>
                <select
                  value={newRegionId}
                  onChange={(e) => setNewRegionId(e.target.value)}
                >
                  <option value="">Select a region...</option>
                  {allRegions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.slug}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="button-row">
              <button type="submit" className="primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create Lifeguard'}
              </button>
            </div>
            {createError && <div className="error">{createError}</div>}
          </form>
        </div>
      )}

      {loading && <div className="loading">Loading lifeguards...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && lifeguards.length === 0 && <div className="empty">No lifeguards yet.</div>}

      {!loading && lifeguards.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Region</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lifeguards.map((lifeguard) => {
                const isEditing = editingLifeguardId === lifeguard.id;
                return (
                  <React.Fragment key={lifeguard.id}>
                    <tr className={isEditing ? 'expanded' : ''}>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="inline-edit"
                          />
                        ) : (
                          <>
                            <div className="primary-text">{lifeguard.name}</div>
                            <div className="code-block small">{lifeguard.id}</div>
                          </>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="inline-edit"
                          />
                        ) : (
                          lifeguard.phone
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editRegionId}
                            onChange={(e) => setEditRegionId(e.target.value)}
                            className="inline-edit"
                          >
                            <option value="">Select a region...</option>
                            {allRegions.map((region) => (
                              <option key={region.id} value={region.id}>
                                {region.slug}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="badge region">
                            {getRegionSlug(lifeguard.region_id)}
                          </span>
                        )}
                      </td>
                      <td>{new Date(lifeguard.created).toLocaleDateString()}</td>
                      <td>
                        {isEditing ? (
                          <div className="button-row">
                            <button
                              className="primary small"
                              onClick={() => saveLifeguard(lifeguard.id)}
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
                              onClick={() => startEditing(lifeguard)}
                            >
                              Edit
                            </button>
                            <button
                              className="danger small"
                              onClick={() => handleDelete(lifeguard.id)}
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
