/*
 * QRCode.js library (inlined)
 *
 * The following minified code is taken from davidshimjs/qrcodejs (MIT license)
 * and defines the global `QRCode` constructor along with necessary helper
 * classes and functions.  It is inlined here instead of being loaded via a
 * separate script to avoid restrictions when running this app from the
 * `file://` scheme, which can block loading external scripts.  Do not
 * modify this code unless updating to a newer version of the library.
 */
var QRCode;
!function(){function a(a){this.mode=c.MODE_8BIT_BYTE,this.data=a,this.parsedData=[];for(var b=[],d=0,e=this.data.length;e>d;d++){var f=this.data.charCodeAt(d);f>65536?(b[0]=240|(1835008&f)>>>18,b[1]=128|(258048&f)>>>12,b[2]=128|(4032&f)>>>6,b[3]=128|63&f):f>2048?(b[0]=224|(61440&f)>>>12,b[1]=128|(4032&f)>>>6,b[2]=128|63&f):f>128?(b[0]=192|(1984&f)>>>6,b[1]=128|63&f):b[0]=f,this.parsedData=this.parsedData.concat(b)}this.parsedData.length!=this.data.length&&(this.parsedData.unshift(191),this.parsedData.unshift(187),this.parsedData.unshift(239))}function b(a,b){this.typeNumber=a,this.errorCorrectLevel=b,this.modules=null,this.moduleCount=0,this.dataCache=null,this.dataList=[]}function i(a,b){if(void 0==a.length)throw new Error(a.length+"/"+b);for(var c=0;c<a.length&&0==a[c];)c++;this.num=new Array(a.length-c+b);for(var d=0;d<a.length-c;d++)this.num[d]=a[d+c]}function j(a,b){this.totalCount=a,this.dataCount=b}function k(){this.buffer=[],this.length=0}function m(){return"undefined"!=typeof CanvasRenderingContext2D}function n(){var a=!1,b=navigator.userAgent;return/android/i.test(b)&&(a=!0,aMat=b.toString().match(/android ([0-9]\.[0-9])/i),aMat&&aMat[1]&&(a=parseFloat(aMat[1]))),a}function r(a,b){for(var c=1,e=s(a),f=0,g=l.length;g>=f;f++){var h=0;switch(b){case d.L:h=l[f][0];break;case d.M:h=l[f][1];break;case d.Q:h=l[f][2];break;case d.H:h=l[f][3]}if(h>=e)break;c++}if(c>l.length)throw new Error("Too long data");return c}function s(a){var b=encodeURI(a).toString().replace(/\%[0-9a-fA-F]{2}/g,"a");return b.length+(b.length!=a?3:0)}a.prototype={getLength:function(){return this.parsedData.length},write:function(a){for(var b=0,c=this.parsedData.length;c>b;b++)a.put(this.parsedData[b],8)}},b.prototype={addData:function(b){var c=new a(b);this.dataList.push(c),this.dataCache=null},isDark:function(a,b){if(0>a||this.moduleCount<=a||0>b||this.moduleCount<=b)throw new Error(a+","+b);return this.modules[a][b]},getModuleCount:function(){return this.moduleCount},make:function(){this.makeImpl(!1,this.getBestMaskPattern())},makeImpl:function(a,c){this.moduleCount=4*this.typeNumber+17,this.modules=new Array(this.moduleCount);for(var d=0;d<this.moduleCount;d++){this.modules[d]=new Array(this.moduleCount);for(var e=0;e<this.moduleCount;e++)this.modules[d][e]=null}this.setupPositionProbePattern(0,0),this.setupPositionProbePattern(this.moduleCount-7,0),this.setupPositionProbePattern(0,this.moduleCount-7),this.setupPositionAdjustPattern(),this.setupTimingPattern(),this.setupTypeInfo(a,c),this.typeNumber>=7&&this.setupTypeNumber(a),null==this.dataCache&&(this.dataCache=b.createData(this.typeNumber,this.errorCorrectLevel,this.dataList)),this.mapData(this.dataCache,c)},setupPositionProbePattern:function(a,b){for(var c=-1;7>=c;c++)if(!(-1>=a+c||this.moduleCount<=a+c))for(var d=-1;7>=d;d++)-1>=b+d||this.moduleCount<=b+d||(this.modules[a+c][b+d]=c>=0&&6>=c&&(0==d||6==d)||d>=0&&6>=d&&(0==c||6==c)||c>=2&&4>=c&&d>=2&&4>=d?!0:!1)},getBestMaskPattern:function(){for(var a=0,b=0,c=0;8>c;c++){this.makeImpl(!0,c);var d=f.getLostPoint(this);(0==c||a>d)&&(a=d,b=c)}return b},createMovieClip:function(a,b,c){var d=a.createEmptyMovieClip(b,c),e=1;this.make();for(var f=0;f<this.modules.length;f++)for(var g=f*e,h=0;h<this.modules[f].length;h++){var i=h*e,j=this.modules[f][h];j&&(d.beginFill(0,100),d.moveTo(i,g),d.lineTo(i+e,g),d.lineTo(i+e,g+e),d.lineTo(i,g+e),d.endFill())}return d},setupTimingPattern:function(){for(var a=8;a<this.moduleCount-8;a++)null==this.modules[a][6]&&(this.modules[a][6]=0==a%2);for(var b=8;b<this.moduleCount-8;b++)null==this.modules[6][b]&&(this.modules[6][b]=0==b%2)},setupPositionAdjustPattern:function(){for(var a=f.getPatternPosition(this.typeNumber),b=0;b<a.length;b++)for(var c=0;c<a.length;c++){var d=a[b],e=a[c];if(null==this.modules[d][e])for(var g=-2;2>=g;g++)for(var h=-2;2>=h;h++)this.modules[d+g][e+h]=-2==g||2==g||-2==h||2==h||0==g&&0==h?!0:!1}},setupTypeNumber:function(a){for(var b=f.getBCHTypeNumber(this.typeNumber),c=0;18>c;c++){var d=!a&&1==(1&b>>c);this.modules[Math.floor(c/3)][c%3+this.moduleCount-8-3]=d}for(var c=0;18>c;c++){var d=!a&&1==(1&b>>c);this.modules[c%3+this.moduleCount-8-3][Math.floor(c/3)]=d}},setupTypeInfo:function(a,b){for(var c=this.errorCorrectLevel<<3|b,d=f.getBCHTypeInfo(c),e=0;15>e;e++){var g=!a&&1==(1&d>>e);6>e?this.modules[e][8]=g:8>e?this.modules[e+1][8]=g:this.modules[this.moduleCount-15+e][8]=g}for(var e=0;15>e;e++){var g=!a&&1==(1&d>>e);8>e?this.modules[8][this.moduleCount-e-1]=g:9>e?this.modules[8][15-e-1+1]=g:this.modules[8][15-e-1]=g}this.modules[this.moduleCount-8][8]=!a},mapData:function(a,b){for(var c=-1,d=this.moduleCount-1,e=7,g=0,h=this.moduleCount-1;h>0;h-=2)for(6==h&&h--;;){for(var i=0;2>i;i++)if(null==this.modules[d][h-i]){var j=!1;g<a.length&&(j=1==(1&a[g]>>>e));var k=f.getMask(b,d,h-i);k&&(j=!j),this.modules[d][h-i]=j,e--,-1==e&&(g++,e=7)}if(d+=c,0>d||this.moduleCount<=d){d-=c,c=-c;break}}}},b.PAD0=236,b.PAD1=17,b.createData=function(a,c,d){for(var e=j.getRSBlocks(a,c),g=new k,h=0;h<d.length;h++){var i=d[h];g.put(i.mode,4),g.put(i.getLength(),f.getLengthInBits(i.mode,a)),i.write(g)}for(var l=0,h=0;h<e.length;h++)l+=e[h].dataCount;if(g.getLengthInBits()>8*l)throw new Error("code length overflow. ("+g.getLengthInBits()+">"+8*l+")");for(g.getLengthInBits()+4<=8*l&&g.put(0,4);0!=g.getLengthInBits()%8;)g.putBit(!1);for(;;){if(g.getLengthInBits()>=8*l)break;if(g.put(b.PAD0,8),g.getLengthInBits()>=8*l)break;g.put(b.PAD1,8)}return b.createBytes(g,e)},b.createBytes=function(a,b){for(var c=0,d=0,e=0,g=new Array(b.length),h=new Array(b.length),j=0;j<b.length;j++){var k=b[j].dataCount,l=b[j].totalCount-k;d=Math.max(d,k),e=Math.max(e,l),g[j]=new Array(k);for(var m=0;m<g[j].length;m++)g[j][m]=255&a.buffer[m+c];c+=k;var n=f.getErrorCorrectPolynomial(l),o=new i(g[j],n.getLength()-1),p=o.mod(n);h[j]=new Array(n.getLength()-1);for(var m=0;m<h[j].length;m++){var q=m+p.getLength()-h[j].length;h[j][m]=q>=0?p.get(q):0}}for(var r=0,m=0;m<b.length;m++)r+=b[m].totalCount;for(var s=new Array(r),t=0,m=0;d>m;m++)for(var j=0;j<b.length;j++)m<g[j].length&&(s[t++]=g[j][m]);for(var m=0;e>m;m++)for(var j=0;j<b.length;j++)m<h[j].length&&(s[t++]=h[j][m]);return s};for(var c={MODE_NUMBER:1,MODE_ALPHA_NUM:2,MODE_8BIT_BYTE:4,MODE_KANJI:8},d={L:1,M:0,Q:3,H:2},e={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7},f={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:1335,G18:7973,G15_MASK:21522,getBCHTypeInfo:function(a){for(var b=a<<10;f.getBCHDigit(b)-f.getBCHDigit(f.G15)>=0;)b^=f.G15<<f.getBCHDigit(b)-f.getBCHDigit(f.G15);return(a<<10|b)^f.G15_MASK},getBCHTypeNumber:function(a){for(var b=a<<12;f.getBCHDigit(b)-f.getBCHDigit(f.G18)>=0;)b^=f.G18<<f.getBCHDigit(b)-f.getBCHDigit(f.G18);return a<<12|b},getBCHDigit:function(a){for(var b=0;0!=a;)b++,a>>>=1;return b},getPatternPosition:function(a){return f.PATTERN_POSITION_TABLE[a-1]},getMask:function(a,b,c){switch(a){case e.PATTERN000:return 0==(b+c)%2;case e.PATTERN001:return 0==b%2;case e.PATTERN010:return 0==c%3;case e.PATTERN011:return 0==(b+c)%3;case e.PATTERN100:return 0==(Math.floor(b/2)+Math.floor(c/3))%2;case e.PATTERN101:return 0==b*c%2+b*c%3;case e.PATTERN110:return 0==(b*c%2+b*c%3)%2;case e.PATTERN111:return 0==(b*c%3+(b+c)%2)%2;default:throw new Error("bad maskPattern:"+a)}},getErrorCorrectPolynomial:function(a){for(var b=new i([1],0),c=0;a>c;c++)b=b.multiply(new i([1,g.gexp(c)],0));return b},getLengthInBits:function(a,b){if(b>=1&&10>b)switch(a){case c.MODE_NUMBER:return 10;case c.MODE_ALPHA_NUM:return 9;case c.MODE_8BIT_BYTE:return 8;case c.MODE_KANJI:return 8;default:throw new Error("mode:"+a)}else if(27>b)switch(a){case c.MODE_NUMBER:return 12;case c.MODE_ALPHA_NUM:return 11;case c.MODE_8BIT_BYTE:return 16;case c.MODE_KANJI:return 10;default:throw new Error("mode:"+a)}else{if(!(41>b))throw new Error("type:"+b);switch(a){case c.MODE_NUMBER:return 14;case c.MODE_ALPHA_NUM:return 13;case c.MODE_8BIT_BYTE:return 16;case c.MODE_KANJI:return 12;default:throw new Error("mode:"+a)}}},getLostPoint:function(a){for(var b=a.getModuleCount(),c=0,d=0;b>d;d++)for(var e=0;b>e;e++){for(var f=0,g=a.isDark(d,e),h=-1;1>=h;h++)if(!(0>d+h||d+h>=b))for(var i=-1;1>=i;i++)0>e+i||e+i>=b||(0!=h||0!=i)&&g==a.isDark(d+h,e+i)&&f++;f>5&&(c+=3+f-5)}for(var d=0;b-1>d;d++)for(var e=0;b-1>e;e++){var j=0;a.isDark(d,e)&&j++,a.isDark(d+1,e)&&j++,a.isDark(d,e+1)&&j++,a.isDark(d+1,e+1)&&j++,(0==j||4==j)&&(c+=3)}for(var d=0;b>d;d++)for(var e=0;b-6>e;e++)a.isDark(d,e)&&!a.isDark(d,e+1)&&a.isDark(d,e+2)&&a.isDark(d,e+3)&&a.isDark(d,e+4)&&!a.isDark(d,e+5)&&a.isDark(d,e+6)&&(c+=40);for(var e=0;b>e;e++)for(var d=0;b-6>d;d++)a.isDark(d,e)&&!a.isDark(d+1,e)&&a.isDark(d+2,e)&&a.isDark(d+3,e)&&a.isDark(d+4,e)&&!a.isDark(d+5,e)&&a.isDark(d+6,e)&&(c+=40);for(var k=0,e=0;b>e;e++)for(var d=0;b>d;d++)a.isDark(d,e)&&k++;var l=Math.abs(100*k/b/b-50)/5;return c+=10*l}},g={glog:function(a){if(1>a)throw new Error("glog("+a+")");return g.LOG_TABLE[a]},gexp:function(a){for(;0>a;)a+=255;for(;a>=256;)a-=255;return g.EXP_TABLE[a]},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)},h=0;8>h;h++)g.EXP_TABLE[h]=1<<h;for(var h=8;256>h;h++)g.EXP_TABLE[h]=g.EXP_TABLE[h-4]^g.EXP_TABLE[h-5]^g.EXP_TABLE[h-6]^g.EXP_TABLE[h-8];for(var h=0;255>h;h++)g.LOG_TABLE[g.EXP_TABLE[h]]=h;i.prototype={get:function(a){return this.num[a]},getLength:function(){return this.num.length},multiply:function(a){for(var b=new Array(this.getLength()+a.getLength()-1),c=0;c<this.getLength();c++)for(var d=0;d<a.getLength();d++)b[c+d]^=g.gexp(g.glog(this.get(c))+g.glog(a.get(d)));return new i(b,0)},mod:function(a){if(this.getLength()-a.getLength()<0)return this;for(var b=g.glog(this.get(0))-g.glog(a.get(0)),c=new Array(this.getLength()),d=0;d<this.getLength();d++)c[d]=this.get(d);for(var d=0;d<a.getLength();d++)c[d]^=g.gexp(g.glog(a.get(d))+b);return new i(c,0).mod(a)}},j.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],j.getRSBlocks=function(a,b){var c=j.getRsBlockTable(a,b);if(void 0==c)throw new Error("bad rs block @ typeNumber:"+a+"/errorCorrectLevel:"+b);for(var d=c.length/3,e=[],f=0;d>f;f++)for(var g=c[3*f+0],h=c[3*f+1],i=c[3*f+2],k=0;g>k;k++)e.push(new j(h,i));return e},j.getRsBlockTable=function(a,b){switch(b){case d.L:return j.RS_BLOCK_TABLE[4*(a-1)+0];case d.M:return j.RS_BLOCK_TABLE[4*(a-1)+1];case d.Q:return j.RS_BLOCK_TABLE[4*(a-1)+2];case d.H:return j.RS_BLOCK_TABLE[4*(a-1)+3];default:return void 0}},k.prototype={get:function(a){var b=Math.floor(a/8);return 1==(1&this.buffer[b]>>>7-a%8)},put:function(a,b){for(var c=0;b>c;c++)this.putBit(1==(1&a>>>b-c-1))},getLengthInBits:function(){return this.length},putBit:function(a){var b=Math.floor(this.length/8);this.buffer.length<=b&&this.buffer.push(0),a&&(this.buffer[b]|=128>>>this.length%8),this.length++}};var l=[[17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],[134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],[321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],[520,412,292,220],[586,450,322,250],[644,504,364,280],[718,560,394,310],[792,624,442,338],[858,666,482,382],[929,711,509,403],[1003,779,565,439],[1091,857,611,461],[1171,911,661,511],[1273,997,715,535],[1367,1059,751,593],[1465,1125,805,625],[1528,1190,868,658],[1628,1264,908,698],[1732,1370,982,742],[1840,1452,1030,790],[1952,1538,1112,842],[2068,1628,1168,898],[2188,1722,1228,958],[2303,1809,1283,983],[2431,1911,1351,1051],[2563,1989,1423,1093],[2699,2099,1499,1139],[2809,2213,1579,1219],[2953,2331,1663,1273]],o=function(){var a=function(a,b){this._el=a,this._htOption=b};return a.prototype.draw=function(a){function g(a,b){var c=document.createElementNS("http://www.w3.org/2000/svg",a);for(var d in b)b.hasOwnProperty(d)&&c.setAttribute(d,b[d]);return c}var b=this._htOption,c=this._el,d=a.getModuleCount();Math.floor(b.width/d),Math.floor(b.height/d),this.clear();var h=g("svg",{viewBox:"0 0 "+String(d)+" "+String(d),width:"100%",height:"100%",fill:b.colorLight});h.setAttributeNS("http://www.w3.org/2000/xmlns/","xmlns:xlink","http://www.w3.org/1999/xlink"),c.appendChild(h),h.appendChild(g("rect",{fill:b.colorDark,width:"1",height:"1",id:"template"}));for(var i=0;i<d;i++)for(var j=0;j<d;j++)if(a.isDark(i,j)){var k=g("use",{x:String(i),y:String(j)});k.setAttributeNS("http://www.w3.org/1999/xlink","href","#template"),h.appendChild(k)}},a.prototype.clear=function(){for(;this._el.hasChildNodes();)this._el.removeChild(this._el.lastChild)},a}(),p="svg"===document.documentElement.tagName.toLowerCase(),q=p?o:m()?function(){function a(){this._elImage.src=this._elCanvas.toDataURL("image/png"),this._elImage.style.display="block",this._elCanvas.style.display="none"}function d(a,b){var c=this;if(c._fFail=b,c._fSuccess=a,null===c._bSupportDataURI){var d=document.createElement("img"),e=function(){c._bSupportDataURI=!1,c._fFail&&_fFail.call(c)},f=function(){c._bSupportDataURI=!0,c._fSuccess&&c._fSuccess.call(c)};return d.onabort=e,d.onerror=e,d.onload=f,d.src="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",void 0}c._bSupportDataURI===!0&&c._fSuccess?c._fSuccess.call(c):c._bSupportDataURI===!1&&c._fFail&&c._fFail.call(c)}if(this._android&&this._android<=2.1){var b=1/window.devicePixelRatio,c=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(a,d,e,f,g,h,i,j){if("nodeName"in a&&/img/i.test(a.nodeName))for(var l=arguments.length-1;l>=1;l--)arguments[l]=arguments[l]*b;else"undefined"==typeof j&&(arguments[1]*=b,arguments[2]*=b,arguments[3]*=b,arguments[4]*=b);c.apply(this,arguments)}}var e=function(a,b){this._bIsPainted=!1,this._android=n(),this._htOption=b,this._elCanvas=document.createElement("canvas"),this._elCanvas.width=b.width,this._elCanvas.height=b.height,a.appendChild(this._elCanvas),this._el=a,this._oContext=this._elCanvas.getContext("2d"),this._bIsPainted=!1,this._elImage=document.createElement("img"),this._elImage.style.display="none",this._el.appendChild(this._elImage),this._bSupportDataURI=null};return e.prototype.draw=function(a){var b=this._elImage,c=this._oContext,d=this._htOption,e=a.getModuleCount(),f=d.width/e,g=d.height/e,h=Math.round(f),i=Math.round(g);b.style.display="none",this.clear();for(var j=0;j<e;j++)for(var k=0;k<e;k++){var l=a.isDark(j,k),m=k*f,n=j*g;c.strokeStyle=l?d.colorDark:d.colorLight,c.lineWidth=1,c.fillStyle=l?d.colorDark:d.colorLight,c.fillRect(m,n,f,g),c.strokeRect(Math.floor(m)+.5,Math.floor(n)+.5,h,i),c.strokeRect(Math.ceil(m)-.5,Math.ceil(n)-.5,h,i)}this._bIsPainted=!0},e.prototype.makeImage=function(){this._bIsPainted&&d.call(this,a)},e.prototype.isPainted=function(){return this._bIsPainted},e.prototype.clear=function(){this._oContext.clearRect(0,0,this._elCanvas.width,this._elCanvas.height),this._bIsPainted=!1},e.prototype.round=function(a){return a?Math.floor(1e3*a)/1e3:a},e}():function(){var a=function(a,b){this._el=a,this._htOption=b};return a.prototype.draw=function(a){for(var b=this._htOption,c=this._el,d=a.getModuleCount(),e=Math.floor(b.width/d),f=Math.floor(b.height/d),g=['<table style="border:0;border-collapse:collapse;">'],h=0;h<d;h++){g.push("<tr>");for(var i=0;i<d;i++)g.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:'+e+"px;height:"+f+"px;background-color:"+(a.isDark(h,i)?b.colorDark:b.colorLight)+';"></td>');g.push("</tr>")}g.push("</table>"),c.innerHTML=g.join("");var j=c.childNodes[0],k=(b.width-j.offsetWidth)/2,l=(b.height-j.offsetHeight)/2;k>0&&l>0&&(j.style.margin=l+"px "+k+"px")},a.prototype.clear=function(){this._el.innerHTML=""},a}();QRCode=function(a,b){if(this._htOption={width:256,height:256,typeNumber:4,colorDark:"#000000",colorLight:"#ffffff",correctLevel:d.H},"string"==typeof b&&(b={text:b}),b)for(var c in b)this._htOption[c]=b[c];"string"==typeof a&&(a=document.getElementById(a)),this._android=n(),this._el=a,this._oQRCode=null,this._oDrawing=new q(this._el,this._htOption),this._htOption.text&&this.makeCode(this._htOption.text)},QRCode.prototype.makeCode=function(a){this._oQRCode=new b(r(a,this._htOption.correctLevel),this._htOption.correctLevel),this._oQRCode.addData(a),this._oQRCode.make(),this._el.title=a,this._oDrawing.draw(this._oQRCode),this.makeImage()},QRCode.prototype.makeImage=function(){"function"==typeof this._oDrawing.makeImage&&(!this._android||this._android>=3)&&this._oDrawing.makeImage()},QRCode.prototype.clear=function(){this._oDrawing.clear()},QRCode.CorrectLevel=d}();
/*
 * Application logic for QR Risk Radar
 *
 * This script defines a set of heuristic rules to flag common risk
 * conditions in URL or text payloads.  When the user clicks the
 * "Analyze & Generate" button, it evaluates the input, computes a
 * cumulative risk score, classifies the result into low/medium/high
 * categories, displays individual rule hits, and finally renders a QR
 * code representing the original input.  All processing is done
 * client‑side without network calls.
 */

// Whitelist storage
let whitelist = [];

// Load whitelist from localStorage
function loadWhitelist() {
  try {
    const stored = localStorage.getItem('qr-risk-radar-whitelist');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that it's an array and contains only valid domains
      if (Array.isArray(parsed)) {
        whitelist = parsed.filter(domain => 
          typeof domain === 'string' && isValidDomain(domain)
        );
      } else {
        whitelist = [];
      }
    }
  } catch (e) {
    console.warn('Failed to load whitelist from localStorage:', e);
    whitelist = [];
  }
}

// --- Whitelist persistence (localStorage-backed) ---
// Save whitelist to localStorage
function saveWhitelist() {
  try {
    localStorage.setItem('qr-risk-radar-whitelist', JSON.stringify(whitelist));
  } catch (e) {
    console.warn('Failed to save whitelist to localStorage:', e);
  }
}

// ドメイン名の検証関数
function isValidDomain(domain) {
  // 基本的なドメイン形式チェック
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain) && domain.length <= 253;
}

// Add domain to whitelist
function addToWhitelist(domain) {
  domain = domain.toLowerCase().trim();
  
  // 入力検証
  if (!domain || typeof domain !== 'string') {
    return false;
  }
  
  // ドメイン名の形式チェック
  if (!isValidDomain(domain)) {
    return false;
  }
  
  // 重複チェック
  if (!whitelist.includes(domain)) {
    whitelist.push(domain);
    saveWhitelist();
    renderWhitelist();
    return true;
  }
  return false;
}

// Remove domain from whitelist
function removeFromWhitelist(domain) {
  const index = whitelist.indexOf(domain);
  if (index > -1) {
    whitelist.splice(index, 1);
    saveWhitelist();
    renderWhitelist();
  }
}

// HTML エスケープ関数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Render whitelist UI
function renderWhitelist() {
  const container = document.getElementById('whitelistItems');
  if (!container) return;
  
  // Clear container safely
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  
  if (whitelist.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.style.color = '#94a3b8';
    emptyMsg.style.fontSize = '0.875rem';
    emptyMsg.textContent = '信頼できるドメインはまだ追加されていません';
    container.appendChild(emptyMsg);
    return;
  }
  
  whitelist.forEach(domain => {
    const item = document.createElement('div');
    item.className = 'whitelist-item';
    
    const span = document.createElement('span');
    span.textContent = domain; // Safe text assignment
    
    const button = document.createElement('button');
    button.textContent = '×';
    button.title = 'Remove';
    button.addEventListener('click', () => removeFromWhitelist(domain));
    
    item.appendChild(span);
    item.appendChild(button);
    container.appendChild(item);
  });
}

// Check if URL is whitelisted
function isWhitelisted(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return whitelist.some(domain => {
      // Check exact match or subdomain match
      return hostname === domain || hostname.endsWith('.' + domain);
    });
  } catch (e) {
    return false;
  }
}

