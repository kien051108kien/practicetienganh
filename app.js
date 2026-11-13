const DB_KEY = "flashpractice_local_ai_v1";
const MODEL_ID = "onnx-community/Qwen2.5-1.5B-Instruct";
const $ = id => document.getElementById(id);
const topics = window.TOPICS || [];
let data = readData(), topic = null, qIndex = 0, model = null, loading = false, grading = false;

function readData(){
  try { const x=JSON.parse(localStorage.getItem(DB_KEY)||"{}"); return {answers:x.answers||{},last:x.last||null}; }
  catch { return {answers:{},last:null}; }
}
function save(){ try{localStorage.setItem(DB_KEY,JSON.stringify(data));}catch{toast("Không thể lưu bài làm trong trình duyệt.");} }
function id(t,i){return t+":"+i;}
function entry(t=topic.id,i=qIndex){return data.answers[id(t,i)]||{text:"",grade:null,gradedAnswer:null};}
function put(t,i,e){data.answers[id(t,i)]=e;save();}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(s){$("toast").textContent=s;$("toast").classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>$("toast").classList.remove("show"),2800);}
function view(name){
  const ids={home:"homeView",topic:"topicView",practice:"practiceView",review:"reviewView"};
  Object.keys(ids).forEach(k=>$(ids[k]).classList.toggle("hidden",k!==name));
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===(name==="review"?"review":"home")));
  window.scrollTo({top:0,behavior:"smooth"});
}
function stats(t){
  let done=0,written=0;
  t.questions.forEach((_,i)=>{const e=entry(t.id,i);if(e.text.trim())written++;if(e.text.trim()&&e.grade&&e.gradedAnswer===e.text)done++;});
  return {done,written};
}
function renderHome(){
  let done=0;
  topics.forEach(t=>done+=stats(t).done);
  $("overallFraction").textContent=done+" / 150";
  $("overallProgress").style.width=(done/150*100)+"%";
  $("overallPercent").textContent=Math.round(done/150*100)+"%";
  $("topicDoneText").textContent=topics.filter(t=>stats(t).done===30).length+"/5 chủ đề hoàn thành";
  $("topicGrid").innerHTML=topics.map((t,i)=>{
    const s=stats(t);
    return '<button class="topic-card" data-topic="'+t.id+'"><span class="topic-number" style="background:'+t.color+'">'+String(i+1).padStart(2,"0")+'</span><span class="topic-copy"><span class="topic-title-en">'+esc(t.titleEn)+'</span><span class="topic-title-vi">'+esc(t.titleVi)+'</span><span class="topic-progress-text"><span>'+s.done+'/30 câu đã chấm</span><span>'+Math.round(s.done/30*100)+'%</span></span><span class="mini-bar"><span style="width:'+s.done/30*100+'%"></span></span></span><span class="topic-arrow">→</span></button>';
  }).join("");
  document.querySelectorAll("[data-topic]").forEach(b=>b.onclick=()=>openTopic(b.dataset.topic));
}
function openTopic(tid){
  topic=topics.find(t=>t.id===tid);if(!topic)return;
  renderTopic();view("topic");
}
function renderTopic(){
  const s=stats(topic),n=topics.indexOf(topic)+1;
  $("topicHeader").innerHTML='<span class="topic-number" style="background:'+topic.color+'">'+String(n).padStart(2,"0")+'</span><div class="topic-header-main"><h1>'+esc(topic.titleEn)+'</h1><p>'+esc(topic.titleVi)+' · 30 câu · Tăng dần từ A2 đến B1</p></div><div class="topic-head-progress"><strong>'+s.done+'/30 câu đã chấm</strong><div class="progress"><span style="width:'+s.done/30*100+'%"></span></div></div>';
  document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b.dataset.filter===(renderTopic.filter||"all")));
  const filter=renderTopic.filter||"all";
  const items=topic.questions.map((q,i)=>({q,i,e:entry(topic.id,i)})).filter(x=>filter==="all"||(filter==="done"&&x.e.grade&&x.e.gradedAnswer===x.e.text)||(filter==="todo"&&!(x.e.grade&&x.e.gradedAnswer===x.e.text)));
  $("questionList").innerHTML=items.map(x=>{
    const done=x.e.grade&&x.e.gradedAnswer===x.e.text;
    const label=done?"✓ "+x.e.grade.total+"/10":x.e.text.trim()?"Đã nhập":"Chưa làm";
    return '<button class="question-row '+(done?"done":"")+'" data-q="'+x.i+'"><span class="q-number">'+String(x.i+1).padStart(2,"0")+'</span><span class="q-preview">'+esc(x.q)+'</span><span class="q-status '+(done?"done":"")+'">'+label+'</span></button>';
  }).join("");
  document.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>openPractice(Number(b.dataset.q)));
}
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{renderTopic.filter=b.dataset.filter;renderTopic();});
function openPractice(i){
  qIndex=Math.max(0,Math.min(29,i));data.last={topicId:topic.id,index:qIndex};save();renderPractice();view("practice");
}
function level(i){return i<10?"Cơ bản · A2":i<20?"Trung cấp · A2–B1":"Trung cấp cao · B1";}
function renderPractice(){
  const e=entry(),done=!!(e.grade&&e.gradedAnswer===e.text),stale=!!(e.grade&&e.gradedAnswer!==e.text);
  $("practiceTopic").textContent=topic.titleEn;
  $("questionCounter").textContent="Câu "+String(qIndex+1).padStart(2,"0")+" / 30";
  $("levelPill").textContent=level(qIndex);
  $("questionProgress").style.width=((qIndex+1)/30*100)+"%";
  $("promptText").textContent=topic.questions[qIndex];
  $("answerInput").value=e.text||"";
  $("wordCount").textContent=(e.text.trim()?e.text.trim().split(/\s+/).length:0)+" từ";
  $("gradeState").textContent=done?"✓ Đã chấm · "+e.grade.total+"/10":stale?"Cần chấm lại":"Chưa chấm";
  $("gradeState").className="grade-state "+(done?"done":stale?"stale":"");
  $("gradeButton").textContent=model?(done?"↻ Chấm lại câu này":"✦ Chấm câu này"):"✦ Tải AI & chấm câu";
  $("gradeButton").disabled=loading||grading;
  $("prevQuestion").disabled=qIndex===0;$("nextQuestion").disabled=qIndex===29;
  $("modelNotice").classList.toggle("hidden",!!model);
  if(done){$("gradePanel").classList.remove("hidden");renderGrade(e.grade);}
  else {$("gradePanel").classList.add("hidden");$("gradePanel").innerHTML="";}
  renderJump();
}
function renderJump(){
  const s=stats(topic);$("jumpAnswered").textContent=s.done+"/30 đã chấm";
  $("questionJump").innerHTML=topic.questions.map((_,i)=>{
    const e=entry(topic.id,i),done=e.grade&&e.gradedAnswer===e.text;
    return '<button class="jump-cell '+(i===qIndex?"active ":"")+(done?"done":"")+'" data-jump="'+i+'">'+(i+1)+'</button>';
  }).join("");
  document.querySelectorAll("[data-jump]").forEach(b=>b.onclick=async()=>{
    const next=Number(b.dataset.jump);if(next===qIndex)return;
    if(!await ensureGraded())return;openPractice(next);
  });
}
async function loadModel(){
  if(model)return model;
  if(loading)throw new Error("Mô hình đang được tải, vui lòng đợi.");
  loading=true;$("loadingPanel").classList.remove("hidden");$("modelNotice").classList.add("hidden");
  $("loadingTitle").textContent="Đang tải mô hình AI…";
  $("loadingDetail").textContent="Lần đầu cần tải khoảng 1,6 GB. Giữ tab Chrome mở trong khi tải.";
  try{
    const {pipeline,env}=await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4");
    env.allowLocalModels=false;env.useBrowserCache=true;
    let device="wasm";
    if(navigator.gpu){try{if(await navigator.gpu.requestAdapter())device="webgpu";}catch{}}
    const progress_callback=p=>{
      if(p&&p.status==="progress"&&typeof p.progress==="number"){
        $("modelProgress").style.width=Math.min(100,Math.max(0,p.progress))+"%";
        $("loadingTitle").textContent="Đang tải "+(p.file||"mô hình AI");
        $("loadingDetail").textContent=Math.round(p.progress)+"% · Tải lần đầu khoảng 1,6 GB.";
      }
    };
    try{model=await pipeline("text-generation",MODEL_ID,{dtype:"q4",device,progress_callback});}
    catch(err){if(device!=="webgpu")throw err;$("loadingTitle").textContent="GPU chưa sẵn sàng, đang thử CPU…";model=await pipeline("text-generation",MODEL_ID,{dtype:"q4",device:"wasm",progress_callback});}
    toast("Mô hình AI đã sẵn sàng trên thiết bị.");
    return model;
  }catch(err){
    model=null;$("modelNotice").classList.remove("hidden");
    throw new Error("Không tải được AI: "+(err.message||err)+". Hãy kiểm tra Internet và thử Chrome mới.");
  }finally{
    loading=false;$("loadingPanel").classList.add("hidden");$("gradeButton").disabled=false;
    $("gradeButton").textContent=model?"✦ Chấm câu này":"✦ Tải AI & chấm câu";
  }
}
function getAssistant(result){
  let x=result&&result[0]?result[0].generated_text:result;
  if(Array.isArray(x)){const a=[...x].reverse().find(m=>m&&m.role==="assistant");return a?.content||x.map(m=>m?.content||"").join("\n");}
  if(typeof x==="string")return x;
  if(x&&typeof x.content==="string")return x.content;
  return "";
}
function parseGrade(raw){
  const s=String(raw).replace(/```(?:json)?/gi,"").trim(),a=s.indexOf("{"),b=s.lastIndexOf("}");
  if(a<0||b<=a)throw new Error("AI chưa trả kết quả đúng định dạng. Hãy chấm lại.");
  const o=JSON.parse(s.slice(a,b+1)),n=(x,m)=>Math.max(0,Math.min(m,Number(x)||0));
  const g={meaning:n(o.meaning_score,4),grammar:n(o.grammar_score,2),vocabulary:n(o.vocabulary_score,2),naturalness:n(o.naturalness_score,2),
    summary:String(o.summary_vi||o.overall_comment||"Mô hình đã đánh giá.").slice(0,1000),
    strengths:Array.isArray(o.strengths)?o.strengths.map(String).slice(0,5):[],
    errors:Array.isArray(o.errors)?o.errors.slice(0,8).map(e=>({severity:e.severity==="major"?"major":"minor",quote:String(e.quote||""),issue:String(e.issue||""),correction:String(e.correction||""),explanation:String(e.explanation_vi||e.explanation||"")})):[],
    sample:String(o.sample_answer||o.model_answer||"").slice(0,600),
    grammarNotes:Array.isArray(o.grammar_notes)?o.grammar_notes.map(String).slice(0,4):[],
    vocabularyNotes:Array.isArray(o.vocabulary_notes)?o.vocabulary_notes.map(String).slice(0,4):[],
    advice:String(o.advice_vi||o.advice||"").slice(0,400)};
  g.total=Math.round((g.meaning+g.grammar+g.vocabulary+g.naturalness)*10)/10;
  if(!g.sample)throw new Error("AI chưa tạo đáp án mẫu. Hãy chấm lại.");
  return g;
}
function graderPrompt(vn,answer){
  const system="Bạn là giám khảo dịch Việt-Anh cho người học A2–B1, khoảng IELTS 4.0–4.5. Chấm công bằng, không bắt buộc dịch sát từng chữ; chấp nhận mọi cách diễn đạt tương đương đúng ngữ cảnh. Đánh giá đủ ý, quan hệ và sắc thái câu gốc. Điểm: meaning tối đa 4 (4 đủ chính xác; 3 đúng ý chính thiếu nhỏ; 2 thiếu phần đáng kể; 1 sai lệch lớn; 0 không truyền đạt); grammar tối đa 2; vocabulary tối đa 2; naturalness tối đa 2. Không bịa lỗi, nếu đúng thì errors là []. Phân biệt major (sai nghĩa/thiếu ý) và minor (ngữ pháp/từ vựng). Giải thích bằng tiếng Việt dễ hiểu, đưa một đáp án mẫu đầy đủ và ghi chú học tập. Chỉ trả JSON theo schema: {meaning_score:number,grammar_score:number,vocabulary_score:number,naturalness_score:number,summary_vi:string,strengths:string[],errors:[{severity:major|minor,quote:string,issue:string,correction:string,explanation_vi:string}],sample_answer:string,grammar_notes:string[],vocabulary_notes:string[],advice_vi:string}.";
  return [{role:"system",content:system},{role:"user",content:"Câu gốc tiếng Việt: "+vn+"\nBản dịch tiếng Anh của người học: "+answer+"\nHãy chấm và chấp nhận các cách dịch tương đương hợp lý."}];
}
async function gradeCurrent(){
  const answer=$("answerInput").value.trim();
  if(!answer){toast("Bạn hãy nhập bản dịch trước khi chấm.");$("answerInput").focus();return null;}
  if(grading)return null;
  grading=true;$("gradeButton").disabled=true;$("gradeButton").textContent="Đang chấm…";
  $("loadingPanel").classList.remove("hidden");$("loadingTitle").textContent="AI đang chấm nghĩa, ngữ pháp và từ vựng…";
  $("loadingDetail").textContent="Bản dịch được phân tích trên thiết bị của bạn.";
  try{
    const engine=await loadModel();
    const out=await engine(graderPrompt(topic.questions[qIndex],answer),{max_new_tokens:560,temperature:0.1,do_sample:false,return_full_text:false});
    const g=parseGrade(getAssistant(out)),e=entry();
    e.text=answer;e.grade=g;e.gradedAnswer=answer;e.gradedAt=new Date().toISOString();put(topic.id,qIndex,e);
    $("gradeState").textContent="✓ Đã chấm · "+g.total+"/10";$("gradeState").className="grade-state done";
    renderGrade(g);renderHome();renderTopicIfOpen();renderJump();
    toast("Đã chấm xong: "+g.total+"/10");return g;
  }catch(err){toast(err.message||"Có lỗi khi chấm bài.");return null;}
  finally{
    grading=false;$("loadingPanel").classList.add("hidden");$("gradeButton").disabled=false;
    $("gradeButton").textContent=model?"✦ Chấm lại câu này":"✦ Tải AI & chấm câu";
  }
}
function listHtml(a){return a&&a.length?"<ul>"+a.map(x=>"<li>"+esc(x)+"</li>").join("")+"</ul>":"<p>Chưa có ghi chú bổ sung.</p>";}
function renderGrade(g){
  const errors=g.errors.length?g.errors.map(e=>'<div class="error-item '+(e.severity==="major"?"":"minor")+'"><strong>'+(e.severity==="major"?"LỖI QUAN TRỌNG":"GỢI Ý SỬA NHỎ")+(e.quote?" · “"+esc(e.quote)+"”":"")+'</strong><p><b>Vấn đề:</b> '+esc(e.issue)+'</p>'+(e.correction?'<p><b>Cách sửa:</b> '+esc(e.correction)+'</p>':"")+(e.explanation?'<p>'+esc(e.explanation)+'</p>':"")+'</div>').join(""):"<p>Không phát hiện lỗi đáng kể trong câu trả lời.</p>";
  $("gradePanel").classList.remove("hidden");
  $("gradePanel").innerHTML='<div class="grade-banner"><div class="grade-score">'+g.total+'<small>/10</small></div><div class="grade-summary"><strong>Kết quả chấm bản dịch</strong><p>'+esc(g.summary)+'</p></div></div><div class="grade-body"><div class="score-grid"><div class="score-item"><span>Đúng nghĩa · /4</span><strong>'+g.meaning+'/4</strong></div><div class="score-item"><span>Ngữ pháp · /2</span><strong>'+g.grammar+'/2</strong></div><div class="score-item"><span>Từ vựng · /2</span><strong>'+g.vocabulary+'/2</strong></div><div class="score-item"><span>Tự nhiên · /2</span><strong>'+g.naturalness+'/2</strong></div></div><div class="feedback-section"><h4>✓ Điểm bạn làm tốt</h4>'+listHtml(g.strengths)+'</div><div class="feedback-section"><h4>✎ Lỗi sai và cách sửa</h4>'+errors+'</div><div class="feedback-section"><h4>Đáp án mẫu tự nhiên</h4><div class="sample-answer">'+esc(g.sample)+'</div></div><div class="feedback-section"><h4>Ngữ pháp cần nhớ</h4>'+listHtml(g.grammarNotes)+'</div><div class="feedback-section"><h4>Từ vựng hữu ích</h4>'+listHtml(g.vocabularyNotes)+'</div>'+(g.advice?'<div class="feedback-section"><h4>Lời khuyên</h4><p>'+esc(g.advice)+'</p></div>':"")+'</div>';
}
function renderTopicIfOpen(){if(!$("topicView").classList.contains("hidden")&&topic)renderTopic();}
async function ensureGraded(){
  const answer=$("answerInput").value.trim();
  if(!answer)return confirm("Bạn chưa nhập câu trả lời. Bạn muốn bỏ qua câu này?");
  const e=entry();
  if(e.grade&&e.gradedAnswer===answer)return true;
  const g=await gradeCurrent();
  if(!g)return false;
  toast("Đã chấm câu này. Nhấn tiếp một lần nữa để chuyển câu.");
  return false;
}
async function move(delta){
  const next=qIndex+delta;if(next<0||next>29)return;
  if(!await ensureGraded())return;
  openPractice(next);
}
function openPractice(i){qIndex=Math.max(0,Math.min(29,i));data.last={topicId:topic.id,index:qIndex};save();renderPractice();view("practice");}
function renderReview(){
  const rows=[];
  topics.forEach(t=>t.questions.forEach((q,i)=>{const e=entry(t.id,i);if(e.text.trim())rows.push({t,q,i,e,done:e.grade&&e.gradedAnswer===e.text});}));
  const done=rows.filter(r=>r.done),avg=done.length?done.reduce((s,r)=>s+r.e.grade.total,0)/done.length:0;
  $("reviewSummary").innerHTML='<div class="review-stat"><strong>'+rows.length+'/150</strong><span>Câu đã nhập</span></div><div class="review-stat"><strong>'+done.length+'/150</strong><span>Câu đã chấm</span></div><div class="review-stat"><strong>'+avg.toFixed(1)+'/10</strong><span>Điểm trung bình</span></div>';
  $("reviewList").innerHTML=rows.length?rows.map(r=>'<article class="review-item"><div class="review-item-head"><strong>'+esc(r.t.titleEn)+' · Câu '+(r.i+1)+'</strong><span>'+(r.done?r.e.grade.total+"/10":r.e.grade?"Cần chấm lại":"Chưa chấm")+'</span></div><p class="review-prompt">'+esc(r.q)+'</p><div class="review-answer">'+esc(r.e.text)+'</div>'+(r.done?'<p class="review-feedback">'+esc(r.e.grade.summary)+'</p><button class="btn btn-outline review-open" data-topic="'+r.t.id+'" data-index="'+r.i+'">Mở lại câu này</button>':"")+'</article>').join(""):'<div class="empty-state">Bạn chưa nhập câu trả lời nào.</div>';
  document.querySelectorAll(".review-open").forEach(b=>b.onclick=()=>{topic=topics.find(t=>t.id===b.dataset.topic);openPractice(Number(b.dataset.index));});
}
function exportCsv(){
  const rows=[["Chủ đề","Câu","Câu tiếng Việt","Bản dịch","Trạng thái","Điểm","Đúng nghĩa /4","Ngữ pháp /2","Từ vựng /2","Tự nhiên /2","Nhận xét","Đáp án mẫu"]];
  topics.forEach(t=>t.questions.forEach((q,i)=>{const e=entry(t.id,i);if(!e.text.trim())return;const g=e.grade&&e.gradedAnswer===e.text?e.grade:null;rows.push([t.titleEn,i+1,q,e.text,g?"Đã chấm":"Chưa chấm",g?.total??"",g?.meaning??"",g?.grammar??"",g?.vocabulary??"",g?.naturalness??"",g?.summary??"",g?.sample??""]);}));
  const csv="\ufeff"+rows.map(r=>r.map(v=>{const x=String(v??"").replace(/^[=+@-]/,"'$&");return '"'+x.replace(/"/g,'""')+'"';}).join(",")).join("\r\n");
  const a=document.createElement("a"),url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.href=url;a.download="flashpractice-bai-lam.csv";a.click();URL.revokeObjectURL(url);
}
$("answerInput").addEventListener("input",()=>{
  if(!topic)return;const e=entry(),text=$("answerInput").value;e.text=text;put(topic.id,qIndex,e);
  $("wordCount").textContent=(text.trim()?text.trim().split(/\s+/).length:0)+" từ";
  if(e.grade&&e.gradedAnswer!==text){$("gradeState").textContent="Cần chấm lại";$("gradeState").className="grade-state stale";$("gradePanel").classList.add("hidden");}
  else if(!e.grade){$("gradeState").textContent="Chưa chấm";$("gradeState").className="grade-state";}
  renderJump();renderHome();
});
$("gradeButton").onclick=async()=>{try{await loadModel();await gradeCurrent();}catch(e){toast(e.message);}};
$("prevQuestion").onclick=()=>move(-1);$("nextQuestion").onclick=()=>move(1);
$("backToTopic").onclick=()=>{renderTopic();view("topic");};
$("exportCsv").onclick=exportCsv;$("printReview").onclick=()=>window.print();
document.querySelectorAll(".nav-link").forEach(b=>b.onclick=()=>{if(b.dataset.view==="review"){renderReview();view("review");}else{renderHome();view("home");}});
document.querySelectorAll("[data-go=home]").forEach(b=>b.onclick=()=>{renderHome();view("home");});
renderHome();