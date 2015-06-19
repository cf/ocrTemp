function thinCoat(idata,w)
{
	var h=idata.length/w;
	var d=new Uint8Array(idata.buffer);
	for(var y=1;y<h-1;y++)
	{
		var yp=y*w*4;
		for(var x=1;x<w-1;x++)
		{
			var m=yp+x*4;
			if(d[m]+d[m+1]+d[m+2]>300)
			{
				if(d[m-2]+d[m-3]+d[m-4]>600&&d[m+6]+d[m+5]+d[m+4]>600&&d[m+w*4]+d[m+w*4+1]+d[m+w*4+2]>600)
				{
					d[m]=d[m+1]=d[m+2]=0xff;
					d[m+3]=0;
				}
			}
		}
	}
}
function cfRand(x)
{	
	var c=(Math.cos(x*x*2.314985)+1)/2;
	return (Math.exp(Math.sin((x%(2+Math.cos(x)*x))*x*(c+(Math.cos(c+0.1)+1)/2)))*Math.PI*5*(Math.cos(x)+1+x%2))%1;
}

var ocrImage=(function(){
var curColor=0,minX=0,maxX=0,minY=0,maxY=0,cw=0,ch=0,colorInd=0,buf;
function fillBucket(x,y)
{
	if(buf[y*cw+x]!==0) return;
	var p=y*cw+x;
	buf[p]=curColor;
	if(x+1<cw&&buf[p+1]===0) fillBucket(x+1,y);
	if(x-1>0&&buf[p-1]===0) fillBucket(x-1,y);
	if(y+1<ch&&buf[p+cw]===0) fillBucket(x,y+1);
	if(y-1>0&&buf[p-cw]===0) fillBucket(x,y-1);
}
function countRegions(ctx)
{
	var idata=ctx.getImageData(0,0,cw,ch);
	buf=new Uint32Array(idata.data.buffer);
	colorInd=0;
	for(var y=0;y<ch;y++)
	{
		for(var x=0;x<cw;x++)
		{
			if(buf[y*cw+x]===0)
			{
				curColor=(0xff000000|(Math.floor(cfRand(colorInd*3)*127+127)&0xff)<<16|(Math.floor(cfRand(colorInd*5+1)*127+127)&0xff)<<8|((colorInd++)&0xff))>>>0;
				fillBucket(x,y);
			}
		}
	}
	ctx.putImageData(idata,0,0);
	return colorInd;
}
function _ocrCanv(ctx)
{
	var canv=ctx.canvas;
	cw=canv.width;
	ch=canv.height;
	var oidata=ctx.getImageData(0,0,cw,ch);
	thinCoat(oidata.data);
	var obuf=new Uint32Array(oidata.data.buffer);
	minX=cw;
	minY=ch;
	maxX=maxY=0;
	for(var i=0;i<obuf.length;i++)
	{
		if(obuf[i]!==0&&(obuf[i]&0xffffff)===0&&(obuf[i]>>>24)>128&&((obuf[i]>>>8)&0xff)<235&&((obuf[i]>>>16)&0xff)<235)
		{
			var x=i%cw,y=Math.floor(i/cw);
			if(x<minX) minX=x;
			if(x>maxX) maxX=x;
			if(y<minY) minY=y;
			if(y>maxY) maxY=y;
			
			obuf[i]=0xffffffff;
		}else{
			obuf[i]=0;
		}
	}
	ctx.putImageData(oidata,0,0);
	
	var res={text:"",base:countRegions(ctx)};
	ctx.putImageData(oidata,0,0);
	ctx.strokeStyle="#ffffff";
	ctx.lineWidth=1;
	var midX=Math.round((minX+maxX)/2);
	var midY=Math.round((minY+maxY)/2);
	//Start tests, each test is named according to <x0>_<y0>_<x1>_<y1> 
	//bi ru, midX_maxY_midX_minY
	ctx.beginPath();
	ctx.moveTo(midX,maxY);
	ctx.lineTo(midX,minY);
	ctx.stroke();
	res.midX_maxY_midX_minY=countRegions(ctx);
	
	ctx.putImageData(oidata,0,0);
	ctx.beginPath();
	ctx.moveTo(minX,midY);
	ctx.lineTo(maxX,midY);
	ctx.stroke();
	res.minX_midY_maxX_midY=countRegions(ctx);
	
	
	ctx.putImageData(oidata,0,0);
	ctx.beginPath();
	ctx.moveTo(minX,maxY-1);
	ctx.lineTo(maxX,maxY-1);
	ctx.stroke();
	res.minX_maxY_maxX_maxY=countRegions(ctx);
	
	ctx.putImageData(oidata,0,0);
	ctx.beginPath();
	ctx.moveTo(minX,minY+1);
	ctx.lineTo(maxX,minY+1);
	ctx.stroke();
	res.minX_minY_maxX_minY=countRegions(ctx);
	
	
	ctx.putImageData(oidata,0,0);
	ctx.beginPath();
	ctx.moveTo(minX,minY);
	ctx.lineTo(minX,maxY);
	ctx.stroke();
	res.minX_minY_minX_maxY=countRegions(ctx);
	
	ctx.putImageData(oidata,0,0);
	ctx.beginPath();
	ctx.moveTo(minX,minY);
	ctx.lineTo(minX,maxY);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(minX,minY);
	ctx.lineTo(maxX,minY);
	ctx.stroke();
	res.minX_minY_minX_maxY$minX_minY_maxX_minY=countRegions(ctx);
	
	ctx.putImageData(oidata,0,0);
	ctx.beginPath();
	ctx.moveTo(minX,minY);
	ctx.lineTo(maxX,maxY);
	ctx.stroke();
	res.minX_minY_maxX_maxY=countRegions(ctx);
	
	ctx.putImageData(oidata,0,0);
	ctx.beginPath();
	ctx.moveTo(maxX,minY);
	ctx.lineTo(maxX,maxY);
	ctx.stroke();
	res.maxX_minY_maxX_maxY=countRegions(ctx);
	
	ctx.putImageData(oidata,0,0);
	ctx.beginPath();
	ctx.moveTo(maxX,minY);
	ctx.lineTo(maxX,maxY);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(minX,minY);
	ctx.lineTo(maxX,maxY);
	ctx.stroke();
	res.maxX_minY_maxX_maxY$minX_minY_maxX_maxY=countRegions(ctx);
	
	ctx.putImageData(oidata,0,0);
	ctx.beginPath();
	ctx.moveTo(maxX-cw/18,minY);
	ctx.lineTo(maxX-cw/18,maxY);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(midX,maxY);
	ctx.lineTo(midX,minY);
	ctx.stroke();
	res.maxX_minY_maxX_maxY$midX_maxY_midX_minY=countRegions(ctx);
	
//	ctx.putImageData(oidata,0,0);
	
	
	
	return res;
}
return _ocrCanv;
})();
function generateImage(str,fontSize)
{
	var FONT="Arial";
	var gcanv=document.createElement("canvas");
	gcanv.height=gcanv.width=fontSize*3;
	var gctx=gcanv.getContext("2d");
	gctx.clearRect(0,0,gcanv.width,gcanv.height);
	gctx.fillStyle="#000000";
	gctx.font=fontSize+"px "+FONT;
	gcanv.width=30+gctx.measureText(str).width;
	gctx.font=fontSize+"px "+FONT;
	gctx.fillText(str,15,gcanv.height-5);
	var minX=gcanv.width,maxX=0,minY=gcanv.height,maxY=0;
	var idata=gctx.getImageData(0,0,gcanv.width,gcanv.height);
	var buf=new Uint32Array(idata.data.buffer);
	var gw=gcanv.width;
	for(var y=0;y<gcanv.height;y++)
	{
		for(var x=0;x<gcanv.width;x++)
		{
			if(buf[y*gw+x]!==0)
			{
				if(x<minX) minX=x;
				if(x>maxX) maxX=x;
				if(y<minY) minY=y;
				if(y>maxY) maxY=y;
			}
		}
	}
	//console.log({minX:minX,maxX:maxX,minY:minY,maxY:maxY});
	idata=null;
	buf=null;
	var nData=gctx.getImageData(minX,minY,maxX-minX+1,maxY-minY+1);
	gcanv.width=maxX-minX+1;
	gcanv.height=maxY-minY+1;
	gctx.putImageData(nData,0,0);
	nData=null;
	gctx=null;
	return gcanv.toDataURL("image/png");
}
var iResult={};
var ALPHABET="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function ocrCharTest(ind)
{
	var img=new Image();
	img.onload=function(){
		var canv=document.getElementById("canv");		
		canv.width=img.width+20;
		canv.height=img.height+20;
		var ctx=canv.getContext("2d");
		ctx.drawImage(this,10,10);
		window.iResult[ALPHABET[ind]]=ocrImage(ctx);
		ind++;
		if(ind<ALPHABET.length) setTimeout(function(){ocrCharTest(ind);},1000);
		else findDupes(aggrData(window.iResult));
	};
	img.src=generateImage(ALPHABET[ind],72);
}
function findDupes(adat)
{
	var ind=0;
	for(var i=0;i<adat.length;i++)
	{
		ind=i;
		while((ind=adat.indexOf(adat[i],ind+1))!==-1)
		{
			console.log(ALPHABET[i]+" conflicts with "+ALPHABET[ind]);
		}
	}
}
function aggrData(resObj)
{
	var arr=[];
	for(var k in resObj)
	{
		if(resObj.hasOwnProperty(k))
		{
			var str="";
			for(var j in resObj[k])
			{
				if(resObj[k].hasOwnProperty(j))
				{
					str+=resObj[k][j]+"|";
				}
			}
			arr.push(str.substring(0,str.length-1));
		}
	}
	return arr;
}
function init()
{
	ocrCharTest(0);
}
init();
