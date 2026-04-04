"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

const LANGUAGES = [
  { id: "javascript", name: "JavaScript", ext: "js" },
  { id: "python", name: "Python", ext: "py" },
  { id: "java", name: "Java", ext: "java" },
  { id: "cpp", name: "C++", ext: "cpp" },
];

const fallbackParams = ["nums"];

const parseParams = (input = "") => {
  const params = [];
  if (!input) return params;
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
    if (match) params.push(match[1]);
  }
  return params;
};

const inferJavaType = (raw = "") => {
  const v = raw.toLowerCase();
  if (v.includes("listnode")) return "ListNode";
  if (v.includes("string")) return "String";
  if (v.includes("boolean")) return "boolean";
  if (v.includes("char")) return "char";
  if (v.includes("int") && v.includes("[]")) return "int[]";
  if (v.includes("integer") && v.includes("[]")) return "int[]";
  if (v.includes("int")) return "int";
  if (v.includes("integer")) return "int";
  return "Object";
};

const inferCppType = (raw = "") => {
  const v = raw.toLowerCase();
  if (v.includes("listnode")) return "ListNode*";
  if (v.includes("string")) return "string";
  if (v.includes("boolean")) return "bool";
  if (v.includes("char")) return "char";
  if ((v.includes("int") || v.includes("integer")) && v.includes("[]")) return "vector<int>";
  if (v.includes("int") || v.includes("integer")) return "int";
  return "auto";
};

const buildTemplates = ({ title = "", input = "" } = {}) => {
  const params = parseParams(input);
  const args = params.length ? params.join(", ") : fallbackParams.join(", ");
  const titleLine = title ? `// ${title}\n` : "";
  const pyTitleLine = title ? `# ${title}\n` : "";

  const javaParams = params.length
    ? params
        .map((name, idx) => `${inferJavaType(input.split(/\r?\n/)[idx] || "")} ${name}`)
        .join(", ")
    : "int[] nums";

  const cppParams = params.length
    ? params
        .map((name, idx) => `${inferCppType(input.split(/\r?\n/)[idx] || "")} ${name}`)
        .join(", ")
    : "vector<int> nums";

  return {
    javascript: `${titleLine}// Write your solution here\nfunction solution(${args}) {\n  \n  return result;\n}\n`,
    python: `${pyTitleLine}# Write your solution here\ndef solution(${args}):\n    \n    return result\n`,
    java: `${titleLine}// Write your solution here\nclass Solution {\n    public Object solve(${javaParams}) {\n        \n        return null;\n    }\n}\n`,
    cpp: `${titleLine}// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    auto solve(${cppParams}) {\n        \n        return 0;\n    }\n};\n`,
  };
};

const parseCases = (examplesText = "", testCasesText = "") => {
  const raw = [examplesText, testCasesText].filter(Boolean).join("\n");
  if (!raw.trim()) return [];
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const cases = [];
  let pendingInput = null;

  const parseLine = (line) => {
    const inline = line.match(/Input:\s*(.+?)\s*->\s*Output:\s*(.+)$/i);
    if (inline) {
      cases.push({ input: inline[1].trim(), output: inline[2].trim() });
      return true;
    }
    const inputMatch = line.match(/Input:\s*(.+)$/i);
    if (inputMatch) {
      pendingInput = inputMatch[1].trim();
      return true;
    }
    const outputMatch = line.match(/Output:\s*(.+)$/i);
    if (outputMatch && pendingInput) {
      cases.push({ input: pendingInput, output: outputMatch[1].trim() });
      pendingInput = null;
      return true;
    }
    return false;
  };

  lines.forEach(parseLine);
  return cases;
};

const splitTopLevel = (text = "") => {
  const parts = [];
  let buf = "";
  let depth = 0;
  let inString = false;
  let quote = "";
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const prev = text[i - 1];
    if (inString) {
      if (ch === quote && prev !== "\\") {
        inString = false;
      }
      buf += ch;
      continue;
    }
    if (ch === "\"" || ch === "'") {
      inString = true;
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === "[" || ch === "{" || ch === "(") depth += 1;
    if (ch === "]" || ch === "}" || ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
};

const parseValue = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    return Function(`"use strict"; return (${trimmed});`)();
  } catch {
    return trimmed;
  }
};

const parseArgs = (input = "") => {
  const parts = splitTopLevel(input);
  return parts.map((part) => {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) return parseValue(part);
    const value = part.slice(eqIdx + 1);
    return parseValue(value);
  });
};

const deepEqual = (a, b) => {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (a && b && typeof a === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
};

const parseInputTypes = (input = "") => {
  if (!input) return [];
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.+)$/);
      return match ? match[2].trim() : "";
    })
    .filter(Boolean);
};

