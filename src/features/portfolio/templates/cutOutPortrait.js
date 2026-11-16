const MODEL='https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite'
const WASM='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'

export async function cutOutPortrait(file){
  const {FilesetResolver,ImageSegmenter}=await import('@mediapipe/tasks-vision')
  const bitmap=await createImageBitmap(file)
  let segmenter
  try{
    const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height))
    const canvas=document.createElement('canvas')
    canvas.width=Math.max(1,Math.round(bitmap.width*scale))
    canvas.height=Math.max(1,Math.round(bitmap.height*scale))
    const context=canvas.getContext('2d')
    context.drawImage(bitmap,0,0,canvas.width,canvas.height)
    const vision=await FilesetResolver.forVisionTasks(WASM)
    segmenter=await ImageSegmenter.createFromOptions(vision,{
      baseOptions:{modelAssetPath:MODEL},
      runningMode:'IMAGE',outputCategoryMask:false,outputConfidenceMasks:true
    })
    const matte=document.createElement('canvas')
    segmenter.segment(canvas,result=>{
      const labels=segmenter.getLabels()
      const masks=result.confidenceMasks||[]
      const foreground=masks[labels.findIndex(label=>/person|foreground/i.test(label))]
        ||masks[masks.length-1]
      if(!foreground)throw new Error('Không nhận diện được người trong ảnh.')
      matte.width=foreground.width
      matte.height=foreground.height
      const matteContext=matte.getContext('2d')
      const pixels=matteContext.createImageData(matte.width,matte.height)
      const values=foreground.getAsFloat32Array()
      let detected=0
      for(let index=0;index<values.length;index++){
        const alpha=Math.max(0,Math.min(1,(values[index]-.16)/.72))
        pixels.data[index*4+3]=Math.round(alpha*255)
        if(alpha>.5)detected++
      }
      if(detected<values.length*.01)throw new Error('Không nhận diện được người trong ảnh.')
      matteContext.putImageData(pixels,0,0)
    })
    context.globalCompositeOperation='destination-in'
    context.drawImage(matte,0,0,canvas.width,canvas.height)
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.93))
    if(!blob)throw new Error('Không tạo được ảnh trong suốt.')
    return new File([blob],'chan-dung-tach-nen.webp',{type:blob.type})
  }finally{
    segmenter?.close()
    bitmap.close()
  }
}
