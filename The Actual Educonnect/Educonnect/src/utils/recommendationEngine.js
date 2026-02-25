// Recommendation algorithm based on multiple factors

export function calculateSimilarity(user1, user2) {
  let score = 0
  let maxScore = 0

  // Primary factor: CS and Data Science Interests (weight: 40%)
  const weightPrimary = 0.4
  const interests1 = parseCommaSeparated(user1.csInterests || '')
  const interests2 = parseCommaSeparated(user2.csInterests || '')
  const interestsMatch = calculateJaccardSimilarity(interests1, interests2)
  score += interestsMatch * weightPrimary
  maxScore += weightPrimary

  // Technical Skills (weight: 15%)
  const weightTech = 0.15
  const tech1 = parseCommaSeparated(user1.technicalSkills || '')
  const tech2 = parseCommaSeparated(user2.technicalSkills || '')
  const techMatch = calculateJaccardSimilarity(tech1, tech2)
  score += techMatch * weightTech
  maxScore += weightTech

  // Soft Skills (weight: 10%)
  const weightSoft = 0.1
  const soft1 = parseCommaSeparated(user1.softSkills || '')
  const soft2 = parseCommaSeparated(user2.softSkills || '')
  const softMatch = calculateJaccardSimilarity(soft1, soft2)
  score += softMatch * weightSoft
  maxScore += weightSoft

  // Research Interests (weight: 10%)
  const weightResearch = 0.1
  const research1 = parseCommaSeparated(user1.researchInterests || '')
  const research2 = parseCommaSeparated(user2.researchInterests || '')
  const researchMatch = calculateJaccardSimilarity(research1, research2)
  score += researchMatch * weightResearch
  maxScore += weightResearch

  // Professional Interests (weight: 10%)
  const weightProfessional = 0.1
  const prof1 = parseCommaSeparated(user1.professionalInterests || '')
  const prof2 = parseCommaSeparated(user2.professionalInterests || '')
  const profMatch = calculateJaccardSimilarity(prof1, prof2)
  score += profMatch * weightProfessional
  maxScore += weightProfessional

  // Hobbies (weight: 5%)
  const weightHobbies = 0.05
  const hobbies1 = parseCommaSeparated(user1.hobbies || '')
  const hobbies2 = parseCommaSeparated(user2.hobbies || '')
  const hobbiesMatch = calculateJaccardSimilarity(hobbies1, hobbies2)
  score += hobbiesMatch * weightHobbies
  maxScore += weightHobbies

  // Preferred Learning Style (weight: 5%)
  const weightLearning = 0.05
  if (user1.preferredLearningStyle && user2.preferredLearningStyle) {
    if (user1.preferredLearningStyle === user2.preferredLearningStyle) {
      score += weightLearning
    }
  }
  maxScore += weightLearning

  // Study Partners Preferences (weight: 3%)
  const weightPartnerPref = 0.03
  if (user1.studyPartnersPreferences && user2.studyPartnersPreferences) {
    if (user1.studyPartnersPreferences === user2.studyPartnersPreferences) {
      score += weightPartnerPref
    }
  }
  maxScore += weightPartnerPref

  // Preferred Study Hours (weight: 2%)
  const weightStudyHours = 0.02
  if (user1.preferredStudyHours && user2.preferredStudyHours) {
    if (user1.preferredStudyHours === user2.preferredStudyHours) {
      score += weightStudyHours
    }
  }
  maxScore += weightStudyHours

  // Normalize score to 0-1 range
  return maxScore > 0 ? score / maxScore : 0
}

function parseCommaSeparated(str) {
  if (!str || typeof str !== 'string') return []
  return str
    .split(',')
    .map(item => item.trim())
    .filter(item => item && item.toLowerCase() !== 'none')
    .map(item => item.toLowerCase())
}

function calculateJaccardSimilarity(set1, set2) {
  if (set1.length === 0 && set2.length === 0) return 1
  if (set1.length === 0 || set2.length === 0) return 0

  const intersection = set1.filter(item => set2.includes(item))
  const union = [...new Set([...set1, ...set2])]
  
  return intersection.length / union.length
}

export function getRecommendations(currentUser, allUsers, limit = null) {
  // Filter out current user
  const otherUsers = allUsers.filter(u => u.id !== currentUser.id)
  
  // Calculate similarity scores
  const scoredUsers = otherUsers.map(user => ({
    user,
    similarity: calculateSimilarity(currentUser, user)
  }))
  
  // Sort by similarity (highest first)
  scoredUsers.sort((a, b) => b.similarity - a.similarity)
  
  // Return top N if limit specified, otherwise return all
  const results = limit ? scoredUsers.slice(0, limit) : scoredUsers
  
  return results.map(item => ({
    ...item.user,
    matchScore: Math.round(item.similarity * 100)
  }))
}

