// Search vocabulary for the Mission Health app.
// Each category lists the words, symptoms and abbreviations that should bring it up.
// Natasha can extend these later from the Admin tab; keep entries lowercase.

export const CATEGORIES = {
  'Walk-in clinic': {
    icon: 'stethoscope',
    terms: ['walk-in', 'walk in', 'walkin', 'medicentre', 'medicenter', 'medi centre', 'clinic', 'doctor', 'dr', 'gp',
      'family doctor', 'physician', 'urgent care', 'uc', 'pcp', 'appointment', 'refill', 'prescription renewal'],
    symptoms: ['fever', 'cough', 'cold', 'flu', 'sick', 'rash', 'infection', 'ear infection', 'earache', 'sinus',
      'stomach', 'vomiting', 'diarrhea', 'headache', 'migraine', 'allergy', 'cut', 'stitches', 'pink eye']
  },
  'Medical advice': {
    icon: 'phone-medical',
    terms: ['advice', 'consult', 'mha doctor', 'orth', 'mental health', 'anxiety', 'depression', 'medication review',
      'meds renewal', 'renewal'],
    symptoms: []
  },
  'Physiotherapy': {
    icon: 'activity',
    terms: ['physio', 'physiotherapy', 'physiotherapist', 'physical therapy', 'pt', 'rehab', 'pelvic'],
    symptoms: ['back pain', 'sore back', 'knee', 'shoulder', 'sprain', 'strain', 'sports injury', 'neck pain', 'hip']
  },
  'Chiropractic': {
    icon: 'spine',
    terms: ['chiro', 'chiropractor', 'chiropractic', 'adjustment', 'acupuncture'],
    symptoms: ['back pain', 'sore back', 'lower back', 'neck pain', 'posture']
  },
  'Dental': {
    icon: 'tooth',
    terms: ['dentist', 'dental', 'teeth', 'tooth', 'orthodontist', 'ortho', 'retainer', 'wisdom teeth', 'ada'],
    symptoms: ['toothache', 'broken tooth', 'chipped tooth', 'cavity', 'filling', 'broken retainer', 'loose retainer',
      'gum', 'jaw pain', 'abscess']
  },
  'Eye care': {
    icon: 'eye',
    terms: ['eye', 'eyes', 'optometrist', 'optometry', 'optical', 'glasses', 'contacts', 'eye exam', 'vision'],
    symptoms: ['broken glasses', 'blurry vision', 'lost contacts']
  },
  'Pharmacy': {
    icon: 'pill',
    terms: ['pharmacy', 'pharmacist', 'drugstore', 'drug store', 'shoppers', 'rexall', 'walmart', 'pharmasave',
      'prescription', 'rx', 'meds', 'medication', 'otc', 'over the counter', 'prescribing pharmacist', 'flu shot'],
    symptoms: ['strep', 'strep throat', 'sore throat', 'uti', 'bladder infection', 'urinary']
  },
  'Lab': {
    icon: 'flask',
    terms: ['lab', 'labs', 'blood test', 'bloodwork', 'blood work', 'urine test', 'apl', 'alberta precision',
      'requisition', 'req', '33804'],
    symptoms: []
  },
  'Diagnostic imaging': {
    icon: 'scan',
    terms: ['x-ray', 'xray', 'x ray', 'ultrasound', 'u/s', 'us', 'ct', 'ct scan', 'mri', 'imaging', 'radiology',
      'mic', 'insight', 'canadian diagnostic'],
    symptoms: ['possible fracture', 'broken bone']
  },
  'Podiatry': {
    icon: 'foot',
    terms: ['podiatrist', 'podiatry', 'foot doctor', 'foot', 'feet', 'toe'],
    symptoms: ['ingrown toenail', 'ingrown toe nail', 'infected toe', 'ankle', 'blister', 'plantar']
  },
  'Medical supplies': {
    icon: 'crutch',
    terms: ['brace', 'ankle brace', 'air boot', 'boot', 'surgical shoe', 'crutches', 'supplies'],
    symptoms: []
  },
  'Hearing': {
    icon: 'ear',
    terms: ['hearing', 'hearing test', 'audiologist', 'ears'],
    symptoms: ['can\'t hear', 'hearing loss', 'ringing']
  },
  'Hospital / ER': {
    icon: 'hospital',
    terms: ['hospital', 'er', 'emergency', 'emergency room', 'ed', 'urgent', 'after hours'],
    symptoms: ['chest pain', 'broken bone', 'head injury', 'sudden hearing loss']
  },
  'Counselling': {
    icon: 'heart',
    terms: ['counselling', 'counseling', 'counsellor', 'therapist', 'family services', 'fsc', 'amha', 'mental health'],
    symptoms: ['anxiety', 'depression', 'stress', 'homesick']
  },
};

// Words that should open a guidance card rather than (or as well as) a provider list.
export const GUIDANCE_TERMS = {
  '911': 'General', 'ambulance': 'General', 'emergency': 'ER', 'er': 'ER', 'ed': 'ER', 'hospital': 'ER',
  'receipt': 'General', 'reimburse': 'What Cowan covers', 'reimbursement': 'What Cowan covers', 'cash': 'General',
  'covered': 'What Cowan covers', 'coverage': 'What Cowan covers', 'not covered': 'What Cowan covers', 'pay first': 'What Cowan covers',
  'claim': 'What Cowan covers', 'otc': 'What Cowan covers', 'over the counter': 'What Cowan covers', 'pre approval': 'What Cowan covers',
  'intake form': 'General', 'forms': 'General', 'address': 'General', 'us prescription': 'General',
  'ama': 'Physiotherapy', 'visit limit': 'Chiropractic', '10 visits': 'Chiropractic', '5 visits': 'Physiotherapy',
  'cowan': 'General', 'code': 'Lab', 'billing code': 'Lab',
};

// Town names and common spellings, so "grand prairie" or "fort sask" still match.
export const TOWN_ALIASES = {
  'grand prairie': 'Grande Prairie', 'gp': 'Grande Prairie', 'fort sask': 'Fort Saskatchewan',
  'sherwood': 'Sherwood Park', 'sp': 'Sherwood Park', 'rmh': 'Rocky Mountain House', 'rocky': 'Rocky Mountain House',
  'st paul': 'St. Paul', 'saint paul': 'St. Paul', 'dawson creek': 'Dawson Creek, BC', 'lloyd': 'Lloydminster',
  'red deer': 'Red Deer', 'rd': 'Red Deer', 'spruce grove': 'Spruce Grove', 'sg': 'Spruce Grove', 'yeg': 'Edmonton',
};

export const PAYMENT_LABELS = {
  direct_bill: 'Direct bills Cowan',
  accepts_cowan: 'Accepts Cowan card',
  pay_reimburse: 'Pay, then reimburse',
  free_courtesy: 'Free / courtesy',
  unknown: 'Unknown – call',
};
