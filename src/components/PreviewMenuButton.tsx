import React, { useState, useRef, useEffect } from "react";

export default function PreviewMenuButton({
  onForm,
  onChat,
  brandColor = "#4f46e5",
}: {
  onForm: () => void;
  onChat: () => void;
  brandColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative inline-block text-right">
      <button
        type="button"
        className="px-4 py-2 rounded-lg text-white"
        style={{ background: brandColor }}
        onClick={() => setOpen((v) => !v)}
      >
        תצוגה ▾
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-44 origin-top-right rounded-md border bg-white shadow-lg">
          <button
            type="button"
            className="block w-full px-3 py-2 text-right hover:bg-gray-50"
            onClick={() => { setOpen(false); onForm(); }}
          >
            טופס
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-right hover:bg-gray-50"
            onClick={() => { setOpen(false); onChat(); }}
          >
            כצ׳אט
          </button>
        </div>
      )}
    </div>
  );
}
