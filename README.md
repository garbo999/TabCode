# TabCode for web pages

## Purpose
Display lute or historical guitar tablature in a webpage.

## What is TabCode?
TabCode is a convenient way to notate historical tablature in a computer. It was created by Tim Crawford in the 1990s. There is a basic description [here]. More details are given [in this article]. TabCode has been further developed as part of the [ECOLM] project.

## How to try the code (simple)

Download one of the compressed packages (ZIP or TAR format) and save the files somewhere on your computer. You should then be able to open the example files (e.g. TabCode_EXAMPLE_1.html) directly with your browser.

* [TabCode in ZIP format][Reference text 1]
* [TabCode in TAR format][Reference text 2]

If you have a basic understanding of HTML (and are willing to copy and paste some Javacript), you can integrate TabCode into your own website. 

## How to try the code (advanced)

Use a Git client to fork the code to your machine.

## The 1st example file: `TabCode_EXAMPLE_1.html`

This is the smallest possible example. The necessary CSS and Javascript files are loaded in the head of the file:

```html
...
<link type="text/css" rel="stylesheet" href="css/newlook.css" />
<link type="text/css" rel="stylesheet" href="css/render.css" />
<script type="text/javascript" src="js/jquery-1.4.4.js"></script>
<script type="text/javascript" src="js/tabcode.js"></script>
...
```

The body of the page has an SVG element for the TabCode graphic:

```html
...
<svg id="notation"></svg>
...
```

Finally, a script runs to display the TabCode in the SVG element:

```javascript
...
var my_tabcode_tablature = "M(C/) \
  E.a2a3c5 Sc2 Ed2 Ea2 Ed2a3c5 Ea1 Ec2a3 Eb5 | \
  E.a2a3c5 Sc2 Ed2 Ec2a5 Ed2b3d6 Ea1 Qc1c2e3c6 :|";
...
  tabcode_doc = new Tablature(my_tabcode_tablature, svg_element, params);
  tabcode_doc.draw();
```

## Installation questions, bug reports, etc.

Use the Issues page provided by Github for questions and bug reports: 

* [Github Issues page for TabCode][Reference text 3]

## Thanks

Thanks to Tim Crawford, David Lewis and Richard Lewis at Goldsmiths College, University of London for sharing the Javascript code behind TabCode and for answering my questions.

[Reference text 1]: https://github.com/garbo999/TabCode/zipball/master
[Reference text 2]: https://github.com/garbo999/TabCode/tarball/master
[Reference text 3]: https://github.com/garbo999/TabCode/issues
[here]: http://www.doc.gold.ac.uk/~mas01tc/web/ttc/TabCode.html
[ECOLM]: http://www.ecolm.org/
[in this article]: http://doc.gold.ac.uk/isms/ecolm/?page=TabCode

