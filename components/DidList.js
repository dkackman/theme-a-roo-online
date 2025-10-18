export default function DidList({ dids = [], onToggle, onDelete }) {
  if (!dids.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="mt-4 text-lg font-medium">No DIDs yet</p>
        <p className="mt-1 text-sm">Add your first DID to get started!</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {dids.map((d) => (
        <li
          key={d.id}
          className="py-4 flex items-center gap-4 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors"
        >
          <input
            type="checkbox"
            checked={d.is_complete}
            onChange={() => onToggle(d)}
            className="h-5 w-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          />
          <span
            className={`flex-1 ${
              d.is_complete ? "line-through text-gray-400" : "text-gray-900"
            }`}
          >
            {d.title}
          </span>
          <button
            onClick={() => onDelete(d.id)}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
