import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

const TIMEOUT_MS = 7000;

const runCommand = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { ...options, shell: false });
  let stdout = "";
  let stderr = "";
  let settled = false;
  const timer = setTimeout(() => {
    if (!settled) {
      settled = true;
      child.kill("SIGKILL");
      reject(new Error("Execution timed out"));
    }
  }, TIMEOUT_MS);

  child.stdout.on("data", (data) => { stdout += data.toString(); });
  child.stderr.on("data", (data) => { stderr += data.toString(); });

  child.on("error", (err) => {
    clearTimeout(timer);
    if (!settled) {
      settled = true;
      reject(err);
    }
  });

  child.on("close", (code) => {
    clearTimeout(timer);
    if (settled) return;
    if (code !== 0) {
      reject(new Error(stderr || `Process exited with code ${code}`));
      return;
    }
    resolve({ stdout, stderr });
  });
});

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const normalizeType = (raw = "") => raw.toLowerCase().replace(/\s+/g, "");

const mapJavaType = (raw) => {
  const t = normalizeType(raw);
  if (t.endsWith("[]")) {
    const base = mapJavaType(t.slice(0, -2));
    return `${base}[]`;
  }
  if (t.includes("string")) return "String";
  if (t.includes("boolean")) return "boolean";
  if (t.includes("long")) return "long";
  if (t.includes("double") || t.includes("float")) return "double";
  if (t.includes("int") || t.includes("integer")) return "int";
  return "Object";
};

const mapCppType = (raw) => {
  const t = normalizeType(raw);
  if (t.endsWith("[]")) {
    const base = mapCppType(t.slice(0, -2));
    return `vector<${base}>`;
  }
  if (t.includes("string")) return "string";
  if (t.includes("boolean")) return "bool";
  if (t.includes("long")) return "long long";
  if (t.includes("double") || t.includes("float")) return "double";
  if (t.includes("int") || t.includes("integer")) return "int";
  return "string";
};

