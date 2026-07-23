import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-[820px] flex-col gap-2 px-6 py-8 text-[13px] text-ink-3 sm:flex-row sm:items-center">
        <p>
          © {new Date().getFullYear()} {site.author} · {site.name}
        </p>
        <div className="flex gap-4 sm:ml-auto">
          <a href={site.medium} className="hover:text-ink-2">
            Medium
          </a>
          <a href="/feed.xml" className="hover:text-ink-2">
            RSS
          </a>
        </div>
      </div>
    </footer>
  );
}
