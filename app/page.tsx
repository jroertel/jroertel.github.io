"use client";

import { useState, useRef } from "react";

type Stage = "input" | "loading" | "result";

export default function Home() {
  const [specs, setSpecs] = useState("");
  const [output, setOutput] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!specs.trim()) return;

    setStage("loading");
    setOutput("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specs }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      setStage("result");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value);
        setOutput(full);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setOutput("Something went wrong. Please try again.");
        setStage("result");
      }
    }
  }

  function reset() {
    abortRef.current?.abort();
    setStage("input");
    setSpecs("");
    setOutput("");
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(output);
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <header className="bg-white border-b border-amber-100 px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-bold text-amber-900 tracking-tight">
          Cocktail Menu Writer
        </h1>
        <p className="text-sm text-amber-700 mt-0.5">
          Paste your cocktail specs — get polished menu descriptions instantly
        </p>
      </header>

      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-8 gap-6">
        {stage === "input" && (
          <>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="specs"
                className="text-sm font-medium text-amber-900"
              >
                Paste your cocktail spec sheet
              </label>
              <textarea
                id="specs"
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                placeholder={`COCKTAIL NAME\n2 oz Spirit\n0.75 oz Liqueur\n1 oz Citrus Juice\n\nMethod: Shake, strain\nGlass: Rocks\nGarnish: Citrus wheel\n\n...paste as many as you like`}
                rows={18}
                className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none font-mono leading-relaxed shadow-sm"
              />
            </div>
            <button
              onClick={generate}
              disabled={!specs.trim()}
              className="self-end bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-full px-8 py-3 transition-colors shadow"
            >
              Generate Menu Descriptions →
            </button>
          </>
        )}

        {stage === "loading" && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-amber-800">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-sm font-medium">Writing your menu copy…</p>
          </div>
        )}

        {stage === "result" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
                Menu Descriptions
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="text-sm text-amber-700 hover:text-amber-900 border border-amber-300 hover:border-amber-500 rounded-full px-4 py-1.5 transition-colors"
                >
                  Copy
                </button>
                <button
                  onClick={reset}
                  className="text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-full px-4 py-1.5 transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-amber-100 shadow-sm px-6 py-6 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap min-h-[300px]">
              {output || <span className="text-gray-400 italic">Generating…</span>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
