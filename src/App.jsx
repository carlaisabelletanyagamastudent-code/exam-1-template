import { useEffect, useMemo, useState } from "react";

const PER_PAGE = 12;

const CATEGORY_TAGS = [
  "Student & School",
  "Technology",
  "Architecture",
  "Nature",
  "Food",
  "Travel",
  "Minimal",
  "Fitness",
];

const CURATED_COLLECTIONS = [
  {
    title: "Calm Study",
    description: "Focus-friendly desks, books, and soft light.",
    vibe: "STUDY DESK MINIMAL",
    query: "study desk minimal",
  },
  {
    title: "Smart Work",
    description: "Modern tech, product shots, and sleek setups.",
    vibe: "TECHNOLOGY WORKSPACE",
    query: "technology workspace",
  },
  {
    title: "Urban Lines",
    description: "Clean architecture with sharp geometry.",
    vibe: "MODERN ARCHITECTURE",
    query: "modern architecture",
  },
  {
    title: "Green Escape",
    description: "Nature scenes to reset the mood.",
    vibe: "FOREST LANDSCAPE",
    query: "forest landscape",
  },
];

function App() {
  const accessKey = (import.meta.env.VITE_UNSPLASH_ACCESS_KEY || "")
    .replace(/^['"]|['"]$/g, "")
    .trim();
  const [inputValue, setInputValue] = useState("travel");
  const [searchQuery, setSearchQuery] = useState("travel");
  const [page, setPage] = useState(1);
  const [photos, setPhotos] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      query: searchQuery,
      page: String(page),
      per_page: String(PER_PAGE),
      orientation: "landscape",
    });

    const parsePayload = async (response) => {
      try {
        return await response.json();
      } catch {
        return null;
      }
    };

    const fetchOfficialApi = async () => {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?${params.toString()}`,
        {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
            "Accept-Version": "v1",
          },
          signal: controller.signal,
        },
      );

      const payload = await parsePayload(response);

      if (!response.ok) {
        const message = Array.isArray(payload?.errors)
          ? payload.errors.join(" ")
          : `Unsplash request failed with status ${response.status}`;
        const requestError = new Error(message);
        requestError.status = response.status;
        throw requestError;
      }

      return payload;
    };

    const fetchPublicFallback = async () => {
      const response = await fetch(`/napi/search/photos?${params.toString()}`, {
        signal: controller.signal,
      });
      const payload = await parsePayload(response);

      if (!response.ok) {
        throw new Error(`Unsplash fallback failed with status ${response.status}`);
      }

      return payload;
    };

    const loadPhotos = async () => {
      setLoading(true);
      setError("");

      try {
        let payload = null;

        if (accessKey) {
          try {
            payload = await fetchOfficialApi();
          } catch (requestError) {
            if (requestError.status === 401 || requestError.status === 403) {
              payload = await fetchPublicFallback();
            } else {
              throw requestError;
            }
          }
        } else {
          payload = await fetchPublicFallback();
        }

        setPhotos(Array.isArray(payload?.results) ? payload.results : []);
        setTotalResults(typeof payload?.total === "number" ? payload.total : 0);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Could not load images from Unsplash");
          setPhotos([]);
          setTotalResults(0);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadPhotos();
    return () => controller.abort();
  }, [accessKey, page, searchQuery]);

  const totalPages = useMemo(() => {
    const fromResults = Math.ceil(totalResults / PER_PAGE);
    return Math.max(1, Math.min(50, fromResults || 1));
  }, [totalResults]);

  const visiblePages = useMemo(() => {
    const windowSize = 5;
    const halfWindow = Math.floor(windowSize / 2);
    let start = Math.max(1, page - halfWindow);
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    const pages = [];
    for (let index = start; index <= end; index += 1) {
      pages.push(index);
    }
    return pages;
  }, [page, totalPages]);

  const triggerSearch = (nextQuery) => {
    const normalizedQuery = nextQuery.trim();
    if (!normalizedQuery) {
      return;
    }

    setSearchQuery(normalizedQuery);
    setInputValue(normalizedQuery);
    setPage(1);
  };

  const activeCategory = CATEGORY_TAGS.find(
    (tag) => tag.toLowerCase() === searchQuery.toLowerCase(),
  );

  return (
    <main className="min-h-screen bg-[#01071f] px-4 py-8 text-slate-100 md:py-10">
      <div className="mx-auto w-full max-w-6xl animate-stage rounded-[30px] border border-cyan-300/10 bg-[radial-gradient(circle_at_15%_0%,rgba(56,189,248,0.15),transparent_46%),linear-gradient(180deg,#071334_0%,#040e2b_55%,#030a21_100%)] p-4 shadow-[0_30px_80px_rgba(2,8,35,0.8)] md:p-8">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full border border-cyan-300/20 bg-cyan-400/15 text-sm font-semibold text-cyan-200">
              UG
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-100/60">
                Unsplash Gallery
              </p>
              <p className="text-sm font-medium text-slate-100">
                Carla Isabelle Tanyag
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/20"
            onClick={() => triggerSearch("collections")}
          >
            Collections
          </button>
        </header>

        <section className="mb-5 grid gap-4 md:grid-cols-[2.3fr_1fr]">
          <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-6 shadow-[inset_0_1px_0_rgba(103,232,249,0.07)]">
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-cyan-100/50">
              Curated Search
            </p>
            <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-white md:text-[2.2rem]">
              Find the mood. Build the board.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-300/90">
              Explore premium imagery with a clean, modern experience. Search by
              theme, vibe, or subject and curate the visuals you need.
            </p>
          </div>
          <aside className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-100/50">
              Insight
            </p>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-2xl font-semibold text-white">{photos.length}</p>
                <p className="text-slate-300/70">images per page</p>
              </div>
              <div className="h-px bg-cyan-200/10" />
              <div>
                <p className="font-semibold text-white">Unsplash</p>
                <p className="text-slate-300/70">Trusted provider</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-cyan-300/10 bg-white/[0.03] p-4 md:p-6">
          <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-cyan-100/50">
            Search
          </p>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              triggerSearch(inputValue);
            }}
          >
            <input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              type="text"
              placeholder="Travel"
              className="w-full rounded-full border border-cyan-300/10 bg-[#030a22] px-4 py-3 text-sm text-cyan-50 outline-none ring-cyan-300/50 transition focus:ring"
            />
            <button
              type="submit"
              className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORY_TAGS.map((tag) => {
              const selected = tag.toLowerCase() === searchQuery.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => triggerSearch(tag)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    selected
                      ? "border-emerald-300/60 bg-emerald-300/25 text-emerald-100"
                      : "border-cyan-300/15 bg-cyan-100/[0.03] text-cyan-100/75 hover:border-cyan-300/35 hover:text-cyan-50"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-300/70">
            <p>{totalResults.toLocaleString()} results</p>
            <p>
              Page {page} of {totalPages}
            </p>
          </div>
        </section>

        <section className="mt-5">
          {error ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {loading
              ? Array.from({ length: PER_PAGE }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="h-44 animate-pulse rounded-2xl border border-cyan-200/10 bg-cyan-100/5"
                  />
                ))
              : photos.map((photo, index) => (
                  <a
                    key={photo.id}
                    href={photo.links.html}
                    target="_blank"
                    rel="noreferrer"
                    className="group animate-card overflow-hidden rounded-2xl border border-cyan-200/10 bg-cyan-100/5"
                    style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
                  >
                    <div className="relative h-44">
                      <img
                        src={photo.urls.small}
                        srcSet={`${photo.urls.small} 400w, ${photo.urls.regular} 1080w`}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        alt={photo.alt_description || photo.description || "Unsplash photo"}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-[11px]">
                        <p className="truncate font-medium text-cyan-50">
                          {photo.user?.name || "Unsplash"}
                        </p>
                        <p className="text-cyan-100/70">{photo.likes} likes</p>
                      </div>
                    </div>
                  </a>
                ))}
          </div>

          {!loading && !error && photos.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-5 text-sm text-slate-300/85">
              No images found for "{searchQuery}". Try another keyword.
            </div>
          ) : null}
        </section>

        <section className="mt-6 rounded-3xl border border-cyan-300/10 bg-white/[0.03] p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-100/50">
                Collections
              </p>
              <p className="mt-2 text-xl font-semibold text-white">Curated starting points</p>
            </div>
            <p className="hidden text-xs text-cyan-100/55 sm:block">
              Click a card to search instantly.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {CURATED_COLLECTIONS.map((collection) => (
              <button
                key={collection.title}
                type="button"
                onClick={() => triggerSearch(collection.query)}
                className="rounded-2xl border border-cyan-300/10 bg-[#08163a] p-4 text-left transition hover:border-cyan-300/30 hover:bg-[#0a1c47]"
              >
                <p className="font-semibold text-white">{collection.title}</p>
                <p className="mt-2 text-xs text-slate-300/85">{collection.description}</p>
                <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-emerald-200/90">
                  {collection.vibe}
                </p>
              </button>
            ))}
          </div>
        </section>

        <footer className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            className="rounded-full border border-cyan-300/20 px-4 py-2 text-cyan-100/80 transition hover:border-cyan-200/50 hover:text-cyan-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          {visiblePages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              className={`h-9 w-9 rounded-full border transition ${
                pageNumber === page
                  ? "border-emerald-300/60 bg-emerald-300/30 text-emerald-100"
                  : "border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-100/75 hover:border-cyan-200/45 hover:text-cyan-50"
              }`}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
            className="rounded-full border border-cyan-300/20 px-4 py-2 text-cyan-100/80 transition hover:border-cyan-200/50 hover:text-cyan-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </footer>

        {activeCategory ? (
          <p className="mt-4 text-center text-xs uppercase tracking-[0.18em] text-cyan-100/45">
            Active mood: {activeCategory}
          </p>
        ) : null}
      </div>
    </main>
  );
}

export default App;