const generateJava = (code, tests, paramTypes) => {
  const javaTypes = paramTypes.map(mapJavaType);
  const argsList = javaTypes.map((t, i) => `${t} a${i}`).join(", ") || "";
  const callArgs = javaTypes.map((_, i) => `a${i}`).join(", ");
  const testsJson = JSON.stringify(tests);

  return `import java.util.*;

${code}

public class Main {
  public static void main(String[] args) {
    String json = ${JSON.stringify(testsJson)};
    List<Object> tests = (List<Object>) new JsonParser(json).parseValue();
    Solution sol = new Solution();
    List<Map<String, Object>> results = new ArrayList<>();
    int passed = 0;
    for (int i = 0; i < tests.size(); i++) {
      Map<String, Object> test = (Map<String, Object>) tests.get(i);
      List<Object> argList = (List<Object>) test.get("args");
      Object expected = test.get("expected");
      Map<String, Object> res = new LinkedHashMap<>();
      res.put("index", i + 1);
      res.put("input", test.get("input"));
      try {
        ${javaTypes.map((t, idx) => `${t} a${idx} = ( ${t} ) TypeCaster.cast(argList.get(${idx}), "${javaTypes[idx]}");`).join("\n        ")}
        Object output = sol.solve(${callArgs});
        String received = JsonWriter.toJson(output);
        String expectedJson = JsonWriter.toJson(expected);
        boolean ok = received.equals(expectedJson);
        res.put("expected", expectedJson);
        res.put("received", received);
        res.put("passed", ok);
        if (ok) passed++;
      } catch (Exception ex) {
        res.put("error", ex.getMessage());
        res.put("passed", false);
      }
      results.add(res);
    }
    Map<String, Object> summary = new LinkedHashMap<>();
    summary.put("total", results.size());
    summary.put("passed", passed);
    summary.put("failed", results.size() - passed);

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("summary", summary);
    payload.put("results", results);
    System.out.print(JsonWriter.toJson(payload));
  }

  static class JsonWriter {
    static String toJson(Object obj) {
      if (obj == null) return "null";
      if (obj instanceof String) return "\"" + escape((String) obj) + "\"";
      if (obj instanceof Number || obj instanceof Boolean) return obj.toString();
      if (obj instanceof List) {
        List<?> list = (List<?>) obj;
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < list.size(); i++) {
          if (i > 0) sb.append(",");
          sb.append(toJson(list.get(i)));
        }
        sb.append("]");
        return sb.toString();
      }
      if (obj.getClass().isArray()) {
        int len = java.lang.reflect.Array.getLength(obj);
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < len; i++) {
          if (i > 0) sb.append(",");
          Object v = java.lang.reflect.Array.get(obj, i);
          sb.append(toJson(v));
        }
        sb.append("]");
        return sb.toString();
      }
      if (obj instanceof Map) {
        Map<?, ?> map = (Map<?, ?>) obj;
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        boolean first = true;
        for (Map.Entry<?, ?> entry : map.entrySet()) {
          if (!first) sb.append(",");
          first = false;
          sb.append("\"").append(escape(String.valueOf(entry.getKey()))).append("\"");
          sb.append(":");
          sb.append(toJson(entry.getValue()));
        }
        sb.append("}");
        return sb.toString();
      }
      return "\"" + escape(String.valueOf(obj)) + "\"";
    }

    static String escape(String s) {
      return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
  }

  static class TypeCaster {
    static Object cast(Object raw, String type) {
      if (raw == null) return null;
      String t = type.toLowerCase();
      if (t.endsWith("[]")) {
        List<?> list = (List<?>) raw;
        String base = type.substring(0, type.length() - 2);
        Object arr = java.lang.reflect.Array.newInstance(resolveClass(base), list.size());
        for (int i = 0; i < list.size(); i++) {
          Object val = cast(list.get(i), base);
          java.lang.reflect.Array.set(arr, i, val);
        }
        return arr;
      }
      if (t.contains("string")) return String.valueOf(raw);
      if (t.contains("boolean")) return (raw instanceof Boolean) ? raw : Boolean.parseBoolean(raw.toString());
      if (t.contains("long")) return ((Number) raw).longValue();
      if (t.contains("double") || t.contains("float")) return ((Number) raw).doubleValue();
      if (t.contains("int") || t.contains("integer")) return ((Number) raw).intValue();
      return raw;
    }

    static Class<?> resolveClass(String base) {
      String t = base.toLowerCase();
      if (t.contains("string")) return String.class;
      if (t.contains("boolean")) return boolean.class;
      if (t.contains("long")) return long.class;
      if (t.contains("double") || t.contains("float")) return double.class;
      if (t.contains("int") || t.contains("integer")) return int.class;
      return Object.class;
    }
  }

  static class JsonParser {
    private final String s;
    private int i = 0;
    JsonParser(String s) { this.s = s; }
    Object parseValue() {
      skip();
      if (i >= s.length()) return null;
      char c = s.charAt(i);
      if (c == '"') return parseString();
      if (c == '{') return parseObject();
      if (c == '[') return parseArray();
      if (c == 't' && s.startsWith("true", i)) { i += 4; return Boolean.TRUE; }
      if (c == 'f' && s.startsWith("false", i)) { i += 5; return Boolean.FALSE; }
      if (c == 'n' && s.startsWith("null", i)) { i += 4; return null; }
      return parseNumber();
    }
    Map<String, Object> parseObject() {
      Map<String, Object> map = new LinkedHashMap<>();
      i++;
      skip();
      if (s.charAt(i) == '}') { i++; return map; }
      while (i < s.length()) {
        String key = parseString();
        skip();
        i++; // :
        Object val = parseValue();
        map.put(key, val);
        skip();
        char c = s.charAt(i++);
        if (c == '}') break;
      }
      return map;
    }
    List<Object> parseArray() {
      List<Object> list = new ArrayList<>();
      i++;
      skip();
      if (s.charAt(i) == ']') { i++; return list; }
      while (i < s.length()) {
        Object val = parseValue();
        list.add(val);
        skip();
        char c = s.charAt(i++);
        if (c == ']') break;
      }
      return list;
    }
    String parseString() {
      StringBuilder sb = new StringBuilder();
      i++;
      while (i < s.length()) {
        char c = s.charAt(i++);
        if (c == '"') break;
        if (c == '\\') {
          char n = s.charAt(i++);
          if (n == '"' || n == '\\' || n == '/') sb.append(n);
          else if (n == 'b') sb.append('\b');
          else if (n == 'f') sb.append('\f');
          else if (n == 'n') sb.append('\n');
          else if (n == 'r') sb.append('\r');
          else if (n == 't') sb.append('\t');
        } else sb.append(c);
      }
      return sb.toString();
    }
    Number parseNumber() {
      int start = i;
      while (i < s.length()) {
        char c = s.charAt(i);
        if (c == '-' || c == '+' || c == '.' || (c >= '0' && c <= '9') || c == 'e' || c == 'E') i++;
        else break;
      }
      String num = s.substring(start, i);
      if (num.contains(".") || num.contains("e") || num.contains("E")) return Double.parseDouble(num);
      return Long.parseLong(num);
    }
    void skip() { while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++; }
  }
}
`;
};