// --- Heuristic scoring engine ---
// Define the detection rules.  Each rule can specify a regular
// expression (`re`) or a custom function (`custom`) that returns a
// boolean.  The `score` can be a number or a function that returns
// a number given RegExp match data.  The `msg` is a short
// human‑readable explanation.
const RULES = [
  {
    id: 'scheme-http',
    re: /^http:\/\//i,
    score: 2,
    msg: 'HTTPスキーム（暗号化されていない接続）',
    category: 'security'
  },
  {
    id: 'scheme-danger',
    re: /^(javascript:|data:|file:|vbscript:)/i,
    score: 3,
    msg: '危険なURLスキーム',
    category: 'security'
  },
  {
    id: 'ip-host',
    re: /^https?:\/\/\d{1,3}(?:\.\d{1,3}){3}/i,
    score: 2,
    msg: 'IPアドレスがホストとして使用されている',
    category: 'security'
  },
  {
    id: 'weird-port',
    re: /https?:\/\/[^:/]+:(?!80$|443$)\d+/i,
    score: 1,
    msg: 'URLで非標準ポートが使用されている',
    category: 'network'
  },
  {
    id: 'shortener',
    re: /https?:\/\/(?:bit\.ly|t\.co|tinyurl\.com|is\.gd|cutt\.ly|goo\.gl|ow\.ly)\//i,
    score: 2,
    msg: '短縮URL（不明瞭な遷移先）',
    category: 'obfuscation'
  },
  {
    id: 'redirector',
    re: /[?&](?:url|redirect|next|dest)=/i,
    score: 2,
    msg: 'オープンリダイレクトの可能性のあるパラメーター',
    category: 'security'
  },
  {
    id: 'utm-overuse',
    custom: (s) => {
      const matches = s.match(/(utm_|fbclid|gclid)/gi);
      return matches && matches.length >= 3;
    },
    score: 1,
    msg: '過剰なトラッキングパラメーター',
    category: 'privacy'
  },
  {
    id: 'punycode',
    re: /https?:\/\/[^/]*xn--/i,
    score: 2,
    msg: 'Punycodeドメイン（ホモグラフ攻撃の可能性）',
    category: 'obfuscation'
  },
  {
    id: 'subdomain-mislead',
    custom: (s) => {
      try {
        const url = new URL(s);
        const host = url.hostname;
        const parts = host.split('.');
        // If only two labels, nothing to flag.
        if (parts.length <= 2) return false;
        const base = parts.slice(-2).join('.');
        const sub = parts.slice(0, -2).join('.');
        // Flag if base domain appears in subdomain portion, e.g. example.com.evil.com
        return sub.includes(base);
      } catch (e) {
        return false;
      }
    },
    score: 2,
    msg: '疑わしいサブドメイン構造',
    category: 'obfuscation'
  },
  {
    id: 'length',
    custom: (s) => s.length > 200,
    score: 1,
    msg: 'ペイロード長が200文字を超過',
    category: 'structure'
  },
  {
    id: 'query-frag-many',
    custom: (s) => {
      const ampersands = (s.match(/&/g) || []).length;
      const frag = s.split('#')[1];
      return ampersands >= 15 || (frag && frag.length > 60);
    },
    score: 1,
    msg: '過剰なクエリまたはフラグメント',
    category: 'structure'
  },
  {
    id: 'phishing-keywords',
    re: /(?:login|signin|update|verify|confirm|secure|suspend|account|bank|paypal|amazon|microsoft|google|apple|facebook)(?:-|_|\.|[0-9])/i,
    score: 2,
    msg: 'フィッシングでよく使われるキーワードパターン',
    category: 'phishing'
  },
  {
    id: 'urgent-words',
    re: /(?:urgent|immediate|expire|suspend|verify|confirm|update|secure|alert|warning|action|required)/i,
    score: 1,
    msg: '緊急性を煽る文言（フィッシングの典型的手法）',
    category: 'phishing'
  },
  {
    id: 'executable-download',
    re: /\.(?:exe|scr|bat|cmd|com|pif|vbs|jar|app|dmg|pkg|deb|rpm)(?:\?|$|&)/i,
    score: 3,
    msg: '実行可能ファイルの直接ダウンロードリンク',
    category: 'malware'
  },
  {
    id: 'archive-download',
    re: /\.(?:zip|rar|7z|tar|gz|bz2)(?:\?|$|&)/i,
    score: 2,
    msg: 'アーカイブファイルのダウンロードリンク（マルウェア隠蔽の可能性）',
    category: 'malware'
  },
  {
    id: 'spoofed-unicode',
    custom: (s) => {
      // よく使われる偽装文字の個別チェック
      const suspiciousChars = [
        // キリル文字でよく偽装される文字
        'а', 'е', 'о', 'р', 'с', 'х', 'у', // 小文字
        'А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'Х', // 大文字
        // ギリシャ文字
        'α', 'β', 'γ', 'δ', 'ε', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ω',
        'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω'
      ];
      
      // ASCII文字が混在している場合のみ警告（完全にキリル文字やギリシャ文字のサイトは正当）
      const hasAscii = /[a-zA-Z]/.test(s);
      const hasSuspicious = suspiciousChars.some(char => s.includes(char));
      
      return hasAscii && hasSuspicious;
    },
    score: 3,
    msg: 'Unicode偽装文字（ホモグラフ攻撃）の可能性',
    category: 'obfuscation'
  },
  {
    id: 'ip-subdomain',
    re: /https?:\/\/(?:\d{1,3}-){3}\d{1,3}\.|\d{1,3}x\d{1,3}x\d{1,3}x\d{1,3}/i,
    score: 2,
    msg: 'IPアドレスを模倣したサブドメイン',
    category: 'obfuscation'
  },
  {
    id: 'base64-suspicious',
    custom: (s) => {
      // Base64パターンの検出と自動デコード
      const base64Pattern = /(?:[A-Za-z0-9+\/]{20,}(?:=|%3D){0,2})/g;
      const matches = s.match(base64Pattern);
      
      if (!matches) return false;
      
      // URLパラメーター内のBase64をデコードして分析
      for (const match of matches) {
        try {
          // URLエンコードされた=をデコード
          const cleaned = match.replace(/%3D/gi, '=');
          const decoded = atob(cleaned);
          
          // デコード結果にURLや危険なスキームが含まれているかチェック
          if (/^https?:\/\//.test(decoded) || 
              /^(?:javascript:|data:|file:)/.test(decoded) ||
              decoded.includes('://')) {
            return true;
          }
        } catch (e) {
          // デコード失敗は偽のBase64として扱わない
        }
      }
      
      // 長いBase64文字列は疑わしい
      return matches.some(match => match.length > 60);
    },
    score: 2,
    msg: 'Base64エンコードされた疑いのある文字列（難読化の可能性）',
    category: 'obfuscation'
  },
  {
    id: 'hex-encoding',
    re: /(?:%[0-9a-fA-F]{2}){8,}/,
    score: 1,
    msg: '過剰なURL/Hexエンコーディング（難読化の可能性）',
    category: 'obfuscation'
  },
  {
    id: 'double-encoding',
    re: /%25[0-9a-fA-F]{2}/,
    score: 2,
    msg: '二重URLエンコーディング（高度な難読化）',
    category: 'obfuscation'
  },
  {
    id: 'unicode-escape',
    re: /\\u[0-9a-fA-F]{4}/,
    score: 1,
    msg: 'Unicode エスケープシーケンス（難読化の可能性）',
    category: 'obfuscation'
  },
  {
    id: 'url-shortener-chaining',
    re: /(?:bit\.ly|t\.co|tinyurl\.com|is\.gd|cutt\.ly|goo\.gl|ow\.ly).*(?:redirect|url|go|link)/i,
    score: 3,
    msg: '短縮URL連鎖（多段階リダイレクト）',
    category: 'obfuscation'
  },
  {
    id: 'obfuscated-ip',
    custom: (s) => {
      // 難読化されたIPアドレス（8進数、16進数、整数表現）
      const octalIP = /https?:\/\/0[0-7]{1,3}\.0[0-7]{1,3}\.0[0-7]{1,3}\.0[0-7]{1,3}/;
      const hexIP = /https?:\/\/0x[0-9a-fA-F]{1,8}/;
      const integerIP = /https?:\/\/(?:0x)?[0-9]{8,10}(?:\/|$)/;
      
      return octalIP.test(s) || hexIP.test(s) || integerIP.test(s);
    },
    score: 3,
    msg: '難読化されたIPアドレス（8進数/16進数/整数表現）',
    category: 'obfuscation'
  },
  {
    id: 'data-uri-suspicious',
    custom: (s) => {
      const dataUriPattern = /data:([^;]+)(;[^,]*)?,(.*)/i;
      const match = s.match(dataUriPattern);
      
      if (!match) return false;
      
      const mimeType = match[1];
      const data = match[3];
      
      // 実行可能なMIMEタイプ
      const executableTypes = [
        'text/html', 'application/javascript', 'text/javascript',
        'application/x-msdownload', 'application/octet-stream'
      ];
      
      // Base64エンコードされたHTMLやJavaScript
      if (executableTypes.includes(mimeType) || 
          (data.length > 100 && /^[A-Za-z0-9+\/=]+$/.test(data))) {
        return true;
      }
      
      return false;
    },
    score: 3,
    msg: '疑わしいData URI（実行可能コンテンツの可能性）',
    category: 'malware'
  },
  {
    id: 'typosquatting',
    custom: (s) => {
      try {
        const url = new URL(s);
        const hostname = url.hostname.toLowerCase();
        // 有名サイトのタイポスクワッティングをチェック
        const legitimateSites = ['google', 'facebook', 'amazon', 'microsoft', 'apple', 'paypal', 'github', 'twitter'];
        const typoPatterns = legitimateSites.some(site => {
          // 文字の置換や挿入をチェック
          const variations = [
            site.replace('o', '0'),  // o -> 0 (google -> g00gle)
            site.replace(/o/g, '0'), // 全てのo -> 0
            site.replace('e', '3'),  // e -> 3
            site.replace('a', '@'),  // a -> @
            site.replace('l', '1'),  // l -> 1
            site + '1', site + '-', site + '_',  // 末尾追加
            'www-' + site, 'secure-' + site, 'login-' + site,  // プレフィックス
            site.replace('g', 'q'), // g -> q (google -> qoogle)
            site.replace('oo', '00'), // oo -> 00 (google -> g00gle)
          ];
          return variations.some(variant => hostname.includes(variant));
        });
        return typoPatterns;
      } catch (e) {
        return false;
      }
    },
    score: 3,
    msg: 'タイポスクワッティング（有名サイトの偽装）の疑い',
    category: 'phishing'
  },
  {
    id: 'suspicious-tld',
    custom: (s) => {
      try {
        const url = new URL(s);
        const hostname = url.hostname.toLowerCase();
        
        // 疑わしいTLD（よく悪用されるもの）
        const suspiciousTlds = [
          '.tk', '.ml', '.ga', '.cf', '.men', '.click', '.download',
          '.stream', '.science', '.racing', '.review', '.country',
          '.kim', '.cricket', '.science', '.work', '.party'
        ];
        
        return suspiciousTlds.some(tld => hostname.endsWith(tld));
      } catch (e) {
        return false;
      }
    },
    score: 2,
    msg: '疑わしいトップレベルドメイン（悪用されやすいTLD）',
    category: 'phishing'
  },
];

