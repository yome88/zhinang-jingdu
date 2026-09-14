// 《智囊》精读 App · 数据完整性与逻辑不变量测试
// 用法: node test.js
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "智囊精读App.html"), "utf8");

let pass = 0, fail = 0;
function ok(cond, name){
  if(cond){ pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name); }
}

// 提取 JS 段并在沙箱中求值
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if(!scriptMatch){ console.log("✗ 未找到 script 段"); process.exit(1); }
const sandbox = {};
const vm = require("vm");
// 只执行数据声明部分（到 SPIRAL 定义为止），避免 DOM 依赖
const dataCode = scriptMatch[1].split("/* ═══════════ 状态与存储")[0];
// SPIRAL / MILESTONES / STAGE_SIZE 定义在逻辑段，单独提取其 const 声明行
const extraLines = scriptMatch[1].split("\n").filter(l=>/^const SPIRAL =/.test(l)).join("\n");
const ctx = vm.createContext(sandbox);
vm.runInContext(dataCode + "\n" + extraLines + "\nthis.STORIES=STORIES; this.DEPTS=DEPTS; this.SPIRAL=SPIRAL; this.MILESTONES=MILESTONES; this.STAGE_SIZE=STAGE_SIZE;", ctx);
const { STORIES, DEPTS, SPIRAL, STAGE_SIZE } = sandbox;

console.log("\n【1】篇目数据结构");
ok(Array.isArray(STORIES) && STORIES.length >= 30, `篇目总数 ≥ 30（实际 ${STORIES.length}）`);
const ids = STORIES.map(s=>s.id);
ok(new Set(ids).size === ids.length, "篇目 id 无重复");
const fields = ["id","dept","level","title","act1","act1v","act2","act2v","note","hint","tags"];
STORIES.forEach(s=>{
  fields.forEach(f=>{
    ok(s[f] !== undefined && String(s[f]).trim() !== "", `${s.id||"?"}.${f} 非空`);
  });
});

console.log("\n【2】两幕切分");
STORIES.forEach(s=>{
  ok(s.act1 !== s.act2, `${s.title}：两幕原文不重复`);
  ok(s.act1v !== s.act2v, `${s.title}：两幕白话不重复`);
  ok(s.act1.length >= 10 && s.act2.length >= 10, `${s.title}：两幕均有实质内容`);
});

console.log("\n【3】部别与分级");
STORIES.forEach(s=>{
  ok(DEPTS.includes(s.dept), `${s.title}：部别「${s.dept}」合法`);
  ok(/🌱|🌿|🌳/.test(s.level), `${s.title}：分级合法`);
});
const deptCounts = {};
STORIES.forEach(s=>deptCounts[s.dept]=(deptCounts[s.dept]||0)+1);
console.log("  部别分布: " + Object.entries(deptCounts).map(([k,v])=>`${k}${v}`).join(" / "));
ok(Object.values(deptCounts).every(v=>v>=1), "无空部");

console.log("\n【4】螺旋编排");
ok(SPIRAL.length === STORIES.length, `SPIRAL 覆盖全部篇目（${SPIRAL.length}/${STORIES.length}）`);
ok(new Set(SPIRAL).size === SPIRAL.length, "SPIRAL 无重复");
SPIRAL.forEach(id=>ok(ids.includes(id), `SPIRAL 引用存在: ${id}`));
// 检查相邻不连读同一部（螺旋性）
let adjacentSame = 0;
for(let i=1;i<SPIRAL.length;i++){
  const a = STORIES.find(s=>s.id===SPIRAL[i-1]), b = STORIES.find(s=>s.id===SPIRAL[i]);
  if(a.dept===b.dept) adjacentSame++;
}
ok(adjacentSame <= 3, `相邻同部次数 ≤ 3（实际 ${adjacentSame}）`);
// 挑战级不在最前 3 则
const first3 = SPIRAL.slice(0,3).map(id=>STORIES.find(s=>s.id===id).level);
ok(!first3.some(l=>l.includes("🌳")), "前三则不含挑战级");

console.log("\n【5】阶段总结配置");
ok(STAGE_SIZE === 8, "每 8 则一次阶段总结");

console.log(`\n═══ 结果: ${pass} 通过 / ${fail} 失败 ═══`);
process.exit(fail ? 1 : 0);
