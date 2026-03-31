export default function ProfileSidebar({ profile }) {
  const redditAge = () => {
    const created = new Date(profile.created_at);
    const now = new Date();
    const diffMs = now - created;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days} hari`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} bulan`;
    const years = Math.floor(months / 12);
    return `${years} tahun`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Banner */}
      <div className="h-20 bg-gradient-to-r from-orange-400 to-orange-500" />

      {/* Avatar + Username */}
      <div className="px-4 -mt-6">
        <div className="w-16 h-16 rounded-full bg-gray-300 border-4 border-white flex items-center justify-center text-2xl font-bold text-gray-500">
          {profile.username?.charAt(0).toUpperCase()}
        </div>
        <h3 className="font-bold text-gray-800 mt-2">u/{profile.username}</h3>
      </div>

      {/* Share Button */}
      <div className="px-4 mt-3">
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="w-full py-1.5 text-sm font-medium rounded-full border border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800"
        >
          Share
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-sm font-bold text-gray-800">{profile.karma ?? 0}</p>
          <p className="text-xs text-gray-500">Karma</p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{redditAge()}</p>
          <p className="text-xs text-gray-500">Reddit Age</p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">-</p>
          <p className="text-xs text-gray-500">Active In</p>
        </div>
      </div>

      {/* Settings */}
      <div className="px-4 py-4 mt-3 border-t border-gray-100">
        <button className="w-full py-1.5 text-sm font-medium rounded-full bg-orange-500 text-white hover:bg-orange-600">
          Update Profile
        </button>
      </div>
    </div>
  );
}