// Determine if a string is a URL.  We use the URL constructor and
// ignore strings that do not have a valid scheme or host.
function isURL(value) {
  try {
    const url = new URL(value);
    return !!url.protocol && !!url.host;
  } catch (err) {
    return false;
  }
}

// Analyse the input string against all rules and compute a risk
// classification.
function analysePayload(payload) {
  const details = [];
  let totalScore = 0;
  const trimmed = payload.trim();
  const decodedInfo = [];
  
  // Check if whitelisted
  if (isURL(trimmed) && isWhitelisted(trimmed)) {
    return {
      level: 'whitelisted',
      score: 0,
      details: [{
        id: 'whitelisted',
        message: 'このドメインは信頼できるホワイトリストに登録されています',
        score: 0,
        category: 'trusted'
      }]
    };
  }
  
  if (!isURL(trimmed)) {
    // Not a URL: still perform generic checks but warn the user.
    details.push({
      id: 'non-url',
      message: '入力はURLではないようです；静的チェックのみ適用されます',
      score: 0,
      category: 'info'
    });
  }
  
  // Base64デコード試行とデコード情報の収集
  const base64Pattern = /(?:[A-Za-z0-9+\/]{20,}(?:=|%3D){0,2})/g;
  const base64Matches = trimmed.match(base64Pattern);
  
  if (base64Matches) {
    base64Matches.forEach((match, index) => {
      try {
        const cleaned = match.replace(/%3D/gi, '=');
        const decoded = atob(cleaned);
        
        // 印刷可能文字かチェック
        if (/^[\x20-\x7E\s]*$/.test(decoded)) {
          decodedInfo.push({
            original: match.substring(0, 50) + (match.length > 50 ? '...' : ''),
            decoded: decoded.substring(0, 200) + (decoded.length > 200 ? '...' : ''),
            length: decoded.length
          });
        }
      } catch (e) {
        // デコード失敗は無視
      }
    });
  }
  
  RULES.forEach((rule) => {
    let matched = false;
    let score = 0;
    if (rule.re) {
      matched = rule.re.test(trimmed);
      if (matched) {
        score = typeof rule.score === 'function' ? rule.score(trimmed.match(rule.re)) : rule.score;
      }
    } else if (rule.custom) {
      matched = rule.custom(trimmed);
      if (matched) {
        score = typeof rule.score === 'function' ? rule.score(trimmed) : rule.score;
      }
    }
    if (matched) {
      totalScore += score;
      details.push({ 
        id: rule.id, 
        message: rule.msg, 
        score: score,
        category: rule.category || 'general'
      });
    }
  });
  
  let level;
  if (totalScore >= 6) {
    level = 'high';
  } else if (totalScore >= 3) {
    level = 'medium';
  } else {
    level = 'low';
  }
  
  return { level, score: totalScore, details, decodedInfo };
}

