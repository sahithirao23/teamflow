import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

// ─── Generic fetch hook ───────────────────────────────────────────────────────
export function useFetch(url, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get(url);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { fetch(); }, [fetch, ...deps]);

  return { data, loading, error, refetch: fetch };
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export function useProjects() {
  return useFetch('/projects');
}

export function useProject(id) {
  return useFetch(id ? `/projects/${id}` : null, [id]);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export function useTasks(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  ).toString();
  return useFetch(`/tasks${query ? '?' + query : ''}`);
}

export function useTaskStats() {
  return useFetch('/tasks/stats/overview');
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function useUsers() {
  return useFetch('/users');
}

// ─── Activity ─────────────────────────────────────────────────────────────────
export function useActivity(projectId) {
  const url = projectId ? `/activity?projectId=${projectId}` : '/activity';
  return useFetch(url, [projectId]);
}
