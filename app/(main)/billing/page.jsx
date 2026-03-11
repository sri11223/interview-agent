"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/app/provider";
import { supabase } from "@/services/supabaseClient";
import { BarChart3, Target, Clock, TrendingUp, GraduationCap, Flame } from "lucide-react";
import moment from "moment";

export default function ProgressPage() {
  const { user } = useUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) loadStats();
  }, [user]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data: interviews } = await supabase
        .from('Interviews')
        .select('*')
        .eq('userEmail', user.email)
        .order('created_at', { ascending: false });

      const { data: feedbacks } = await supabase
        .from('interview-feedback')
        .select('*')
        .eq('userEmail', user.email);

      const totalSessions = interviews?.length || 0;
      const completedSessions = feedbacks?.length || 0;

      // Calculate category breakdown
      const categoryMap = {};
      (interviews || []).forEach(i => {
        const cat = i.jobPosition || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });

      // Calculate average scores from feedback
      let totalScore = 0;
      let scoreCount = 0;
      const scores = [];
      (feedbacks || []).forEach(f => {
        const rating = f.feedback?.rating;
        if (rating) {
          const vals = Object.values(rating);
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          totalScore += avg;
          scoreCount++;
          scores.push({ date: f.created_at, score: avg });
        }
      });

      const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount * 10) / 10 : null;

      // Calculate streak (consecutive days with practice)
      const sessionDates = [...new Set((interviews || []).map(i => moment(i.created_at).format('YYYY-MM-DD')))].sort().reverse();
      let streak = 0;
      let checkDate = moment().startOf('day');
      for (const dateStr of sessionDates) {
        const d = moment(dateStr);
        if (d.isSame(checkDate, 'day') || d.isSame(checkDate.clone().subtract(1, 'day'), 'day')) {
          streak++;
          checkDate = d;
        } else {
          break;
        }
      }

      // Total practice time
      let totalMinutes = 0;
      (interviews || []).forEach(i => {
        const dur = parseInt(i.duration);
        if (!isNaN(dur)) totalMinutes += dur;
      });

      setStats({
        totalSessions,
        completedSessions,
        avgScore,
        categoryMap,
        scores,
        streak,
        totalMinutes,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Progress</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-8 bg-gray-200 rounded mb-2 w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const categories = stats ? Object.entries(stats.categoryMap).sort((a, b) => b[1] - a[1]) : [];
  const categoryColors = {
    'System Design': 'bg-purple-500',
    'DSA': 'bg-green-500',
    'Development': 'bg-blue-500',
    'Behavioral': 'bg-orange-500',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Progress</h1>
        <p className="text-gray-500">Track your interview preparation journey</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalSessions || 0}</p>
                <p className="text-sm text-gray-500">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.avgScore != null ? `${stats.avgScore}/10` : '--'}
                </p>
                <p className="text-sm text-gray-500">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.streak || 0}</p>
                <p className="text-sm text-gray-500">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalMinutes || 0}m</p>
                <p className="text-sm text-gray-500">Practice Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <GraduationCap className="w-10 h-10 mx-auto mb-2" />
                <p>No sessions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {categories.map(([cat, count]) => {
                  const total = stats.totalSessions || 1;
                  const pct = Math.round((count / total) * 100);
                  const color = categoryColors[cat] || 'bg-gray-500';
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{cat}</span>
                        <span className="text-gray-500">{count} sessions ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Scores</CardTitle>
          </CardHeader>
          <CardContent>
            {(!stats?.scores || stats.scores.length === 0) ? (
              <div className="text-center py-8 text-gray-400">
                <TrendingUp className="w-10 h-10 mx-auto mb-2" />
                <p>Complete a session to see scores</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.scores.slice(0, 8).map((s, i) => {
                  const score = Math.round(s.score * 10) / 10;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-20">{moment(s.date).format('MMM DD')}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            score >= 7 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score * 10}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-10 text-right">{score}/10</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#e5e7eb" strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#3b82f6" strokeWidth="3"
                  strokeDasharray={`${stats?.totalSessions ? (stats.completedSessions / stats.totalSessions) * 100 : 0}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">
                  {stats?.totalSessions ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-gray-700 font-medium">{stats?.completedSessions || 0} of {stats?.totalSessions || 0} sessions completed with feedback</p>
              <p className="text-sm text-gray-500 mt-1">Complete more sessions to improve your stats</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}