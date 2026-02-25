import Papa from 'papaparse'

let datasetCache = null

function rowToUser(row, index) {
  return {
    id: `dataset_${index}`,
    registrationNumber: row['Registration Number'],
    firstName: row['First Name'],
    middleName: row['Middle Name'] || '',
    lastName: row['Last Name'],
    gender: row['Gender'],
    dateOfBirth: row['Date of Birth'],
    nationality: row['Nationality'],
    countryOfResidence: row['Country of Residence'],
    phoneNumber: row['Phone Number'],
    email: row['Email Address'],
    homeAddress: row['Home Address'],
    city: row['City'],
    state: row['State'],
    zipCode: row['Zip Code'],
    university: row['University'],
    currentGPA: row['Current GPA / CGPA'],
    creditsCompleted: row['Credits Completed'],
    creditsRemaining: row['Credits Remaining'],
    coursesEnrolled: row['Courses Enrolled Per Semester'],
    courseCodes: row['Course Codes'],
    courseUnits: row['Course Units'],
    technicalSkills: row['Technical Skills'] || '',
    softSkills: row['Soft Skills'] || '',
    researchInterests: row['Research Interests'] || '',
    professionalInterests: row['Professional Interests'] || '',
    hobbies: row['Hobbies'] || '',
    preferredLearningStyle: row['Preferred Learning Style'] || '',
    studyPartnersPreferences: row['Study Partners Preferences'] || '',
    preferredStudyHours: row['Preferred Study Hours'] || '',
    csInterests: row['CS and Data Science Interests'] || '',
    strongComputingFields: row['Strong Computing Fields'] || '',
    weakComputingFields: row['Weak Computing Fields'] || '',
    isFromDataset: true,
    studyStats: {
      totalHours: Math.floor(Math.random() * 200) + 50,
      weeklyHours: Array.from({ length: 7 }, () => Math.floor(Math.random() * 8) + 2),
      sessionsCompleted: Math.floor(Math.random() * 100) + 20,
      studyProgress: Math.floor(Math.random() * 80) + 10
    }
  }
}

function parseCSV(text) {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: reject
    })
  })
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function loadDataset() {
  if (datasetCache) {
    return datasetCache
  }

  try {
    // Prefer database if API is available and seeded
    try {
      const res = await fetch(`${API_BASE}/api/dataset-students`)
      if (res.ok) {
        const data = await res.json()
        if (data.users && data.users.length > 0) {
          datasetCache = data.users
          return datasetCache
        }
      }
    } catch (_) {
      // Fall back to CSV
    }

    // Fallback: load Ugandan students CSV when API is unavailable
    try {
      const response = await fetch('/ugandan_students_dataset_1050.csv')
      if (!response.ok) throw new Error(response.statusText)
      const text = await response.text()
      const rows = await parseCSV(text)
      const users = rows.map((row, index) => rowToUser(row, index))
      datasetCache = users
      return users
    } catch (err) {
      console.error('Error loading Ugandan dataset:', err)
      return []
    }
  } catch (error) {
    console.error('Error loading dataset:', error)
    return []
  }
}

export function getDatasetUsers() {
  return datasetCache || []
}

