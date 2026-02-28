/**
 * Learning fields with progressive quizzes and final tests.
 * Score after each quiz; final test gauges proficiency in the field.
 */

export const PASSING_SCORE = 0.7 // 70% to pass

export const getProficiency = (scorePercent) => {
  if (scorePercent >= 90) return { level: 'Expert', color: '#10B981' }
  if (scorePercent >= 70) return { level: 'Advanced', color: '#4ECDC4' }
  if (scorePercent >= 50) return { level: 'Intermediate', color: '#FFD93D' }
  return { level: 'Beginner', color: '#FF6B35' }
}

// Learning fields: each has 3 progressive quizzes + 1 final test
export const learningFields = [
  {
    id: 'ai',
    name: 'Artificial Intelligence',
    description: 'AI fundamentals, search, and problem-solving',
    resourceIds: [1, 11],
    quizzes: [
      {
        id: 'ai-1',
        order: 1,
        title: 'AI Quiz 1: Search & Problem-Solving',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'What is a key characteristic of heuristic search algorithms?', options: ['They always find the optimal solution', 'They use problem-specific knowledge to guide the search', 'They never use memory'], correct: 1 },
          { id: 'q2', question: 'In problem-solving, what does the "state space" represent?', options: ['The physical location', 'All possible configurations of the problem', 'The solution only'], correct: 1 },
          { id: 'q3', question: 'Which search guarantees the shortest path in an unweighted graph?', options: ['Depth-First', 'Breadth-First Search', 'Greedy Search'], correct: 1 },
          { id: 'q4', question: 'What role do heuristics play in A* search?', options: ['Slow down search', 'Estimate cost to reach the goal', 'Guarantee optimality'], correct: 1 },
          { id: 'q5', question: 'What distinguishes informed from uninformed search?', options: ['Informed uses problem knowledge', 'Informed is always faster', 'No difference'], correct: 0 }
        ]
      },
      {
        id: 'ai-2',
        order: 2,
        title: 'AI Quiz 2: Advanced Concepts',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'What is the main goal of reinforcement learning?', options: ['Classify data', 'Learn optimal actions by interacting with an environment', 'Cluster data'], correct: 1 },
          { id: 'q2', question: 'What is the "reward" in RL?', options: ['A neural network', 'A signal indicating how good an action was', 'The dataset'], correct: 1 },
          { id: 'q3', question: 'What does Q-learning estimate?', options: ['The optimal value of taking an action in a state', 'The number of episodes', 'The discount factor'], correct: 0 },
          { id: 'q4', question: 'What is the "policy" in RL?', options: ['A legal document', 'A strategy mapping states to actions', 'A reward function'], correct: 1 },
          { id: 'q5', question: 'What is exploration vs exploitation?', options: ['Two datasets', 'Exploring new actions vs choosing known good ones', 'Two algorithms'], correct: 1 }
        ]
      },
      {
        id: 'ai-3',
        order: 3,
        title: 'AI Quiz 3: Synthesis',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'Which is an informed search algorithm?', options: ['BFS', 'A*', 'DFS'], correct: 1 },
          { id: 'q2', question: 'In RL, what does the agent learn from?', options: ['Labels only', 'Rewards and environment feedback', 'Predefined rules'], correct: 1 },
          { id: 'q3', question: 'What makes a heuristic admissible in A*?', options: ['Never overestimates cost', 'Always underestimates', 'Is always zero'], correct: 0 },
          { id: 'q4', question: 'What is the exploration-exploitation tradeoff?', options: ['Model selection', 'Balancing trying new vs known-good actions', 'Data splitting'], correct: 1 },
          { id: 'q5', question: 'Which RL algorithm is model-free?', options: ['Value iteration with full model', 'Q-learning', 'Policy iteration'], correct: 1 }
        ]
      }
    ],
    finalTest: {
      id: 'ai-final',
      title: 'AI Final Assessment',
      isFinal: true,
      questions: [
        { id: 'f1', question: 'Heuristic search uses problem-specific knowledge to:', options: ['Guarantee shortest path', 'Guide the search toward the goal', 'Eliminate state space'], correct: 1 },
        { id: 'f2', question: 'Breadth-First Search is complete when:', options: ['Graph is directed', 'Branching factor is finite', 'Heuristic is admissible'], correct: 1 },
        { id: 'f3', question: 'In RL, the policy defines:', options: ['The environment', 'What action to take in each state', 'The reward function'], correct: 1 },
        { id: 'f4', question: 'Q-learning updates the Q-value based on:', options: ['Supervised labels', 'Temporal difference from reward and next state', 'Gradient descent only'], correct: 1 },
        { id: 'f5', question: 'An admissible heuristic for A* must:', options: ['Never overestimate the actual cost to goal', 'Always equal the actual cost', 'Be differentiable'], correct: 0 },
        { id: 'f6', question: 'Exploration in RL is important to:', options: ['Speed up training', 'Discover potentially better actions', 'Reduce memory'], correct: 1 },
        { id: 'f7', question: 'The state space in search represents:', options: ['The algorithm used', 'All possible problem configurations', 'The goal state only'], correct: 1 },
        { id: 'f8', question: 'Discount factor in RL affects:', options: ['Learning rate only', 'How much future rewards are valued', 'Exploration rate'], correct: 1 },
        { id: 'f9', question: 'Depth-First Search uses:', options: ['Queue (FIFO)', 'Stack (LIFO)', 'Priority queue'], correct: 1 },
        { id: 'f10', question: 'Model-free RL means:', options: ['No neural network', 'No explicit model of environment dynamics', 'No policy'], correct: 1 }
      ]
    }
  },
  {
    id: 'ml',
    name: 'Machine Learning',
    description: 'Supervised learning, neural networks, and more',
    resourceIds: [2, 10],
    quizzes: [
      {
        id: 'ml-1',
        order: 1,
        title: 'ML Quiz 1: Fundamentals',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'What is supervised learning?', options: ['Learning without labels', 'Learning from labeled data to predict outcomes', 'Clustering only'], correct: 1 },
          { id: 'q2', question: 'What does the cost function measure in linear regression?', options: ['Number of features', 'Difference between predicted and actual values', 'Learning rate'], correct: 1 },
          { id: 'q3', question: 'What is gradient descent used for?', options: ['Visualization', 'Minimizing cost to find optimal parameters', 'Data preprocessing'], correct: 1 },
          { id: 'q4', question: 'In neural networks, the activation function:', options: ['Stores weights', 'Introduces non-linearity', 'Loads data'], correct: 1 },
          { id: 'q5', question: 'What is overfitting?', options: ['Model too simple', 'Good on training, poor on new data', 'Never converges'], correct: 1 }
        ]
      },
      {
        id: 'ml-2',
        order: 2,
        title: 'ML Quiz 2: Deep Learning',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'What is a CNN primarily used for?', options: ['Text only', 'Image and spatial data', 'Tabular data'], correct: 1 },
          { id: 'q2', question: 'Backpropagation computes:', options: ['Input data', 'Gradients of loss w.r.t. weights', 'Final output'], correct: 1 },
          { id: 'q3', question: 'ReLU helps address:', options: ['Overfitting', 'Vanishing gradients', 'Slow training'], correct: 1 },
          { id: 'q4', question: 'A dense layer has:', options: ['No connections', 'Every neuron connects to next layer', 'Only one neuron'], correct: 1 },
          { id: 'q5', question: 'Batch normalization:', options: ['Increases batch size', 'Normalizes layer inputs to stabilize training', 'Removes batches'], correct: 1 }
        ]
      },
      {
        id: 'ml-3',
        order: 3,
        title: 'ML Quiz 3: TensorFlow & Practice',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'A tensor in TensorFlow is:', options: ['A file format', 'A multi-dimensional array', 'A UI component'], correct: 1 },
          { id: 'q2', question: 'Eager execution means:', options: ['Operations run immediately', 'Faster training', 'Lazy loading'], correct: 0 },
          { id: 'q3', question: 'Keras provides:', options: ['Database', 'High-level API for building models', 'Deployment'], correct: 1 },
          { id: 'q4', question: 'model.fit() is used to:', options: ['Save model', 'Train the model on data', 'Load data'], correct: 1 },
          { id: 'q5', question: 'GPU acceleration helps with:', options: ['Smaller models', 'Faster neural network training', 'Visualization'], correct: 1 }
        ]
      }
    ],
    finalTest: {
      id: 'ml-final',
      title: 'Machine Learning Final Assessment',
      isFinal: true,
      questions: [
        { id: 'f1', question: 'Supervised learning requires:', options: ['Unlabeled data', 'Labeled input-output pairs', 'Reinforcement signals'], correct: 1 },
        { id: 'f2', question: 'Gradient descent optimizes by:', options: ['Increasing cost', 'Moving opposite to the gradient', 'Random search'], correct: 1 },
        { id: 'f3', question: 'Overfitting can be reduced by:', options: ['More parameters', 'Regularization and more data', 'Smaller datasets'], correct: 1 },
        { id: 'f4', question: 'CNNs use convolutions to:', options: ['Increase resolution', 'Extract spatial features', 'Reduce parameters only'], correct: 1 },
        { id: 'f5', question: 'The learning rate affects:', options: ['Batch size', 'Step size in parameter updates', 'Number of layers'], correct: 1 },
        { id: 'f6', question: 'Activation functions enable networks to:', options: ['Store more data', 'Learn non-linear patterns', 'Train faster'], correct: 1 },
        { id: 'f7', question: 'Dropout during training:', options: ['Increases overfitting', 'Randomly drops neurons to regularize', 'Speeds up inference'], correct: 1 },
        { id: 'f8', question: 'Transfer learning uses:', options: ['Only random init', 'Pre-trained weights as starting point', 'No gradients'], correct: 1 },
        { id: 'f9', question: 'A validation set is used to:', options: ['Train the model', 'Tune hyperparameters and evaluate', 'Deploy production'], correct: 1 },
        { id: 'f10', question: 'Cross-validation helps assess:', options: ['Single split performance', 'Generalization across data splits', 'Training speed'], correct: 1 }
      ]
    }
  },
  {
    id: 'ds',
    name: 'Data Science',
    description: 'Data analysis, visualization, and Python',
    resourceIds: [4, 12],
    quizzes: [
      {
        id: 'ds-1',
        order: 1,
        title: 'Data Science Quiz 1: Fundamentals',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'Data visualization primarily serves to:', options: ['Hide data', 'Communicate insights and patterns', 'Delete outliers'], correct: 1 },
          { id: 'q2', question: 'Pandas is used for:', options: ['Web frameworks', 'Data manipulation in Python', 'Mobile apps'], correct: 1 },
          { id: 'q3', question: 'EDA stands for:', options: ['External Data Access', 'Exploratory Data Analysis', 'Encrypted Data Archive'], correct: 1 },
          { id: 'q4', question: 'A histogram displays:', options: ['Correlations', 'Distribution of a variable', 'Categories'], correct: 1 },
          { id: 'q5', question: 'Missing data can be handled by:', options: ['Ignoring all', 'Imputation, deletion, or analysis', 'Zeros only'], correct: 1 }
        ]
      },
      {
        id: 'ds-2',
        order: 2,
        title: 'Data Science Quiz 2: Visualization',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'D3.js is used for:', options: ['Backend', 'Data-driven visualizations in browser', 'Databases'], correct: 1 },
          { id: 'q2', question: '"Data-driven" in D3 means:', options: ['Data determines structure and styling', 'Data stored in D3', 'Data encrypted'], correct: 0 },
          { id: 'q3', question: 'SVG in D3 is used for:', options: ['Database', 'Drawing shapes and graphics', 'Servers'], correct: 1 },
          { id: 'q4', question: 'A scale in D3 maps:', options: ['Data to visual properties', 'Colors only', 'File formats'], correct: 0 },
          { id: 'q5', question: 'Enter/update/exit pattern:', options: ['Handles auth', 'Syncs DOM with data', 'Routes'], correct: 1 }
        ]
      },
      {
        id: 'ds-3',
        order: 3,
        title: 'Data Science Quiz 3: Analysis',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'Outliers can affect:', options: ['Nothing', 'Mean and variance', 'Only median'], correct: 1 },
          { id: 'q2', question: 'Correlation measures:', options: ['Causation', 'Linear relationship strength', 'Distribution shape'], correct: 1 },
          { id: 'q3', question: 'Feature scaling helps when:', options: ['Features have different units', 'Data is small', 'No numeric data'], correct: 0 },
          { id: 'q4', question: 'A box plot shows:', options: ['Only mean', 'Distribution, quartiles, outliers', 'Correlations'], correct: 1 },
          { id: 'q5', question: 'Train-test split is for:', options: ['Faster training', 'Evaluating generalization', 'Reducing data'], correct: 1 }
        ]
      }
    ],
    finalTest: {
      id: 'ds-final',
      title: 'Data Science Final Assessment',
      isFinal: true,
      questions: [
        { id: 'f1', question: 'Exploratory Data Analysis aims to:', options: ['Train models', 'Understand data patterns and quality', 'Deploy systems'], correct: 1 },
        { id: 'f2', question: 'Pandas DataFrame is:', options: ['A chart', 'Tabular data structure', 'A database'], correct: 1 },
        { id: 'f3', question: 'Handling missing data incorrectly can:', options: ['Improve accuracy', 'Introduce bias', 'Have no effect'], correct: 1 },
        { id: 'f4', question: 'Data visualization helps:', options: ['Only experts', 'Communicate findings to stakeholders', 'Delete data'], correct: 1 },
        { id: 'f5', question: 'A scatter plot is best for:', options: ['Categories', 'Relationship between two variables', 'Time series only'], correct: 1 },
        { id: 'f6', question: 'Normalization scales data to:', options: ['Remove all values', 'A standard range (e.g. 0-1)', 'Integers only'], correct: 1 },
        { id: 'f7', question: 'D3 scales map:', options: ['Only colors', 'Data domain to visual range', 'Files to servers'], correct: 1 },
        { id: 'f8', question: 'Feature engineering:', options: ['Only uses raw columns', 'Creates meaningful features for models', 'Removes all features'], correct: 1 },
        { id: 'f9', question: 'Cross-validation reduces:', options: ['Overfitting risk in evaluation', 'Data size', 'Model complexity'], correct: 0 },
        { id: 'f10', question: 'A good visualization should:', options: ['Show all raw data', 'Be clear and convey insight', 'Use maximum colors'], correct: 1 }
      ]
    }
  },
  {
    id: 'nlp',
    name: 'Natural Language Processing',
    description: 'NLP and deep learning for text',
    resourceIds: [5],
    quizzes: [
      { id: 'nlp-1', order: 1, title: 'NLP Quiz 1: Basics', isFinal: false, questions: [
        { id: 'q1', question: 'What is a word embedding?', options: ['A font', 'Dense vector representation of words', 'Compression'], correct: 1 },
        { id: 'q2', question: 'Attention mechanism allows:', options: ['Faster only', 'Model to focus on relevant input parts', 'Smaller models'], correct: 1 },
        { id: 'q3', question: 'A transformer uses:', options: ['Only RNN', 'Self-attention for sequences', 'Databases'], correct: 1 },
        { id: 'q4', question: 'Tokenization splits text into:', options: ['Sentences only', 'Words or subwords', 'Paragraphs'], correct: 1 },
        { id: 'q5', question: 'BERT addresses:', options: ['Images', 'Contextual language understanding', 'Audio'], correct: 1 }
      ]},
      { id: 'nlp-2', order: 2, title: 'NLP Quiz 2: Models', isFinal: false, questions: [
        { id: 'q1', question: 'Word2Vec produces:', options: ['Labels', 'Vector embeddings', 'Summaries'], correct: 1 },
        { id: 'q2', question: 'Sequence-to-sequence models:', options: ['Only encode', 'Encode input, decode output', 'Only classify'], correct: 1 },
        { id: 'q3', question: 'Self-attention computes:', options: ['Only similarity', 'Weighted combinations of all positions', 'Fixed weights'], correct: 1 },
        { id: 'q4', question: 'Pre-training in NLP:', options: ['Uses labeled data only', 'Learns general representations on large text', 'Ignores context'], correct: 1 },
        { id: 'q5', question: 'Fine-tuning adapts a model:', options: ['To random task', 'To specific downstream task', 'To larger size'], correct: 1 }
      ]},
      { id: 'nlp-3', order: 3, title: 'NLP Quiz 3: Applications', isFinal: false, questions: [
        { id: 'q1', question: 'Named Entity Recognition extracts:', options: ['Only verbs', 'Entities like people, orgs', 'Stop words'], correct: 1 },
        { id: 'q2', question: 'Sentiment analysis predicts:', options: ['Syntax', 'Emotion or polarity', 'Grammar'], correct: 1 },
        { id: 'q3', question: 'BLEU score measures:', options: ['Speed', 'Translation quality', 'Model size'], correct: 1 },
        { id: 'q4', question: 'Text classification can use:', options: ['Only rules', 'Embeddings + classifier', 'No ML'], correct: 1 },
        { id: 'q5', question: 'Contextual embeddings differ from static by:', options: ['Size only', 'Varying by context', 'Being faster'], correct: 1 }
      ]}
    ],
    finalTest: { id: 'nlp-final', title: 'NLP Final Assessment', isFinal: true, questions: [
      { id: 'f1', question: 'Word embeddings capture:', options: ['Only syntax', 'Semantic relationships', 'Formatting'], correct: 1 },
      { id: 'f2', question: 'Transformers replaced RNNs because:', options: ['Smaller', 'Better at long-range dependencies', 'Simpler'], correct: 1 },
      { id: 'f3', question: 'Tokenization affects:', options: ['Nothing', 'Vocabulary and subword units', 'Only speed'], correct: 1 },
      { id: 'f4', question: 'Masked language modeling:', options: ['Predicts next word only', 'Predicts masked tokens from context', 'Uses images'], correct: 1 },
      { id: 'f5', question: 'Attention weights indicate:', options: ['Only position', 'Importance of each input part', 'Output length'], correct: 1 },
      { id: 'f6', question: 'Transfer learning in NLP:', options: ['Never works', 'Uses pre-trained LMs for downstream tasks', 'Only for English'], correct: 1 },
      { id: 'f7', question: 'Sequence length affects:', options: ['Only speed', 'Context window and compute', 'Accuracy only'], correct: 1 },
      { id: 'f8', question: 'BPE (Byte Pair Encoding):', options: ['Splits by bytes only', 'Learns subword units', 'Is character-level only'], correct: 1 },
      { id: 'f9', question: 'NLP pipelines typically include:', options: ['Only model', 'Tokenization, model, post-processing', 'No preprocessing'], correct: 1 },
      { id: 'f10', question: 'Evaluation metrics for NLP vary by:', options: ['Model size', 'Task (classification, generation, etc.)', 'Language only'], correct: 1 }
    ]}
  },
  {
    id: 'cyber',
    name: 'Cybersecurity',
    description: 'Security fundamentals and ethical hacking',
    resourceIds: [7],
    quizzes: [
      { id: 'cyber-1', order: 1, title: 'Cybersecurity Quiz 1', isFinal: false, questions: [
        { id: 'q1', question: 'Encryption protects data by:', options: ['Speeding transfer', 'Converting to unreadable form', 'Deleting'], correct: 1 },
        { id: 'q2', question: 'A firewall:', options: ['Is physical', 'Monitors and controls network traffic', 'Backs up only'], correct: 1 },
        { id: 'q3', question: 'Phishing is:', options: ['Encryption', 'Social engineering to steal credentials', 'Hardware'], correct: 1 },
        { id: 'q4', question: 'Authentication verifies:', options: ['Data integrity', 'Identity', 'Speed'], correct: 1 },
        { id: 'q5', question: 'Ethical hacking is:', options: ['Illegal', 'Authorized security testing', 'Creating malware'], correct: 1 }
      ]},
      { id: 'cyber-2', order: 2, title: 'Cybersecurity Quiz 2', isFinal: false, questions: [
        { id: 'q1', question: 'Symmetric encryption uses:', options: ['Different keys', 'Same key for encrypt/decrypt', 'No keys'], correct: 1 },
        { id: 'q2', question: 'Multi-factor authentication adds:', options: ['Nothing', 'Extra verification steps', 'Only password'], correct: 1 },
        { id: 'q3', question: 'A vulnerability is:', options: ['A feature', 'A weakness that can be exploited', 'A patch'], correct: 1 },
        { id: 'q4', question: 'Penetration testing:', options: ['Only simulates', 'Tests defenses by simulating attacks', 'Replaces security'], correct: 1 },
        { id: 'q5', question: 'Zero-day exploits target:', options: ['Old bugs', 'Unknown/unpatched vulnerabilities', 'Hardware'], correct: 1 }
      ]},
      { id: 'cyber-3', order: 3, title: 'Cybersecurity Quiz 3', isFinal: false, questions: [
        { id: 'q1', question: 'Hashing is:', options: ['Reversible', 'One-way transformation', 'Encryption'], correct: 1 },
        { id: 'q2', question: 'SSL/TLS provides:', options: ['Faster speed', 'Encrypted communication', 'Compression'], correct: 1 },
        { id: 'q3', question: 'Social engineering exploits:', options: ['Hardware', 'Human psychology', 'Networks only'], correct: 1 },
        { id: 'q4', question: 'Least privilege means:', options: ['Admin for all', 'Minimum access needed', 'No access'], correct: 1 },
        { id: 'q5', question: 'Incident response includes:', options: ['Ignoring', 'Detection, containment, recovery', 'Deleting logs'], correct: 1 }
      ]}
    ],
    finalTest: { id: 'cyber-final', title: 'Cybersecurity Final Assessment', isFinal: true, questions: [
      { id: 'f1', question: 'Confidentiality ensures:', options: ['Speed', 'Only authorized access to data', 'Backups'], correct: 1 },
      { id: 'f2', question: 'Integrity in security means:', options: ['Data is correct/unchanged', 'Fast access', 'Large storage'], correct: 0 },
      { id: 'f3', question: 'Asymmetric encryption uses:', options: ['One key', 'Public and private key pair', 'No keys'], correct: 1 },
      { id: 'f4', question: 'IDS/IPS detects:', options: ['Only performance', 'Intrusions and threats', 'User behavior only'], correct: 1 },
      { id: 'f5', question: 'Patch management is critical because:', options: ['It\'s optional', 'Unpatched systems are vulnerable', 'Only for new systems'], correct: 1 },
      { id: 'f6', question: 'Defense in depth means:', options: ['One layer', 'Multiple security layers', 'No layers'], correct: 1 },
      { id: 'f7', question: 'A man-in-the-middle attack:', options: ['Only reads', 'Intercepts/alters communication', 'Only encrypts'], correct: 1 },
      { id: 'f8', question: 'Security awareness training helps:', options: ['Only IT', 'All users recognize threats', 'Hardware only'], correct: 1 },
      { id: 'f9', question: 'Backups protect against:', options: ['Nothing', 'Data loss and ransomware', 'Speed issues'], correct: 1 },
      { id: 'f10', question: 'Compliance in security refers to:', options: ['Ignoring rules', 'Meeting regulatory requirements', 'Only audits'], correct: 1 }
    ]}
  },
  { id: 'cv', name: 'Computer Vision', description: 'Image processing and vision', resourceIds: [6], quizzes: [
    { id: 'cv-1', order: 1, title: 'CV Quiz 1', isFinal: false, questions: [
      { id: 'q1', question: 'Convolution extracts:', options: ['Colors only', 'Features like edges', 'Noise'], correct: 1 },
      { id: 'q2', question: 'Pooling reduces:', options: ['Parameters only', 'Spatial dimensions', 'Accuracy'], correct: 1 },
      { id: 'q3', question: 'Object detection:', options: ['Classifies whole image', 'Locates objects in image', 'Removes objects'], correct: 1 },
      { id: 'q4', question: 'Image segmentation:', options: ['Compresses', 'Labels each pixel', 'Rotates'], correct: 1 },
      { id: 'q5', question: 'CNNs are used for:', options: ['Text only', 'Image data', 'Audio only'], correct: 1 }
    ]},
    { id: 'cv-2', order: 2, title: 'CV Quiz 2', isFinal: false, questions: [
      { id: 'q1', question: 'Feature maps in CNN:', options: ['Store raw pixels', 'Contain learned features', 'Are 1D only'], correct: 1 },
      { id: 'q2', question: 'Transfer learning in CV:', options: ['Never works', 'Uses pre-trained image models', 'Only for video'], correct: 1 },
      { id: 'q3', question: 'Data augmentation:', options: ['Deletes data', 'Creates variations for training', 'Reduces dataset'], correct: 1 },
      { id: 'q4', question: 'Edge detection finds:', options: ['Colors', 'Boundaries between regions', 'Shapes only'], correct: 1 },
      { id: 'q5', question: 'YOLO is used for:', options: ['Classification only', 'Real-time object detection', 'Segmentation only'], correct: 1 }
    ]},
    { id: 'cv-3', order: 3, title: 'CV Quiz 3', isFinal: false, questions: [
      { id: 'q1', question: 'Receptive field:', options: ['Input size', 'Region affecting a neuron', 'Output size'], correct: 1 },
      { id: 'q2', question: 'Stride in convolution:', options: ['Learning rate', 'Step size of filter', 'Batch size'], correct: 1 },
      { id: 'q3', question: 'Semantic segmentation:', options: ['Classifies pixels by category', 'Only detects boxes', 'Compresses'], correct: 0 },
      { id: 'q4', question: 'Pre-training on ImageNet:', options: ['Only for NLP', 'Provides visual features', 'Is obsolete'], correct: 1 },
      { id: 'q5', question: 'Batch norm in CNN:', options: ['Increases batch size', 'Stabilizes training', 'Removes layers'], correct: 1 }
    ]}
    ],
    finalTest: { id: 'cv-final', title: 'Computer Vision Final', isFinal: true, questions: [
      { id: 'f1', question: 'CNN convolutions learn:', options: ['Fixed filters', 'Hierarchical features from data', 'Only edges'], correct: 1 },
      { id: 'f2', question: 'Max pooling:', options: ['Averages', 'Takes maximum in region', 'Sums values'], correct: 1 },
      { id: 'f3', question: 'Object detection outputs:', options: ['Single label', 'Boxes and classes', 'Segmentation mask'], correct: 1 },
      { id: 'f4', question: 'Anchor boxes help with:', options: ['Training speed', 'Multiple objects per cell', 'Smaller models'], correct: 1 },
      { id: 'f5', question: 'R-CNN family:', options: ['Only real-time', 'Region-based detection', 'Segmentation only'], correct: 1 },
      { id: 'f6', question: 'mAP measures:', options: ['Speed', 'Detection accuracy', 'Model size'], correct: 1 },
      { id: 'f7', question: 'Data augmentation in CV:', options: ['Reduces data', 'Increases effective dataset size', 'Slows training'], correct: 1 },
      { id: 'f8', question: 'Grayscale in edge detection:', options: ['Slows processing', 'Simplifies gradient computation', 'Adds color'], correct: 1 },
      { id: 'f9', question: 'Instance segmentation:', options: ['One mask per image', 'Separate mask per object', 'Boxes only'], correct: 1 },
      { id: 'f10', question: 'Feature pyramid networks:', options: ['Single scale only', 'Multi-scale feature extraction', 'Reduce resolution'], correct: 1 }
    ]}
  },
  { id: 'web', name: 'Web Development', description: 'Full stack and frontend', resourceIds: [8], quizzes: [
    { id: 'web-1', order: 1, title: 'Web Quiz 1', isFinal: false, questions: [
      { id: 'q1', question: 'Frontend refers to:', options: ['Database', 'User-facing UI', 'Server'], correct: 1 },
      { id: 'q2', question: 'Backend handles:', options: ['Only styling', 'Logic, DB, APIs', 'HTML only'], correct: 1 },
      { id: 'q3', question: 'An API is:', options: ['Language', 'Interface for apps to communicate', 'Database'], correct: 1 },
      { id: 'q4', question: 'REST stands for:', options: ['Rapid Service', 'Representational State Transfer', 'Remote Storage'], correct: 1 },
      { id: 'q5', question: 'Responsive design:', options: ['Faster servers', 'Adapts to screen sizes', 'Database scaling'], correct: 1 }
    ]},
    { id: 'web-2', order: 2, title: 'Web Quiz 2', isFinal: false, questions: [
      { id: 'q1', question: 'HTTP methods include:', options: ['Only GET', 'GET, POST, PUT, DELETE', 'Only POST'], correct: 1 },
      { id: 'q2', question: 'CRUD operations:', options: ['Create Read Update Delete', 'Compress Render Upload', 'Copy Remove'], correct: 0 },
      { id: 'q3', question: 'A database index:', options: ['Slows queries', 'Speeds up lookups', 'Adds storage only'], correct: 1 },
      { id: 'q4', question: 'Authentication vs Authorization:', options: ['Same thing', 'Who you are vs what you can do', 'Only auth'], correct: 1 },
      { id: 'q5', question: 'CORS enables:', options: ['Same-origin only', 'Cross-origin requests', 'Localhost only'], correct: 1 }
    ]},
    { id: 'web-3', order: 3, title: 'Web Quiz 3', isFinal: false, questions: [
      { id: 'q1', question: 'State management:', options: ['Only server', 'Tracks app data across components', 'CSS only'], correct: 1 },
      { id: 'q2', question: 'SPA means:', options: ['Single Page Application', 'Static Page Auth', 'Server Page App'], correct: 0 },
      { id: 'q3', question: 'WebSockets provide:', options: ['One-way only', 'Real-time bidirectional communication', 'Static content'], correct: 1 },
      { id: 'q4', question: 'SSL/TLS in web:', options: ['Optional', 'Encrypts HTTPS traffic', 'Only for APIs'], correct: 1 },
      { id: 'q5', question: 'CDN improves:', options: ['Code quality', 'Asset delivery speed', 'Database size'], correct: 1 }
    ]}
    ],
    finalTest: { id: 'web-final', title: 'Web Development Final', isFinal: true, questions: [
      { id: 'f1', question: 'Full stack includes:', options: ['Only frontend', 'Frontend and backend', 'Database only'], correct: 1 },
      { id: 'f2', question: 'REST API uses:', options: ['Only GET', 'HTTP methods for CRUD', 'Binary protocol'], correct: 1 },
      { id: 'f3', question: 'JWT is used for:', options: ['Rendering', 'Stateless authentication', 'Database queries'], correct: 1 },
      { id: 'f4', question: 'Responsive breakpoints:', options: ['Ignore screens', 'Define layout changes at widths', 'Only mobile'], correct: 1 },
      { id: 'f5', question: 'API versioning helps:', options: ['Nothing', 'Maintain backward compatibility', 'Delete old code'], correct: 1 },
      { id: 'f6', question: 'Caching reduces:', options: ['Security', 'Redundant computation/requests', 'Code size'], correct: 1 },
      { id: 'f7', question: 'Load balancing:', options: ['Increases single point failure', 'Distributes traffic across servers', 'Only for DB'], correct: 1 },
      { id: 'f8', question: 'SEO for SPAs:', options: ['Not relevant', 'Requires SSR or prerendering', 'Automatic'], correct: 1 },
      { id: 'f9', question: 'API rate limiting:', options: ['Slows everything', 'Prevents abuse and ensures fair use', 'Only for paid APIs'], correct: 1 },
      { id: 'f10', question: 'CI/CD in web:', options: ['Manual only', 'Automates build and deployment', 'Only testing'], correct: 1 }
    ]}
  },
  {
    id: 'law',
    name: 'Law',
    description: 'Contract law, constitutional law, legal writing, and fundamentals',
    resourceIds: [34, 35, 36, 37],
    quizzes: [
      {
        id: 'law-1',
        order: 1,
        title: 'Law Quiz 1: Legal Fundamentals',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'What are the primary sources of law in most common law jurisdictions?', options: ['Only statutes', 'Legislation, case law, and custom', 'International treaties only'], correct: 1 },
          { id: 'q2', question: 'What is the difference between civil and criminal law?', options: ['No difference', 'Civil deals with disputes between parties; criminal with offences against the state', 'Criminal is only for corporations'], correct: 1 },
          { id: 'q3', question: 'What does "stare decisis" mean?', options: ['Overrule precedent', 'Stand by decided cases; follow precedent', 'Ignore past rulings'], correct: 1 },
          { id: 'q4', question: 'Who typically bears the burden of proof in a criminal case?', options: ['The defendant', 'The prosecution', 'The judge'], correct: 1 },
          { id: 'q5', question: 'What is "jurisdiction"?', options: ['A type of contract', 'The authority of a court to hear and decide a case', 'A legal document'], correct: 1 }
        ]
      },
      {
        id: 'law-2',
        order: 2,
        title: 'Law Quiz 2: Contract & Constitutional Law',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'What are the essential elements of a valid contract?', options: ['Only written agreement', 'Offer, acceptance, consideration, intention to create legal relations', 'Signature only'], correct: 1 },
          { id: 'q2', question: 'What is "breach of contract"?', options: ['Renewing a contract', 'Failure to perform a contractual obligation', 'Signing a contract'], correct: 1 },
          { id: 'q3', question: 'Constitutional law primarily concerns:', options: ['Private disputes only', 'The structure of government and fundamental rights', 'Commercial transactions'], correct: 1 },
          { id: 'q4', question: 'What is judicial review?', options: ['Review of lower court judges', 'Power of courts to examine whether laws or actions comply with the constitution', 'Criminal appeal only'], correct: 1 },
          { id: 'q5', question: 'Remedies for breach of contract can include:', options: ['Only imprisonment', 'Damages, specific performance, or rescission', 'Only fines'], correct: 1 }
        ]
      },
      {
        id: 'law-3',
        order: 3,
        title: 'Law Quiz 3: Legal Writing & International Law',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'Legal writing should be:', options: ['Vague and lengthy', 'Clear, precise, and well-structured', 'Informal'], correct: 1 },
          { id: 'q2', question: 'What is citation in legal writing?', options: ['A summons to court', 'Referencing primary and secondary sources', 'Closing argument'], correct: 1 },
          { id: 'q3', question: 'International law governs:', options: ['Only domestic disputes', 'Relations between states and international organisations', 'Only trade'], correct: 1 },
          { id: 'q4', question: 'Human rights law typically protects:', options: ['Only property rights', 'Civil, political, economic, and social rights', 'Only states'], correct: 1 },
          { id: 'q5', question: 'Criminal law "actus reus" refers to:', options: ['The mental element', 'The guilty act or conduct', 'The defence'], correct: 1 }
        ]
      }
    ],
    finalTest: {
      id: 'law-final',
      title: 'Law Final Assessment',
      isFinal: true,
      questions: [
        { id: 'f1', question: 'Common law is characterised by:', options: ['No precedent', 'Judge-made law and precedent', 'Only legislation'], correct: 1 },
        { id: 'f2', question: 'Consideration in contract must:', options: ['Be excessive', 'Have some value and move from the promisee', 'Be in writing only'], correct: 1 },
        { id: 'f3', question: 'A constitution typically:', options: ['Only sets tax rates', 'Establishes government structure and fundamental rights', 'Replaces all other law'], correct: 1 },
        { id: 'f4', question: 'Damages in contract aim to:', options: ['Punish the defendant', 'Compensate the injured party', 'Reward the court'], correct: 1 },
        { id: 'f5', question: 'Mens rea in criminal law refers to:', options: ['The act only', 'The guilty mind or intention', 'The victim'], correct: 1 },
        { id: 'f6', question: 'Legal research involves:', options: ['Only reading one case', 'Finding and analysing primary and secondary sources', 'Ignoring precedent'], correct: 1 },
        { id: 'f7', question: 'International treaties:', options: ['Bind only non-signatories', 'Create obligations for states that ratify them', 'Have no legal effect'], correct: 1 },
        { id: 'f8', question: 'Specific performance is:', options: ['A type of damages', 'An order to perform the contract', 'A criminal sentence'], correct: 1 },
        { id: 'f9', question: 'Human rights instruments include:', options: ['Only national laws', 'Universal Declaration, regional conventions, and domestic bills of rights', 'Only trade agreements'], correct: 1 },
        { id: 'f10', question: 'Precedent is important because:', options: ['It is optional', 'It promotes consistency and predictability in the law', 'It applies only to criminal law'], correct: 1 }
      ]
    }
  },
  {
    id: 'business',
    name: 'Business & Management',
    description: 'Accounting, economics, marketing, HR, and management fundamentals',
    resourceIds: [42, 43, 44, 45, 46],
    quizzes: [
      {
        id: 'business-1',
        order: 1,
        title: 'Business Quiz 1: Management & Organisation',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'What are the four main functions of management?', options: ['Only planning', 'Planning, organising, leading, controlling', 'Only controlling'], correct: 1 },
          { id: 'q2', question: 'SWOT analysis stands for:', options: ['Single Way Of Thinking', 'Strengths, Weaknesses, Opportunities, Threats', 'Sales Without Output'], correct: 1 },
          { id: 'q3', question: 'A mission statement typically describes:', options: ['Only profit targets', "The organisation's purpose and what it does", 'Only the product'], correct: 1 },
          { id: 'q4', question: 'What is organisational structure?', options: ['Only the building', 'How tasks, roles, and reporting lines are arranged', 'Only HR policy'], correct: 1 },
          { id: 'q5', question: 'Leadership differs from management in that leadership often emphasises:', options: ['Only budgets', 'Vision, change, and inspiring people', 'Only scheduling'], correct: 1 }
        ]
      },
      {
        id: 'business-2',
        order: 2,
        title: 'Business Quiz 2: Accounting & Economics',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'The balance sheet shows:', options: ['Only income', 'Assets, liabilities, and equity at a point in time', 'Only cash flow'], correct: 1 },
          { id: 'q2', question: 'What is the accounting equation?', options: ['Profit = Revenue - Cost', 'Assets = Liabilities + Equity', 'Sales = Price × Quantity'], correct: 1 },
          { id: 'q3', question: 'Microeconomics studies:', options: ['Only national GDP', 'Individual consumers, firms, and markets', 'Only international trade'], correct: 1 },
          { id: 'q4', question: 'Supply and demand determine:', options: ['Only quantity', 'Equilibrium price and quantity in a market', 'Only quality'], correct: 1 },
          { id: 'q5', question: 'Revenue minus cost of goods sold equals:', options: ['Net profit', 'Gross profit', 'Total assets'], correct: 1 }
        ]
      },
      {
        id: 'business-3',
        order: 3,
        title: 'Business Quiz 3: Marketing, HR & Ethics',
        isFinal: false,
        questions: [
          { id: 'q1', question: 'The marketing mix (4 Ps) includes:', options: ['Only product', 'Product, Price, Place, Promotion', 'Only promotion'], correct: 1 },
          { id: 'q2', question: 'HRM (Human Resource Management) is responsible for:', options: ['Only payroll', 'Recruitment, training, performance, and compensation', 'Only legal compliance'], correct: 1 },
          { id: 'q3', question: 'Market segmentation means:', options: ['Selling one product to everyone', 'Dividing the market into distinct groups with similar needs', 'Ignoring customers'], correct: 1 },
          { id: 'q4', question: 'Business ethics refers to:', options: ['Only profit', 'Moral principles and standards in business conduct', 'Only law'], correct: 1 },
          { id: 'q5', question: 'Stakeholders in a business can include:', options: ['Only shareholders', 'Shareholders, employees, customers, community, suppliers', 'Only managers'], correct: 1 }
        ]
      }
    ],
    finalTest: {
      id: 'business-final',
      title: 'Business & Management Final Assessment',
      isFinal: true,
      questions: [
        { id: 'f1', question: 'Strategic planning involves:', options: ['Only daily tasks', 'Setting long-term goals and deciding how to achieve them', 'Only budgeting'], correct: 1 },
        { id: 'f2', question: 'Cash flow statement shows:', options: ['Only profit', 'Cash inflows and outflows over a period', 'Only assets'], correct: 1 },
        { id: 'f3', question: 'Macroeconomics deals with:', options: ['Only one firm', 'Economy-wide issues: GDP, inflation, unemployment', 'Only prices'], correct: 1 },
        { id: 'f4', question: 'Competitive advantage can come from:', options: ['Only luck', 'Cost, differentiation, or focus', 'Only size'], correct: 1 },
        { id: 'f5', question: 'Performance appraisal is used to:', options: ['Only punish', 'Evaluate and develop employee performance', 'Only set pay'], correct: 1 },
        { id: 'f6', question: 'The product life cycle stages include:', options: ['Only launch', 'Introduction, growth, maturity, decline', 'Only growth'], correct: 1 },
        { id: 'f7', question: 'Corporate social responsibility (CSR) refers to:', options: ['Only profit', 'Business accountability to society and environment', 'Only shareholders'], correct: 1 },
        { id: 'f8', question: 'Break-even point is when:', options: ['Profit is maximum', 'Total revenue equals total costs', 'Sales are zero'], correct: 1 },
        { id: 'f9', question: 'Motivation theories (e.g. Maslow) help managers:', options: ['Ignore employees', 'Understand and improve employee motivation', 'Only set targets'], correct: 1 },
        { id: 'f10', question: 'A business plan typically includes:', options: ['Only financials', 'Executive summary, market analysis, strategy, and financial projections', 'Only mission'], correct: 1 }
      ]
    }
  }
]