const generateCpp = (code, tests, paramTypes) => {
  const cppTypes = paramTypes.map(mapCppType);
  const argsList = cppTypes.map((t, i) => `${t} a${i}`).join(", ") || "";
  const callArgs = cppTypes.map((_, i) => `a${i}`).join(", ");
  const testsJson = JSON.stringify(tests);

  return `#include <bits/stdc++.h>
using namespace std;

${code}

struct JValue {
  enum Type {NUL, BOOL, NUM, STR, ARR, OBJ} type = NUL;
  bool b = false;
  double num = 0.0;
  string str;
  vector<JValue> arr;
  map<string, JValue> obj;
};

struct JsonParser {
  string s; size_t i = 0;
  JsonParser(const string& s): s(s) {}
  void skip() { while (i < s.size() && isspace(s[i])) i++; }
  JValue parseValue() {
    skip();
    if (i >= s.size()) return JValue();
    char c = s[i];
    if (c == '"') return parseString();
    if (c == '{') return parseObject();
    if (c == '[') return parseArray();
    if (s.compare(i, 4, "true") == 0) { i += 4; JValue v; v.type = JValue::BOOL; v.b = true; return v; }
    if (s.compare(i, 5, "false") == 0) { i += 5; JValue v; v.type = JValue::BOOL; v.b = false; return v; }
    if (s.compare(i, 4, "null") == 0) { i += 4; JValue v; v.type = JValue::NUL; return v; }
    return parseNumber();
  }
  JValue parseString() {
    JValue v; v.type = JValue::STR; i++;
    while (i < s.size()) {
      char c = s[i++];
      if (c == '"') break;
      if (c == '\\') {
        char n = s[i++];
        if (n == '"' || n == '\\' || n == '/') v.str.push_back(n);
        else if (n == 'b') v.str.push_back('\b');
        else if (n == 'f') v.str.push_back('\f');
        else if (n == 'n') v.str.push_back('\n');
        else if (n == 'r') v.str.push_back('\r');
        else if (n == 't') v.str.push_back('\t');
      } else v.str.push_back(c);
    }
    return v;
  }
  JValue parseNumber() {
    size_t start = i;
    while (i < s.size()) {
      char c = s[i];
      if (c == '-' || c == '+' || c == '.' || (c >= '0' && c <= '9') || c == 'e' || c == 'E') i++; else break;
    }
    JValue v; v.type = JValue::NUM; v.num = stod(s.substr(start, i - start));
    return v;
  }
  JValue parseArray() {
    JValue v; v.type = JValue::ARR; i++;
    skip();
    if (s[i] == ']') { i++; return v; }
    while (i < s.size()) {
      v.arr.push_back(parseValue());
      skip();
      char c = s[i++];
      if (c == ']') break;
    }
    return v;
  }
  JValue parseObject() {
    JValue v; v.type = JValue::OBJ; i++;
    skip();
    if (s[i] == '}') { i++; return v; }
    while (i < s.size()) {
      JValue key = parseString();
      skip(); i++;
      JValue val = parseValue();
      v.obj[key.str] = val;
      skip();
      char c = s[i++];
      if (c == '}') break;
    }
    return v;
  }
};

string to_json(const string& s) {
  string out = "\"";
  for (char c : s) {
    if (c == '\\' || c == '"') out.push_back('\\');
    out.push_back(c);
  }
  out.push_back('"');
  return out;
}
string to_json(bool v) { return v ? "true" : "false"; }
string to_json(double v) {
  if (fabs(v - llround(v)) < 1e-9) return to_string((long long) llround(v));
  return to_string(v);
}
string to_json(int v) { return to_string(v); }
string to_json(long long v) { return to_string(v); }

template <typename T>
string to_json(const vector<T>& arr) {
  string out = "[";
  for (size_t i = 0; i < arr.size(); i++) {
    if (i) out += ",";
    out += to_json(arr[i]);
  }
  out += "]";
  return out;
}

string jvalue_to_json(const JValue& v) {
  if (v.type == JValue::NUL) return "null";
  if (v.type == JValue::BOOL) return to_json(v.b);
  if (v.type == JValue::NUM) return to_json(v.num);
  if (v.type == JValue::STR) return to_json(v.str);
  if (v.type == JValue::ARR) {
    string out = "[";
    for (size_t i = 0; i < v.arr.size(); i++) {
      if (i) out += ",";
      out += jvalue_to_json(v.arr[i]);
    }
    out += "]";
    return out;
  }
  if (v.type == JValue::OBJ) {
    string out = "{";
    bool first = true;
    for (auto& kv : v.obj) {
      if (!first) out += ",";
      first = false;
      out += "\"" + kv.first + "\":" + jvalue_to_json(kv.second);
    }
    out += "}";
    return out;
  }
  return "null";
}

template <typename T>
string to_json_fallback(const T& v) {
  return to_json(to_string(v));
}

int to_int(const JValue& v) { return (int) llround(v.num); }
long long to_long(const JValue& v) { return (long long) llround(v.num); }
double to_double(const JValue& v) { return v.num; }
bool to_bool(const JValue& v) { return v.type == JValue::BOOL ? v.b : (v.num != 0.0); }
string to_string_val(const JValue& v) { return v.str; }

vector<int> to_int_vec(const JValue& v) { vector<int> out; for (auto& x : v.arr) out.push_back(to_int(x)); return out; }
vector<long long> to_long_vec(const JValue& v) { vector<long long> out; for (auto& x : v.arr) out.push_back(to_long(x)); return out; }
vector<double> to_double_vec(const JValue& v) { vector<double> out; for (auto& x : v.arr) out.push_back(to_double(x)); return out; }
vector<bool> to_bool_vec(const JValue& v) { vector<bool> out; for (auto& x : v.arr) out.push_back(to_bool(x)); return out; }
vector<string> to_string_vec(const JValue& v) { vector<string> out; for (auto& x : v.arr) out.push_back(to_string_val(x)); return out; }

int main() {
  string json = ${JSON.stringify(testsJson)};
  JsonParser parser(json);
  JValue tests = parser.parseValue();
  Solution sol;
  vector<map<string, string>> results;
  int passed = 0;
  for (size_t i = 0; i < tests.arr.size(); i++) {
    auto test = tests.arr[i].obj;
    auto args = test["args"].arr;
    string inputStr = test["input"].str;
    string expectedStr = jvalue_to_json(test["expected"]);
    map<string, string> res;
    res["index"] = to_string((int) i + 1);
    res["input"] = inputStr;
    try {
      ${cppTypes.map((t, idx) => {
        const norm = normalizeType(paramTypes[idx]);
        if (norm.endsWith("[]")) {
          if (norm.includes("string")) return `${t} a${idx} = to_string_vec(args[${idx}]);`;
          if (norm.includes("boolean")) return `${t} a${idx} = to_bool_vec(args[${idx}]);`;
          if (norm.includes("long")) return `${t} a${idx} = to_long_vec(args[${idx}]);`;
          if (norm.includes("double") || norm.includes("float")) return `${t} a${idx} = to_double_vec(args[${idx}]);`;
          return `${t} a${idx} = to_int_vec(args[${idx}]);`;
        }
        if (norm.includes("string")) return `${t} a${idx} = to_string_val(args[${idx}]);`;
        if (norm.includes("boolean")) return `${t} a${idx} = to_bool(args[${idx}]);`;
        if (norm.includes("long")) return `${t} a${idx} = to_long(args[${idx}]);`;
        if (norm.includes("double") || norm.includes("float")) return `${t} a${idx} = to_double(args[${idx}]);`;
        return `${t} a${idx} = to_int(args[${idx}]);`;
      }).join("\n      ")}
      auto output = sol.solve(${callArgs});
      string received = to_json(output);
      bool ok = received == expectedStr;
      res["expected"] = expectedStr;
      res["received"] = received;
      res["passed"] = ok ? "true" : "false";
      if (ok) passed++;
    } catch (...) {
      res["error"] = "Runtime error";
      res["passed"] = "false";
    }
    results.push_back(res);
  }
  stringstream out;
  out << "{\"summary\":{\"total\":" << results.size() << ",\"passed\":" << passed << ",\"failed\":" << (results.size() - passed) << "},\"results\":[";
  for (size_t i = 0; i < results.size(); i++) {
    if (i) out << ",";
    out << "{";
    bool first = true;
    for (auto& kv : results[i]) {
      if (!first) out << ",";
      first = false;
      out << "\"" << kv.first << "\":";
      if (kv.first == "index") out << kv.second;
      else out << to_json(kv.second);
    }
    out << "}";
  }
  out << "]}";
  cout << out.str();
  return 0;
}
`;
};

