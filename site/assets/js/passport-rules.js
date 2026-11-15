/*
 * Cargo Passport rules. Decides, from the passport data alone, what the passport shows for
 * each component, air and place. No imports, no I/O, no clock, no randomness: the same input
 * always gives the same output. Every threshold lives in the data (passport.tolerances,
 * passport.rules), never here. The statuses are "applies", "differs" and "none"; they point at
 * evidence and gaps and never give a verdict. The module holds no sentence about gravity: the caveat that the
 * test data are from normal gravity is a cited record, named in passport.rules.gravity_caveat_evidence.
 */

const STATUS = Object.freeze({ APPLIES: 'applies', DIFFERS: 'differs', NONE: 'none' });

const list = (value) => (Array.isArray(value) ? value : []);

function unique(ids) {
  return [...new Set(ids)];
}

function findById(items, id, what) {
  const found = list(items).find((item) => item.id === id);
  if (!found) {
    const known = list(items).map((item) => item.id).join(', ');
    throw new Error(`Unknown ${what} "${id}". Known ${what}s: ${known}.`);
  }
  return found;
}

function need(condition, message) {
  if (!condition) throw new Error(message);
}

/* How far a test sits from the air: pressure first, then oxygen. A test with no pressure is never near. */
function distance(test, env) {
  const pressure = typeof test.pressure_kpa === 'number' ? Math.abs(test.pressure_kpa - env.pressure_kpa) : Infinity;
  const oxygen = typeof test.o2_percent === 'number' ? Math.abs(test.o2_percent - env.o2_percent) : Infinity;
  return [pressure, oxygen];
}

function covers(test, env, tolerance, resultTypes) {
  const rule = resultTypes[test.result];
  need(rule !== undefined, `Unknown test result "${test.result}" in evidence "${test.evidence}". Known results: ${Object.keys(resultTypes).join(', ')}.`);
  if (rule === 'never') return false;
  need(rule === 'covers_at_or_below', `Unknown rule "${rule}" for result "${test.result}".`);
  if (typeof test.pressure_kpa !== 'number' || typeof test.o2_percent !== 'number') return false;
  if (Math.abs(test.pressure_kpa - env.pressure_kpa) > tolerance) return false;
  return env.o2_percent <= test.o2_percent;
}

function chooseEnvironment(passport, vehicle, place) {
  const base = findById(passport.environments, vehicle.environment, 'environment');
  if (place.environment) {
    const own = findById(passport.environments, place.environment, 'environment');
    if (own.vehicle === vehicle.id) return own;
  }
  return base;
}

function publicEnv(env) {
  return {
    id: env.id,
    label: env.label,
    kind: env.kind,
    o2_percent: env.o2_percent,
    o2_max_percent: env.o2_max_percent ?? null,
    pressure_kpa: env.pressure_kpa,
    pressure_psia: env.pressure_psia ?? null,
    computed: env.computed ?? null,
    evidence: [...list(env.evidence)],
  };
}

function assessComponent(component, env, place, passport) {
  const tolerance = passport.tolerances.pressure_kpa;
  const resultTypes = passport.rules.result_types;
  const limit = passport.rules.max_evidence_per_differs;
  const tests = list(component.tests);
  let status;
  let evidence;
  let gravityCaveat = false;
  if (tests.length === 0) {
    status = STATUS.NONE;
    evidence = [...list(component.notes)];
  } else {
    const covering = tests.filter((test) => covers(test, env, tolerance, resultTypes));
    if (covering.length > 0) {
      status = STATUS.APPLIES;
      evidence = unique(covering.map((test) => test.evidence));
      // The caveat record is shown with an "applies" row unless a covering test states a gravity of its own.
      gravityCaveat = covering.every((test) => !test.gravity);
    } else {
      status = STATUS.DIFFERS;
      const ranked = tests
        .map((test, index) => ({ test, index, d: distance(test, env) }))
        .sort((a, b) => a.d[0] - b.d[0] || a.d[1] - b.d[1] || a.index - b.index);
      evidence = unique(ranked.map((row) => row.test.evidence)).slice(0, limit);
    }
  }
  if (place.powered) evidence = unique([...evidence, ...list(passport.rules.powered_evidence)]);
  return { component: { id: component.id, status, evidence }, gravityCaveat: status === STATUS.APPLIES && gravityCaveat };
}

function assessPlace(place, vehicle) {
  const flagged = place.flag === true && list(place.flag_in).includes(vehicle.id);
  if (place.flag === true && !flagged) return { id: place.id, flagged: false, evidence: [] };
  const own = place.vehicle_evidence && place.vehicle_evidence[vehicle.id];
  return { id: place.id, flagged, evidence: unique([...list(place.evidence), ...list(own)]) };
}

export function assess(passport, { vehicle, place } = {}) {
  need(passport && typeof passport === 'object', 'assess needs the passport data as its first argument.');
  need(passport.tolerances && typeof passport.tolerances.pressure_kpa === 'number', 'The passport has no tolerances.pressure_kpa.');
  need(passport.rules && passport.rules.result_types, 'The passport has no rules.result_types.');
  const vehicleRecord = findById(passport.vehicles, vehicle, 'vehicle');
  const placeRecord = findById(passport.places, place, 'place');
  const env = chooseEnvironment(passport, vehicleRecord, placeRecord);

  const rows = list(passport.components).map((component) => assessComponent(component, env, placeRecord, passport));
  const components = rows.map((row) => row.component);
  const summary = { applies: 0, differs: 0, none: 0 };
  for (const component of components) summary[component.status] += 1;

  return {
    env: publicEnv(env),
    components,
    places: list(passport.places).map((p) => assessPlace(p, vehicleRecord)),
    summary,
    caveats: {
      gravity_caveat_components: rows.filter((row) => row.gravityCaveat).map((row) => row.component.id),
      gravity_evidence: [...list(passport.rules.gravity_caveat_evidence)],
    },
  };
}
