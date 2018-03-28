(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
'use strict'

require('./prettify')
require('./lang-css')


module.exports = function() {
    prettyPrint()

    var source = document.getElementsByClassName('prettyprint source linenums');
    var i = 0;
    var lineNumber = 0;
    var lineId;
    var lines;
    var totalLines;
    var anchorHash;
    var lineNumberHTML = '';

    if (source && source[0]) {
        anchorHash = document.location.hash.substring(1);
        lines = source[0].getElementsByTagName('li');
        totalLines = lines.length;

        for (; i < totalLines; i++) {
            lineNumber++;
            lineId = 'line' + lineNumber;
            lines[i].id = lineId;

            lineNumberHTML = '<span class="number">' + (i + 1) + '</span>';

            lines[i].insertAdjacentHTML('afterBegin', lineNumberHTML);
            if (lineId === anchorHash) {
                lines[i].className += ' selected';
            }
        }
    }
}

},{"./lang-css":2,"./prettify":3}],2:[function(require,module,exports){
PR.registerLangHandler(PR.createSimpleLexer([["pln",/^[\t\n\f\r ]+/,null," \t\r\n"]],[["str",/^"(?:[^\n\f\r"\\]|\\(?:\r\n?|\n|\f)|\\[\S\s])*"/,null],["str",/^'(?:[^\n\f\r'\\]|\\(?:\r\n?|\n|\f)|\\[\S\s])*'/,null],["lang-css-str",/^url\(([^"')]*)\)/i],["kwd",/^(?:url|rgb|!important|@import|@page|@media|@charset|inherit)(?=[^\w-]|$)/i,null],["lang-css-kw",/^(-?(?:[_a-z]|\\[\da-f]+ ?)(?:[\w-]|\\\\[\da-f]+ ?)*)\s*:/i],["com",/^\/\*[^*]*\*+(?:[^*/][^*]*\*+)*\//],["com",
/^(?:<\!--|--\>)/],["lit",/^(?:\d+|\d*\.\d+)(?:%|[a-z]+)?/i],["lit",/^#[\da-f]{3,6}/i],["pln",/^-?(?:[_a-z]|\\[\da-f]+ ?)(?:[\w-]|\\\\[\da-f]+ ?)*/i],["pun",/^[^\s\w"']+/]]),["css"]);PR.registerLangHandler(PR.createSimpleLexer([],[["kwd",/^-?(?:[_a-z]|\\[\da-f]+ ?)(?:[\w-]|\\\\[\da-f]+ ?)*/i]]),["css-kw"]);PR.registerLangHandler(PR.createSimpleLexer([],[["str",/^[^"')]+/]]),["css-str"]);

},{}],3:[function(require,module,exports){
var q=null;window.PR_SHOULD_USE_CONTINUATION=!0;
(function(){function L(a){function m(a){var f=a.charCodeAt(0);if(f!==92)return f;var b=a.charAt(1);return(f=r[b])?f:"0"<=b&&b<="7"?parseInt(a.substring(1),8):b==="u"||b==="x"?parseInt(a.substring(2),16):a.charCodeAt(1)}function e(a){if(a<32)return(a<16?"\\x0":"\\x")+a.toString(16);a=String.fromCharCode(a);if(a==="\\"||a==="-"||a==="["||a==="]")a="\\"+a;return a}function h(a){for(var f=a.substring(1,a.length-1).match(/\\u[\dA-Fa-f]{4}|\\x[\dA-Fa-f]{2}|\\[0-3][0-7]{0,2}|\\[0-7]{1,2}|\\[\S\s]|[^\\]/g),a=
[],b=[],o=f[0]==="^",c=o?1:0,i=f.length;c<i;++c){var j=f[c];if(/\\[bdsw]/i.test(j))a.push(j);else{var j=m(j),d;c+2<i&&"-"===f[c+1]?(d=m(f[c+2]),c+=2):d=j;b.push([j,d]);d<65||j>122||(d<65||j>90||b.push([Math.max(65,j)|32,Math.min(d,90)|32]),d<97||j>122||b.push([Math.max(97,j)&-33,Math.min(d,122)&-33]))}}b.sort(function(a,f){return a[0]-f[0]||f[1]-a[1]});f=[];j=[NaN,NaN];for(c=0;c<b.length;++c)i=b[c],i[0]<=j[1]+1?j[1]=Math.max(j[1],i[1]):f.push(j=i);b=["["];o&&b.push("^");b.push.apply(b,a);for(c=0;c<
f.length;++c)i=f[c],b.push(e(i[0])),i[1]>i[0]&&(i[1]+1>i[0]&&b.push("-"),b.push(e(i[1])));b.push("]");return b.join("")}function y(a){for(var f=a.source.match(/\[(?:[^\\\]]|\\[\S\s])*]|\\u[\dA-Fa-f]{4}|\\x[\dA-Fa-f]{2}|\\\d+|\\[^\dux]|\(\?[!:=]|[()^]|[^()[\\^]+/g),b=f.length,d=[],c=0,i=0;c<b;++c){var j=f[c];j==="("?++i:"\\"===j.charAt(0)&&(j=+j.substring(1))&&j<=i&&(d[j]=-1)}for(c=1;c<d.length;++c)-1===d[c]&&(d[c]=++t);for(i=c=0;c<b;++c)j=f[c],j==="("?(++i,d[i]===void 0&&(f[c]="(?:")):"\\"===j.charAt(0)&&
(j=+j.substring(1))&&j<=i&&(f[c]="\\"+d[i]);for(i=c=0;c<b;++c)"^"===f[c]&&"^"!==f[c+1]&&(f[c]="");if(a.ignoreCase&&s)for(c=0;c<b;++c)j=f[c],a=j.charAt(0),j.length>=2&&a==="["?f[c]=h(j):a!=="\\"&&(f[c]=j.replace(/[A-Za-z]/g,function(a){a=a.charCodeAt(0);return"["+String.fromCharCode(a&-33,a|32)+"]"}));return f.join("")}for(var t=0,s=!1,l=!1,p=0,d=a.length;p<d;++p){var g=a[p];if(g.ignoreCase)l=!0;else if(/[a-z]/i.test(g.source.replace(/\\u[\da-f]{4}|\\x[\da-f]{2}|\\[^UXux]/gi,""))){s=!0;l=!1;break}}for(var r=
{b:8,t:9,n:10,v:11,f:12,r:13},n=[],p=0,d=a.length;p<d;++p){g=a[p];if(g.global||g.multiline)throw Error(""+g);n.push("(?:"+y(g)+")")}return RegExp(n.join("|"),l?"gi":"g")}function M(a){function m(a){switch(a.nodeType){case 1:if(e.test(a.className))break;for(var g=a.firstChild;g;g=g.nextSibling)m(g);g=a.nodeName;if("BR"===g||"LI"===g)h[s]="\n",t[s<<1]=y++,t[s++<<1|1]=a;break;case 3:case 4:g=a.nodeValue,g.length&&(g=p?g.replace(/\r\n?/g,"\n"):g.replace(/[\t\n\r ]+/g," "),h[s]=g,t[s<<1]=y,y+=g.length,
t[s++<<1|1]=a)}}var e=/(?:^|\s)nocode(?:\s|$)/,h=[],y=0,t=[],s=0,l;a.currentStyle?l=a.currentStyle.whiteSpace:window.getComputedStyle&&(l=document.defaultView.getComputedStyle(a,q).getPropertyValue("white-space"));var p=l&&"pre"===l.substring(0,3);m(a);return{a:h.join("").replace(/\n$/,""),c:t}}function B(a,m,e,h){m&&(a={a:m,d:a},e(a),h.push.apply(h,a.e))}function x(a,m){function e(a){for(var l=a.d,p=[l,"pln"],d=0,g=a.a.match(y)||[],r={},n=0,z=g.length;n<z;++n){var f=g[n],b=r[f],o=void 0,c;if(typeof b===
"string")c=!1;else{var i=h[f.charAt(0)];if(i)o=f.match(i[1]),b=i[0];else{for(c=0;c<t;++c)if(i=m[c],o=f.match(i[1])){b=i[0];break}o||(b="pln")}if((c=b.length>=5&&"lang-"===b.substring(0,5))&&!(o&&typeof o[1]==="string"))c=!1,b="src";c||(r[f]=b)}i=d;d+=f.length;if(c){c=o[1];var j=f.indexOf(c),k=j+c.length;o[2]&&(k=f.length-o[2].length,j=k-c.length);b=b.substring(5);B(l+i,f.substring(0,j),e,p);B(l+i+j,c,C(b,c),p);B(l+i+k,f.substring(k),e,p)}else p.push(l+i,b)}a.e=p}var h={},y;(function(){for(var e=a.concat(m),
l=[],p={},d=0,g=e.length;d<g;++d){var r=e[d],n=r[3];if(n)for(var k=n.length;--k>=0;)h[n.charAt(k)]=r;r=r[1];n=""+r;p.hasOwnProperty(n)||(l.push(r),p[n]=q)}l.push(/[\S\s]/);y=L(l)})();var t=m.length;return e}function u(a){var m=[],e=[];a.tripleQuotedStrings?m.push(["str",/^(?:'''(?:[^'\\]|\\[\S\s]|''?(?=[^']))*(?:'''|$)|"""(?:[^"\\]|\\[\S\s]|""?(?=[^"]))*(?:"""|$)|'(?:[^'\\]|\\[\S\s])*(?:'|$)|"(?:[^"\\]|\\[\S\s])*(?:"|$))/,q,"'\""]):a.multiLineStrings?m.push(["str",/^(?:'(?:[^'\\]|\\[\S\s])*(?:'|$)|"(?:[^"\\]|\\[\S\s])*(?:"|$)|`(?:[^\\`]|\\[\S\s])*(?:`|$))/,
q,"'\"`"]):m.push(["str",/^(?:'(?:[^\n\r'\\]|\\.)*(?:'|$)|"(?:[^\n\r"\\]|\\.)*(?:"|$))/,q,"\"'"]);a.verbatimStrings&&e.push(["str",/^@"(?:[^"]|"")*(?:"|$)/,q]);var h=a.hashComments;h&&(a.cStyleComments?(h>1?m.push(["com",/^#(?:##(?:[^#]|#(?!##))*(?:###|$)|.*)/,q,"#"]):m.push(["com",/^#(?:(?:define|elif|else|endif|error|ifdef|include|ifndef|line|pragma|undef|warning)\b|[^\n\r]*)/,q,"#"]),e.push(["str",/^<(?:(?:(?:\.\.\/)*|\/?)(?:[\w-]+(?:\/[\w-]+)+)?[\w-]+\.h|[a-z]\w*)>/,q])):m.push(["com",/^#[^\n\r]*/,
q,"#"]));a.cStyleComments&&(e.push(["com",/^\/\/[^\n\r]*/,q]),e.push(["com",/^\/\*[\S\s]*?(?:\*\/|$)/,q]));a.regexLiterals&&e.push(["lang-regex",/^(?:^^\.?|[!+-]|!=|!==|#|%|%=|&|&&|&&=|&=|\(|\*|\*=|\+=|,|-=|->|\/|\/=|:|::|;|<|<<|<<=|<=|=|==|===|>|>=|>>|>>=|>>>|>>>=|[?@[^]|\^=|\^\^|\^\^=|{|\||\|=|\|\||\|\|=|~|break|case|continue|delete|do|else|finally|instanceof|return|throw|try|typeof)\s*(\/(?=[^*/])(?:[^/[\\]|\\[\S\s]|\[(?:[^\\\]]|\\[\S\s])*(?:]|$))+\/)/]);(h=a.types)&&e.push(["typ",h]);a=(""+a.keywords).replace(/^ | $/g,
"");a.length&&e.push(["kwd",RegExp("^(?:"+a.replace(/[\s,]+/g,"|")+")\\b"),q]);m.push(["pln",/^\s+/,q," \r\n\t\xa0"]);e.push(["lit",/^@[$_a-z][\w$@]*/i,q],["typ",/^(?:[@_]?[A-Z]+[a-z][\w$@]*|\w+_t\b)/,q],["pln",/^[$_a-z][\w$@]*/i,q],["lit",/^(?:0x[\da-f]+|(?:\d(?:_\d+)*\d*(?:\.\d*)?|\.\d\+)(?:e[+-]?\d+)?)[a-z]*/i,q,"0123456789"],["pln",/^\\[\S\s]?/,q],["pun",/^.[^\s\w"-$'./@\\`]*/,q]);return x(m,e)}function D(a,m){function e(a){switch(a.nodeType){case 1:if(k.test(a.className))break;if("BR"===a.nodeName)h(a),
a.parentNode&&a.parentNode.removeChild(a);else for(a=a.firstChild;a;a=a.nextSibling)e(a);break;case 3:case 4:if(p){var b=a.nodeValue,d=b.match(t);if(d){var c=b.substring(0,d.index);a.nodeValue=c;(b=b.substring(d.index+d[0].length))&&a.parentNode.insertBefore(s.createTextNode(b),a.nextSibling);h(a);c||a.parentNode.removeChild(a)}}}}function h(a){function b(a,d){var e=d?a.cloneNode(!1):a,f=a.parentNode;if(f){var f=b(f,1),g=a.nextSibling;f.appendChild(e);for(var h=g;h;h=g)g=h.nextSibling,f.appendChild(h)}return e}
for(;!a.nextSibling;)if(a=a.parentNode,!a)return;for(var a=b(a.nextSibling,0),e;(e=a.parentNode)&&e.nodeType===1;)a=e;d.push(a)}var k=/(?:^|\s)nocode(?:\s|$)/,t=/\r\n?|\n/,s=a.ownerDocument,l;a.currentStyle?l=a.currentStyle.whiteSpace:window.getComputedStyle&&(l=s.defaultView.getComputedStyle(a,q).getPropertyValue("white-space"));var p=l&&"pre"===l.substring(0,3);for(l=s.createElement("LI");a.firstChild;)l.appendChild(a.firstChild);for(var d=[l],g=0;g<d.length;++g)e(d[g]);m===(m|0)&&d[0].setAttribute("value",
m);var r=s.createElement("OL");r.className="linenums";for(var n=Math.max(0,m-1|0)||0,g=0,z=d.length;g<z;++g)l=d[g],l.className="L"+(g+n)%10,l.firstChild||l.appendChild(s.createTextNode("\xa0")),r.appendChild(l);a.appendChild(r)}function k(a,m){for(var e=m.length;--e>=0;){var h=m[e];A.hasOwnProperty(h)?window.console&&console.warn("cannot override language handler %s",h):A[h]=a}}function C(a,m){if(!a||!A.hasOwnProperty(a))a=/^\s*</.test(m)?"default-markup":"default-code";return A[a]}function E(a){var m=
a.g;try{var e=M(a.h),h=e.a;a.a=h;a.c=e.c;a.d=0;C(m,h)(a);var k=/\bMSIE\b/.test(navigator.userAgent),m=/\n/g,t=a.a,s=t.length,e=0,l=a.c,p=l.length,h=0,d=a.e,g=d.length,a=0;d[g]=s;var r,n;for(n=r=0;n<g;)d[n]!==d[n+2]?(d[r++]=d[n++],d[r++]=d[n++]):n+=2;g=r;for(n=r=0;n<g;){for(var z=d[n],f=d[n+1],b=n+2;b+2<=g&&d[b+1]===f;)b+=2;d[r++]=z;d[r++]=f;n=b}for(d.length=r;h<p;){var o=l[h+2]||s,c=d[a+2]||s,b=Math.min(o,c),i=l[h+1],j;if(i.nodeType!==1&&(j=t.substring(e,b))){k&&(j=j.replace(m,"\r"));i.nodeValue=
j;var u=i.ownerDocument,v=u.createElement("SPAN");v.className=d[a+1];var x=i.parentNode;x.replaceChild(v,i);v.appendChild(i);e<o&&(l[h+1]=i=u.createTextNode(t.substring(b,o)),x.insertBefore(i,v.nextSibling))}e=b;e>=o&&(h+=2);e>=c&&(a+=2)}}catch(w){"console"in window&&console.log(w&&w.stack?w.stack:w)}}var v=["break,continue,do,else,for,if,return,while"],w=[[v,"auto,case,char,const,default,double,enum,extern,float,goto,int,long,register,short,signed,sizeof,static,struct,switch,typedef,union,unsigned,void,volatile"],
"catch,class,delete,false,import,new,operator,private,protected,public,this,throw,true,try,typeof"],F=[w,"alignof,align_union,asm,axiom,bool,concept,concept_map,const_cast,constexpr,decltype,dynamic_cast,explicit,export,friend,inline,late_check,mutable,namespace,nullptr,reinterpret_cast,static_assert,static_cast,template,typeid,typename,using,virtual,where"],G=[w,"abstract,boolean,byte,extends,final,finally,implements,import,instanceof,null,native,package,strictfp,super,synchronized,throws,transient"],
H=[G,"as,base,by,checked,decimal,delegate,descending,dynamic,event,fixed,foreach,from,group,implicit,in,interface,internal,into,is,lock,object,out,override,orderby,params,partial,readonly,ref,sbyte,sealed,stackalloc,string,select,uint,ulong,unchecked,unsafe,ushort,var"],w=[w,"debugger,eval,export,function,get,null,set,undefined,var,with,Infinity,NaN"],I=[v,"and,as,assert,class,def,del,elif,except,exec,finally,from,global,import,in,is,lambda,nonlocal,not,or,pass,print,raise,try,with,yield,False,True,None"],
J=[v,"alias,and,begin,case,class,def,defined,elsif,end,ensure,false,in,module,next,nil,not,or,redo,rescue,retry,self,super,then,true,undef,unless,until,when,yield,BEGIN,END"],v=[v,"case,done,elif,esac,eval,fi,function,in,local,set,then,until"],K=/^(DIR|FILE|vector|(de|priority_)?queue|list|stack|(const_)?iterator|(multi)?(set|map)|bitset|u?(int|float)\d*)/,N=/\S/,O=u({keywords:[F,H,w,"caller,delete,die,do,dump,elsif,eval,exit,foreach,for,goto,if,import,last,local,my,next,no,our,print,package,redo,require,sub,undef,unless,until,use,wantarray,while,BEGIN,END"+
I,J,v],hashComments:!0,cStyleComments:!0,multiLineStrings:!0,regexLiterals:!0}),A={};k(O,["default-code"]);k(x([],[["pln",/^[^<?]+/],["dec",/^<!\w[^>]*(?:>|$)/],["com",/^<\!--[\S\s]*?(?:--\>|$)/],["lang-",/^<\?([\S\s]+?)(?:\?>|$)/],["lang-",/^<%([\S\s]+?)(?:%>|$)/],["pun",/^(?:<[%?]|[%?]>)/],["lang-",/^<xmp\b[^>]*>([\S\s]+?)<\/xmp\b[^>]*>/i],["lang-js",/^<script\b[^>]*>([\S\s]*?)(<\/script\b[^>]*>)/i],["lang-css",/^<style\b[^>]*>([\S\s]*?)(<\/style\b[^>]*>)/i],["lang-in.tag",/^(<\/?[a-z][^<>]*>)/i]]),
["default-markup","htm","html","mxml","xhtml","xml","xsl"]);k(x([["pln",/^\s+/,q," \t\r\n"],["atv",/^(?:"[^"]*"?|'[^']*'?)/,q,"\"'"]],[["tag",/^^<\/?[a-z](?:[\w-.:]*\w)?|\/?>$/i],["atn",/^(?!style[\s=]|on)[a-z](?:[\w:-]*\w)?/i],["lang-uq.val",/^=\s*([^\s"'>]*(?:[^\s"'/>]|\/(?=\s)))/],["pun",/^[/<->]+/],["lang-js",/^on\w+\s*=\s*"([^"]+)"/i],["lang-js",/^on\w+\s*=\s*'([^']+)'/i],["lang-js",/^on\w+\s*=\s*([^\s"'>]+)/i],["lang-css",/^style\s*=\s*"([^"]+)"/i],["lang-css",/^style\s*=\s*'([^']+)'/i],["lang-css",
/^style\s*=\s*([^\s"'>]+)/i]]),["in.tag"]);k(x([],[["atv",/^[\S\s]+/]]),["uq.val"]);k(u({keywords:F,hashComments:!0,cStyleComments:!0,types:K}),["c","cc","cpp","cxx","cyc","m"]);k(u({keywords:"null,true,false"}),["json"]);k(u({keywords:H,hashComments:!0,cStyleComments:!0,verbatimStrings:!0,types:K}),["cs"]);k(u({keywords:G,cStyleComments:!0}),["java"]);k(u({keywords:v,hashComments:!0,multiLineStrings:!0}),["bsh","csh","sh"]);k(u({keywords:I,hashComments:!0,multiLineStrings:!0,tripleQuotedStrings:!0}),
["cv","py"]);k(u({keywords:"caller,delete,die,do,dump,elsif,eval,exit,foreach,for,goto,if,import,last,local,my,next,no,our,print,package,redo,require,sub,undef,unless,until,use,wantarray,while,BEGIN,END",hashComments:!0,multiLineStrings:!0,regexLiterals:!0}),["perl","pl","pm"]);k(u({keywords:J,hashComments:!0,multiLineStrings:!0,regexLiterals:!0}),["rb"]);k(u({keywords:w,cStyleComments:!0,regexLiterals:!0}),["js"]);k(u({keywords:"all,and,by,catch,class,else,extends,false,finally,for,if,in,is,isnt,loop,new,no,not,null,of,off,on,or,return,super,then,true,try,unless,until,when,while,yes",
hashComments:3,cStyleComments:!0,multilineStrings:!0,tripleQuotedStrings:!0,regexLiterals:!0}),["coffee"]);k(x([],[["str",/^[\S\s]+/]]),["regex"]);window.prettyPrintOne=function(a,m,e){var h=document.createElement("PRE");h.innerHTML=a;e&&D(h,e);E({g:m,i:e,h:h});return h.innerHTML};window.prettyPrint=function(a){function m(){for(var e=window.PR_SHOULD_USE_CONTINUATION?l.now()+250:Infinity;p<h.length&&l.now()<e;p++){var n=h[p],k=n.className;if(k.indexOf("prettyprint")>=0){var k=k.match(g),f,b;if(b=
!k){b=n;for(var o=void 0,c=b.firstChild;c;c=c.nextSibling)var i=c.nodeType,o=i===1?o?b:c:i===3?N.test(c.nodeValue)?b:o:o;b=(f=o===b?void 0:o)&&"CODE"===f.tagName}b&&(k=f.className.match(g));k&&(k=k[1]);b=!1;for(o=n.parentNode;o;o=o.parentNode)if((o.tagName==="pre"||o.tagName==="code"||o.tagName==="xmp")&&o.className&&o.className.indexOf("prettyprint")>=0){b=!0;break}b||((b=(b=n.className.match(/\blinenums\b(?::(\d+))?/))?b[1]&&b[1].length?+b[1]:!0:!1)&&D(n,b),d={g:k,h:n,i:b},E(d))}}p<h.length?setTimeout(m,
250):a&&a()}for(var e=[document.getElementsByTagName("pre"),document.getElementsByTagName("code"),document.getElementsByTagName("xmp")],h=[],k=0;k<e.length;++k)for(var t=0,s=e[k].length;t<s;++t)h.push(e[k][t]);var e=q,l=Date;l.now||(l={now:function(){return+new Date}});var p=0,d,g=/\blang(?:uage)?-([\w.]+)(?!\S)/;m()};window.PR={createSimpleLexer:x,registerLangHandler:k,sourceDecorator:u,PR_ATTRIB_NAME:"atn",PR_ATTRIB_VALUE:"atv",PR_COMMENT:"com",PR_DECLARATION:"dec",PR_KEYWORD:"kwd",PR_LITERAL:"lit",
PR_NOCODE:"nocode",PR_PLAIN:"pln",PR_PUNCTUATION:"pun",PR_SOURCE:"src",PR_STRING:"str",PR_TAG:"tag",PR_TYPE:"typ"}})();

},{}],4:[function(require,module,exports){
const CodeHighlight = require('./code_highlight')
const Search = require('./search')


class RTD {

    constructor() {
        this.$ = {}

        this.$.main = $('#main')
        this.$.nav = $('nav')
        this.$.resizer = $('#resizer')
        this.$.scroll = $('.nav-scroll-container')

        this.$.apiTab = $('#api-tab')
        this.$.manualsTab = $('#manuals-tab')

        // Determine which category tab must be active.
        if (window.isManual || (!location.pathname.includes('.html') && !location.hash.includes('#api'))) {
            this.showManualsTab()
        } else {
            this.showApiTab()
        }

        // Targets the current page in the navigation.
        if (window.isApi) {
            let longnameSelector = window.doc.longname.replace(/[~|:|.]/g, '_')
            this.$.selectedApiSubItem = $(`#${longnameSelector}_sub`)
            this.$.selectedApiSubItem.removeClass('hidden')
            let selectedApiItem = this.$.selectedApiSubItem.prev()
            selectedApiItem.addClass('selected')
            // Try to position selectedApiItem at the top of the scroll container.
            let navScrollTop = this.$.scroll.get(0)
            if (navScrollTop) navScrollTop = navScrollTop.getBoundingClientRect().top
            let navItemTop = selectedApiItem.get(0)
            if (navItemTop) navItemTop = navItemTop.getBoundingClientRect().top

            this.$.scroll.scrollTop(navItemTop - navScrollTop + 1)
            // Height of the item from the top of the scroll container.
            this.$.selectedApiSubItem.parent().find('.fa').removeClass('fa-plus').addClass('fa-minus')
        }

        this.selectHref()

        this.codehighlight = new CodeHighlight()
        this.search = new Search()

        this.events()
    }


    events() {
        this.$.apiTab.on('click', this.showApiTab.bind(this))
        this.$.manualsTab.on('click', this.showManualsTab.bind(this))

        this.$.nav.find('.nav-api').each(function() {
            $(this).find('.toggle-subnav')
                .filter(function() {
                    // Keeps subnavs without items invisible.
                    return $(this).next().next(':empty').length === 0;
                }).each(function() {
                    $(this).removeClass('invisible').on('click', function(e) {
                        $(e.currentTarget).next().next().toggleClass('hidden')
                        $(e.currentTarget).toggleClass('fa-plus fa-minus')
                    })
                })
        })

        function resize(event) {
            var clientX = event.clientX
            clientX = Math.max(200, clientX)
            clientX = Math.min(500, clientX)
            this.$.nav.css('width', clientX)
            this.$.resizer.css('left', clientX)
            this.$.main.css('left', clientX + this.$.resizer.width())
        }

        function detachResize() {
            $(window).off({mousemove: resize, mouseup: detachResize})
        }

        this.$.resizer.on('mousedown', function() {
            $(window).on({mousemove: resize, mouseup: detachResize})
        })

        window.addEventListener('hashchange', this.selectHref.bind(this), false)
    }


    /**
     * The manual tab.
     */
    showManualsTab() {
        this.$.apiTab.removeClass('selected')
        this.$.manualsTab.addClass('selected')
        $('.nav-api').addClass('hidden')
        $('.nav-manuals').removeClass('hidden')
    }


    /**
     * The API tab.
     */
    showApiTab() {
        this.$.manualsTab.removeClass('selected')
        this.$.apiTab.addClass('selected')
        $('.nav-api').removeClass('hidden')
        $('.nav-manuals').addClass('hidden')
    }


    /**
     * Add a selected class to a link with a matching href.
     */
    selectHref() {
        // Remove selected from all
        $('.sub-nav-item a').removeClass('selected')
        let hrefMatch = location.pathname.split('/').pop()
        if (hrefMatch.includes('tutorial')) {
            hrefMatch = `.nav-item.${hrefMatch.replace('.html', '').split('-').pop()}`
        } else if (hrefMatch !== '') {
            hrefMatch = `a[href="${hrefMatch}${location.hash}"]`
        }

        if (hrefMatch) {
            const node = document.querySelector(hrefMatch)
            if (node) node.classList.add('selected')
        }

    }
}

$(() => {
    window.rtd = new RTD()
})

},{"./code_highlight":1,"./search":5}],5:[function(require,module,exports){
'use strict'

const KEY_CODE_UP = 38
const KEY_CODE_DOWN = 40
const KEY_CODE_ENTER = 13

class Search {

    constructor() {

        this.$ = {}
        this.$.searchContainer = $('.js-search')
        this.$.searchInput = this.$.searchContainer.find('input')
        this.$.searchedList = this.$.searchContainer.find('ul')
        this.$.anchorList = $('nav ul li a')
        this.$.selected = $()
        this.events()
    }


    clear() {
        this.$.searchedList.html('')
        this.$.searchInput.val('')
        this.$.selected = $()
    }


    events() {
        // Remove the search list when clicking outside the working area.
        $(window).on('click', (event) => {
            if (!this.$.searchContainer[0].contains(event.target)) {
                this.clear()
            }
        })

        // Clicking on a searchlist item will go to that page.
        this.$.searchedList.on('click', 'li', (event) => {
            var currentTarget = event.currentTarget
            var url = $(currentTarget).find('a').attr('href')
            this.moveToPage(url)
        })


        this.$.searchInput.on('keyup', (event) => {
            var inputText = this.removeWhiteSpace(this.$.searchInput.val()).toLowerCase()

            if (event.keyCode === KEY_CODE_UP || event.keyCode === KEY_CODE_DOWN) {
                return
            }

            if (!inputText) {
                this.$.searchedList.html('')
                return
            }

            if (event.keyCode === KEY_CODE_ENTER) {
                if (!this.$.selected.length) {
                    this.$.selected = this.$.searchedList.find('li').first()
                }
                this.moveToPage(this.$.selected.find('a').attr('href'))
                return
            }

            this.setList(inputText)
        })


        this.$.searchInput.on('keydown', (event) => {
            this.$.selected.removeClass('highlight')

            switch (event.keyCode) {
            case KEY_CODE_UP:
                this.$.selected = this.$.selected.prev()
                if (!this.$.selected.length) {
                    this.$.selected = this.$.searchedList.find('li').last()
                }
                break
            case KEY_CODE_DOWN:
                this.$.selected = this.$.selected.next()
                if (!this.$.selected.length) {
                    this.$.selected = this.$.searchedList.find('li').first()
                }
                break
            default: break
            }

            this.$.selected.addClass('highlight')
        })
    }


    isMatched(itemText, inputText) {
        return this.removeWhiteSpace(itemText).toLowerCase().indexOf(inputText) > -1
    }


    moveToPage(url) {
        if (url) {
            window.location = url
        }
        this.clear()
    }


    makeListItemHtml(item, inputText) {
        var itemText = item.text
        var itemHref = item.href
        var $parent = $(item).closest('div')
        var memberof = ''

        if ($parent.length && $parent.attr('id')) {
            memberof = $parent.attr('id').replace('_sub', '')
        } else {
            memberof = $(item).closest('div').find('h3').text()
        }

        if (memberof) {
            memberof = `<span class="group">${memberof}</span>`
        }

        itemText = itemText.replace(new RegExp(inputText, 'ig'), (matched) => {
            return `<strong>${matched}</strong>`
        })

        return `<li><a href="${itemHref}">${itemText}</a>${memberof}</li>`
    }


    setList(inputText) {
        var html = ''

        this.$.anchorList.filter((idx, item) => {
            return this.isMatched(item.text, inputText)
        }).each((idx, item) => {
            html += this.makeListItemHtml(item, inputText)
        })
        this.$.searchedList.html(html)
    }

    removeWhiteSpace(value) {
        return value.replace(/\s/g, '');
    }
}

module.exports = Search

},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5ucG0vbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwianMvY29kZV9oaWdobGlnaHQuanMiLCJqcy9sYW5nLWNzcy5qcyIsImpzL3ByZXR0aWZ5LmpzIiwianMvcnRkLmpzIiwianMvc2VhcmNoLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc31yZXR1cm4gZX0pKCkiLCIndXNlIHN0cmljdCdcblxucmVxdWlyZSgnLi9wcmV0dGlmeScpXG5yZXF1aXJlKCcuL2xhbmctY3NzJylcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHByZXR0eVByaW50KClcblxuICAgIHZhciBzb3VyY2UgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdwcmV0dHlwcmludCBzb3VyY2UgbGluZW51bXMnKTtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGxpbmVOdW1iZXIgPSAwO1xuICAgIHZhciBsaW5lSWQ7XG4gICAgdmFyIGxpbmVzO1xuICAgIHZhciB0b3RhbExpbmVzO1xuICAgIHZhciBhbmNob3JIYXNoO1xuICAgIHZhciBsaW5lTnVtYmVySFRNTCA9ICcnO1xuXG4gICAgaWYgKHNvdXJjZSAmJiBzb3VyY2VbMF0pIHtcbiAgICAgICAgYW5jaG9ySGFzaCA9IGRvY3VtZW50LmxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDEpO1xuICAgICAgICBsaW5lcyA9IHNvdXJjZVswXS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnbGknKTtcbiAgICAgICAgdG90YWxMaW5lcyA9IGxpbmVzLmxlbmd0aDtcblxuICAgICAgICBmb3IgKDsgaSA8IHRvdGFsTGluZXM7IGkrKykge1xuICAgICAgICAgICAgbGluZU51bWJlcisrO1xuICAgICAgICAgICAgbGluZUlkID0gJ2xpbmUnICsgbGluZU51bWJlcjtcbiAgICAgICAgICAgIGxpbmVzW2ldLmlkID0gbGluZUlkO1xuXG4gICAgICAgICAgICBsaW5lTnVtYmVySFRNTCA9ICc8c3BhbiBjbGFzcz1cIm51bWJlclwiPicgKyAoaSArIDEpICsgJzwvc3Bhbj4nO1xuXG4gICAgICAgICAgICBsaW5lc1tpXS5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyQmVnaW4nLCBsaW5lTnVtYmVySFRNTCk7XG4gICAgICAgICAgICBpZiAobGluZUlkID09PSBhbmNob3JIYXNoKSB7XG4gICAgICAgICAgICAgICAgbGluZXNbaV0uY2xhc3NOYW1lICs9ICcgc2VsZWN0ZWQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiUFIucmVnaXN0ZXJMYW5nSGFuZGxlcihQUi5jcmVhdGVTaW1wbGVMZXhlcihbW1wicGxuXCIsL15bXFx0XFxuXFxmXFxyIF0rLyxudWxsLFwiIFxcdFxcclxcblxmXCJdXSxbW1wic3RyXCIsL15cIig/OlteXFxuXFxmXFxyXCJcXFxcXXxcXFxcKD86XFxyXFxuP3xcXG58XFxmKXxcXFxcW1xcU1xcc10pKlwiLyxudWxsXSxbXCJzdHJcIiwvXicoPzpbXlxcblxcZlxccidcXFxcXXxcXFxcKD86XFxyXFxuP3xcXG58XFxmKXxcXFxcW1xcU1xcc10pKicvLG51bGxdLFtcImxhbmctY3NzLXN0clwiLC9edXJsXFwoKFteXCInKV0qKVxcKS9pXSxbXCJrd2RcIiwvXig/OnVybHxyZ2J8IWltcG9ydGFudHxAaW1wb3J0fEBwYWdlfEBtZWRpYXxAY2hhcnNldHxpbmhlcml0KSg/PVteXFx3LV18JCkvaSxudWxsXSxbXCJsYW5nLWNzcy1rd1wiLC9eKC0/KD86W19hLXpdfFxcXFxbXFxkYS1mXSsgPykoPzpbXFx3LV18XFxcXFxcXFxbXFxkYS1mXSsgPykqKVxccyo6L2ldLFtcImNvbVwiLC9eXFwvXFwqW14qXSpcXCorKD86W14qL11bXipdKlxcKispKlxcLy9dLFtcImNvbVwiLFxuL14oPzo8XFwhLS18LS1cXD4pL10sW1wibGl0XCIsL14oPzpcXGQrfFxcZCpcXC5cXGQrKSg/OiV8W2Etel0rKT8vaV0sW1wibGl0XCIsL14jW1xcZGEtZl17Myw2fS9pXSxbXCJwbG5cIiwvXi0/KD86W19hLXpdfFxcXFxbXFxkYS1mXSsgPykoPzpbXFx3LV18XFxcXFxcXFxbXFxkYS1mXSsgPykqL2ldLFtcInB1blwiLC9eW15cXHNcXHdcIiddKy9dXSksW1wiY3NzXCJdKTtQUi5yZWdpc3RlckxhbmdIYW5kbGVyKFBSLmNyZWF0ZVNpbXBsZUxleGVyKFtdLFtbXCJrd2RcIiwvXi0/KD86W19hLXpdfFxcXFxbXFxkYS1mXSsgPykoPzpbXFx3LV18XFxcXFxcXFxbXFxkYS1mXSsgPykqL2ldXSksW1wiY3NzLWt3XCJdKTtQUi5yZWdpc3RlckxhbmdIYW5kbGVyKFBSLmNyZWF0ZVNpbXBsZUxleGVyKFtdLFtbXCJzdHJcIiwvXlteXCInKV0rL11dKSxbXCJjc3Mtc3RyXCJdKTtcbiIsInZhciBxPW51bGw7d2luZG93LlBSX1NIT1VMRF9VU0VfQ09OVElOVUFUSU9OPSEwO1xuKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gTChhKXtmdW5jdGlvbiBtKGEpe3ZhciBmPWEuY2hhckNvZGVBdCgwKTtpZihmIT09OTIpcmV0dXJuIGY7dmFyIGI9YS5jaGFyQXQoMSk7cmV0dXJuKGY9cltiXSk/ZjpcIjBcIjw9YiYmYjw9XCI3XCI/cGFyc2VJbnQoYS5zdWJzdHJpbmcoMSksOCk6Yj09PVwidVwifHxiPT09XCJ4XCI/cGFyc2VJbnQoYS5zdWJzdHJpbmcoMiksMTYpOmEuY2hhckNvZGVBdCgxKX1mdW5jdGlvbiBlKGEpe2lmKGE8MzIpcmV0dXJuKGE8MTY/XCJcXFxceDBcIjpcIlxcXFx4XCIpK2EudG9TdHJpbmcoMTYpO2E9U3RyaW5nLmZyb21DaGFyQ29kZShhKTtpZihhPT09XCJcXFxcXCJ8fGE9PT1cIi1cInx8YT09PVwiW1wifHxhPT09XCJdXCIpYT1cIlxcXFxcIithO3JldHVybiBhfWZ1bmN0aW9uIGgoYSl7Zm9yKHZhciBmPWEuc3Vic3RyaW5nKDEsYS5sZW5ndGgtMSkubWF0Y2goL1xcXFx1W1xcZEEtRmEtZl17NH18XFxcXHhbXFxkQS1GYS1mXXsyfXxcXFxcWzAtM11bMC03XXswLDJ9fFxcXFxbMC03XXsxLDJ9fFxcXFxbXFxTXFxzXXxbXlxcXFxdL2cpLGE9XG5bXSxiPVtdLG89ZlswXT09PVwiXlwiLGM9bz8xOjAsaT1mLmxlbmd0aDtjPGk7KytjKXt2YXIgaj1mW2NdO2lmKC9cXFxcW2Jkc3ddL2kudGVzdChqKSlhLnB1c2goaik7ZWxzZXt2YXIgaj1tKGopLGQ7YysyPGkmJlwiLVwiPT09ZltjKzFdPyhkPW0oZltjKzJdKSxjKz0yKTpkPWo7Yi5wdXNoKFtqLGRdKTtkPDY1fHxqPjEyMnx8KGQ8NjV8fGo+OTB8fGIucHVzaChbTWF0aC5tYXgoNjUsail8MzIsTWF0aC5taW4oZCw5MCl8MzJdKSxkPDk3fHxqPjEyMnx8Yi5wdXNoKFtNYXRoLm1heCg5NyxqKSYtMzMsTWF0aC5taW4oZCwxMjIpJi0zM10pKX19Yi5zb3J0KGZ1bmN0aW9uKGEsZil7cmV0dXJuIGFbMF0tZlswXXx8ZlsxXS1hWzFdfSk7Zj1bXTtqPVtOYU4sTmFOXTtmb3IoYz0wO2M8Yi5sZW5ndGg7KytjKWk9YltjXSxpWzBdPD1qWzFdKzE/alsxXT1NYXRoLm1heChqWzFdLGlbMV0pOmYucHVzaChqPWkpO2I9W1wiW1wiXTtvJiZiLnB1c2goXCJeXCIpO2IucHVzaC5hcHBseShiLGEpO2ZvcihjPTA7YzxcbmYubGVuZ3RoOysrYylpPWZbY10sYi5wdXNoKGUoaVswXSkpLGlbMV0+aVswXSYmKGlbMV0rMT5pWzBdJiZiLnB1c2goXCItXCIpLGIucHVzaChlKGlbMV0pKSk7Yi5wdXNoKFwiXVwiKTtyZXR1cm4gYi5qb2luKFwiXCIpfWZ1bmN0aW9uIHkoYSl7Zm9yKHZhciBmPWEuc291cmNlLm1hdGNoKC9cXFsoPzpbXlxcXFxcXF1dfFxcXFxbXFxTXFxzXSkqXXxcXFxcdVtcXGRBLUZhLWZdezR9fFxcXFx4W1xcZEEtRmEtZl17Mn18XFxcXFxcZCt8XFxcXFteXFxkdXhdfFxcKFxcP1shOj1dfFsoKV5dfFteKClbXFxcXF5dKy9nKSxiPWYubGVuZ3RoLGQ9W10sYz0wLGk9MDtjPGI7KytjKXt2YXIgaj1mW2NdO2o9PT1cIihcIj8rK2k6XCJcXFxcXCI9PT1qLmNoYXJBdCgwKSYmKGo9K2ouc3Vic3RyaW5nKDEpKSYmajw9aSYmKGRbal09LTEpfWZvcihjPTE7YzxkLmxlbmd0aDsrK2MpLTE9PT1kW2NdJiYoZFtjXT0rK3QpO2ZvcihpPWM9MDtjPGI7KytjKWo9ZltjXSxqPT09XCIoXCI/KCsraSxkW2ldPT09dm9pZCAwJiYoZltjXT1cIig/OlwiKSk6XCJcXFxcXCI9PT1qLmNoYXJBdCgwKSYmXG4oaj0rai5zdWJzdHJpbmcoMSkpJiZqPD1pJiYoZltjXT1cIlxcXFxcIitkW2ldKTtmb3IoaT1jPTA7YzxiOysrYylcIl5cIj09PWZbY10mJlwiXlwiIT09ZltjKzFdJiYoZltjXT1cIlwiKTtpZihhLmlnbm9yZUNhc2UmJnMpZm9yKGM9MDtjPGI7KytjKWo9ZltjXSxhPWouY2hhckF0KDApLGoubGVuZ3RoPj0yJiZhPT09XCJbXCI/ZltjXT1oKGopOmEhPT1cIlxcXFxcIiYmKGZbY109ai5yZXBsYWNlKC9bQS1aYS16XS9nLGZ1bmN0aW9uKGEpe2E9YS5jaGFyQ29kZUF0KDApO3JldHVyblwiW1wiK1N0cmluZy5mcm9tQ2hhckNvZGUoYSYtMzMsYXwzMikrXCJdXCJ9KSk7cmV0dXJuIGYuam9pbihcIlwiKX1mb3IodmFyIHQ9MCxzPSExLGw9ITEscD0wLGQ9YS5sZW5ndGg7cDxkOysrcCl7dmFyIGc9YVtwXTtpZihnLmlnbm9yZUNhc2UpbD0hMDtlbHNlIGlmKC9bYS16XS9pLnRlc3QoZy5zb3VyY2UucmVwbGFjZSgvXFxcXHVbXFxkYS1mXXs0fXxcXFxceFtcXGRhLWZdezJ9fFxcXFxbXlVYdXhdL2dpLFwiXCIpKSl7cz0hMDtsPSExO2JyZWFrfX1mb3IodmFyIHI9XG57Yjo4LHQ6OSxuOjEwLHY6MTEsZjoxMixyOjEzfSxuPVtdLHA9MCxkPWEubGVuZ3RoO3A8ZDsrK3Ape2c9YVtwXTtpZihnLmdsb2JhbHx8Zy5tdWx0aWxpbmUpdGhyb3cgRXJyb3IoXCJcIitnKTtuLnB1c2goXCIoPzpcIit5KGcpK1wiKVwiKX1yZXR1cm4gUmVnRXhwKG4uam9pbihcInxcIiksbD9cImdpXCI6XCJnXCIpfWZ1bmN0aW9uIE0oYSl7ZnVuY3Rpb24gbShhKXtzd2l0Y2goYS5ub2RlVHlwZSl7Y2FzZSAxOmlmKGUudGVzdChhLmNsYXNzTmFtZSkpYnJlYWs7Zm9yKHZhciBnPWEuZmlyc3RDaGlsZDtnO2c9Zy5uZXh0U2libGluZyltKGcpO2c9YS5ub2RlTmFtZTtpZihcIkJSXCI9PT1nfHxcIkxJXCI9PT1nKWhbc109XCJcXG5cIix0W3M8PDFdPXkrKyx0W3MrKzw8MXwxXT1hO2JyZWFrO2Nhc2UgMzpjYXNlIDQ6Zz1hLm5vZGVWYWx1ZSxnLmxlbmd0aCYmKGc9cD9nLnJlcGxhY2UoL1xcclxcbj8vZyxcIlxcblwiKTpnLnJlcGxhY2UoL1tcXHRcXG5cXHIgXSsvZyxcIiBcIiksaFtzXT1nLHRbczw8MV09eSx5Kz1nLmxlbmd0aCxcbnRbcysrPDwxfDFdPWEpfX12YXIgZT0vKD86XnxcXHMpbm9jb2RlKD86XFxzfCQpLyxoPVtdLHk9MCx0PVtdLHM9MCxsO2EuY3VycmVudFN0eWxlP2w9YS5jdXJyZW50U3R5bGUud2hpdGVTcGFjZTp3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSYmKGw9ZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShhLHEpLmdldFByb3BlcnR5VmFsdWUoXCJ3aGl0ZS1zcGFjZVwiKSk7dmFyIHA9bCYmXCJwcmVcIj09PWwuc3Vic3RyaW5nKDAsMyk7bShhKTtyZXR1cm57YTpoLmpvaW4oXCJcIikucmVwbGFjZSgvXFxuJC8sXCJcIiksYzp0fX1mdW5jdGlvbiBCKGEsbSxlLGgpe20mJihhPXthOm0sZDphfSxlKGEpLGgucHVzaC5hcHBseShoLGEuZSkpfWZ1bmN0aW9uIHgoYSxtKXtmdW5jdGlvbiBlKGEpe2Zvcih2YXIgbD1hLmQscD1bbCxcInBsblwiXSxkPTAsZz1hLmEubWF0Y2goeSl8fFtdLHI9e30sbj0wLHo9Zy5sZW5ndGg7bjx6Oysrbil7dmFyIGY9Z1tuXSxiPXJbZl0sbz12b2lkIDAsYztpZih0eXBlb2YgYj09PVxuXCJzdHJpbmdcIiljPSExO2Vsc2V7dmFyIGk9aFtmLmNoYXJBdCgwKV07aWYoaSlvPWYubWF0Y2goaVsxXSksYj1pWzBdO2Vsc2V7Zm9yKGM9MDtjPHQ7KytjKWlmKGk9bVtjXSxvPWYubWF0Y2goaVsxXSkpe2I9aVswXTticmVha31vfHwoYj1cInBsblwiKX1pZigoYz1iLmxlbmd0aD49NSYmXCJsYW5nLVwiPT09Yi5zdWJzdHJpbmcoMCw1KSkmJiEobyYmdHlwZW9mIG9bMV09PT1cInN0cmluZ1wiKSljPSExLGI9XCJzcmNcIjtjfHwocltmXT1iKX1pPWQ7ZCs9Zi5sZW5ndGg7aWYoYyl7Yz1vWzFdO3ZhciBqPWYuaW5kZXhPZihjKSxrPWorYy5sZW5ndGg7b1syXSYmKGs9Zi5sZW5ndGgtb1syXS5sZW5ndGgsaj1rLWMubGVuZ3RoKTtiPWIuc3Vic3RyaW5nKDUpO0IobCtpLGYuc3Vic3RyaW5nKDAsaiksZSxwKTtCKGwraStqLGMsQyhiLGMpLHApO0IobCtpK2ssZi5zdWJzdHJpbmcoayksZSxwKX1lbHNlIHAucHVzaChsK2ksYil9YS5lPXB9dmFyIGg9e30seTsoZnVuY3Rpb24oKXtmb3IodmFyIGU9YS5jb25jYXQobSksXG5sPVtdLHA9e30sZD0wLGc9ZS5sZW5ndGg7ZDxnOysrZCl7dmFyIHI9ZVtkXSxuPXJbM107aWYobilmb3IodmFyIGs9bi5sZW5ndGg7LS1rPj0wOyloW24uY2hhckF0KGspXT1yO3I9clsxXTtuPVwiXCIrcjtwLmhhc093blByb3BlcnR5KG4pfHwobC5wdXNoKHIpLHBbbl09cSl9bC5wdXNoKC9bXFxTXFxzXS8pO3k9TChsKX0pKCk7dmFyIHQ9bS5sZW5ndGg7cmV0dXJuIGV9ZnVuY3Rpb24gdShhKXt2YXIgbT1bXSxlPVtdO2EudHJpcGxlUXVvdGVkU3RyaW5ncz9tLnB1c2goW1wic3RyXCIsL14oPzonJycoPzpbXidcXFxcXXxcXFxcW1xcU1xcc118Jyc/KD89W14nXSkpKig/OicnJ3wkKXxcIlwiXCIoPzpbXlwiXFxcXF18XFxcXFtcXFNcXHNdfFwiXCI/KD89W15cIl0pKSooPzpcIlwiXCJ8JCl8Jyg/OlteJ1xcXFxdfFxcXFxbXFxTXFxzXSkqKD86J3wkKXxcIig/OlteXCJcXFxcXXxcXFxcW1xcU1xcc10pKig/OlwifCQpKS8scSxcIidcXFwiXCJdKTphLm11bHRpTGluZVN0cmluZ3M/bS5wdXNoKFtcInN0clwiLC9eKD86Jyg/OlteJ1xcXFxdfFxcXFxbXFxTXFxzXSkqKD86J3wkKXxcIig/OlteXCJcXFxcXXxcXFxcW1xcU1xcc10pKig/OlwifCQpfGAoPzpbXlxcXFxgXXxcXFxcW1xcU1xcc10pKig/OmB8JCkpLyxcbnEsXCInXFxcImBcIl0pOm0ucHVzaChbXCJzdHJcIiwvXig/OicoPzpbXlxcblxccidcXFxcXXxcXFxcLikqKD86J3wkKXxcIig/OlteXFxuXFxyXCJcXFxcXXxcXFxcLikqKD86XCJ8JCkpLyxxLFwiXFxcIidcIl0pO2EudmVyYmF0aW1TdHJpbmdzJiZlLnB1c2goW1wic3RyXCIsL15AXCIoPzpbXlwiXXxcIlwiKSooPzpcInwkKS8scV0pO3ZhciBoPWEuaGFzaENvbW1lbnRzO2gmJihhLmNTdHlsZUNvbW1lbnRzPyhoPjE/bS5wdXNoKFtcImNvbVwiLC9eIyg/OiMjKD86W14jXXwjKD8hIyMpKSooPzojIyN8JCl8LiopLyxxLFwiI1wiXSk6bS5wdXNoKFtcImNvbVwiLC9eIyg/Oig/OmRlZmluZXxlbGlmfGVsc2V8ZW5kaWZ8ZXJyb3J8aWZkZWZ8aW5jbHVkZXxpZm5kZWZ8bGluZXxwcmFnbWF8dW5kZWZ8d2FybmluZylcXGJ8W15cXG5cXHJdKikvLHEsXCIjXCJdKSxlLnB1c2goW1wic3RyXCIsL148KD86KD86KD86XFwuXFwuXFwvKSp8XFwvPykoPzpbXFx3LV0rKD86XFwvW1xcdy1dKykrKT9bXFx3LV0rXFwuaHxbYS16XVxcdyopPi8scV0pKTptLnB1c2goW1wiY29tXCIsL14jW15cXG5cXHJdKi8sXG5xLFwiI1wiXSkpO2EuY1N0eWxlQ29tbWVudHMmJihlLnB1c2goW1wiY29tXCIsL15cXC9cXC9bXlxcblxccl0qLyxxXSksZS5wdXNoKFtcImNvbVwiLC9eXFwvXFwqW1xcU1xcc10qPyg/OlxcKlxcL3wkKS8scV0pKTthLnJlZ2V4TGl0ZXJhbHMmJmUucHVzaChbXCJsYW5nLXJlZ2V4XCIsL14oPzpeXlxcLj98WyErLV18IT18IT09fCN8JXwlPXwmfCYmfCYmPXwmPXxcXCh8XFwqfFxcKj18XFwrPXwsfC09fC0+fFxcL3xcXC89fDp8Ojp8O3w8fDw8fDw8PXw8PXw9fD09fD09PXw+fD49fD4+fD4+PXw+Pj58Pj4+PXxbP0BbXl18XFxePXxcXF5cXF58XFxeXFxePXx7fFxcfHxcXHw9fFxcfFxcfHxcXHxcXHw9fH58YnJlYWt8Y2FzZXxjb250aW51ZXxkZWxldGV8ZG98ZWxzZXxmaW5hbGx5fGluc3RhbmNlb2Z8cmV0dXJufHRocm93fHRyeXx0eXBlb2YpXFxzKihcXC8oPz1bXiovXSkoPzpbXi9bXFxcXF18XFxcXFtcXFNcXHNdfFxcWyg/OlteXFxcXFxcXV18XFxcXFtcXFNcXHNdKSooPzpdfCQpKStcXC8pL10pOyhoPWEudHlwZXMpJiZlLnB1c2goW1widHlwXCIsaF0pO2E9KFwiXCIrYS5rZXl3b3JkcykucmVwbGFjZSgvXiB8ICQvZyxcblwiXCIpO2EubGVuZ3RoJiZlLnB1c2goW1wia3dkXCIsUmVnRXhwKFwiXig/OlwiK2EucmVwbGFjZSgvW1xccyxdKy9nLFwifFwiKStcIilcXFxcYlwiKSxxXSk7bS5wdXNoKFtcInBsblwiLC9eXFxzKy8scSxcIiBcXHJcXG5cXHRcXHhhMFwiXSk7ZS5wdXNoKFtcImxpdFwiLC9eQFskX2Etel1bXFx3JEBdKi9pLHFdLFtcInR5cFwiLC9eKD86W0BfXT9bQS1aXStbYS16XVtcXHckQF0qfFxcdytfdFxcYikvLHFdLFtcInBsblwiLC9eWyRfYS16XVtcXHckQF0qL2kscV0sW1wibGl0XCIsL14oPzoweFtcXGRhLWZdK3woPzpcXGQoPzpfXFxkKykqXFxkKig/OlxcLlxcZCopP3xcXC5cXGRcXCspKD86ZVsrLV0/XFxkKyk/KVthLXpdKi9pLHEsXCIwMTIzNDU2Nzg5XCJdLFtcInBsblwiLC9eXFxcXFtcXFNcXHNdPy8scV0sW1wicHVuXCIsL14uW15cXHNcXHdcIi0kJy4vQFxcXFxgXSovLHFdKTtyZXR1cm4geChtLGUpfWZ1bmN0aW9uIEQoYSxtKXtmdW5jdGlvbiBlKGEpe3N3aXRjaChhLm5vZGVUeXBlKXtjYXNlIDE6aWYoay50ZXN0KGEuY2xhc3NOYW1lKSlicmVhaztpZihcIkJSXCI9PT1hLm5vZGVOYW1lKWgoYSksXG5hLnBhcmVudE5vZGUmJmEucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChhKTtlbHNlIGZvcihhPWEuZmlyc3RDaGlsZDthO2E9YS5uZXh0U2libGluZyllKGEpO2JyZWFrO2Nhc2UgMzpjYXNlIDQ6aWYocCl7dmFyIGI9YS5ub2RlVmFsdWUsZD1iLm1hdGNoKHQpO2lmKGQpe3ZhciBjPWIuc3Vic3RyaW5nKDAsZC5pbmRleCk7YS5ub2RlVmFsdWU9YzsoYj1iLnN1YnN0cmluZyhkLmluZGV4K2RbMF0ubGVuZ3RoKSkmJmEucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUocy5jcmVhdGVUZXh0Tm9kZShiKSxhLm5leHRTaWJsaW5nKTtoKGEpO2N8fGEucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChhKX19fX1mdW5jdGlvbiBoKGEpe2Z1bmN0aW9uIGIoYSxkKXt2YXIgZT1kP2EuY2xvbmVOb2RlKCExKTphLGY9YS5wYXJlbnROb2RlO2lmKGYpe3ZhciBmPWIoZiwxKSxnPWEubmV4dFNpYmxpbmc7Zi5hcHBlbmRDaGlsZChlKTtmb3IodmFyIGg9ZztoO2g9ZylnPWgubmV4dFNpYmxpbmcsZi5hcHBlbmRDaGlsZChoKX1yZXR1cm4gZX1cbmZvcig7IWEubmV4dFNpYmxpbmc7KWlmKGE9YS5wYXJlbnROb2RlLCFhKXJldHVybjtmb3IodmFyIGE9YihhLm5leHRTaWJsaW5nLDApLGU7KGU9YS5wYXJlbnROb2RlKSYmZS5ub2RlVHlwZT09PTE7KWE9ZTtkLnB1c2goYSl9dmFyIGs9Lyg/Ol58XFxzKW5vY29kZSg/Olxcc3wkKS8sdD0vXFxyXFxuP3xcXG4vLHM9YS5vd25lckRvY3VtZW50LGw7YS5jdXJyZW50U3R5bGU/bD1hLmN1cnJlbnRTdHlsZS53aGl0ZVNwYWNlOndpbmRvdy5nZXRDb21wdXRlZFN0eWxlJiYobD1zLmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoYSxxKS5nZXRQcm9wZXJ0eVZhbHVlKFwid2hpdGUtc3BhY2VcIikpO3ZhciBwPWwmJlwicHJlXCI9PT1sLnN1YnN0cmluZygwLDMpO2ZvcihsPXMuY3JlYXRlRWxlbWVudChcIkxJXCIpO2EuZmlyc3RDaGlsZDspbC5hcHBlbmRDaGlsZChhLmZpcnN0Q2hpbGQpO2Zvcih2YXIgZD1bbF0sZz0wO2c8ZC5sZW5ndGg7KytnKWUoZFtnXSk7bT09PShtfDApJiZkWzBdLnNldEF0dHJpYnV0ZShcInZhbHVlXCIsXG5tKTt2YXIgcj1zLmNyZWF0ZUVsZW1lbnQoXCJPTFwiKTtyLmNsYXNzTmFtZT1cImxpbmVudW1zXCI7Zm9yKHZhciBuPU1hdGgubWF4KDAsbS0xfDApfHwwLGc9MCx6PWQubGVuZ3RoO2c8ejsrK2cpbD1kW2ddLGwuY2xhc3NOYW1lPVwiTFwiKyhnK24pJTEwLGwuZmlyc3RDaGlsZHx8bC5hcHBlbmRDaGlsZChzLmNyZWF0ZVRleHROb2RlKFwiXFx4YTBcIikpLHIuYXBwZW5kQ2hpbGQobCk7YS5hcHBlbmRDaGlsZChyKX1mdW5jdGlvbiBrKGEsbSl7Zm9yKHZhciBlPW0ubGVuZ3RoOy0tZT49MDspe3ZhciBoPW1bZV07QS5oYXNPd25Qcm9wZXJ0eShoKT93aW5kb3cuY29uc29sZSYmY29uc29sZS53YXJuKFwiY2Fubm90IG92ZXJyaWRlIGxhbmd1YWdlIGhhbmRsZXIgJXNcIixoKTpBW2hdPWF9fWZ1bmN0aW9uIEMoYSxtKXtpZighYXx8IUEuaGFzT3duUHJvcGVydHkoYSkpYT0vXlxccyo8Ly50ZXN0KG0pP1wiZGVmYXVsdC1tYXJrdXBcIjpcImRlZmF1bHQtY29kZVwiO3JldHVybiBBW2FdfWZ1bmN0aW9uIEUoYSl7dmFyIG09XG5hLmc7dHJ5e3ZhciBlPU0oYS5oKSxoPWUuYTthLmE9aDthLmM9ZS5jO2EuZD0wO0MobSxoKShhKTt2YXIgaz0vXFxiTVNJRVxcYi8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSxtPS9cXG4vZyx0PWEuYSxzPXQubGVuZ3RoLGU9MCxsPWEuYyxwPWwubGVuZ3RoLGg9MCxkPWEuZSxnPWQubGVuZ3RoLGE9MDtkW2ddPXM7dmFyIHIsbjtmb3Iobj1yPTA7bjxnOylkW25dIT09ZFtuKzJdPyhkW3IrK109ZFtuKytdLGRbcisrXT1kW24rK10pOm4rPTI7Zz1yO2ZvcihuPXI9MDtuPGc7KXtmb3IodmFyIHo9ZFtuXSxmPWRbbisxXSxiPW4rMjtiKzI8PWcmJmRbYisxXT09PWY7KWIrPTI7ZFtyKytdPXo7ZFtyKytdPWY7bj1ifWZvcihkLmxlbmd0aD1yO2g8cDspe3ZhciBvPWxbaCsyXXx8cyxjPWRbYSsyXXx8cyxiPU1hdGgubWluKG8sYyksaT1sW2grMV0sajtpZihpLm5vZGVUeXBlIT09MSYmKGo9dC5zdWJzdHJpbmcoZSxiKSkpe2smJihqPWoucmVwbGFjZShtLFwiXFxyXCIpKTtpLm5vZGVWYWx1ZT1cbmo7dmFyIHU9aS5vd25lckRvY3VtZW50LHY9dS5jcmVhdGVFbGVtZW50KFwiU1BBTlwiKTt2LmNsYXNzTmFtZT1kW2ErMV07dmFyIHg9aS5wYXJlbnROb2RlO3gucmVwbGFjZUNoaWxkKHYsaSk7di5hcHBlbmRDaGlsZChpKTtlPG8mJihsW2grMV09aT11LmNyZWF0ZVRleHROb2RlKHQuc3Vic3RyaW5nKGIsbykpLHguaW5zZXJ0QmVmb3JlKGksdi5uZXh0U2libGluZykpfWU9YjtlPj1vJiYoaCs9Mik7ZT49YyYmKGErPTIpfX1jYXRjaCh3KXtcImNvbnNvbGVcImluIHdpbmRvdyYmY29uc29sZS5sb2codyYmdy5zdGFjaz93LnN0YWNrOncpfX12YXIgdj1bXCJicmVhayxjb250aW51ZSxkbyxlbHNlLGZvcixpZixyZXR1cm4sd2hpbGVcIl0sdz1bW3YsXCJhdXRvLGNhc2UsY2hhcixjb25zdCxkZWZhdWx0LGRvdWJsZSxlbnVtLGV4dGVybixmbG9hdCxnb3RvLGludCxsb25nLHJlZ2lzdGVyLHNob3J0LHNpZ25lZCxzaXplb2Ysc3RhdGljLHN0cnVjdCxzd2l0Y2gsdHlwZWRlZix1bmlvbix1bnNpZ25lZCx2b2lkLHZvbGF0aWxlXCJdLFxuXCJjYXRjaCxjbGFzcyxkZWxldGUsZmFsc2UsaW1wb3J0LG5ldyxvcGVyYXRvcixwcml2YXRlLHByb3RlY3RlZCxwdWJsaWMsdGhpcyx0aHJvdyx0cnVlLHRyeSx0eXBlb2ZcIl0sRj1bdyxcImFsaWdub2YsYWxpZ25fdW5pb24sYXNtLGF4aW9tLGJvb2wsY29uY2VwdCxjb25jZXB0X21hcCxjb25zdF9jYXN0LGNvbnN0ZXhwcixkZWNsdHlwZSxkeW5hbWljX2Nhc3QsZXhwbGljaXQsZXhwb3J0LGZyaWVuZCxpbmxpbmUsbGF0ZV9jaGVjayxtdXRhYmxlLG5hbWVzcGFjZSxudWxscHRyLHJlaW50ZXJwcmV0X2Nhc3Qsc3RhdGljX2Fzc2VydCxzdGF0aWNfY2FzdCx0ZW1wbGF0ZSx0eXBlaWQsdHlwZW5hbWUsdXNpbmcsdmlydHVhbCx3aGVyZVwiXSxHPVt3LFwiYWJzdHJhY3QsYm9vbGVhbixieXRlLGV4dGVuZHMsZmluYWwsZmluYWxseSxpbXBsZW1lbnRzLGltcG9ydCxpbnN0YW5jZW9mLG51bGwsbmF0aXZlLHBhY2thZ2Usc3RyaWN0ZnAsc3VwZXIsc3luY2hyb25pemVkLHRocm93cyx0cmFuc2llbnRcIl0sXG5IPVtHLFwiYXMsYmFzZSxieSxjaGVja2VkLGRlY2ltYWwsZGVsZWdhdGUsZGVzY2VuZGluZyxkeW5hbWljLGV2ZW50LGZpeGVkLGZvcmVhY2gsZnJvbSxncm91cCxpbXBsaWNpdCxpbixpbnRlcmZhY2UsaW50ZXJuYWwsaW50byxpcyxsb2NrLG9iamVjdCxvdXQsb3ZlcnJpZGUsb3JkZXJieSxwYXJhbXMscGFydGlhbCxyZWFkb25seSxyZWYsc2J5dGUsc2VhbGVkLHN0YWNrYWxsb2Msc3RyaW5nLHNlbGVjdCx1aW50LHVsb25nLHVuY2hlY2tlZCx1bnNhZmUsdXNob3J0LHZhclwiXSx3PVt3LFwiZGVidWdnZXIsZXZhbCxleHBvcnQsZnVuY3Rpb24sZ2V0LG51bGwsc2V0LHVuZGVmaW5lZCx2YXIsd2l0aCxJbmZpbml0eSxOYU5cIl0sST1bdixcImFuZCxhcyxhc3NlcnQsY2xhc3MsZGVmLGRlbCxlbGlmLGV4Y2VwdCxleGVjLGZpbmFsbHksZnJvbSxnbG9iYWwsaW1wb3J0LGluLGlzLGxhbWJkYSxub25sb2NhbCxub3Qsb3IscGFzcyxwcmludCxyYWlzZSx0cnksd2l0aCx5aWVsZCxGYWxzZSxUcnVlLE5vbmVcIl0sXG5KPVt2LFwiYWxpYXMsYW5kLGJlZ2luLGNhc2UsY2xhc3MsZGVmLGRlZmluZWQsZWxzaWYsZW5kLGVuc3VyZSxmYWxzZSxpbixtb2R1bGUsbmV4dCxuaWwsbm90LG9yLHJlZG8scmVzY3VlLHJldHJ5LHNlbGYsc3VwZXIsdGhlbix0cnVlLHVuZGVmLHVubGVzcyx1bnRpbCx3aGVuLHlpZWxkLEJFR0lOLEVORFwiXSx2PVt2LFwiY2FzZSxkb25lLGVsaWYsZXNhYyxldmFsLGZpLGZ1bmN0aW9uLGluLGxvY2FsLHNldCx0aGVuLHVudGlsXCJdLEs9L14oRElSfEZJTEV8dmVjdG9yfChkZXxwcmlvcml0eV8pP3F1ZXVlfGxpc3R8c3RhY2t8KGNvbnN0Xyk/aXRlcmF0b3J8KG11bHRpKT8oc2V0fG1hcCl8Yml0c2V0fHU/KGludHxmbG9hdClcXGQqKS8sTj0vXFxTLyxPPXUoe2tleXdvcmRzOltGLEgsdyxcImNhbGxlcixkZWxldGUsZGllLGRvLGR1bXAsZWxzaWYsZXZhbCxleGl0LGZvcmVhY2gsZm9yLGdvdG8saWYsaW1wb3J0LGxhc3QsbG9jYWwsbXksbmV4dCxubyxvdXIscHJpbnQscGFja2FnZSxyZWRvLHJlcXVpcmUsc3ViLHVuZGVmLHVubGVzcyx1bnRpbCx1c2Usd2FudGFycmF5LHdoaWxlLEJFR0lOLEVORFwiK1xuSSxKLHZdLGhhc2hDb21tZW50czohMCxjU3R5bGVDb21tZW50czohMCxtdWx0aUxpbmVTdHJpbmdzOiEwLHJlZ2V4TGl0ZXJhbHM6ITB9KSxBPXt9O2soTyxbXCJkZWZhdWx0LWNvZGVcIl0pO2soeChbXSxbW1wicGxuXCIsL15bXjw/XSsvXSxbXCJkZWNcIiwvXjwhXFx3W14+XSooPzo+fCQpL10sW1wiY29tXCIsL148XFwhLS1bXFxTXFxzXSo/KD86LS1cXD58JCkvXSxbXCJsYW5nLVwiLC9ePFxcPyhbXFxTXFxzXSs/KSg/OlxcPz58JCkvXSxbXCJsYW5nLVwiLC9ePCUoW1xcU1xcc10rPykoPzolPnwkKS9dLFtcInB1blwiLC9eKD86PFslP118WyU/XT4pL10sW1wibGFuZy1cIiwvXjx4bXBcXGJbXj5dKj4oW1xcU1xcc10rPyk8XFwveG1wXFxiW14+XSo+L2ldLFtcImxhbmctanNcIiwvXjxzY3JpcHRcXGJbXj5dKj4oW1xcU1xcc10qPykoPFxcL3NjcmlwdFxcYltePl0qPikvaV0sW1wibGFuZy1jc3NcIiwvXjxzdHlsZVxcYltePl0qPihbXFxTXFxzXSo/KSg8XFwvc3R5bGVcXGJbXj5dKj4pL2ldLFtcImxhbmctaW4udGFnXCIsL14oPFxcLz9bYS16XVtePD5dKj4pL2ldXSksXG5bXCJkZWZhdWx0LW1hcmt1cFwiLFwiaHRtXCIsXCJodG1sXCIsXCJteG1sXCIsXCJ4aHRtbFwiLFwieG1sXCIsXCJ4c2xcIl0pO2soeChbW1wicGxuXCIsL15cXHMrLyxxLFwiIFxcdFxcclxcblwiXSxbXCJhdHZcIiwvXig/OlwiW15cIl0qXCI/fCdbXiddKic/KS8scSxcIlxcXCInXCJdXSxbW1widGFnXCIsL15ePFxcLz9bYS16XSg/OltcXHctLjpdKlxcdyk/fFxcLz8+JC9pXSxbXCJhdG5cIiwvXig/IXN0eWxlW1xccz1dfG9uKVthLXpdKD86W1xcdzotXSpcXHcpPy9pXSxbXCJsYW5nLXVxLnZhbFwiLC9ePVxccyooW15cXHNcIic+XSooPzpbXlxcc1wiJy8+XXxcXC8oPz1cXHMpKSkvXSxbXCJwdW5cIiwvXlsvPC0+XSsvXSxbXCJsYW5nLWpzXCIsL15vblxcdytcXHMqPVxccypcIihbXlwiXSspXCIvaV0sW1wibGFuZy1qc1wiLC9eb25cXHcrXFxzKj1cXHMqJyhbXiddKyknL2ldLFtcImxhbmctanNcIiwvXm9uXFx3K1xccyo9XFxzKihbXlxcc1wiJz5dKykvaV0sW1wibGFuZy1jc3NcIiwvXnN0eWxlXFxzKj1cXHMqXCIoW15cIl0rKVwiL2ldLFtcImxhbmctY3NzXCIsL15zdHlsZVxccyo9XFxzKicoW14nXSspJy9pXSxbXCJsYW5nLWNzc1wiLFxuL15zdHlsZVxccyo9XFxzKihbXlxcc1wiJz5dKykvaV1dKSxbXCJpbi50YWdcIl0pO2soeChbXSxbW1wiYXR2XCIsL15bXFxTXFxzXSsvXV0pLFtcInVxLnZhbFwiXSk7ayh1KHtrZXl3b3JkczpGLGhhc2hDb21tZW50czohMCxjU3R5bGVDb21tZW50czohMCx0eXBlczpLfSksW1wiY1wiLFwiY2NcIixcImNwcFwiLFwiY3h4XCIsXCJjeWNcIixcIm1cIl0pO2sodSh7a2V5d29yZHM6XCJudWxsLHRydWUsZmFsc2VcIn0pLFtcImpzb25cIl0pO2sodSh7a2V5d29yZHM6SCxoYXNoQ29tbWVudHM6ITAsY1N0eWxlQ29tbWVudHM6ITAsdmVyYmF0aW1TdHJpbmdzOiEwLHR5cGVzOkt9KSxbXCJjc1wiXSk7ayh1KHtrZXl3b3JkczpHLGNTdHlsZUNvbW1lbnRzOiEwfSksW1wiamF2YVwiXSk7ayh1KHtrZXl3b3Jkczp2LGhhc2hDb21tZW50czohMCxtdWx0aUxpbmVTdHJpbmdzOiEwfSksW1wiYnNoXCIsXCJjc2hcIixcInNoXCJdKTtrKHUoe2tleXdvcmRzOkksaGFzaENvbW1lbnRzOiEwLG11bHRpTGluZVN0cmluZ3M6ITAsdHJpcGxlUXVvdGVkU3RyaW5nczohMH0pLFxuW1wiY3ZcIixcInB5XCJdKTtrKHUoe2tleXdvcmRzOlwiY2FsbGVyLGRlbGV0ZSxkaWUsZG8sZHVtcCxlbHNpZixldmFsLGV4aXQsZm9yZWFjaCxmb3IsZ290byxpZixpbXBvcnQsbGFzdCxsb2NhbCxteSxuZXh0LG5vLG91cixwcmludCxwYWNrYWdlLHJlZG8scmVxdWlyZSxzdWIsdW5kZWYsdW5sZXNzLHVudGlsLHVzZSx3YW50YXJyYXksd2hpbGUsQkVHSU4sRU5EXCIsaGFzaENvbW1lbnRzOiEwLG11bHRpTGluZVN0cmluZ3M6ITAscmVnZXhMaXRlcmFsczohMH0pLFtcInBlcmxcIixcInBsXCIsXCJwbVwiXSk7ayh1KHtrZXl3b3JkczpKLGhhc2hDb21tZW50czohMCxtdWx0aUxpbmVTdHJpbmdzOiEwLHJlZ2V4TGl0ZXJhbHM6ITB9KSxbXCJyYlwiXSk7ayh1KHtrZXl3b3Jkczp3LGNTdHlsZUNvbW1lbnRzOiEwLHJlZ2V4TGl0ZXJhbHM6ITB9KSxbXCJqc1wiXSk7ayh1KHtrZXl3b3JkczpcImFsbCxhbmQsYnksY2F0Y2gsY2xhc3MsZWxzZSxleHRlbmRzLGZhbHNlLGZpbmFsbHksZm9yLGlmLGluLGlzLGlzbnQsbG9vcCxuZXcsbm8sbm90LG51bGwsb2Ysb2ZmLG9uLG9yLHJldHVybixzdXBlcix0aGVuLHRydWUsdHJ5LHVubGVzcyx1bnRpbCx3aGVuLHdoaWxlLHllc1wiLFxuaGFzaENvbW1lbnRzOjMsY1N0eWxlQ29tbWVudHM6ITAsbXVsdGlsaW5lU3RyaW5nczohMCx0cmlwbGVRdW90ZWRTdHJpbmdzOiEwLHJlZ2V4TGl0ZXJhbHM6ITB9KSxbXCJjb2ZmZWVcIl0pO2soeChbXSxbW1wic3RyXCIsL15bXFxTXFxzXSsvXV0pLFtcInJlZ2V4XCJdKTt3aW5kb3cucHJldHR5UHJpbnRPbmU9ZnVuY3Rpb24oYSxtLGUpe3ZhciBoPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJQUkVcIik7aC5pbm5lckhUTUw9YTtlJiZEKGgsZSk7RSh7ZzptLGk6ZSxoOmh9KTtyZXR1cm4gaC5pbm5lckhUTUx9O3dpbmRvdy5wcmV0dHlQcmludD1mdW5jdGlvbihhKXtmdW5jdGlvbiBtKCl7Zm9yKHZhciBlPXdpbmRvdy5QUl9TSE9VTERfVVNFX0NPTlRJTlVBVElPTj9sLm5vdygpKzI1MDpJbmZpbml0eTtwPGgubGVuZ3RoJiZsLm5vdygpPGU7cCsrKXt2YXIgbj1oW3BdLGs9bi5jbGFzc05hbWU7aWYoay5pbmRleE9mKFwicHJldHR5cHJpbnRcIik+PTApe3ZhciBrPWsubWF0Y2goZyksZixiO2lmKGI9XG4hayl7Yj1uO2Zvcih2YXIgbz12b2lkIDAsYz1iLmZpcnN0Q2hpbGQ7YztjPWMubmV4dFNpYmxpbmcpdmFyIGk9Yy5ub2RlVHlwZSxvPWk9PT0xP28/YjpjOmk9PT0zP04udGVzdChjLm5vZGVWYWx1ZSk/YjpvOm87Yj0oZj1vPT09Yj92b2lkIDA6bykmJlwiQ09ERVwiPT09Zi50YWdOYW1lfWImJihrPWYuY2xhc3NOYW1lLm1hdGNoKGcpKTtrJiYoaz1rWzFdKTtiPSExO2ZvcihvPW4ucGFyZW50Tm9kZTtvO289by5wYXJlbnROb2RlKWlmKChvLnRhZ05hbWU9PT1cInByZVwifHxvLnRhZ05hbWU9PT1cImNvZGVcInx8by50YWdOYW1lPT09XCJ4bXBcIikmJm8uY2xhc3NOYW1lJiZvLmNsYXNzTmFtZS5pbmRleE9mKFwicHJldHR5cHJpbnRcIik+PTApe2I9ITA7YnJlYWt9Ynx8KChiPShiPW4uY2xhc3NOYW1lLm1hdGNoKC9cXGJsaW5lbnVtc1xcYig/OjooXFxkKykpPy8pKT9iWzFdJiZiWzFdLmxlbmd0aD8rYlsxXTohMDohMSkmJkQobixiKSxkPXtnOmssaDpuLGk6Yn0sRShkKSl9fXA8aC5sZW5ndGg/c2V0VGltZW91dChtLFxuMjUwKTphJiZhKCl9Zm9yKHZhciBlPVtkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInByZVwiKSxkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNvZGVcIiksZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJ4bXBcIildLGg9W10saz0wO2s8ZS5sZW5ndGg7KytrKWZvcih2YXIgdD0wLHM9ZVtrXS5sZW5ndGg7dDxzOysrdCloLnB1c2goZVtrXVt0XSk7dmFyIGU9cSxsPURhdGU7bC5ub3d8fChsPXtub3c6ZnVuY3Rpb24oKXtyZXR1cm4rbmV3IERhdGV9fSk7dmFyIHA9MCxkLGc9L1xcYmxhbmcoPzp1YWdlKT8tKFtcXHcuXSspKD8hXFxTKS87bSgpfTt3aW5kb3cuUFI9e2NyZWF0ZVNpbXBsZUxleGVyOngscmVnaXN0ZXJMYW5nSGFuZGxlcjprLHNvdXJjZURlY29yYXRvcjp1LFBSX0FUVFJJQl9OQU1FOlwiYXRuXCIsUFJfQVRUUklCX1ZBTFVFOlwiYXR2XCIsUFJfQ09NTUVOVDpcImNvbVwiLFBSX0RFQ0xBUkFUSU9OOlwiZGVjXCIsUFJfS0VZV09SRDpcImt3ZFwiLFBSX0xJVEVSQUw6XCJsaXRcIixcblBSX05PQ09ERTpcIm5vY29kZVwiLFBSX1BMQUlOOlwicGxuXCIsUFJfUFVOQ1RVQVRJT046XCJwdW5cIixQUl9TT1VSQ0U6XCJzcmNcIixQUl9TVFJJTkc6XCJzdHJcIixQUl9UQUc6XCJ0YWdcIixQUl9UWVBFOlwidHlwXCJ9fSkoKTtcbiIsImNvbnN0IENvZGVIaWdobGlnaHQgPSByZXF1aXJlKCcuL2NvZGVfaGlnaGxpZ2h0JylcbmNvbnN0IFNlYXJjaCA9IHJlcXVpcmUoJy4vc2VhcmNoJylcblxuXG5jbGFzcyBSVEQge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuJCA9IHt9XG5cbiAgICAgICAgdGhpcy4kLm1haW4gPSAkKCcjbWFpbicpXG4gICAgICAgIHRoaXMuJC5uYXYgPSAkKCduYXYnKVxuICAgICAgICB0aGlzLiQucmVzaXplciA9ICQoJyNyZXNpemVyJylcbiAgICAgICAgdGhpcy4kLnNjcm9sbCA9ICQoJy5uYXYtc2Nyb2xsLWNvbnRhaW5lcicpXG5cbiAgICAgICAgdGhpcy4kLmFwaVRhYiA9ICQoJyNhcGktdGFiJylcbiAgICAgICAgdGhpcy4kLm1hbnVhbHNUYWIgPSAkKCcjbWFudWFscy10YWInKVxuXG4gICAgICAgIC8vIERldGVybWluZSB3aGljaCBjYXRlZ29yeSB0YWIgbXVzdCBiZSBhY3RpdmUuXG4gICAgICAgIGlmICh3aW5kb3cuaXNNYW51YWwgfHwgKCFsb2NhdGlvbi5wYXRobmFtZS5pbmNsdWRlcygnLmh0bWwnKSAmJiAhbG9jYXRpb24uaGFzaC5pbmNsdWRlcygnI2FwaScpKSkge1xuICAgICAgICAgICAgdGhpcy5zaG93TWFudWFsc1RhYigpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNob3dBcGlUYWIoKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGFyZ2V0cyB0aGUgY3VycmVudCBwYWdlIGluIHRoZSBuYXZpZ2F0aW9uLlxuICAgICAgICBpZiAod2luZG93LmlzQXBpKSB7XG4gICAgICAgICAgICBsZXQgbG9uZ25hbWVTZWxlY3RvciA9IHdpbmRvdy5kb2MubG9uZ25hbWUucmVwbGFjZSgvW358OnwuXS9nLCAnXycpXG4gICAgICAgICAgICB0aGlzLiQuc2VsZWN0ZWRBcGlTdWJJdGVtID0gJChgIyR7bG9uZ25hbWVTZWxlY3Rvcn1fc3ViYClcbiAgICAgICAgICAgIHRoaXMuJC5zZWxlY3RlZEFwaVN1Ykl0ZW0ucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpXG4gICAgICAgICAgICBsZXQgc2VsZWN0ZWRBcGlJdGVtID0gdGhpcy4kLnNlbGVjdGVkQXBpU3ViSXRlbS5wcmV2KClcbiAgICAgICAgICAgIHNlbGVjdGVkQXBpSXRlbS5hZGRDbGFzcygnc2VsZWN0ZWQnKVxuICAgICAgICAgICAgLy8gVHJ5IHRvIHBvc2l0aW9uIHNlbGVjdGVkQXBpSXRlbSBhdCB0aGUgdG9wIG9mIHRoZSBzY3JvbGwgY29udGFpbmVyLlxuICAgICAgICAgICAgbGV0IG5hdlNjcm9sbFRvcCA9IHRoaXMuJC5zY3JvbGwuZ2V0KDApXG4gICAgICAgICAgICBpZiAobmF2U2Nyb2xsVG9wKSBuYXZTY3JvbGxUb3AgPSBuYXZTY3JvbGxUb3AuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgICAgICBsZXQgbmF2SXRlbVRvcCA9IHNlbGVjdGVkQXBpSXRlbS5nZXQoMClcbiAgICAgICAgICAgIGlmIChuYXZJdGVtVG9wKSBuYXZJdGVtVG9wID0gbmF2SXRlbVRvcC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcblxuICAgICAgICAgICAgdGhpcy4kLnNjcm9sbC5zY3JvbGxUb3AobmF2SXRlbVRvcCAtIG5hdlNjcm9sbFRvcCArIDEpXG4gICAgICAgICAgICAvLyBIZWlnaHQgb2YgdGhlIGl0ZW0gZnJvbSB0aGUgdG9wIG9mIHRoZSBzY3JvbGwgY29udGFpbmVyLlxuICAgICAgICAgICAgdGhpcy4kLnNlbGVjdGVkQXBpU3ViSXRlbS5wYXJlbnQoKS5maW5kKCcuZmEnKS5yZW1vdmVDbGFzcygnZmEtcGx1cycpLmFkZENsYXNzKCdmYS1taW51cycpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNlbGVjdEhyZWYoKVxuXG4gICAgICAgIHRoaXMuY29kZWhpZ2hsaWdodCA9IG5ldyBDb2RlSGlnaGxpZ2h0KClcbiAgICAgICAgdGhpcy5zZWFyY2ggPSBuZXcgU2VhcmNoKClcblxuICAgICAgICB0aGlzLmV2ZW50cygpXG4gICAgfVxuXG5cbiAgICBldmVudHMoKSB7XG4gICAgICAgIHRoaXMuJC5hcGlUYWIub24oJ2NsaWNrJywgdGhpcy5zaG93QXBpVGFiLmJpbmQodGhpcykpXG4gICAgICAgIHRoaXMuJC5tYW51YWxzVGFiLm9uKCdjbGljaycsIHRoaXMuc2hvd01hbnVhbHNUYWIuYmluZCh0aGlzKSlcblxuICAgICAgICB0aGlzLiQubmF2LmZpbmQoJy5uYXYtYXBpJykuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQodGhpcykuZmluZCgnLnRvZ2dsZS1zdWJuYXYnKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEtlZXBzIHN1Ym5hdnMgd2l0aG91dCBpdGVtcyBpbnZpc2libGUuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkKHRoaXMpLm5leHQoKS5uZXh0KCc6ZW1wdHknKS5sZW5ndGggPT09IDA7XG4gICAgICAgICAgICAgICAgfSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnaW52aXNpYmxlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJChlLmN1cnJlbnRUYXJnZXQpLm5leHQoKS5uZXh0KCkudG9nZ2xlQ2xhc3MoJ2hpZGRlbicpXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGUuY3VycmVudFRhcmdldCkudG9nZ2xlQ2xhc3MoJ2ZhLXBsdXMgZmEtbWludXMnKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG5cbiAgICAgICAgZnVuY3Rpb24gcmVzaXplKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgY2xpZW50WCA9IGV2ZW50LmNsaWVudFhcbiAgICAgICAgICAgIGNsaWVudFggPSBNYXRoLm1heCgyMDAsIGNsaWVudFgpXG4gICAgICAgICAgICBjbGllbnRYID0gTWF0aC5taW4oNTAwLCBjbGllbnRYKVxuICAgICAgICAgICAgdGhpcy4kLm5hdi5jc3MoJ3dpZHRoJywgY2xpZW50WClcbiAgICAgICAgICAgIHRoaXMuJC5yZXNpemVyLmNzcygnbGVmdCcsIGNsaWVudFgpXG4gICAgICAgICAgICB0aGlzLiQubWFpbi5jc3MoJ2xlZnQnLCBjbGllbnRYICsgdGhpcy4kLnJlc2l6ZXIud2lkdGgoKSlcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRldGFjaFJlc2l6ZSgpIHtcbiAgICAgICAgICAgICQod2luZG93KS5vZmYoe21vdXNlbW92ZTogcmVzaXplLCBtb3VzZXVwOiBkZXRhY2hSZXNpemV9KVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4kLnJlc2l6ZXIub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCh3aW5kb3cpLm9uKHttb3VzZW1vdmU6IHJlc2l6ZSwgbW91c2V1cDogZGV0YWNoUmVzaXplfSlcbiAgICAgICAgfSlcblxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIHRoaXMuc2VsZWN0SHJlZi5iaW5kKHRoaXMpLCBmYWxzZSlcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFRoZSBtYW51YWwgdGFiLlxuICAgICAqL1xuICAgIHNob3dNYW51YWxzVGFiKCkge1xuICAgICAgICB0aGlzLiQuYXBpVGFiLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpXG4gICAgICAgIHRoaXMuJC5tYW51YWxzVGFiLmFkZENsYXNzKCdzZWxlY3RlZCcpXG4gICAgICAgICQoJy5uYXYtYXBpJykuYWRkQ2xhc3MoJ2hpZGRlbicpXG4gICAgICAgICQoJy5uYXYtbWFudWFscycpLnJlbW92ZUNsYXNzKCdoaWRkZW4nKVxuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogVGhlIEFQSSB0YWIuXG4gICAgICovXG4gICAgc2hvd0FwaVRhYigpIHtcbiAgICAgICAgdGhpcy4kLm1hbnVhbHNUYWIucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJylcbiAgICAgICAgdGhpcy4kLmFwaVRhYi5hZGRDbGFzcygnc2VsZWN0ZWQnKVxuICAgICAgICAkKCcubmF2LWFwaScpLnJlbW92ZUNsYXNzKCdoaWRkZW4nKVxuICAgICAgICAkKCcubmF2LW1hbnVhbHMnKS5hZGRDbGFzcygnaGlkZGVuJylcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHNlbGVjdGVkIGNsYXNzIHRvIGEgbGluayB3aXRoIGEgbWF0Y2hpbmcgaHJlZi5cbiAgICAgKi9cbiAgICBzZWxlY3RIcmVmKCkge1xuICAgICAgICAvLyBSZW1vdmUgc2VsZWN0ZWQgZnJvbSBhbGxcbiAgICAgICAgJCgnLnN1Yi1uYXYtaXRlbSBhJykucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJylcbiAgICAgICAgbGV0IGhyZWZNYXRjaCA9IGxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KCcvJykucG9wKClcbiAgICAgICAgaWYgKGhyZWZNYXRjaC5pbmNsdWRlcygndHV0b3JpYWwnKSkge1xuICAgICAgICAgICAgaHJlZk1hdGNoID0gYC5uYXYtaXRlbS4ke2hyZWZNYXRjaC5yZXBsYWNlKCcuaHRtbCcsICcnKS5zcGxpdCgnLScpLnBvcCgpfWBcbiAgICAgICAgfSBlbHNlIGlmIChocmVmTWF0Y2ggIT09ICcnKSB7XG4gICAgICAgICAgICBocmVmTWF0Y2ggPSBgYVtocmVmPVwiJHtocmVmTWF0Y2h9JHtsb2NhdGlvbi5oYXNofVwiXWBcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChocmVmTWF0Y2gpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGhyZWZNYXRjaClcbiAgICAgICAgICAgIGlmIChub2RlKSBub2RlLmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJylcbiAgICAgICAgfVxuXG4gICAgfVxufVxuXG4kKCgpID0+IHtcbiAgICB3aW5kb3cucnRkID0gbmV3IFJURCgpXG59KVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IEtFWV9DT0RFX1VQID0gMzhcbmNvbnN0IEtFWV9DT0RFX0RPV04gPSA0MFxuY29uc3QgS0VZX0NPREVfRU5URVIgPSAxM1xuXG5jbGFzcyBTZWFyY2gge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgdGhpcy4kID0ge31cbiAgICAgICAgdGhpcy4kLnNlYXJjaENvbnRhaW5lciA9ICQoJy5qcy1zZWFyY2gnKVxuICAgICAgICB0aGlzLiQuc2VhcmNoSW5wdXQgPSB0aGlzLiQuc2VhcmNoQ29udGFpbmVyLmZpbmQoJ2lucHV0JylcbiAgICAgICAgdGhpcy4kLnNlYXJjaGVkTGlzdCA9IHRoaXMuJC5zZWFyY2hDb250YWluZXIuZmluZCgndWwnKVxuICAgICAgICB0aGlzLiQuYW5jaG9yTGlzdCA9ICQoJ25hdiB1bCBsaSBhJylcbiAgICAgICAgdGhpcy4kLnNlbGVjdGVkID0gJCgpXG4gICAgICAgIHRoaXMuZXZlbnRzKClcbiAgICB9XG5cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLiQuc2VhcmNoZWRMaXN0Lmh0bWwoJycpXG4gICAgICAgIHRoaXMuJC5zZWFyY2hJbnB1dC52YWwoJycpXG4gICAgICAgIHRoaXMuJC5zZWxlY3RlZCA9ICQoKVxuICAgIH1cblxuXG4gICAgZXZlbnRzKCkge1xuICAgICAgICAvLyBSZW1vdmUgdGhlIHNlYXJjaCBsaXN0IHdoZW4gY2xpY2tpbmcgb3V0c2lkZSB0aGUgd29ya2luZyBhcmVhLlxuICAgICAgICAkKHdpbmRvdykub24oJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuJC5zZWFyY2hDb250YWluZXJbMF0uY29udGFpbnMoZXZlbnQudGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXIoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIENsaWNraW5nIG9uIGEgc2VhcmNobGlzdCBpdGVtIHdpbGwgZ28gdG8gdGhhdCBwYWdlLlxuICAgICAgICB0aGlzLiQuc2VhcmNoZWRMaXN0Lm9uKCdjbGljaycsICdsaScsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRUYXJnZXQgPSBldmVudC5jdXJyZW50VGFyZ2V0XG4gICAgICAgICAgICB2YXIgdXJsID0gJChjdXJyZW50VGFyZ2V0KS5maW5kKCdhJykuYXR0cignaHJlZicpXG4gICAgICAgICAgICB0aGlzLm1vdmVUb1BhZ2UodXJsKVxuICAgICAgICB9KVxuXG5cbiAgICAgICAgdGhpcy4kLnNlYXJjaElucHV0Lm9uKCdrZXl1cCcsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgdmFyIGlucHV0VGV4dCA9IHRoaXMucmVtb3ZlV2hpdGVTcGFjZSh0aGlzLiQuc2VhcmNoSW5wdXQudmFsKCkpLnRvTG93ZXJDYXNlKClcblxuICAgICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IEtFWV9DT0RFX1VQIHx8IGV2ZW50LmtleUNvZGUgPT09IEtFWV9DT0RFX0RPV04pIHtcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFpbnB1dFRleHQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiQuc2VhcmNoZWRMaXN0Lmh0bWwoJycpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSBLRVlfQ09ERV9FTlRFUikge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy4kLnNlbGVjdGVkLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiQuc2VsZWN0ZWQgPSB0aGlzLiQuc2VhcmNoZWRMaXN0LmZpbmQoJ2xpJykuZmlyc3QoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVUb1BhZ2UodGhpcy4kLnNlbGVjdGVkLmZpbmQoJ2EnKS5hdHRyKCdocmVmJykpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2V0TGlzdChpbnB1dFRleHQpXG4gICAgICAgIH0pXG5cblxuICAgICAgICB0aGlzLiQuc2VhcmNoSW5wdXQub24oJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuJC5zZWxlY3RlZC5yZW1vdmVDbGFzcygnaGlnaGxpZ2h0JylcblxuICAgICAgICAgICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICAgICAgICBjYXNlIEtFWV9DT0RFX1VQOlxuICAgICAgICAgICAgICAgIHRoaXMuJC5zZWxlY3RlZCA9IHRoaXMuJC5zZWxlY3RlZC5wcmV2KClcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuJC5zZWxlY3RlZC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kLnNlbGVjdGVkID0gdGhpcy4kLnNlYXJjaGVkTGlzdC5maW5kKCdsaScpLmxhc3QoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSBLRVlfQ09ERV9ET1dOOlxuICAgICAgICAgICAgICAgIHRoaXMuJC5zZWxlY3RlZCA9IHRoaXMuJC5zZWxlY3RlZC5uZXh0KClcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuJC5zZWxlY3RlZC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kLnNlbGVjdGVkID0gdGhpcy4kLnNlYXJjaGVkTGlzdC5maW5kKCdsaScpLmZpcnN0KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuJC5zZWxlY3RlZC5hZGRDbGFzcygnaGlnaGxpZ2h0JylcbiAgICAgICAgfSlcbiAgICB9XG5cblxuICAgIGlzTWF0Y2hlZChpdGVtVGV4dCwgaW5wdXRUZXh0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlbW92ZVdoaXRlU3BhY2UoaXRlbVRleHQpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihpbnB1dFRleHQpID4gLTFcbiAgICB9XG5cblxuICAgIG1vdmVUb1BhZ2UodXJsKSB7XG4gICAgICAgIGlmICh1cmwpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHVybFxuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xlYXIoKVxuICAgIH1cblxuXG4gICAgbWFrZUxpc3RJdGVtSHRtbChpdGVtLCBpbnB1dFRleHQpIHtcbiAgICAgICAgdmFyIGl0ZW1UZXh0ID0gaXRlbS50ZXh0XG4gICAgICAgIHZhciBpdGVtSHJlZiA9IGl0ZW0uaHJlZlxuICAgICAgICB2YXIgJHBhcmVudCA9ICQoaXRlbSkuY2xvc2VzdCgnZGl2JylcbiAgICAgICAgdmFyIG1lbWJlcm9mID0gJydcblxuICAgICAgICBpZiAoJHBhcmVudC5sZW5ndGggJiYgJHBhcmVudC5hdHRyKCdpZCcpKSB7XG4gICAgICAgICAgICBtZW1iZXJvZiA9ICRwYXJlbnQuYXR0cignaWQnKS5yZXBsYWNlKCdfc3ViJywgJycpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtZW1iZXJvZiA9ICQoaXRlbSkuY2xvc2VzdCgnZGl2JykuZmluZCgnaDMnKS50ZXh0KClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtZW1iZXJvZikge1xuICAgICAgICAgICAgbWVtYmVyb2YgPSBgPHNwYW4gY2xhc3M9XCJncm91cFwiPiR7bWVtYmVyb2Z9PC9zcGFuPmBcbiAgICAgICAgfVxuXG4gICAgICAgIGl0ZW1UZXh0ID0gaXRlbVRleHQucmVwbGFjZShuZXcgUmVnRXhwKGlucHV0VGV4dCwgJ2lnJyksIChtYXRjaGVkKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYDxzdHJvbmc+JHttYXRjaGVkfTwvc3Ryb25nPmBcbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gYDxsaT48YSBocmVmPVwiJHtpdGVtSHJlZn1cIj4ke2l0ZW1UZXh0fTwvYT4ke21lbWJlcm9mfTwvbGk+YFxuICAgIH1cblxuXG4gICAgc2V0TGlzdChpbnB1dFRleHQpIHtcbiAgICAgICAgdmFyIGh0bWwgPSAnJ1xuXG4gICAgICAgIHRoaXMuJC5hbmNob3JMaXN0LmZpbHRlcigoaWR4LCBpdGVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pc01hdGNoZWQoaXRlbS50ZXh0LCBpbnB1dFRleHQpXG4gICAgICAgIH0pLmVhY2goKGlkeCwgaXRlbSkgPT4ge1xuICAgICAgICAgICAgaHRtbCArPSB0aGlzLm1ha2VMaXN0SXRlbUh0bWwoaXRlbSwgaW5wdXRUZXh0KVxuICAgICAgICB9KVxuICAgICAgICB0aGlzLiQuc2VhcmNoZWRMaXN0Lmh0bWwoaHRtbClcbiAgICB9XG5cbiAgICByZW1vdmVXaGl0ZVNwYWNlKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9cXHMvZywgJycpO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTZWFyY2hcbiJdfQ==
