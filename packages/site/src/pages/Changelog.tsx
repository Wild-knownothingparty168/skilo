import { useEffect, useState } from "react";
import { renderMarkdown } from "../lib/markdown";

function Changelog() {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/changelog.md")
      .then((r) => r.text())
      .then((raw) => setHtml(renderMarkdown(raw)))
      .catch(() => setHtml("<p>Could not load changelog.</p>"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex flex-col gap-4 max-w-[600px] mx-auto p-5 pt-28 pb-20 lg:p-10 lg:pt-32 lg:pb-32 leading-relaxed text-base">
      {loading ? (
        <p className="text-stone-400">Loading&hellip;</p>
      ) : (
        <div
          className="changelog-md"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </main>
  );
}

export default Changelog;