const generateJs = (code, tests) => `const tests = ${JSON.stringify(tests)};
${code}

const getFn = () => {
  if (typeof solution === "function") return solution;
  if (typeof solve === "function") return solve;
  return null;
};

const deepEqual = (a, b) => {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (a && b && typeof a === "object") {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
};

const fn = getFn();
if (!fn) {
  console.log(JSON.stringify({ error: "Define a function named solution (or solve)." }));
  process.exit(0);
}

const results = tests.map((t, idx) => {
  try {
    const received = fn(...t.args);
    const passed = deepEqual(received, t.expected);
    return { index: idx + 1, input: t.input, expected: t.expected, received, passed };
  } catch (err) {
    return { index: idx + 1, input: t.input, passed: false, error: err.message || "Runtime error" };
  }
});
const summary = { total: results.length, passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length };
console.log(JSON.stringify({ summary, results }));
`;

const generatePython = (code, tests) => `import json\nimport sys\n\nTESTS = json.loads(${JSON.stringify(JSON.stringify(tests))})\n\n${code}\n\nfn = globals().get("solution") or globals().get("solve")\nif fn is None:\n    print(json.dumps({"error": "Define a function named solution (or solve)."}))\n    sys.exit(0)\n\nresults = []\npassed = 0\nfor idx, test in enumerate(TESTS):\n    try:\n        received = fn(*test["args"])\n        ok = received == test["expected"]\n        if ok:\n            passed += 1\n        results.append({"index": idx + 1, "input": test.get("input"), "expected": test["expected"], "received": received, "passed": ok})\n    except Exception as e:\n        results.append({"index": idx + 1, "input": test.get("input"), "passed": False, "error": str(e)})\n\nsummary = {"total": len(results), "passed": passed, "failed": len(results) - passed}\nprint(json.dumps({"summary": summary, "results": results}))\n`;

