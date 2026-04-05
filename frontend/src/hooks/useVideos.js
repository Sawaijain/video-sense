import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const useVideos = (filters = {}) => {
  const [videos, setVideos] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.set(key, val);
      });
      const res = await api.get(`/videos?${params.toString()}`);
      setVideos(res.data.data.videos);
      setPagination(res.data.data.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return { videos, pagination, loading, error, refetch: fetchVideos };
};
