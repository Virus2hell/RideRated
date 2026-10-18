// Seeds demo roads around Mumbai & Pune so the map isn't empty while you develop.
// Run: npm run seed   (safe to re-run: it skips if the demo user already exists)
// Before launch, replace these with real reviews from your own rides.
import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

const ROADS = [
  { name: 'Tamhini Ghat', city: 'Pune', lat: 18.451, lng: 73.432, review: {
    title: 'Monsoon heaven, but watch the wet patches', overall: 5, surface: 4, scenery: 5, traffic: 4, safety: 3,
    season: 'monsoon', tags: ['ghat', 'scenic', 'waterfalls', 'twisties'],
    body: 'Waterfalls on both sides after the first rains. Tarmac is mostly good, a few broken patches near the Mulshi side. Go early on weekdays; weekends get crowded with cars stopping anywhere.' } },
  { name: 'Malshej Ghat', city: 'Junnar', lat: 19.324, lng: 73.779, review: {
    title: 'Fog, flamingos and fantastic corners', overall: 4, surface: 3, scenery: 5, traffic: 3, safety: 3,
    season: 'monsoon', tags: ['ghat', 'scenic', 'waterfalls', 'potholes'],
    body: 'Visibility drops to 10 metres in the fog, so keep your lights on. Some potholes after the tunnel. MTDC resort stop for vada pav is a must.' } },
  { name: 'Mumbai–Pune Expressway (Khandala)', city: 'Lonavala', lat: 18.755, lng: 73.382, review: {
    title: 'Fast and smooth, but heavy trucks', overall: 3, surface: 5, scenery: 3, traffic: 2, safety: 3,
    season: 'all_year', tags: ['highway', 'heavy_traffic'],
    body: 'Surface is perfect but the ghat section is full of trucks crawling uphill. Stick to the speed limit; cameras everywhere. Food court stops are clean.' } },
  { name: 'Varandha Ghat', city: 'Bhor', lat: 18.127, lng: 73.685, review: {
    title: 'Hidden gem with zero crowds', overall: 4, surface: 3, scenery: 5, traffic: 5, safety: 3,
    season: 'winter', tags: ['ghat', 'twisties', 'scenic', 'no_fuel_nearby'],
    body: 'Almost no traffic. Narrow in places with some loose gravel on the hairpins. Fill up at Bhor; there is no fuel until you reach Mahad.' } },
  { name: 'Lavasa Road (Temghar)', city: 'Pune', lat: 18.41, lng: 73.506, review: {
    title: 'Best twisties near Pune', overall: 5, surface: 5, scenery: 4, traffic: 4, safety: 4,
    season: 'winter', tags: ['twisties', 'scenic', 'food_stops'],
    body: 'Smooth tarmac, great sweepers along the dam backwaters. Popular with riders on Sunday mornings. Watch for cyclists on the climbs.' } },
  { name: 'Amba Ghat', city: 'Kolhapur', lat: 16.969, lng: 73.8, review: {
    title: 'Broken stretches near the top', overall: 2, surface: 1, scenery: 4, traffic: 3, safety: 2,
    season: 'winter', tags: ['ghat', 'potholes', 'construction', 'unsafe_at_night'],
    body: 'Beautiful views but the road surface is badly damaged for about 8 km near the top. Ongoing repair work with no warning signs. Avoid at night.' } },
  { name: 'Bhimashankar Road', city: 'Pune', lat: 19.072, lng: 73.536, review: {
    title: 'Narrow, foggy and full of character', overall: 4, surface: 3, scenery: 5, traffic: 3, safety: 3,
    season: 'monsoon', tags: ['ghat', 'scenic', 'twisties'],
    body: 'Last 20 km through the forest are narrow and slippery in the rains. Temple traffic on Mondays and Shravan. Worth it for the clouds rolling over the road.' } },
  { name: 'Sinhagad Ghat Road', city: 'Pune', lat: 18.366, lng: 73.756, review: {
    title: 'Steep climb, crowded weekends', overall: 3, surface: 3, scenery: 4, traffic: 2, safety: 3,
    season: 'monsoon', tags: ['ghat', 'heavy_traffic', 'food_stops'],
    body: 'Short but steep climb. Weekends are packed with cars and the parking at the top is a mess. Pithla bhakri at the top makes up for it.' } },
];

// Seed tags are written as short keys; reviews store { label, tone } objects.
const TAG_LABELS = {
  ghat: 'Ghat', highway: 'Highway', twisties: 'Twisties', scenic: 'Scenic', waterfalls: 'Waterfalls',
  food_stops: 'Food stops', potholes: 'Potholes', construction: 'Construction',
  heavy_traffic: 'Heavy traffic', no_fuel_nearby: 'No fuel nearby', unsafe_at_night: 'Unsafe at night',
};
const BAD_TAGS = ['potholes', 'construction', 'heavy_traffic', 'no_fuel_nearby', 'unsafe_at_night'];
const toTags = (keys) => keys.map((k) => ({ label: TAG_LABELS[k], tone: BAD_TAGS.includes(k) ? 'bad' : 'good' }));

async function seed() {
  const existing = await pool.query("SELECT id FROM users WHERE username = 'riderated_demo'");
  if (existing.rowCount) {
    console.log('Demo data already present, skipping.');
    return pool.end();
  }

  const hash = await bcrypt.hash('demo-password-123', 12);
  const { rows: [user] } = await pool.query(
    `INSERT INTO users (username, email, password_hash, display_name, city)
     VALUES ('riderated_demo', 'demo@riderated.local', $1, 'RideRated Demo', 'Pune') RETURNING id`,
    [hash],
  );

  for (const [i, r] of ROADS.entries()) {
    const { rows: [road] } = await pool.query(
      `INSERT INTO roads (name, city, location, created_by)
       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5) RETURNING id`,
      [r.name, r.city, r.lng, r.lat, user.id],
    );
    const v = r.review;
    await pool.query(
      `INSERT INTO road_reviews (road_id, user_id, title, body, rating_overall, rating_surface, rating_scenery,
         rating_traffic, rating_safety, best_season, tags, ridden_on, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, CURRENT_DATE - $12::int, now() - ($12 || ' hours')::interval)`,
      [road.id, user.id, v.title, v.body, v.overall, v.surface, v.scenery, v.traffic, v.safety, v.season, JSON.stringify(toTags(v.tags)), i * 3],
    );
  }
  console.log(`Seeded ${ROADS.length} roads with reviews.`);
  await pool.end();
}

seed();