const buildPayload = (stdout) => {
  const data = JSON.parse(stdout || "{}");
  if (data.error) throw new Error(data.error);
  if (!data.summary || !data.results) throw new Error("Invalid runner output");
  return data;
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { language, code, tests, paramTypes = [] } = body || {};
    if (!language || !code || !Array.isArray(tests)) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    if ((language === "java" || language === "cpp") && paramTypes.some((t) => normalizeType(t).includes("[][]"))) {
      return NextResponse.json({ success: false, error: "Nested arrays are not supported yet for this language." }, { status: 400 });
    }
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "prepai-"));
    await ensureDir(tmpDir);

    let output;
    try {
      if (language === "javascript") {
        const file = path.join(tmpDir, "main.js");
        await fs.writeFile(file, generateJs(code, tests), "utf8");
        const result = await runCommand("node", [file], { cwd: tmpDir });
        output = buildPayload(result.stdout.trim());
      } else if (language === "python") {
        const file = path.join(tmpDir, "main.py");
        await fs.writeFile(file, generatePython(code, tests), "utf8");
        const result = await runCommand("python", [file], { cwd: tmpDir });
        output = buildPayload(result.stdout.trim());
      } else if (language === "java") {
        const file = path.join(tmpDir, "Main.java");
        const source = generateJava(code, tests, paramTypes);
        await fs.writeFile(file, source, "utf8");
        await runCommand("javac", [file], { cwd: tmpDir });
        const result = await runCommand("java", ["Main"], { cwd: tmpDir });
        output = buildPayload(result.stdout.trim());
      } else if (language === "cpp") {
        const file = path.join(tmpDir, "main.cpp");
        const source = generateCpp(code, tests, paramTypes);
        await fs.writeFile(file, source, "utf8");
        const exe = path.join(tmpDir, "main.exe");
        await runCommand("g++", [file, "-std=c++17", "-O2", "-o", exe], { cwd: tmpDir });
        const result = await runCommand(exe, [], { cwd: tmpDir });
        output = buildPayload(result.stdout.trim());
      } else {
        return NextResponse.json({ success: false, error: "Unsupported language" }, { status: 400 });
      }
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }

    return NextResponse.json({ success: true, payload: output });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message || "Execution failed" }, { status: 500 });
  }
}
