"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Pill } from "@/components/ui";

interface Article { id: string; slug: string; title: string; body: string; published: boolean; needsReview: boolean; }

export function KnowledgeEditor({ articles }: { articles: Article[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Article | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      await fetch("/api/admin/knowledge/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: editing.slug, title: editing.title, body: editing.body, published: editing.published, needsReview: editing.needsReview }),
      });
      setEditing(null);
      router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-ink">{editing ? "Edit article" : "Articles"}</div>
          {!editing ? <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setEditing({ id: "", slug: "", title: "", body: "", published: true, needsReview: false })}>New</button> : null}
        </div>
        {editing ? (
          <div className="mt-3 space-y-2">
            <input className="input" placeholder="slug-like-this" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
            <input className="input" placeholder="Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <textarea className="input" rows={4} placeholder="Body" value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Published</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.needsReview} onChange={(e) => setEditing({ ...editing, needsReview: e.target.checked })} /> Needs product/legal confirmation</label>
            <div className="flex gap-2"><button className="btn-primary" onClick={save} disabled={busy}>Save</button><button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button></div>
          </div>
        ) : (
          <ul className="mt-3 max-h-[420px] space-y-1.5 overflow-y-auto text-sm">
            {articles.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2">
                <button className="text-left hover:underline" onClick={() => setEditing(a)}>{a.title}</button>
                <div className="flex gap-1.5">
                  {a.needsReview ? <Pill tone="amber">review</Pill> : null}
                  <Pill tone={a.published ? "green" : "slate"}>{a.published ? "live" : "draft"}</Pill>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
