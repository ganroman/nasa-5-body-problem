const passport = await (await fetch('../../data/passport.json')).json();
const row = (c) => `<li data-illustrative>${c.name}: ${c.mass_share * 100} % of the mass</li>`;
document.querySelector('#components').innerHTML = passport.components.map(row).join('');
