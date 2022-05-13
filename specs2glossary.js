/* specs2gloss.js - Jeff Zucker, 2022, MIT License
 * 
 * 1. Get URLs of specs by parsing the RDFa at /TR/.
 * 2. For each spec, parse its RDFa to find definitions.
 * 3. Create RDFa content from all definitions.
 * 4. Use RDFa tags as CSS selectors to style the definitions.
 * 5. Create the technical glossary HTML+RDFa page.
 * 
 */

const fetch = require('node-fetch');
const {JSDOM} = require("jsdom");
const $rdf = require("rdflib");

const store = $rdf.graph();
const fetcher = $rdf.fetcher(store);

let URI = "http://localhost/solid/specs2glossary/specs2glossary.ttl";

let ISA = $rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
let SKOS = $rdf.Namespace("http://www.w3.org/2004/02/skos/core#");
let UI = $rdf.Namespace("http://www.w3.org/ns/ui#");

async function main(){
  let recurring = "";
  let template = await getTemplate(URI);
  for(specURL of await getSpecURLs()){
    if(specURL.match(/primer/i)) continue;
    try {
      await fetcher.load(specURL) ;
    }
    catch(e){}
  }
  for(let stmt of store.match(null,ISA,SKOS("Concept"))){
    let source = stmt.subject;
    let term = store.any(source,SKOS("prefLabel"));
    let definition = store.any(source,SKOS("definition"));
    if(!source || !term || !definition) continue;
    recurring += template.recurring.interpolate({
      term: term.value,
      definition: definition.value,
      source: source.value
    });    
  }
  console.log( template.before, recurring, template.after );
}
async function getSpecURLs() {
    var url = 'https://solidproject.org/TR/';
    var ctype = "text/html";
    var response = await fetch( url,{accept:ctype} );
    var dom = new JSDOM(await response.text()).window.document;
    let reports= dom.querySelector('#work-item-technical-reports');
    let anchors= reports.querySelectorAll('[rel="cito:citesForInformation"]');
    let specs = []
    for(var anchor of anchors){
      specs.push(anchor.href)
    }
    return specs
}
async function getTemplate(URI){
  let template = {};
  await fetcher.load(URI);
  let subject = $rdf.sym(URI+"#GlossaryTemplate");
  template.before = store.any( subject,UI("before") ).value;
  template.recurring = store.any( subject,UI("recurring") ).value;
  template.after = store.any( subject,UI("after") ).value;
  return template;
}
/* https://stackoverflow.com/a/41015840/15781258
 * usage :
 *   const template = 'Hello ${var1}!';
 *   const data     = { var1: 'world'};
 *   const interpolated = template.interpolate(data);
 */
String.prototype.interpolate = function(params) {
  const names = Object.keys(params);
  const vals = Object.values(params);
  return new Function(...names, `return \`${this}\`;`)(...vals);
}
main();

// ENDS
