const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'data', 'learningResources.js');

const categories = {
  law: [
    'Corporate Law', 'Family Law', 'Property Law', 'Tort Law', 'Environmental Law',
    'Intellectual Property', 'Tax Law', 'Labor Law', 'Cyber Law', 'Maritime Law',
    'Aviation Law', 'Entertainment Law', 'Sports Law', 'Bankruptcy Law', 'Health Law'
  ],
  business: [
    'Investment Banking', 'Corporate Finance', 'Strategic Marketing', 'Digital Marketing',
    'Operations Management', 'Project Management', 'Business Analytics', 'Leadership',
    'Organizational Behavior', 'Retail Management', 'B2B Sales', 'Negotiation Skills',
    'Venture Capital', 'Risk Management', 'International Trade'
  ],
  education: [
    'Early Childhood Education', 'Special Education', 'Educational Psychology', 'Instructional Design',
    'Adult Learning', 'E-Learning Development', 'Education Policy', 'Language Teaching',
    'STEM Education', 'Montessori Method', 'Classroom Technology', 'Literacy Development',
    'Higher Education Administration', 'Student Affairs', 'Educational Leadership'
  ],
  humanities: [
    'Modern History', 'Ancient Civilizations', 'Ethics and Morality', 'Linguistics',
    'Cultural Anthropology', 'Political Science', 'Sociology', 'Gender Studies',
    'Art History', 'Theology', 'Comparative Literature', 'Classical Studies',
    'Media Studies', 'Human Geography', 'Philosophy of Mind'
  ],
  health: [
    'Nutrition and Dietetics', 'Mental Health Nursing', 'Kinesiology', 'Public Health Policy',
    'Epidemiology', 'Pharmacology Basics', 'Global Health', 'Healthcare Management',
    'Physical Therapy', 'Occupational Therapy', 'Dental Hygiene', 'Radiology Basics',
    'Medical Terminology', 'Gerontology', 'Pediatrics'
  ],
  agriculture: [
    'Organic Farming', 'Hydroponics', 'Agricultural Engineering', 'Food Science',
    'Horticulture', 'Animal Husbandry', 'Permaculture', 'Agroecology',
    'Precision Agriculture', 'Forestry Management', 'Veterinary Science Basics', 'Aquaculture',
    'Plant Pathology', 'Soil Conservation', 'Agricultural Economics'
  ]
};

const providers = ['Coursera', 'edX', 'FutureLearn', 'Udemy', 'OER', 'University Press', 'Skillshare'];
const types = ['Course', 'Resource', 'Tutorial', 'Book', 'Article', 'Bootcamp'];
const difficulties = ['Beginner', 'Beginner', 'Intermediate', 'Intermediate', 'Intermediate', 'Advanced'];

let startId = 72;
let newResourcesText = [];

for (const [category, topics] of Object.entries(categories)) {
  newResourcesText.push('\\n  // Expanded ' + category.toUpperCase() + ' Resources');
  for (let i = 0; i < 35; i++) {
    const topic = topics[i % topics.length];
    const prefix = i < topics.length ? 'Fundamentals of' : (i < topics.length * 2 ? 'Advanced' : 'Applied');
    const suffix = i < topics.length ? 'in Practice' : (i < topics.length * 2 ? 'Masterclass' : 'Case Studies');
    
    let title;
    if (i % 3 === 0) {
      title = prefix + ' ' + topic;
    } else if (i % 3 === 1) {
      title = topic + ' ' + suffix;
    } else {
      title = topic + ': Complete Guide';
    }
    
    const provider = providers[Math.floor(Math.random() * providers.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const duration = Math.floor(Math.random() * 8 + 2) + ' ' + ['weeks', 'hours', 'months'][Math.floor(Math.random() * 3)];
    const rating = (Math.random() * 0.5 + 4.4).toFixed(1);

    const searchLink = 'https://www.coursera.org/search?query=' + encodeURIComponent(topic);

    const resourceStr = "  { id: " + startId++ + ", title: '" + title + "', category: '" + category + "', type: '" + type + "', provider: '" + provider + "', description: 'Explore key concepts and practical applications in " + topic + ". Ideal for " + difficulty.toLowerCase() + " learners seeking comprehensive knowledge.', link: '" + searchLink + "', difficulty: '" + difficulty + "', duration: '" + duration + "', rating: " + rating + " }";
    
    newResourcesText.push(resourceStr);
  }
}

let content = fs.readFileSync(targetPath, 'utf8');
const lastBracketIndex = content.lastIndexOf(']');

if (lastBracketIndex !== -1) {
  let beforeBracket = content.slice(0, lastBracketIndex);
  beforeBracket = beforeBracket.trimEnd();
  if (!beforeBracket.endsWith(',')) {
    beforeBracket += ',';
  }
  
  const finalContent = beforeBracket + '\\n' + newResourcesText.join(',\\n') + '\\n]\\n';
  fs.writeFileSync(targetPath, finalContent, 'utf8');
  console.log('Successfully expanded learning resources.');
} else {
  console.error('Could not find the end of the array inside learningResources.js');
}