// Map resource category to field for resources not in resourceIds
export const categoryToField = { ai: 'ai', ml: 'ml', ds: 'ds', nlp: 'nlp', cv: 'cv', cyber: 'cyber', web: 'web', dl: 'ml', mobile: 'web', law: 'law', business: 'business' }

// Map resourceId -> field object for quick lookup
export const resourceToField = {}
learningFields.forEach((field) => {
  field.resourceIds.forEach((rid) => {
    resourceToField[rid] = field
  })
})

// Legacy: single quiz per resource (first quiz of field) for old routes
export const resourceQuizzes = {}
learningFields.forEach((field) => {
  field.resourceIds.forEach((rid) => {
    resourceQuizzes[rid] = {
      resourceId: rid,
      title: field.quizzes[0]?.title || field.name,
      questions: field.quizzes[0]?.questions || [],
      fieldId: field.id
    }
  })
})

// Helper: get quiz or final by id
export const getQuizById = (fieldId, quizId) => {
  const field = learningFields.find((f) => f.id === fieldId)
  if (!field) return null
  if (quizId === 'final') return field.finalTest
  const quiz = field.quizzes.find((q) => q.id === quizId)
  return quiz || null
}

// All quizzes + finals for a field
export const getFieldQuizzes = (fieldId) => {
  const field = learningFields.find((f) => f.id === fieldId)
  if (!field) return []
  return [...field.quizzes, field.finalTest]
}