// Update the results panel with the analysis output.
function renderResult(result, source = 'manual') {
  const resultDiv = document.getElementById('result');
  // Clear previous content safely
  while (resultDiv.firstChild) {
    resultDiv.removeChild(resultDiv.firstChild);
  }
  
  // Create heading with risk badge
  const heading = document.createElement('h2');
  const sourceText = source === 'qr' ? 'QRコード分析結果' : '分析結果';
  heading.textContent = sourceText;
  
  const badge = document.createElement('span');
  badge.classList.add('risk-badge');
  
  if (result.level === 'whitelisted') {
    badge.classList.add('risk-low');
    badge.textContent = '信頼済み';
  } else {
    badge.classList.add('risk-' + result.level);
    const levelMap = {
      'low': '低',
      'medium': '中',
      'high': '高'
    };
    badge.textContent = levelMap[result.level] || escapeHtml(result.level);
  }
  
  heading.appendChild(badge);
  resultDiv.appendChild(heading);
  
  // Summary paragraph
  const summary = document.createElement('p');
  if (result.level === 'whitelisted') {
    summary.textContent = 'このドメインは信頼できるホワイトリストに登録されています';
  } else {
    summary.textContent = `総リスクスコア: ${result.score}`;
  }
  resultDiv.appendChild(summary);
  
  // Group details by category
  if (result.details.length > 0) {
    const categories = {
      security: { label: '🔒 セキュリティ問題', items: [] },
      obfuscation: { label: '🎭 偽装・難読化', items: [] },
      privacy: { label: '👁️ プライバシーの懸念', items: [] },
      network: { label: '🌐 ネットワーク問題', items: [] },
      structure: { label: '📐 構造上の問題', items: [] },
      info: { label: 'ℹ️ 情報', items: [] },
      trusted: { label: '✅ 信頼済み', items: [] },
      general: { label: '📋 一般的な問題', items: [] }
    };
    
    result.details.forEach(detail => {
      const cat = detail.category || 'general';
      if (categories[cat]) {
        categories[cat].items.push(detail);
      }
    });
    
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'risk-details';
    
    Object.entries(categories).forEach(([key, cat]) => {
      if (cat.items.length > 0) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'risk-category';
        
        const catHeading = document.createElement('h4');
        catHeading.textContent = cat.label;
        categoryDiv.appendChild(catHeading);
        
        const itemsList = document.createElement('ul');
        itemsList.className = 'risk-items';
        
        cat.items.forEach(item => {
          const li = document.createElement('li');
          li.className = 'risk-item';
          
          // Add severity class based on score
          if (item.score >= 3) {
            li.classList.add('severity-high');
          } else if (item.score >= 2) {
            li.classList.add('severity-medium');
          } else {
            li.classList.add('severity-low');
          }
          
          const messageSpan = document.createElement('span');
          messageSpan.textContent = item.message; // Safe text assignment
          li.appendChild(messageSpan);
          
          if (item.score > 0) {
            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'risk-score';
            scoreSpan.textContent = `+${item.score}`;
            li.appendChild(scoreSpan);
          }
          
          itemsList.appendChild(li);
        });
        
        categoryDiv.appendChild(itemsList);
        detailsDiv.appendChild(categoryDiv);
      }
    });
    
    resultDiv.appendChild(detailsDiv);
  }
  
  // デコード情報の表示
  if (result.decodedInfo && result.decodedInfo.length > 0) {
    const decodedSection = document.createElement('div');
    decodedSection.className = 'decoded-section';
    
    const decodedHeading = document.createElement('h3');
    decodedHeading.textContent = '🔍 検出された難読化コンテンツ';
    decodedSection.appendChild(decodedHeading);
    
    result.decodedInfo.forEach((info, index) => {
      const decodedItem = document.createElement('div');
      decodedItem.className = 'decoded-item';
      
      const originalLabel = document.createElement('div');
      originalLabel.className = 'decoded-label';
      originalLabel.textContent = 'エンコード文字列:';
      decodedItem.appendChild(originalLabel);
      
      const originalText = document.createElement('div');
      originalText.className = 'decoded-original';
      originalText.textContent = info.original;
      decodedItem.appendChild(originalText);
      
      const decodedLabel = document.createElement('div');
      decodedLabel.className = 'decoded-label';
      decodedLabel.textContent = 'デコード結果:';
      decodedItem.appendChild(decodedLabel);
      
      const decodedText = document.createElement('div');
      decodedText.className = 'decoded-content';
      decodedText.textContent = info.decoded;
      decodedItem.appendChild(decodedText);
      
      if (info.length > 200) {
        const lengthInfo = document.createElement('div');
        lengthInfo.className = 'decoded-info';
        lengthInfo.textContent = `（全体長: ${info.length}文字）`;
        decodedItem.appendChild(lengthInfo);
      }
      
      decodedSection.appendChild(decodedItem);
    });
    
    resultDiv.appendChild(decodedSection);
  }
  
  resultDiv.classList.remove('hidden');
}

