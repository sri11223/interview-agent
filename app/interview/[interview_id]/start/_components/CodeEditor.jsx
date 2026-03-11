"use client";
import React, { useState, useRef } from "react";

const LANGUAGES = [
  { id: "javascript", name: "JavaScript", ext: "js" },
  { id: "python", name: "Python", ext: "py" },
  { id: "java", name: "Java", ext: "java" },
  { id: "cpp", name: "C++", ext: "cpp" },
];

const TEMPLATES = {
  javascript: `// Write your solution here\nfunction solution(nums) {\n  \n  return result;\n}\n`,
  python: `# Write your solution here\ndef solution(nums):\n    \n    return result\n`,
  java: `// Write your solution here\nclass Solution {\n    public int[] solve(int[] nums) {\n        \n        return new int[]{};\n    }\n}\n`,
  cpp: `// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n`,
};

export default function CodeEditor({ onShareCode, visible }) {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(TEMPLATES.javascript);
  const textareaRef = useRef(null);

  if (!visible) return null;

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (code === TEMPLATES[language] || !code.trim()) {
      setCode(TEMPLATES[lang]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const lineCount = code.split("\n").length;

  const handleShare = () => {
    if (code.trim() && code !== TEMPLATES[language]) {
      onShareCode(code, LANGUAGES.find(l => l.id === language)?.name || language);
    }
  };

  return (
    <div className="bg-[#1e1e2e] rounded-2xl shadow-lg overflow-hidden border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#181825] border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-gray-400 text-xs font-mono">
            solution.{LANGUAGES.find(l => l.id === language)?.ext || "js"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {LANGUAGES.map((lang) => (
            <button key={lang.id} onClick={() => handleLanguageChange(lang.id)}
              className={`px-2 py-1 text-[11px] rounded font-medium transition ${
                language === lang.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}>
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* Code area */}
      <div className="flex" style={{ maxHeight: "280px" }}>
        {/* Line numbers */}
        <div className="py-3 px-2 bg-[#181825] text-gray-600 text-xs font-mono text-right select-none min-w-[36px] border-r border-gray-700/30 overflow-hidden">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="leading-6">{i + 1}</div>
          ))}
        </div>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-green-300 font-mono text-sm p-3 leading-6 resize-none focus:outline-none min-h-[200px] max-h-[280px] overflow-y-auto placeholder-gray-600"
          placeholder="Write your code here..."
          spellCheck={false}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#181825] border-t border-gray-700/50">
        <div className="text-gray-500 text-[11px] font-mono">
          {lineCount} lines &middot; {language}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCode(TEMPLATES[language])}
            className="px-2.5 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-gray-700 rounded transition">
            Reset
          </button>
          <button onClick={handleShare}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
            Send to AI for Review
          </button>
        </div>
      </div>
    </div>
  );
}
