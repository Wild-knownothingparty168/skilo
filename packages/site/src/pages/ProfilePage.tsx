import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type CatalogEntry, type ProfileData } from "../api/skilo";
import CatalogCard from "../components/CatalogCard";
import {
  addPackTrayItem,
  readPackTray,
  type PackTrayItem,
  writePackTray,
} from "../lib/pack-tray";

const MAIN =
  "flex flex-col gap-6 max-w-[720px] mx-auto p-5 pt-28 pb-20 lg:p-10 lg:pt-32 lg:pb-32";

function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [trayItems, setTrayItems] = useState<PackTrayItem[]>(() => readPackTray());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      setError("Profile not found");
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .getProfile(username)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Profile not found"))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    writePackTray(trayItems);
  }, [trayItems]);

  const trayRefs = useMemo(
    () => new Set(trayItems.map((item) => item.canonicalRef)),
    [trayItems]
  );

  function handleAdd(entry: CatalogEntry) {
    setTrayItems((current) => addPackTrayItem(current, entry));
  }

  if (loading) {
    return (
      <main className={MAIN}>
        <p className="text-stone-400">Loading&hellip;</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className={MAIN}>
        <p className="text-lg font-medium text-black">Profile not found</p>
        <p className="text-stone-500">
          {error || "This publisher does not have a public profile yet."}
        </p>
        <Link
          to="/"
          className="text-sm underline decoration-stone-400/50 underline-offset-[2.5px] hover:decoration-stone-500 transition-[text-decoration-color] duration-150"
        >
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className={MAIN}>
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.18em] text-stone-500">
          Publisher
        </p>
        <h1 className="text-[32px] font-medium tracking-[-0.03em] text-black">
          {profile.username}
        </h1>
        <p className="max-w-[56ch] text-[15px] leading-7 text-stone-600">
          Public native skills published in Skilo. Add any of them to your pack,
          then share or install the whole setup in one link.
        </p>
        {trayItems.length > 0 && (
          <p className="text-sm text-emerald-700">
            {trayItems.length} item{trayItems.length !== 1 ? "s" : ""} currently in your pack tray.
            {" "}
            <Link
              to="/"
              className="underline decoration-emerald-400/40 underline-offset-[2.5px] hover:decoration-emerald-500"
            >
              Continue building
            </Link>
          </p>
        )}
      </header>

      {profile.skills.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 px-5 py-6 text-sm text-stone-500">
          No public skills yet.
        </div>
      ) : (
        <section className="grid gap-4">
          {profile.skills.map((skill) => (
            <CatalogCard
              key={skill.id}
              entry={skill}
              added={trayRefs.has(skill.canonicalRef)}
              onAdd={handleAdd}
            />
          ))}
        </section>
      )}
    </main>
  );
}

export default ProfilePage;