// Tab switching functionality
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      
      // Update button states
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update pane visibility
      tabPanes.forEach(pane => {
        if (pane.id === targetTab + '-tab') {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });
      
      // Clear result when switching tabs
      const resultDiv = document.getElementById('result');
      if (resultDiv) {
        resultDiv.classList.add('hidden');
      }
      
      // Clear QR decode output when switching away from QR tab
      if (targetTab !== 'qrscan') {
        const decodedOutput = document.getElementById('decodedOutput');
        if (decodedOutput) {
          decodedOutput.classList.add('hidden');
          const decodedText = decodedOutput.querySelector('.decoded-text');
          if (decodedText) {
            decodedText.textContent = '';
          }
        }
      }
    });
  });
}

// Sample URL buttons
function setupSampleButtons() {
  const sampleButtons = document.querySelectorAll('.sample-btn');
  const payloadInput = document.getElementById('payload');
  
  sampleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const url = button.dataset.url;
      payloadInput.value = url;
      // Auto-analyze
      const analysis = analysePayload(url);
      renderResult(analysis);
    });
  });
}

// --- Application bootstrap: wire up UI interactions once the DOM is ready ---
// Attach event handlers after DOM content is loaded.
document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const startCameraBtn = document.getElementById('startCameraBtn');
  const stopCameraBtn = document.getElementById('stopCameraBtn');
  const fileInput = document.getElementById('fileInput');
  const video = document.getElementById('preview');
  const decodedOutput = document.getElementById('decodedOutput');
  const decodedText = decodedOutput.querySelector('.decoded-text');
  const cameraLoading = document.getElementById('camera-loading');
  const addWhitelistBtn = document.getElementById('addWhitelistBtn');
  const whitelistInput = document.getElementById('whitelistInput');
  
  let scanner = null;
  
  // Initialize
  loadWhitelist();
  renderWhitelist();
  setupTabs();
  setupSampleButtons();
  
  // Delayed library status check to allow async loading
  setTimeout(() => {
    console.log('=== QR Libraries Status (Final Check) ===');
    
    // Check QR Scanner library
    if (window.QrScanner) {
      console.log('✅ QR Scanner library loaded successfully');
    } else {
      console.error('❌ QR Scanner library not loaded. Some features may be unavailable.');
    }
    
    // Check QR Code generation library
    if (typeof QRCode !== 'undefined') {
      // Check if it's the correct qrcode library (not qrcode-generator)
      if (typeof QRCode.toDataURL === 'function') {
        console.log('✅ QR Code generation library fully functional');
        window.qrCodeLibraryLoaded = true;
      } else if (typeof QRCode.prototype !== 'undefined') {
        // This is likely qrcode-generator library (different API)
        console.warn('⚠️  Found qrcode-generator library (incompatible API)');
        console.log('Available methods:', Object.getOwnPropertyNames(QRCode.prototype));
        window.qrCodeLibraryLoaded = false;
      } else {
        console.warn('⚠️  QR Code library loaded but toDataURL method not available');
        console.log('QRCode object:', QRCode);
        console.log('QRCode type:', typeof QRCode);
        window.qrCodeLibraryLoaded = false;
      }
    } else {
      console.warn('⚠️  QR Code generation library not loaded - will use fallback preview');
      window.qrCodeLibraryLoaded = false;
    }
    
    console.log('======================================');
  }, 1000);
  
  // Whitelist management
  addWhitelistBtn.addEventListener('click', () => {
    const domain = whitelistInput.value.trim();
    if (domain) {
      const success = addToWhitelist(domain);
      if (success) {
        whitelistInput.value = '';
      } else {
        // Show error for invalid domain
        const errorMsg = document.createElement('div');
        errorMsg.className = 'help-text';
        errorMsg.style.background = '#fef2f2';
        errorMsg.style.borderLeftColor = '#dc2626';
        errorMsg.style.marginTop = '0.5rem';
        
        const errorP = document.createElement('p');
        errorP.style.color = '#991b1b';
        errorP.style.fontSize = '0.875rem';
        errorP.textContent = '⚠️ 無効なドメイン名です';
        errorMsg.appendChild(errorP);
        
        const whitelistSection = document.querySelector('.whitelist-section');
        const existing = whitelistSection.querySelector('.help-text');
        if (existing) existing.remove();
        
        whitelistSection.appendChild(errorMsg);
        setTimeout(() => errorMsg.remove(), 3000);
      }
    }
  });
  
  whitelistInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addWhitelistBtn.click();
    }
  });
  
  // Make removeFromWhitelist available globally for onclick handlers
  window.removeFromWhitelist = removeFromWhitelist;
  
  analyzeBtn.addEventListener('click', () => {
    const payload = document.getElementById('payload').value;
    if (!payload.trim()) {
      // Show inline error instead of alert
      const errorDiv = document.createElement('div');
      errorDiv.className = 'help-text';
      errorDiv.style.background = '#fef2f2';
      errorDiv.style.borderLeftColor = '#dc2626';
      const errorP = document.createElement('p');
      errorP.style.color = '#991b1b';
      errorP.textContent = '⚠️ 分析するURLまたはテキストを入力してください';
      errorDiv.appendChild(errorP);
      
      const inputGroup = document.querySelector('.input-group');
      const existing = inputGroup.querySelector('.help-text');
      if (existing) existing.remove();
      inputGroup.insertBefore(errorDiv, inputGroup.firstChild);
      
      setTimeout(() => errorDiv.remove(), 3000);
      return;
    }
    const analysis = analysePayload(payload);
    renderResult(analysis);
  });
  
  clearBtn.addEventListener('click', () => {
    // Clear manual input
    document.getElementById('payload').value = '';
    
    // Clear results
    document.getElementById('result').classList.add('hidden');
    
    // Clear QR decode output
    decodedOutput.classList.add('hidden');
    if (decodedText) decodedText.textContent = '';
    
    // Stop camera if running
    if (scanner) {
      scanner.stop();
      scanner.destroy();
      scanner = null;
    }
    
    // Hide video and loading
    video.classList.add('hidden');
    cameraLoading.classList.add('hidden');
    
    // Reset button states
    startCameraBtn.disabled = false;
    stopCameraBtn.disabled = true;
    
    // Reset file input
    fileInput.value = '';
    
    // Remove any error messages
    const errorMessages = document.querySelectorAll('.help-text');
    errorMessages.forEach(msg => {
      if (msg.querySelector('p[style*="color: #991b1b"]')) {
        msg.remove();
      }
    });
  });
  
  // Start scanning from camera
  startCameraBtn.addEventListener('click', async () => {
    if (!window.QrScanner) {
      console.error('QrScanner is not available:', {
        'window.QrScanner': window.QrScanner,
        'typeof QrScanner': typeof window.QrScanner
      });
      alert('QRスキャンライブラリの読み込みに失敗しました。\n\nブラウザーの開発者ツール（F12）でネットワークタブを確認し、CDNへの接続をチェックしてください。');
      return;
    }
    if (scanner) {
      // Already scanning
      return;
    }
    
    // Show loading indicator
    cameraLoading.classList.remove('hidden');
    startCameraBtn.disabled = true;
    stopCameraBtn.disabled = false;
    
    try {
      const hasCam = await QrScanner.hasCamera();
      if (!hasCam) {
        cameraLoading.classList.add('hidden');
        startCameraBtn.disabled = false;
        stopCameraBtn.disabled = true;
        alert('このデバイスにカメラが見つかりません。');
        return;
      }
      
      decodedOutput.classList.add('hidden');
      if (decodedText) decodedText.textContent = '';
      
      // Hide QR image preview when starting camera
      hideQRImagePreview();
      
      scanner = new QrScanner(video, (result) => {
        const text = result && result.data ? result.data : result;
        
        // Generate clean QR code preview for camera scans
        generateQRCodePreview(text, 'camera-scan');
        
        if (decodedText) {
          decodedText.textContent = text;
        }
        decodedOutput.classList.remove('hidden');
        const analysis = analysePayload(text);
        renderResult(analysis, 'qr');
        
        // Add success animation
        decodedOutput.style.animation = 'fadeIn 0.5s ease';
        
        // stop after first successful scan
        if (scanner) {
          scanner.stop();
          scanner.destroy();
          scanner = null;
          video.classList.add('hidden');
          startCameraBtn.disabled = false;
          stopCameraBtn.disabled = true;
        }
      }, (error) => {
        console.log('Scanner error:', error);
        // Continue scanning on errors (don't show error for every failed scan attempt)
      }, { 
        returnDetailedScanResult: false,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 5
      });
      
      video.classList.remove('hidden');
      await scanner.start();
      cameraLoading.classList.add('hidden');
    } catch (err) {
      console.error(err);
      cameraLoading.classList.add('hidden');
      startCameraBtn.disabled = false;
      stopCameraBtn.disabled = true;
      
      // Show inline error
      const errorDiv = document.createElement('div');
      errorDiv.className = 'help-text';
      errorDiv.style.background = '#fef2f2';
      errorDiv.style.borderLeftColor = '#dc2626';
      const errorP = document.createElement('p');
      errorP.style.color = '#991b1b';
      errorP.textContent = '⚠️ カメラへのアクセスに失敗しました。権限を確認してください。';
      errorDiv.appendChild(errorP);
      
      const scanGroup = document.getElementById('qrscan-tab');
      scanGroup.insertBefore(errorDiv, scanGroup.querySelector('.scan-controls'));
      
      setTimeout(() => errorDiv.remove(), 5000);
      
      if (scanner) {
        scanner.stop();
        scanner.destroy();
        scanner = null;
      }
    }
  });
  
  // QR code download functionality
  const downloadQRBtn = document.getElementById('downloadQRBtn');
  if (downloadQRBtn) {
    downloadQRBtn.addEventListener('click', () => {
      const qrUrl = downloadQRBtn.getAttribute('data-qr-url');
      const qrText = downloadQRBtn.getAttribute('data-qr-text');
      
      if (qrUrl) {
        // Create download link
        const link = document.createElement('a');
        
        // Generate filename based on content
        let filename = 'qr-code';
        if (qrText) {
          // Extract domain or first few words for filename
          try {
            const url = new URL(qrText);
            filename = `qr-${url.hostname.replace(/[^a-z0-9]/gi, '-')}`;
          } catch {
            // Not a URL, use first few words
            const words = qrText.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).slice(0, 3).join('-');
            filename = words ? `qr-${words}` : 'qr-code';
          }
        }
        
        link.download = `${filename}.png`;
        link.href = qrUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        const originalText = downloadQRBtn.innerHTML;
        downloadQRBtn.innerHTML = '<span class="btn-icon">✅</span>保存完了';
        downloadQRBtn.disabled = true;
        setTimeout(() => {
          downloadQRBtn.innerHTML = originalText;
          downloadQRBtn.disabled = false;
        }, 2000);
      }
    });
  }

  // Stop scanning
  stopCameraBtn.addEventListener('click', () => {
    if (scanner) {
      scanner.stop();
      scanner.destroy();
      scanner = null;
    }
    video.classList.add('hidden');
    cameraLoading.classList.add('hidden');
    startCameraBtn.disabled = false;
    stopCameraBtn.disabled = true;
  });
  
  // File input scanning
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const container = document.getElementById('qrscan-tab');

    // Remove previous error messages to avoid stacking
    const existingError = container.querySelector('.help-text.upload-error');
    if (existingError) {
      existingError.remove();
    }

    // Always show the uploaded image preview for context
    showQRImagePreview(file);

    decodedOutput.classList.add('hidden');
    if (decodedText) decodedText.textContent = '';

    // Show loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    const loadingText = document.createElement('p');
    loadingText.textContent = '画像を処理中...';
    loadingDiv.appendChild(spinner);
    loadingDiv.appendChild(loadingText);
    container.appendChild(loadingDiv);

    try {
      const text = await decodeQRCodeFromFile(file);

      if (!text) {
        throw new Error('No QR code found in the selected image');
      }

      if (decodedText) {
        decodedText.textContent = text;
      }
      decodedOutput.classList.remove('hidden');
      decodedOutput.style.animation = 'fadeIn 0.5s ease';

      const analysis = analysePayload(text);
      renderResult(analysis, 'qr');
    } catch (err) {
      const consoleMethod = (err && err.message && err.message.includes('Failed to resolve module specifier')) ? console.warn : console.error;
      consoleMethod.call(console, 'QR scan error:', err);
      
      // Show inline error with more specific message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'help-text upload-error';
      errorDiv.style.background = '#fef2f2';
      errorDiv.style.borderLeftColor = '#dc2626';
      const errorP = document.createElement('p');
      errorP.style.color = '#991b1b';
      
      // Provide more specific error messages
      if (err.message && err.message.includes('No QR code found')) {
        errorP.textContent = '⚠️ 画像からQRコードが見つかりませんでした。画像が鮮明でQRコード全体が写っているか確認してください。';
      } else if (err.message && err.message.includes('QR decoding backend unavailable')) {
        errorP.textContent = '⚠️ このブラウザーではQRコードの解析バックエンドが利用できません。ChromeやEdgeなどの最新ブラウザーでお試しください。';
      } else if (err.message && err.message.includes('Failed to resolve module specifier')) {
        errorP.textContent = '⚠️ QRコード解析用ワーカーの読み込みに失敗しました。オフラインで実行している場合はBarcodeDetector対応ブラウザーをご利用ください。';
      } else if (err.message && err.message.includes('Worker')) {
        errorP.textContent = '⚠️ QRコード読み取り機能の初期化に失敗しました。ブラウザーを更新して再度お試しください。';
      } else {
        errorP.textContent = '⚠️ 画像の処理中にエラーが発生しました。別の画像をお試しください。';
      }
      
      errorDiv.appendChild(errorP);
      
      container.insertBefore(errorDiv, container.querySelector('.scan-controls').nextSibling);
      setTimeout(() => errorDiv.remove(), 7000);
    } finally {
      loadingDiv.remove();
      // Allow selecting the same file twice in a row
      event.target.value = '';
    }
  });
});

