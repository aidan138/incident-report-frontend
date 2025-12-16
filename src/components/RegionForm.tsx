// src/components/RegionForm.tsx

import React, { useState } from 'react';
// import type { RegionPayload } from '../types/portal';
import { createRegion } from '../api/regions';

type RegionPayload = {
  slug: string;
  locations: Record<string, string>;
  managers?: string[];
};


interface RegionFormProps {
  onCreated: () => void; // callback to refresh list
}

const sampleLocations = `{
  "loc1": "Main Pool",
  "loc2": "West Pool"
}`;

export const RegionForm: React.FC<RegionFormProps> = ({ onCreated }) => {
  const [slug, setSlug] = useState('');
  const [locationsText, setLocationsText] = useState(sampleLocations);
  const [managersText, setManagersText] = useState(''); // comma-separated names
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    let locations: Record<string, string>;

    try {
      locations = JSON.parse(locationsText);
      if (typeof locations !== 'object' || Array.isArray(locations)) {
        throw new Error('Locations must be a JSON object of key -> value');
      }
    } catch (err) {
      setError(`Invalid locations JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    const managers =
      managersText.trim().length > 0
        ? managersText.split(',').map((m) => m.trim()).filter(Boolean)
        : [];

    const payload: RegionPayload = {
      slug: slug.trim(),
      locations,
      managers,
    };

    if (!payload.slug) {
      setError('Slug is required');
      return;
    }

    setLoading(true);
    try {
      await createRegion(payload);
      setSuccess(`Region "${payload.slug}" created`);
      setSlug('');
      setManagersText('');
      setLocationsText(sampleLocations);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create region');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Region</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. seattle, north-bay"
          />
        </div>

        <div className="form-group">
          <label>Locations (JSON object)</label>
          <textarea
            rows={5}
            value={locationsText}
            onChange={(e) => setLocationsText(e.target.value)}
          />
          <small>JSON object of location_key to human-readable name.</small>
        </div>

        <div className="form-group">
          <label>Managers (optional, comma-separated names)</label>
          <input
            type="text"
            value={managersText}
            onChange={(e) => setManagersText(e.target.value)}
            placeholder="Alice, Bob, Charlie"
          />
        </div>

        <div className="button-row">
          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Region'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
      </form>
    </div>
  );
};
