# specs2glossary
Gather &amp; display terms from the Solid specifications

This is a script to be run on the console. It gathers information from https://solidproject.org/TR/

  1. Get URLs of specs by parsing the RDFa at /TR/.                           
  2. For each spec, parse its RDFa to find definitions.                       
  3. Create RDFa content from all definitions.                                
  4. Use RDFa tags as CSS selectors to style the definitions.                 
  5. Create the technical glossary HTML+RDFa page.                            
 
## Install and run
* git clone https://github.com/jeff-zucker/specs2glossary.git
* npm install
* npm run build

This will create the tech-glossary.html file. See the [demo](https://jeff-zucker.github.io/specs2glossary/tech-glossary.html).
