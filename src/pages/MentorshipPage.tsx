import { useState } from 'react';
import { Users, Award, TrendingUp, MessageSquare, CheckCircle } from 'lucide-react';
import { mockProfiles, mockMentorshipRequests } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';

export function MentorshipPage() {
  const { profile, user } = useAuth();
  const [mentorshipRequests, setMentorshipRequests] = useState(mockMentorshipRequests);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState('');

  const calculateMatchScore = (mentorProfile: typeof mockProfiles[0]) => {
    if (!profile) return 0;

    let score = 0;
    const mySkills = profile.skills.map((s) => s.skillName.toLowerCase());
    const mentorSkills = mentorProfile.skills.map((s) => s.skillName.toLowerCase());

    const skillOverlap = mySkills.filter((skill) => mentorSkills.includes(skill)).length;
    score += skillOverlap * 0.3;

    if (mentorProfile.graduationYear && profile.graduationYear) {
      const yearDiff = Math.abs(mentorProfile.graduationYear - profile.graduationYear);
      if (yearDiff >= 3 && yearDiff <= 10) {
        score += 0.3;
      }
    }

    if (mentorProfile.department === profile.department) {
      score += 0.2;
    }

    if (mentorProfile.interests) {
      const myInterests = profile.interests.map((i) => i.toLowerCase());
      const mentorInterests = mentorProfile.interests.map((i) => i.toLowerCase());
      const interestOverlap = myInterests.filter((interest) =>
        mentorInterests.includes(interest)
      ).length;
      score += interestOverlap * 0.2;
    }

    return Math.min(score, 1);
  };

  const potentialMentors = mockProfiles
    .filter(
      (p) =>
        p.id !== profile?.id &&
        (p.graduationYear ?? 0) < (profile?.graduationYear ?? 9999) &&
        !mentorshipRequests.some((req) => req.mentorId === p.id && req.studentId === profile?.id)
    )
    .map((mentor) => ({
      ...mentor,
      matchScore: calculateMatchScore(mentor),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  const activeMentorships = mentorshipRequests.filter(
    (req) => req.studentId === profile?.id && req.status === 'active'
  );

  const handleRequestMentorship = () => {
    if (!selectedMentor || !profile) return;

    const mentor = mockProfiles.find((p) => p.id === selectedMentor);
    if (!mentor) return;

    const newRequest = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: profile.id,
      mentorId: selectedMentor,
      status: 'pending' as const,
      matchScore: calculateMatchScore(mentor),
      message: requestMessage,
      createdAt: new Date().toISOString(),
    };

    setMentorshipRequests([...mentorshipRequests, newRequest]);
    setSelectedMentor(null);
    setRequestMessage('');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentorship Program</h1>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {activeMentorships.length}
              </p>
              <p className="text-sm text-gray-600">Active Mentorships</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {potentialMentors.length}
              </p>
              <p className="text-sm text-gray-600">Available Mentors</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {activeMentorships.length > 0
                  ? Math.round(
                      activeMentorships.reduce((sum, req) => sum + (req.matchScore || 0), 0) /
                        activeMentorships.length *
                        100
                    )
                  : 0}
                %
              </p>
              <p className="text-sm text-gray-600">Avg Match Score</p>
            </div>
          </div>
        </div>
      </div>

      {activeMentorships.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Mentors</h2>
          <div className="space-y-4">
            {activeMentorships.map((mentorship) => {
              const mentor = mockProfiles.find((p) => p.id === mentorship.mentorId);
              if (!mentor) return null;

              return (
                <div
                  key={mentorship.id}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {mentor.avatarUrl ? (
                        <img
                          src={mentor.avatarUrl}
                          alt={`${mentor.firstName} ${mentor.lastName}`}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-semibold">
                          {mentor.firstName[0]}
                          {mentor.lastName[0]}
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {mentor.firstName} {mentor.lastName}
                          </h3>
                          <CheckCircle className="text-green-600" size={20} />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {mentor.department} • {mentor.currentEmployer}
                        </p>
                        {mentorship.matchScore && (
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${mentorship.matchScore * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {Math.round(mentorship.matchScore * 100)}% match
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {mentor.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill.id}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                            >
                              {skill.skillName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                      <MessageSquare size={18} />
                      <span>Message</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Mentors</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {potentialMentors.map((mentor) => (
            <div
              key={mentor.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4 mb-4">
                {mentor.avatarUrl ? (
                  <img
                    src={mentor.avatarUrl}
                    alt={`${mentor.firstName} ${mentor.lastName}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-semibold">
                    {mentor.firstName[0]}
                    {mentor.lastName[0]}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {mentor.firstName} {mentor.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {mentor.department}
                    {mentor.currentEmployer && ` • ${mentor.currentEmployer}`}
                  </p>

                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${mentor.matchScore * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round(mentor.matchScore * 100)}% match
                    </span>
                  </div>
                </div>
              </div>

              {mentor.bio && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{mentor.bio}</p>
              )}

              <div className="flex flex-wrap gap-1 mb-4">
                {mentor.skills.slice(0, 4).map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                  >
                    {skill.skillName}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setSelectedMentor(mentor.id)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Request Mentorship
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedMentor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Request Mentorship</h3>
            <p className="text-sm text-gray-600 mb-4">
              Tell your potential mentor why you'd like them to guide you and what you hope to
              learn.
            </p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="I would love to learn more about..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
              rows={4}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedMentor(null);
                  setRequestMessage('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestMentorship}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
