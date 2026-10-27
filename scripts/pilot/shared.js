'use strict';
(function(root){
 const types={work:'Work',collection:'Collection',edition:'Edition',adaptation:'Screen adaptation',person:'Creator',character:'Character',location:'Place',series:'Series'};
 const kinds={novel:'Novel',novella:'Novella','short-story':'Short story',poem:'Poem',comic:'Comic',nonfiction:'Nonfiction',essay:'Essay',screenplay:'Screenplay','children-book':'Picture book','dramatic-work':'Stage musical'};
 const relations={sequel_to:['Sequel to','Continues in'],prequel_to:['Prequel to','Has a prequel'],appears_in:['Appears in','Features'],mentioned_in:['Mentioned in','Mentions'],set_in:['Set in','Setting of'],part_of_series:['Part of series','In this series'],adaptation_of:['Based on','Adapted as'],inspired_by:['Inspired by','Inspired'],shared_reference:['Shared reference','Shared reference'],shared_cosmology:['Shared world','Shared world'],thematic_parallel:['Thematic connection','Thematic connection'],same_as:['Same identity','Same identity'],shares_character_with:['Shared character','Shared character'],shares_location_with:['Shared place','Shared place'],references_work:['Refers to','Referenced by'],dark_tower_connection:['Tower connection','Tower connection'],remake_of:['Remake of','Remade as']};
 const roles={author:'Author',coauthor:'Co-author',editor:'Editor',contributor:'Contributor',illustrator:'Illustrator',photographer:'Photographer',translator:'Translator',foreword:'Introduction',director:'Director',actor:'Cast',screenwriter:'Screenwriter',producer:'Producer',showrunner:'Showrunner',creator:'Creator'};
 const fold=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ');
 const validId=s=>/^(wrk|col|edn|adp|per|chr|loc|ser):\d{6}$/.test(s||'');
 function routeId(query){const id=new URLSearchParams(query).get('entity')||'wrk:000001';return validId(id)?id:null;}
 function relationLabel(e){return (relations[e.predicate]||['Connection','Connection'])[e.reverse?1:0];}
 function typeLabel(n){return kinds[n.kind||n.data?.kind]||types[n.type]||'Record';}
 function filterConnections(rows,kind='all',certainty='all'){return rows.filter(e=>(kind==='all'||(kind==='books'?['work','collection'].includes(e.target.type):e.target.type===kind))&&(certainty==='all'||e.certainty===certainty));}
 function search(rows,query,type='all'){const tokens=fold(query).trim().split(/\s+/).filter(Boolean);return rows.filter(r=>(type==='all'||r.type===type)&&tokens.every(t=>fold([r.label,...r.alternatives,r.type,types[r.type],kinds[r.kind]||''].join(' ')).includes(t)));}
 function dateLabel(d){if(!d?.value)return 'Unconfirmed';const [year,month,day]=d.value.split('-');if(d.precision==='year')return year;const m=['January','February','March','April','May','June','July','August','September','October','November','December'][Number(month)-1];return d.precision==='day'?Number(day)+' '+m+' '+year:m+' '+year;}
 function groupConnections(rows){const groups=new Map();for(const e of rows){if(!groups.has(e.target.id))groups.set(e.target.id,{target:e.target,edges:[]});groups.get(e.target.id).edges.push(e);}return [...groups.values()];}
 function icon(n,predicate){return predicate==='dark_tower_connection'?'⊙':({work:'▤',collection:'▥',edition:'▧',adaptation:'▷',person:'○',character:'♙',location:'◇',series:'↗'}[n.type]||'·');}

 function artworkInTerm(media,day=new Date().toISOString().slice(0,10)){return !media?.validUntil||/^\d{4}-\d{2}-\d{2}$/.test(media.validUntil)&&day<=media.validUntil;}
 const api={artworkInTerm,types,roles,validId,routeId,relationLabel,typeLabel,filterConnections,search,dateLabel,groupConnections,icon};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PilotCore=Object.freeze(api);
})(typeof globalThis==='undefined'?this:globalThis);