// Fallback scanner loader function
// Generate clean QR code preview
function generateQRCodePreview(text, source = 'upload') {
  const qrImagePreview = document.getElementById('qrImagePreview');
  const qrPreviewImg = document.getElementById('qrPreviewImg');
  const qrImageName = document.getElementById('qrImageName');
  const qrImageSize = document.getElementById('qrImageSize');
  const downloadBtn = document.getElementById('downloadQRBtn');
  
  if (!qrImagePreview || !qrPreviewImg || !qrImageName || !qrImageSize) {
    return;
  }
  
  // Check if QR preview is disabled
  if (window.qrPreviewDisabled) {
    console.log('QR code preview is disabled - library not available');
    return;
  }
  
  // Check if correct QRCode library is available and functional
  if (typeof QRCode === 'undefined' || 
      typeof QRCode.toDataURL !== 'function' || 
      window.qrCodeLibraryLoaded === false) {
    console.warn('QRCode library not available or incompatible, using fallback preview');
    // Always show text-based preview as fallback
    showOriginalImagePreview(text);
    return;
  }
  
  try {
    // Generate clean QR code
    QRCode.toDataURL(text, {
      width: 200,
      height: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    }, function(error, url) {
      if (error) {
        console.error('QR code generation error:', error);
        return;
      }
      
      // Set generated QR code
      qrPreviewImg.src = url;
      
      // Set info based on source
      if (source === 'camera-scan') {
        qrImageName.textContent = 'カメラでスキャンしたQRコード';
        qrImageSize.textContent = '200×200 PNG';
      } else {
        qrImageName.textContent = '生成されたQRコード';
        qrImageSize.textContent = '200×200 PNG';
      }
      
      // Show preview and download button
      qrImagePreview.classList.remove('hidden');
      if (downloadBtn) {
        downloadBtn.classList.remove('hidden');
        // Store the data URL for download
        downloadBtn.setAttribute('data-qr-url', url);
        downloadBtn.setAttribute('data-qr-text', text);
      }
    });
  } catch (error) {
    console.error('QR code preview generation failed:', error);
  }
}

