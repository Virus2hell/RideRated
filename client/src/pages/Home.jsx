import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRoads, useStats } from '../lib/queries';
import HeroScene from '../components/HeroScene';
import RoadCard from '../components/RoadCard';
import ReviewList from '../components/review/ReviewList';
import { AlertIcon, GaugeIcon, MapIcon, PlusIcon } from '../components/ui/Icons';

const STEPS = [
  { icon: MapIcon, title: 'Ride', text: 'Hit the ghats, the coast, the expressway. Every ride is a story.' },
  { icon: GaugeIcon, title: 'Rate', text: 'Pin the road, score surface, scenery, traffic and safety. Add photos.' },
  { icon: AlertIcon, title: 'Warn', text: 'Flag potholes, construction and danger zones before someone gets hurt.' },
];

function Stat({ value, label }) {
  return (
    <div>
      <p className="font-display text-5xl leading-none text-white">{value ?? '–'}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
    </div>
  );
}

function SectionTitle({ kicker, title, action }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">{kicker}</p>
        <h2 className="font-display text-5xl leading-none tracking-wide">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { data: stats } = useStats();
  const { data: topRoads = [] } = useRoads({ sort: 'top', limit: 4 });
  const { data: worstRoads = [] } = useRoads({ sort: 'worst', limit: 4 });

  return (
    <>
      {/* HERO */}
      <section className="relative -mt-px overflow-hidden">
        <HeroScene className="absolute inset-0 size-full" />
        <div className="relative mx-auto max-w-6xl px-4 pb-40 pt-20 sm:pt-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-400">
            <span className="size-1.5 animate-pulse rounded-full bg-brand-500" /> Mumbai · Pune · Sahyadris
          </p>
          <h1 className="max-w-3xl font-display text-7xl leading-[0.9] tracking-wide sm:text-8xl lg:text-9xl">
            Every road,
            <br />
            <span className="text-brand-500">rated by riders.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-zinc-300">
            Find the best ghats and twisties, dodge the broken stretches, and share your rides with
            people who get it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link to="/reviews/new" className="btn-primary px-6 py-3 text-base">
                <PlusIcon className="size-5" /> Rate a road you rode
              </Link>
            ) : (
              <Link to="/register" className="btn-primary px-6 py-3 text-base">Join the pack, it's free</Link>
            )}
            <Link to="/explore" className="btn-ghost bg-black/40 px-6 py-3 text-base backdrop-blur">
              <MapIcon /> Explore the map
            </Link>
          </div>

          <div className="mt-14 flex gap-10 sm:gap-14">
            <Stat value={stats?.roads} label="Roads rated" />
            <Stat value={stats?.reviews} label="Reviews" />
            <Stat value={stats?.riders} label="Riders" />
          </div>
        </div>
      </section>

      <div className="road-divider" />

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="card relative overflow-hidden p-6">
              <span className="absolute -right-2 -top-6 font-display text-[120px] leading-none text-zinc-800/60">{i + 1}</span>
              <Icon className="relative size-8 text-brand-500" />
              <h3 className="relative mt-4 font-display text-4xl tracking-wide">{title}</h3>
              <p className="relative mt-1 text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TOP + WORST ROADS */}
      <section className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2">
        <div>
          <SectionTitle kicker="Riders love these" title="Top rated roads" />
          <div className="space-y-3">{topRoads.map((r) => <RoadCard key={r.id} road={r} />)}</div>
        </div>
        <div>
          <SectionTitle kicker="Ride with caution" title="Hall of shame" />
          <div className="space-y-3">{worstRoads.map((r) => <RoadCard key={r.id} road={r} />)}</div>
          <p className="mt-3 text-xs text-zinc-500">
            Lowest rated roads, so you know before you go. Seen a bad stretch? Rate it and warn others.
          </p>
        </div>
      </section>

      {/* LATEST REVIEWS */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <SectionTitle
          kicker="Fresh from the saddle"
          title="Latest reviews"
          action={<Link to="/feed" className="text-sm font-semibold text-brand-400 hover:underline">See all →</Link>}
        />
        <ReviewList filters={{}} columns="sm:grid-cols-2 lg:grid-cols-3" />
      </section>

      {/* CTA */}
      {!user && (
        <section className="mx-auto mt-20 max-w-6xl px-4">
          <div className="card relative overflow-hidden bg-gradient-to-br from-brand-700 to-brand-600 p-10 text-center">
            <h2 className="font-display text-6xl leading-none tracking-wide">Your next ride starts here</h2>
            <p className="mx-auto mt-3 max-w-lg text-brand-50/90">
              Join riders from Mumbai and Pune sharing honest road reviews every week.
            </p>
            <Link to="/register" className="btn mt-6 bg-zinc-950 px-6 py-3 text-base text-white hover:bg-black">
              Create your free account
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
