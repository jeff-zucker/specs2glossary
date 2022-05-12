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
let store = $rdf.graph();

let URI = "https://example.com/example.ttl";

let ISA = $rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
let SKOS = $rdf.Namespace("http://www.w3.org/2004/02/skos/core#");

async function main(){
  let HTML = "";
  let specURLs = await getSpecURLs();
  let turtle = await runQuery( specURLs );
  $rdf.parse(turtle, store, URI, "text/turtle");
  for(let stmt of store.match(null,ISA,SKOS("Concept"))){
    let source = stmt.subject;
    let term = store.any(source,SKOS("prefLabel"));
    let definition = store.any(source,SKOS("definition"));
    if(!source || !term || !definition) continue;
    HTML += createRecurringRDFa(term.value,definition.value,source.value);    
  }
  console.log( topRDFa(),HTML,bottomRDFa() );
}

function topRDFa(){
  return `<!DOCTYPE html>
<html lang="en" xml:lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8" />
</head>
<body typeof="skos:ConceptScheme" about="" prefix="skos: http://www.w3.org/2004/02/skos/core# prov: http://www.w3.org/ns/prov# schema: http://schema.org/">                            

    <h1 property="skos:prefLabel">
        Glossary of terms defined in the Solid Specifications
    </h1>

    <p typeof="schema:description">
        Generated from the specfications using 
        <a rel="prov:wasDerivedFrom" href="https://github.com/jeff-zucker/specs2glossary">
            https://github.com/jeff-zucker/specs2gloss
        </a>
    </p>

`;
}

function bottomRDFa(){
  return `
<style>
    body[typeof="skos:ConceptScheme"] {
       padding-left:1em;
       font-family : Verdana, Helvetica, Sans-Serif;
    }
    div[typeof="skos:Concept"] {
      margin-bottom:1em;
    }
    div[property="skos:prefLabel"] {
      font-weight:bold;
      font-size:100.5%;
    }
    div[property="skos:definition"] {
      margin-top:0.25em;
      padding-left:1em;
    }
    div[typeof="skos:Concept"] a[rel="prov:wasDerivedFrom"] {
      display:block;
      font-size:small;
      padding-left:1em;
      margin-top:0.25em;
      margin-bottom:1em;
    }
  
</style>
</body></html>
`
}
function createRecurringRDFa(term,definition,source){
  return `
    <div typeof="skos:Concept">
      <div property="skos:prefLabel">${term}</div>
      <div property="skos:definition">${definition}</div>
      <a href="${source}" rel="prov:wasDerivedFrom">${source}</a>
    </div>
  `;
}


/* Get URLs of all current specs from solidproject.org/TR/
 *
 * TBD - have Sarven edit /TR/ to use RDFa instead of having to parse HTML
 */
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


/*  Get triples from each spec
 *
 *  TBD : do this part in rdflib instead
 */
async function runQuery(fromList){
    let distiller = 
      `http://rdf.greggkellogg.net/distiller`
      + `?command=serialize`
      + `&output_format=turtle`
      + `&raw=`
      + `&url=`
    ;

    let whereClause = 
      `{ ?s a <http://www.w3.org/2004/02/skos/core#Concept> . ?s ?p ?o . }`;

    let fromClause = "";
    for(fromUri of fromList){
      if(fromUri.match(/primer/i)) continue;
      fromClause += `FROM <${distiller}${fromUri}>\n`
    }
    let query = encodeURIComponent(
      `CONSTRUCT\r\n${fromClause}WHERE ${whereClause} ORDER BY ?s`
    );
    let uri=`http://sparql.org/sparql?query=${query}&default-graph-uri=&output=ttl`;
    try {
       let response = await fetch(uri) ;
       return await response.text();
    }
    catch(e){}
}

main();

// ENDS