// QR image preview function for uploaded files
function showQRImagePreview(file) {
  const qrImagePreview = document.getElementById('qrImagePreview');
  const qrPreviewImg = document.getElementById('qrPreviewImg');
  const qrImageName = document.getElementById('qrImageName');
  const qrImageSize = document.getElementById('qrImageSize');
  const downloadBtn = document.getElementById('downloadQRBtn');
  
  if (!qrImagePreview || !qrPreviewImg || !qrImageName || !qrImageSize) {
    return;
  }
  
  // Create file URL for preview
  const fileURL = URL.createObjectURL(file);
  qrPreviewImg.src = fileURL;
  
  // Set file info
  qrImageName.textContent = file.name;
  const fileSizeKB = (file.size / 1024).toFixed(1);
  qrImageSize.textContent = `${fileSizeKB} KB`;
  
  // Hide download button for uploaded files
  if (downloadBtn) {
    downloadBtn.classList.add('hidden');
  }
  
  // Show preview
  qrImagePreview.classList.remove('hidden');
  
  // Clean up URL when image loads
  qrPreviewImg.onload = function() {
    URL.revokeObjectURL(fileURL);
  };
}

// Use the native BarcodeDetector API when available as a worker-free fallback.
async function loadImageSourceFromFile(file) {
  if (window.createImageBitmap) {
    return await createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(img.src);
      reject(err);
    };
    img.src = URL.createObjectURL(file);
  });
}

