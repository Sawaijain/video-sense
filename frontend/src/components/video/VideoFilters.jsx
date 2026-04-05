export default function VideoFilters({ filters, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select
        value={filters.status || ''}
        onChange={(e) => handleChange('status', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      >
        <option value="">All Status</option>
        <option value="uploaded">Uploaded</option>
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
      </select>

      <select
        value={filters.sensitivityLabel || ''}
        onChange={(e) => handleChange('sensitivityLabel', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      >
        <option value="">All Labels</option>
        <option value="safe">Safe</option>
        <option value="flagged">Flagged</option>
      </select>

      <input
        type="date"
        value={filters.fromDate || ''}
        onChange={(e) => handleChange('fromDate', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        placeholder="From date"
      />

      <input
        type="date"
        value={filters.toDate || ''}
        onChange={(e) => handleChange('toDate', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        placeholder="To date"
      />

      <select
        value={filters.sort || '-createdAt'}
        onChange={(e) => handleChange('sort', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      >
        <option value="-createdAt">Newest First</option>
        <option value="createdAt">Oldest First</option>
        <option value="-size">Largest First</option>
        <option value="size">Smallest First</option>
      </select>
    </div>
  );
}
