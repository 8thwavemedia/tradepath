// Master certification list — used by ProfileSetup and JobRankings
export const CERT_CATEGORIES = {
  Safety: [
    'OSHA-10', 'OSHA-30', 'OSHA-10 Construction', 'OSHA-30 Construction',
    'First Aid/CPR', 'Hazwoper 40-Hour', 'Hazwoper 8-Hour Refresher',
    'Confined Space Entry', 'Confined Space Rescue', 'Lockout/Tagout',
    'Fall Protection', 'Rigging and Signaling', 'Scaffolding',
    'Aerial Lift/Man Lift', 'Forklift', 'Crane Operator'
  ],
  Access: [
    'TWIC Card', 'Nuclear Background Check', 'TSA Background Check',
    'DISA Pre-Enrollment', 'DOT Drug Testing', 'DISA Drug Testing'
  ],
  Trade: [
    'Welding TIG', 'Welding MIG', 'Welding Stick/SMAW', 'Welding 6G',
    'Pipefitter Journeyman Card', 'Plumber License', 'Gas Distribution',
    'Medical Gas', 'Steamfitter Certification', 'Backflow Prevention',
    'Hydrostatic Testing'
  ],
  Equipment: [
    'Telehandler', 'Rough Terrain Forklift', 'Overhead Crane',
    'Mobile Crane', 'Boom Truck', 'Pneumatic Tools',
    'Hydro Blasting', 'Vacuum Truck'
  ],
  'PM and Tech': [
    'Procore Certified', 'PMP', 'CCM', 'BIM 360',
    'Autodesk ACC', 'MS Project', 'Primavera P6'
  ],
  Environmental: [
    'Asbestos Awareness', 'Lead Awareness', 'Silica Awareness',
    'Mold Remediation', 'Radiation Worker'
  ]
}

export const ALL_CERTS = Object.values(CERT_CATEGORIES).flat()
