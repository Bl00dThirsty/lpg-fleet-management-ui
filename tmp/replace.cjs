const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /suivi-tournees/g, replacement: 'trip-tracking' },
  { regex: /tournee-data/g, replacement: 'trip-data' },
  { regex: /tournee-list/g, replacement: 'trip-list' },
  { regex: /tournee-details/g, replacement: 'trip-details' },
  { regex: /tournee-route-map/g, replacement: 'trip-route-map' },
  { regex: /suivi-tournees-layout/g, replacement: 'trip-tracking-layout' },
  { regex: /TourneeStatus/g, replacement: 'TripStatus' },
  { regex: /TourneeLocation/g, replacement: 'TripLocation' },
  { regex: /TourneeDetailsProps/g, replacement: 'TripDetailsProps' },
  { regex: /TourneeRouteMapProps/g, replacement: 'TripRouteMapProps' },
  { regex: /TourneeListProps/g, replacement: 'TripListProps' },
  { regex: /TourneeDetails/g, replacement: 'TripDetails' },
  { regex: /TourneeRouteMap/g, replacement: 'TripRouteMap' },
  { regex: /TourneeList/g, replacement: 'TripList' },
  { regex: /Tournees/g, replacement: 'Trips' },
  { regex: /tournees/g, replacement: 'trips' },
  { regex: /Tournee/g, replacement: 'Trip' },
  { regex: /tournee/g, replacement: 'trip' },
  { regex: /Transporteurs/g, replacement: 'Transporters' },
  { regex: /transporteurs/g, replacement: 'transporters' },
  { regex: /Transporteur/g, replacement: 'Transporter' },
  { regex: /transporteur/g, replacement: 'transporter' },
  { regex: /activite/g, replacement: 'activity' },
  { regex: /SuiviTourneesLayout/g, replacement: 'TripTrackingLayout' }
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;

      for (const { regex, replacement } of replacements) {
        newContent = newContent.replace(regex, replacement);
      }

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, '../src/routes/_authenticated/activity'));
processDirectory(path.join(__dirname, '../src/routes/_authenticated/transporters'));
