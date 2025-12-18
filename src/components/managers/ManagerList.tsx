// src/components/managers/ManagerList.tsx

import React, { useEffect, useState } from 'react';
import type { ManagerRead, ManagerPayload } from '../../types/portal';
import {
  listManagers,
  createManager,
  updateManager,
  deleteManager,
} from '../../api/managers';
import { listRegions, assignManagerToRegion, unassignManagerFromRegion } from '../../api/regions';
import type { RegionRead } from '../../types/portal';

interface ManagerListProps {
  refreshSignal: number;
  onDataChange: () => void;
}

export const ManagerList: React.FC<ManagerListProps> = ({ refreshSignal, onDataChange }) => {
  const [managers, setManagers] = useState<ManagerRead[]>([]);
  const [allRegions, setAllRegions] = useState<RegionRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRegionSlugs, setNewRegionSlugs] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Inline editing state
  const [editingManagerId, setEditingManagerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  // Region assignment state
  const [assigningManagerId, setAssigningManagerId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [managersData, regionsData] = await Promise.all([
        listManagers(),
        listRegions(),
      ]);
      setManagers(managersData);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const payload: ManagerPayload = {
      name: newName.trim(),
      email: newEmail.trim(),
      region_slugs: newRegionSlugs,
    };

    if (!payload.name) {
      setCreateError('Name is required');
      return;
    }
    if (!payload.email) {
      setCreateError('Email is required');
      return;
    }
    if (newRegionSlugs.length === 0) {
      setCreateError('At least one region must be selected');
      return;
    }

    setCreating(true);
    try {
      const newManager = await createManager(payload);
      setManagers((prev) => [...prev, newManager]);
      setNewName('');
      setNewEmail('');
      setNewRegionSlugs([]);
      setShowCreateForm(false);
      onDataChange();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create manager');
    } finally {
      setCreating(false);
    }
  };

  const toggleNewRegion = (slug: string) => {
    setNewRegionSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this manager?')) return;
    try {
      await deleteManager(id);
      setManagers((prev) => prev.filter((m) => m.id !== id));
      onDataChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete manager');
    }
  };

  const startEditing = (manager: ManagerRead) => {
    setRowError(null);
    setEditingManagerId(manager.id);
    setEditName(manager.name);
    setEditEmail(manager.email);
    setAssigningManagerId(null);
  };

  const cancelEditing = () => {
    setEditingManagerId(null);
    setEditName('');
    setEditEmail('');
    setRowError(null);
  };

  const saveManager = async (managerId: string) => {
    setRowError(null);

    if (!editName.trim()) {
      setRowError('Name is required');
      return;
    }
    if (!editEmail.trim()) {
      setRowError('Email is required');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateManager(managerId, {
        name: editName.trim(),
        email: editEmail.trim(),
      });
      setManagers((prev) => prev.map((m) => (m.id === managerId ? updated : m)));
      cancelEditing();
      onDataChange();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Failed to update manager');
    } finally {
      setSaving(false);
    }
  };

  const toggleRegionAssignment = async (manager: ManagerRead, region: RegionRead) => {
    const isAssigned = manager.regions.some((r) => r.id === region.id);
    try {
      if (isAssigned) {
        await unassignManagerFromRegion(region.id, manager.id);
      } else {
        await assignManagerToRegion(region.id, manager.id);
      }
      // Refresh data to get updated assignments
      await fetchData();
      onDataChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update region assignment');
    }
  };

  const toggleAssigning = (managerId: string) => {
    setAssigningManagerId(assigningManagerId === managerId ? null : managerId);
    setEditingManagerId(null);
  };

  return (
    <div className="entity-section">
      <div className="section-header">
        <h2>Managers</h2>
        <button
          className="primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ Add Manager'}
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
                  placeholder="e.g. John Smith"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Assign to Regions (at least one required)</label>
              {allRegions.length === 0 ? (
                <span className="muted">No regions available. Create a region first.</span>
              ) : (
                <div className="checkbox-group create-form-checkboxes">
                  {allRegions.map((region) => (
                    <label key={region.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newRegionSlugs.includes(region.slug)}
                        onChange={() => toggleNewRegion(region.slug)}
                      />
                      {region.slug}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="button-row">
              <button
                type="submit"
                className="primary"
                disabled={creating || allRegions.length === 0}
              >
                {creating ? 'Creating...' : 'Create Manager'}
              </button>
            </div>
            {createError && <div className="error">{createError}</div>}
          </form>
        </div>
      )}

      {loading && <div className="loading">Loading managers...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && managers.length === 0 && <div className="empty">No managers yet.</div>}

      {!loading && managers.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Assigned Regions</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((manager) => {
                const isEditing = editingManagerId === manager.id;
                const isAssigning = assigningManagerId === manager.id;
                return (
                  <React.Fragment key={manager.id}>
                    <tr className={isEditing || isAssigning ? 'expanded' : ''}>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="inline-edit"
                          />
                        ) : (
                          <div className="primary-text">{manager.name}</div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="inline-edit"
                          />
                        ) : (
                          manager.email
                        )}
                      </td>
                      <td>
                        {manager.regions.length === 0 ? (
                          <span className="badge muted">No regions</span>
                        ) : (
                          manager.regions.map((r) => (
                            <span key={r.id} className="badge region">
                              {r.slug}
                            </span>
                          ))
                        )}
                      </td>
                      <td>
                        {manager.created && !isNaN(new Date(manager.created).getTime())
                          ? new Date(manager.created).toLocaleDateString()
                          : '—'}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="button-row">
                            <button
                              className="primary small"
                              onClick={() => saveManager(manager.id)}
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
                              onClick={() => startEditing(manager)}
                            >
                              Edit
                            </button>
                            <button
                              className={`secondary small ${isAssigning ? 'active' : ''}`}
                              onClick={() => toggleAssigning(manager.id)}
                            >
                              Regions
                            </button>
                            <button
                              className="danger small"
                              onClick={() => handleDelete(manager.id)}
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
                            <strong>Assign to Regions:</strong>
                            <div className="checkbox-group">
                              {allRegions.length === 0 ? (
                                <span className="muted">No regions available. Create one first.</span>
                              ) : (
                                allRegions.map((region) => {
                                  const isAssigned = manager.regions.some(
                                    (r) => r.id === region.id
                                  );
                                  return (
                                    <label key={region.id} className="checkbox-label">
                                      <input
                                        type="checkbox"
                                        checked={isAssigned}
                                        onChange={() => toggleRegionAssignment(manager, region)}
                                      />
                                      {region.slug}
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
