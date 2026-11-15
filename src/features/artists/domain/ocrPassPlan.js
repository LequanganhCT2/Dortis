/** OCR region scheduling for heterogeneous Portfolio PDFs.
 * One full-page pass plus additional region passes prevents missed text when
 * raster paragraphs sit beside portraits or graphics.
 */
const rect=(left,top,width,height)=>({
  left:Math.round(left),top:Math.round(top),
  width:Math.max(1,Math.round(width)),height:Math.max(1,Math.round(height))
})
export function renderScale(width,height,{quality='standard',maxPixels}={}){
  const pixels=maxPixels??(quality==='deep'?5_500_000:4_000_000)
  return Math.max(.1,Math.min(quality==='deep'?3.6:3.1,
    3200/width,3200/height,Math.sqrt(pixels/(width*height))))
}
export function buildOcrPasses(width,height,{quality='standard',layerChars=0}={}){
  if(width<=0||height<=0)return []
  const passes=[{kind:'full',mode:'SPARSE_TEXT',rectangle:null}]
  const landscape=width/height>=1.08
  const sparse=layerChars<160
  if(quality==='deep' || landscape || sparse){
    const middle=width/2,overlap=width*.065
    passes.push(
      {kind:'left',mode:'SINGLE_COLUMN',rectangle:rect(0,0,middle+overlap,height)},
      {kind:'right',mode:'SINGLE_COLUMN',rectangle:rect(middle-overlap,0,middle+overlap,height)}
    )
  }
  if(quality==='deep'){
    const middle=height/2,overlap=height*.065
    passes.push(
      {kind:'top',mode:'SPARSE_TEXT',rectangle:rect(0,0,width,middle+overlap)},
      {kind:'bottom',mode:'SPARSE_TEXT',rectangle:rect(0,middle-overlap,width,middle+overlap)}
    )
  }
  return passes
}
