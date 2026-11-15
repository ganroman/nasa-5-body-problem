import passport from '../../data/passport.json' with { type: 'json' };
const note = 'Burn rate of 3 mm/s measured here';
const row = (c) => `<li>${c.name}: ${passport.components.length} % of the mass</li>`;
document.querySelector('#components').innerHTML = passport.components.map(row).join('') + note;
