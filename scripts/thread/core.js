'use strict';
(function(root){
 function neighbors(graph,id){return graph.edges.filter(e=>e.from===id||e.to===id).map(edge=>({edge,node:graph.nodes.find(n=>n.id===(edge.from===id?edge.to:edge.from))})).filter(r=>r.node);}
 function path(graph,from,to){const queue=[[from]],seen=new Set([from]);while(queue.length){const route=queue.shift(),id=route.at(-1);if(id===to)return route;for(const {node} of neighbors(graph,id))if(!seen.has(node.id)){seen.add(node.id);queue.push([...route,node.id]);}}return [];}
 const api={neighbors,path};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ThreadMapModel=Object.freeze(api);
})(typeof globalThis!=='undefined'?globalThis:this);