export default function CodeEditor({ onShareCode, visible, fullHeight = false, problemMeta = null, testSpec = null, onTestResults = null }) {
  const [language, setLanguage] = useState("javascript");
  const templates = useMemo(() => buildTemplates(problemMeta || {}), [problemMeta]);
  const [code, setCode] = useState(templates.javascript);
  const textareaRef = useRef(null);
  const lastTemplateRef = useRef(templates);
  const [testResults, setTestResults] = useState(null);
  const [testError, setTestError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const paramTypes = useMemo(() => parseInputTypes(problemMeta?.input || ""), [problemMeta?.input]);

  if (!visible) return null;

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (code === lastTemplateRef.current[language] || !code.trim()) {
      setCode(templates[lang]);
    }
  };

  useEffect(() => {
    const previous = lastTemplateRef.current[language];
    if (!code.trim() || code === previous) {
      setCode(templates[language]);
    }
    lastTemplateRef.current = templates;
  }, [templates, language, code]);

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
    if (code.trim() && code !== templates[language]) {
      onShareCode(code, LANGUAGES.find(l => l.id === language)?.name || language);
    }
  };

  const handleRunTests = async () => {
    setTestError("");
    setTestResults(null);
    const cases = parseCases(testSpec?.examples, testSpec?.testCases);
    if (!cases.length) {
      setTestError("No test cases found for this problem.");
      return;
    }
    setIsRunning(true);
    try {
      const tests = cases.map((testCase) => {
        const args = parseArgs(testCase.input).map((val) => (val === undefined ? null : val));
        const expected = parseValue(testCase.output);
        return {
          input: testCase.input,
          args,
          expected: expected === undefined ? null : expected,
        };
      });

      const response = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, tests, paramTypes }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Failed to run tests.");
      }
      setTestResults(data.payload);
      if (onTestResults) {
        const summaryText = `Passed ${data.payload.summary.passed}/${data.payload.summary.total} tests.`;
        onTestResults({ summary: data.payload.summary, results: data.payload.results, summaryText });
      }
    } catch (err) {
      setTestError(err?.message || "Failed to run tests.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-[#1f1f1f] rounded-xl shadow-lg overflow-hidden border border-[#2a2a2a]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-gray-200">Code</span>
          <span className="text-[11px] text-gray-500 font-mono">
            solution.{LANGUAGES.find(l => l.id === language)?.ext || "js"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#141414] border border-[#2a2a2a] rounded-md px-2 py-1">
            <span className="text-[11px] text-gray-400">Language</span>
            <div className="flex items-center gap-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => handleLanguageChange(lang.id)}
                  className={`px-2 py-0.5 text-[11px] rounded transition ${
                    language === lang.id
                      ? "bg-[#2d6cdf] text-white"
                      : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
          <button className="px-2.5 py-1 text-[11px] text-gray-300 bg-[#262626] border border-[#2a2a2a] rounded-md">
            Auto
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex" style={{ maxHeight: fullHeight ? "100%" : "320px" }}>
        <div className="py-3 px-2 bg-[#1a1a1a] text-gray-600 text-xs font-mono text-right select-none min-w-[40px] border-r border-[#2a2a2a] overflow-hidden">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="leading-6">{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`flex-1 bg-[#1f1f1f] text-gray-200 font-mono text-sm p-3 leading-6 resize-none focus:outline-none overflow-y-auto placeholder-gray-600 ${
            fullHeight ? "min-h-[520px]" : "min-h-[220px] max-h-[320px]"
          }`}
          placeholder="Write your code here..."
          spellCheck={false}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1a1a1a] border-t border-[#2a2a2a]">
        <div className="text-gray-500 text-[11px] font-mono">
          {lineCount} lines · {language}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCode(templates[language])}
            className="px-2.5 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded transition"
          >
            Reset
          </button>
          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="px-3 py-1.5 bg-[#00af9b] hover:bg-[#009a87] text-white text-xs font-semibold rounded-md transition flex items-center gap-1.5 disabled:opacity-60"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
            {isRunning ? "Running..." : "Submit"}
          </button>
        </div>
      </div>
      {(testError || testResults) && (
        <div className="border-t border-[#2a2a2a] bg-[#141414] px-3 py-3 text-xs">
          {testError && (
            <div className="text-red-400 font-semibold">{testError}</div>
          )}
          {testResults && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${testResults.summary.failed ? "bg-red-900/40 text-red-200 border border-red-700/40" : "bg-emerald-900/40 text-emerald-200 border border-emerald-700/40"}`}>
                  {testResults.summary.failed ? "Failed" : "Passed"}
                </span>
                <span className="text-gray-300">Passed {testResults.summary.passed}/{testResults.summary.total} tests</span>
              </div>
              <div className="space-y-2">
                {testResults.results.map((res) => (
                  <div key={res.index} className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-semibold ${res.passed ? "text-emerald-300" : "text-red-300"}`}>
                        Test {res.index}: {res.passed ? "PASSED" : "FAILED"}
                      </span>
                      {res.error && <span className="text-[10px] text-red-400">{res.error}</span>}
                    </div>
                    <div className="text-gray-400 mt-1">Input: {res.input}</div>
                    {!res.error && (
                      <div className="text-gray-400">Expected: {JSON.stringify(res.expected)}</div>
                    )}
                    {!res.error && (
                      <div className="text-gray-400">Received: {JSON.stringify(res.received)}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
