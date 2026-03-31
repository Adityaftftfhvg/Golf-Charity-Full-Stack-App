import React, { useState, useEffect } from 'react';
// import { createClient } from '@/lib/supabase' // Uncomment when adding your actual Supabase client

export default function LeaderboardPage() {
  const [filter, setFilter] = useState('monthly');
  
  // Mock data: Replace this with your actual Supabase fetch logic.
  // The PRD requires users to enter their last 5 scores[cite: 44].
  // The leaderboard typically ranks based on the average of these active scores.
  const topScorers = [
    { id: 1, name: "Elena R.", avgScore: 42.5, trend: "up", charity: "Ocean Conservancy" },
    { id: 2, name: "Marcus T.", avgScore: 41.2, trend: "same", charity: "World Wildlife Fund" },
    { id: 3, name: "Sarah J.", avgScore: 39.8, trend: "down", charity: "Doctors Without Borders" },
    { id: 4, name: "David K.", avgScore: 38.5, trend: "up", charity: "Local Food Bank" },
    { id: 5, name: "James L.", avgScore: 37.0, trend: "up", charity: "Red Cross" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Impact <span className="text-emerald-500">Leaderboard</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            See who's driving the most change. Rankings are based on the rolling average of your latest 5 Stableford scores.
          </p>
        </header>

        {/* Filters */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-900 p-1 rounded-lg inline-flex">
            <button 
              onClick={() => setFilter('monthly')}
              className={`px-6 py-2 rounded-md transition-all ${filter === 'monthly' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              This Month
            </button>
            <button 
              onClick={() => setFilter('all-time')}
              className={`px-6 py-2 rounded-md transition-all ${filter === 'all-time' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-4">
          {topScorers.map((user, index) => (
            <div 
              key={user.id} 
              className="bg-gray-900 rounded-xl p-4 md:p-6 flex items-center justify-between border border-gray-800 hover:border-emerald-500/50 transition-colors transform hover:-translate-y-1 duration-300"
            >
              <div className="flex items-center gap-4 md:gap-6">
                {/* Rank Indicator */}
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 font-bold text-lg">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </div>
                
                {/* User Info */}
                <div>
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    Playing for: <span className="text-emerald-400">{user.charity}</span>
                  </p>
                </div>
              </div>

              {/* Score & Trend */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold">{user.avgScore.toFixed(1)}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Avg Score</div>
                </div>
                
                {/* Trend Icon */}
                <div className="w-6 flex justify-center">
                  {user.trend === 'up' && <span className="text-green-500">▲</span>}
                  {user.trend === 'down' && <span className="text-red-500">▼</span>}
                  {user.trend === 'same' && <span className="text-gray-600">—</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Back */}
        <div className="mt-12 text-center">
          <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
            &larr; Back to Dashboard
          </a>
        </div>
        
      </div>
    </div>
  );
}