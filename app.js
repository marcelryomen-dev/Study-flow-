const $=id=>document.getElementById(id);
let tasks=JSON.parse(localStorage.getItem("sf_tasks")||"[]");
const now=new Date();
$("today").textContent=now.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
$("day").value=["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"][now.getDay()];
function save(){localStorage.setItem("sf_tasks",JSON.stringify(tasks));renderTasks()}
function renderTasks(){$("taskList").innerHTML=tasks.length?tasks.map((t,i)=>`<div class="task"><div><strong>${esc(t.subject)} · ${esc(t.type)}</strong><span>${esc(t.text)}</span><br><small>${t.duration} min · ${esc(t.priority)}</small></div><button class="remove" data-i="${i}">Retirer</button></div>`).join(""):'<p class="muted small">Aucun travail ajouté pour le moment.</p>';document.querySelectorAll(".remove").forEach(b=>b.onclick=()=>{tasks.splice(+b.dataset.i,1);save()})}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("addTask").onclick=()=>{let text=$("taskText").value.trim();if(!text){alert("Écris d'abord ce que tu dois faire.");return}tasks.push({subject:$("taskSubject").value,type:$("taskType").value,text,duration:+$("taskDuration").value,priority:$("taskPriority").value});$("taskText").value="";save()};
function minutes(v){let [h,m]=v.split(":").map(Number);return h*60+m}
function clock(v){let h=Math.floor(v/60)%24,m=v%60;return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")}
function addSlot(arr,start,dur,title,desc){arr.push({start,end:start+dur,title,desc});return start+dur}
$("generate").onclick=()=>{
 const bed=minutes($("bedtime").value), end=minutes($("schoolEnd").value);
 let start=Math.max(end+30,17*60); if($("day").value==="Mercredi")start=Math.max(end+30,15*60);if($("day").value==="Jeudi")start=Math.max(end+30,14*60);
 let schedule=[];let t=start;
 const urgent=tasks.filter(x=>x.priority==="Urgent"), important=tasks.filter(x=>x.priority==="Important"), later=tasks.filter(x=>x.priority==="Peut attendre");
 const ordered=[...urgent,...important,...later];
 const energy=$("energy").value;
 const workBlock=energy==="Faible"?25:energy==="Moyenne"?35:45;
 for(const item of ordered){let remaining=item.duration;while(remaining>0&&t<bed-55){let d=Math.min(remaining,workBlock,bed-55-t);if(d<15)break;t=addSlot(schedule,t,d,item.subject+" — "+item.type,item.text);remaining-=d;if(remaining>0||t<bed-65)t=addSlot(schedule,t,8,"Pause","Bois de l'eau, bouge un peu, repose tes yeux.");}if(remaining>0)schedule.push({start:null,title:"À reporter : "+item.subject,desc:item.text+" ("+remaining+" min restantes)"})}
 const tomorrow=$("tomorrowSubjects").value.trim();const lessons=$("lessons").value.trim();
 if(tomorrow||lessons){let d=energy==="Faible"?20:30;if(t+d<bed-35){t=addSlot(schedule,t,d,"Préparer les cours de demain",[(tomorrow?"Matières : "+tomorrow:""),(lessons?"À revoir : "+lessons:"")].filter(Boolean).join(" · "));}}
 if($("sport").value!=="Non"&&t+15<bed-30){t=addSlot(schedule,t,15,"Activité physique légère","Corde à sauter doucement ou mobilité, selon ton énergie.");}
 if(t+10<bed){t=addSlot(schedule,t,10,"Préparer le sac","Vérifie les cahiers, devoirs et fournitures de demain.");}
 if(t<bed-5){schedule.push({start:t,end:bed,title:"Temps calme et coucher",desc:"Temps libre, toilette et préparation au sommeil. Objectif : au lit à "+clock(bed)+"."})}
 $("schedule").innerHTML=schedule.map(s=>`<div class="slot"><time>${s.start===null?"À reporter":clock(s.start)+(s.end?" – "+clock(s.end):"")}</time><div><strong>${esc(s.title)}</strong><p>${esc(s.desc)}</p></div></div>`).join("")||'<p>Ajoute tes tâches pour créer ton programme.</p>';
 $("result").classList.remove("hidden");$("result").scrollIntoView({behavior:"smooth"});
};
$("copy").onclick=async()=>{let text="STUDY FLOW — "+$("day").value+"\n"+[...$("schedule").querySelectorAll(".slot")].map(x=>x.innerText.replace("\n"," : ")).join("\n");try{await navigator.clipboard.writeText(text);$("copy").textContent="Copié !"}catch(e){alert(text)}};
renderTasks();
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