async function decodeWithBarcodeDetector(file) {
  if (!('BarcodeDetector' in window)) {
    return null;
  }

  try {
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    const source = await loadImageSourceFromFile(file);
    const results = await detector.detect(source);

    if (source && typeof source.close === 'function') {
      source.close();
    }

    if (results && results.length > 0) {
      const candidate = results[0];
      return candidate.rawValue || candidate.rawData || null;
    }
  } catch (err) {
    console.warn('BarcodeDetector fallback failed:', err);
  }

  return null;
}

// Try worker-based decoding first, then fall back to the native detector or bubble up errors.
async function decodeQRCodeFromFile(file) {
  let scannerError = null;
  if (window.QrScanner) {
    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: false,
        alsoTryWithoutWorker: true
      });
      return typeof result === 'string' ? result : (result && (result.data || result)) || null;
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      if (message.includes('Failed to resolve module specifier')) {
        console.warn('QrScanner worker import failed; falling back to BarcodeDetector.');
      } else {
        console.warn('QrScanner.scanImage failed, trying fallbacks:', err);
      }
      scannerError = err;
    }
  }

  const barcodeText = await decodeWithBarcodeDetector(file);
  if (barcodeText) {
    return barcodeText;
  }

  if (!window.QrScanner && !('BarcodeDetector' in window)) {
    throw new Error('QR decoding backend unavailable');
  }

  if (scannerError) {
    throw scannerError;
  }

  return null;
}

// Show original image preview when QR generation fails
function showOriginalImagePreview(text) {
  const qrImagePreview = document.getElementById('qrImagePreview');
  const qrPreviewImg = document.getElementById('qrPreviewImg');
  const qrImageName = document.getElementById('qrImageName');
  const qrImageSize = document.getElementById('qrImageSize');
  const downloadBtn = document.getElementById('downloadQRBtn');
  
  if (!qrImagePreview || !qrPreviewImg || !qrImageName || !qrImageSize) {
    return;
  }
  
  // Create a more informative placeholder image
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 200, 200);
  
  // Gradient border for better visibility
  const gradient = ctx.createLinearGradient(0, 0, 200, 200);
  gradient.addColorStop(0, '#3b82f6');
  gradient.addColorStop(1, '#1e40af');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 196, 196);
  
  // QR-like pattern in corners (decorative)
  ctx.fillStyle = '#1f2937';
  const cornerSize = 20;
  // Top-left corner
  ctx.fillRect(15, 15, cornerSize, cornerSize);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(20, 20, 10, 10);
  // Top-right corner  
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(165, 15, cornerSize, cornerSize);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(170, 20, 10, 10);
  // Bottom-left corner
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(15, 165, cornerSize, cornerSize);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(20, 170, 10, 10);
  
  // Title
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('QR Preview', 100, 60);
  
  // Status message
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Library unavailable', 100, 80);
  ctx.fillText('Showing text content:', 100, 100);
  
  // Content area background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(15, 110, 170, 50);
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 1;
  ctx.strokeRect(15, 110, 170, 50);
  
  // Display text with better formatting
  ctx.fillStyle = '#1f2937';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  
  // Word wrap the text
  const maxWidth = 150;
  const lineHeight = 12;
  let y = 125;
  
  if (text.length > 35) {
    // Split long text into multiple lines
    const words = text.match(/.{1,30}/g) || [text];
    for (let i = 0; i < Math.min(words.length, 3); i++) {
      let displayLine = words[i];
      if (i === 2 && words.length > 3) {
        displayLine = displayLine.substring(0, 27) + '...';
      }
      ctx.fillText(displayLine, 20, y);
      y += lineHeight;
    }
  } else {
    ctx.fillText(text, 20, y);
  }
  
  // Footer
  ctx.fillStyle = '#9ca3af';
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Text content decoded successfully', 100, 185);
  
  qrPreviewImg.src = canvas.toDataURL();
  qrImageName.textContent = 'QRコード（ライブラリー未対応）';
  qrImageSize.textContent = '200×200 代替表示';
  
  // Hide download button
  if (downloadBtn) {
    downloadBtn.classList.add('hidden');
  }
  
  qrImagePreview.classList.remove('hidden');
}

// Hide QR image preview (for camera scans)
function hideQRImagePreview() {
  const qrImagePreview = document.getElementById('qrImagePreview');
  if (qrImagePreview) {
    qrImagePreview.classList.add('hidden');
  }
}

// QR code generation library fallback loader
window.loadFallbackQRCodeLibrary = function() {
  console.log('Attempting to load fallback QR code generation library...');
  
  // Try alternative CDN paths with CSP-compliant URLs only
  const fallbackPaths = [
    'https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js',
    'https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js'
  ];
  
  let currentIndex = 0;
  
  function tryNextPath() {
    if (currentIndex >= fallbackPaths.length) {
      console.error('All QR code generation library fallbacks failed');
      // Disable QR preview functionality
      disableQRPreview();
      return;
    }
    
    const script = document.createElement('script');
    script.src = fallbackPaths[currentIndex];
    
    script.onload = function() {
      console.log(`Fallback QR code generation library loaded from: ${fallbackPaths[currentIndex]}`);
      
      // Verify this is the correct qrcode library
      if (typeof QRCode !== 'undefined' && typeof QRCode.toDataURL === 'function') {
        console.log('✅ Compatible QRCode.toDataURL is now available');
        window.qrCodeLibraryLoaded = true;
      } else if (typeof QRCode !== 'undefined') {
        console.warn('⚠️  Loaded incompatible QRCode library, continuing to next fallback');
        window.qrCodeLibraryLoaded = false;
        currentIndex++;
        tryNextPath();
      } else {
        console.warn('⚠️  QRCode not defined after loading, continuing to next fallback');
        window.qrCodeLibraryLoaded = false;
        currentIndex++;
        tryNextPath();
      }
    };
    
    script.onerror = function() {
      console.log(`Failed to load QR code library from: ${fallbackPaths[currentIndex]}`);
      currentIndex++;
      tryNextPath();
    };
    
    document.head.appendChild(script);
  }
  
  tryNextPath();
};

// Disable QR preview when library unavailable
function disableQRPreview() {
  console.log('QR code preview disabled - library not available');
  // Hide preview section for new scans
  window.qrPreviewDisabled = true;
}

window.loadFallbackScanner = function() {
  console.log('Attempting to load fallback QR scanner library...');
  
  // Try alternative CDN
  const fallbackScript = document.createElement('script');
  fallbackScript.src = 'https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner.umd.min.js';
  fallbackScript.crossOrigin = 'anonymous';
  
  fallbackScript.onload = function() {
    console.log('Fallback QR scanner library loaded successfully');
  };
  
  fallbackScript.onerror = function() {
    console.error('Failed to load fallback QR scanner library');
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'help-text';
    errorDiv.style.background = '#fef2f2';
    errorDiv.style.borderLeftColor = '#dc2626';
    errorDiv.style.margin = '1rem';
    
    const errorP = document.createElement('p');
    errorP.style.color = '#991b1b';
    errorP.innerHTML = '⚠️ QRスキャナーライブラリの読み込みに失敗しました。<br>ネットワーク接続を確認するか、画像ファイルアップロード機能をご利用ください。';
    errorDiv.appendChild(errorP);
    
    // Add to QR scanner tab
    const qrTab = document.getElementById('qrscan-tab');
    if (qrTab) {
      qrTab.insertBefore(errorDiv, qrTab.firstChild);
    }
  };
  
  document.head.appendChild(fallbackScript);
};
